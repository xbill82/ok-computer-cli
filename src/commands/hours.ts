/* eslint-disable perfectionist/sort-classes */
import type {calendar_v3 as CalendarV3} from '@googleapis/calendar'

import {calendar} from '@googleapis/calendar'
import {confirm, select} from '@inquirer/prompts'
import {Args, Command, Flags} from '@oclif/core'
import {addDays, format, parseISO} from 'date-fns'

import {getAllBundlesByStatus, getBundleByName, saveBundle} from '../repositories/bundle.repository.js'
import {getAuthClient} from '../services/auth.js'
import {getConfig} from '../services/config.js'

export class Hours extends Command {
  static args = {
    query: Args.string({
      description: 'Epic name to search for in event titles',
      required: false,
    }),
  }

  static description = 'Calculate hours spent on epics from Google Calendar events'

  static flags = {
    bundle: Flags.string({
      char: 'b',
      description: 'Bundle name',
      required: false,
    }),
    'end-date': Flags.string({
      char: 'e',
      default: async () => format(new Date(), 'yyyy-MM-dd'),
      description: 'End date (YYYY-MM-DD)',
      required: false,
    }),
    'start-date': Flags.string({
      char: 's',
      description: 'Start date (YYYY-MM-DD). If not provided and bundle is specified, uses bundle start date',
      required: false,
    }),
    timespan: Flags.string({
      char: 't',
      description: 'Timespan to use. Can be "last-week", "last-month", "last-year"',
      options: ['last-week', 'last-month', 'last-year'],
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
    const auth = await getAuthClient()
    const calendarClient = calendar({auth, version: 'v3'})

    let searchQuery = args.query
    let bundle = null

    if (flags.bundle) {
      bundle = await getBundleByName(flags.bundle)
      this.log(`Bundle: ${bundle.toString()}`)
      searchQuery = bundle.name
    } else if (!args.query) {
      // eslint-disable-next-line camelcase
      const bundlesResult = await getAllBundlesByStatus('In Progress', {page_size: 10})
      if (bundlesResult.bundles.length === 0) {
        this.log('No bundles found')
        return
      }

      const selectedBundleName = await select({
        choices: bundlesResult.bundles.map((b) => ({
          name: b.name,
          value: b.name,
        })),
        message: 'Select a bundle:',
      })

      bundle = await getBundleByName(selectedBundleName)
      // this.log(`Bundle: ${bundle.toString()}`)
      searchQuery = bundle.name
    }

    let startDate = new Date()
    const endDate = addDays(parseISO(flags['end-date']), 1) || new Date()

    if (flags.timespan) {
      const {timespan} = flags
      switch (timespan) {
        case 'last-week': {
          startDate.setDate(startDate.getDate() - 7)
          break
        }

        case 'last-month': {
          startDate.setMonth(startDate.getMonth() - 1)
          break
        }

        case 'last-year': {
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        }

        default: {
          throw new Error(`Invalid timespan: ${timespan}`)
        }
      }
    } else if (bundle) {
      const startDateString = format(bundle.startDate, 'yyyy-MM-dd')
      startDate = parseISO(startDateString)
    } else if (flags['start-date']) {
      startDate = parseISO(flags['start-date'])
    }

    const config = getConfig()
    const calendarId = (config.calendarId as string) || 'primary'

    const response = await calendarClient.events.list({
      calendarId,
      orderBy: 'startTime',
      singleEvents: true,
      timeMax: endDate.toISOString(),
      timeMin: startDate.toISOString(),
    })

    const events = response.data.items || []
    const matchingEvents =
      searchQuery === '*'
        ? events
        : events.filter((event: CalendarV3.Schema$Event) =>
            event.summary?.toLowerCase().includes(searchQuery?.toLowerCase() ?? ''),
          )

    const totalHours = matchingEvents.reduce(
      (sum: number, event: CalendarV3.Schema$Event) => sum + this.calculateDuration(event),
      0,
    )

    const totalDays = totalHours / 7

    this.log(`\nResults for epic: ${searchQuery}`)
    this.log(`Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(parseISO(flags['end-date']), 'yyyy-MM-dd')}`)
    this.log(`Total hours: ${totalHours.toFixed(2)} (${totalDays.toFixed(2)} days)`)

    if (bundle) {
      bundle.spentDays = Math.round(totalDays)

      const confirmUpdate = await confirm({message: 'Do you want to update the bundle?'})
      if (confirmUpdate) {
        await saveBundle(bundle)
        this.log(`\nBundle updated: ${bundle.toString()}`)
      }
    }

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
}
