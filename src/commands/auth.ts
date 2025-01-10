/* eslint-disable camelcase */
import {Command} from '@oclif/core'
import {OAuth2Client} from 'google-auth-library'
import * as fs from 'node:fs'
import path from 'node:path'

export class Auth extends Command {
  static description = 'Authenticate with Google Calendar'

  async run(): Promise<void> {
    const credentialsPath = path.join(this.config.configDir, 'credentials.json')
    const tokenPath = path.join(this.config.configDir, 'token.json')

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
    const {client_id, client_secret, redirect_uris} = credentials.installed

    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0])

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    })

    this.log('Authorize this app by visiting this url:', authUrl)
    const code = await this.prompt('Enter the code from that page:')

    const {tokens} = await oAuth2Client.getToken(code)
    fs.writeFileSync(tokenPath, JSON.stringify(tokens))
    this.log('Token stored successfully')
  }

  private async prompt(message: string): Promise<string> {
    // eslint-disable-next-line no-console
    console.log(message)
    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim())
      })
    })
  }
}
