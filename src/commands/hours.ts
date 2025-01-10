/* eslint-disable perfectionist/sort-classes */
/* eslint-disable camelcase */
import type {calendar_v3 as CalendarV3} from '@googleapis/calendar'

import {calendar} from '@googleapis/calendar'
import {Args, Command, Flags} from '@oclif/core'
import {addDays, format, parseISO} from 'date-fns'
import {OAuth2Client} from 'google-auth-library'
import * as fs from 'node:fs'
import path from 'node:path'

export class Hours extends Command {
  static args = {
    query: Args.string({
      description: 'Epic name to search for in event titles',
      required: true,
    }),
  }

  static description = 'Calculate hours spent on epics from Google Calendar events'

  static flags = {
    'end-date': Flags.string({
      char: 'e',
      default: async () => format(new Date(), 'yyyy-MM-dd'),
      description: 'End date (YYYY-MM-DD)',
      required: false,
    }),
    'start-date': Flags.string({
      char: 's',
      default: async () => format(addDays(new Date(), -90), 'yyyy-MM-dd'),
      description: 'Start date (YYYY-MM-DD)',
      required: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Shows the matching events',
      required: false,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Hours)
    const auth = await this.getAuthClient()
    const calendarClient = calendar({auth, version: 'v3'})

    const startDate = parseISO(flags['start-date'])
    const endDate = addDays(parseISO(flags['end-date']), 1) // Include the end date

    const response = await calendarClient.events.list({
      calendarId: 'primary',
      orderBy: 'startTime',
      singleEvents: true,
      timeMax: endDate.toISOString(),
      timeMin: startDate.toISOString(),
    })

    const events = response.data.items || []
    const matchingEvents = events.filter((event: CalendarV3.Schema$Event) =>
      event.summary?.toLowerCase().includes(args.query.toLowerCase()),
    )

    const totalHours = matchingEvents.reduce(
      (sum: number, event: CalendarV3.Schema$Event) => sum + this.calculateDuration(event),
      0,
    )

    this.log(`\nResults for epic: ${args.query}`)
    this.log(`Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(parseISO(flags['end-date']), 'yyyy-MM-dd')}`)
    this.log(`Total hours: ${totalHours.toFixed(2)} (${(totalHours / 7).toFixed(2)} days)`)

    if (flags.verbose) {
      this.log(`\nMatching events:`)
      this.printEvents(matchingEvents)
    }
  }

  private printEvents(events: CalendarV3.Schema$Event[]): void {
    for (const event of events) {
      this.log(`- ${format(new Date(event.start?.dateTime || ''), 'yyyy-MM-dd HH:mm')} - ${event.summary}`)
    }
  }

  private calculateDuration(event: CalendarV3.Schema$Event): number {
    if (!event.start?.dateTime || !event.end?.dateTime) return 0
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime)
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert to hours
  }

  private async getAuthClient(): Promise<OAuth2Client> {
    const credentialsPath = path.join(this.config.configDir, 'credentials.json')
    const tokenPath = path.join(this.config.configDir, 'token.json')

    if (!fs.existsSync(credentialsPath)) {
      throw new Error('No credentials.json found. Please follow setup instructions.')
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
    const {client_id, client_secret, redirect_uris} = credentials.installed

    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0])

    if (fs.existsSync(tokenPath)) {
      const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
      oAuth2Client.setCredentials(token)
    } else {
      throw new Error('No token.json found. Please follow setup instructions.')
    }

    return oAuth2Client
  }
}
