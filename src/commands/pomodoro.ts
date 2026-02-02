import {calendar} from '@googleapis/calendar'
import {input, select} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import readline from 'node:readline'

import {getAllBundlesByStatus, getBundleByName} from '../repositories/bundle.repository.js'
import {getAuthClient} from '../services/auth.js'
import {getConfig} from '../services/config.js'

export class Pomodoro extends Command {
  static description = 'Start a timer for a bundle and create a calendar event'

  static flags = {
    bundle: Flags.string({char: 'b', description: 'Bundle name'}),
    task: Flags.string({char: 't', description: 'Task name (default: WIP)'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Pomodoro)

    // 1. Bundle selection
    let bundleName: string

    if (flags.bundle) {
      const bundle = await getBundleByName(flags.bundle)
      bundleName = bundle.name
    } else {
      // eslint-disable-next-line camelcase
      const bundlesResult = await getAllBundlesByStatus('In Progress', {page_size: 10})
      if (bundlesResult.bundles.length === 0) {
        this.log('No bundles in progress found')
        return
      }

      bundleName = await select({
        choices: bundlesResult.bundles.map((b) => ({
          name: b.name,
          value: b.name,
        })),
        message: 'Select a bundle:',
      })
    }

    // 2. Task name prompt
    let taskName =
      flags.task ||
      (await input({
        default: 'WIP',
        message: 'Task name:',
      }))

    // 3. Run timer
    const timerResult = await this.runTimer()

    if (!timerResult) {
      this.log('Timer cancelled')
      return
    }

    const {endTime, startTime} = timerResult
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = Math.round(durationMs / 1000 / 60)

    this.log(`\nTimer stopped. Duration: ${this.formatDuration(durationMs)}`)

    // 4. Confirmation prompt with option to change task name
    let confirmed = false
    while (!confirmed) {
      const eventTitle = `[${bundleName}] ${taskName}`
      const action = await select({
        choices: [
          {name: 'Yes, create event', value: 'yes'},
          {name: 'No, cancel', value: 'no'},
          {name: 'Change task name', value: 'change'},
        ],
        message: `Create calendar event "${eventTitle}" (${durationMinutes} min)?`,
      })

      if (action === 'no') {
        this.log('Event creation cancelled')
        return
      }

      if (action === 'change') {
        taskName = await input({
          default: taskName,
          message: 'New task name:',
        })
        continue
      }

      confirmed = true
    }

    // 5. Create calendar event
    const eventTitle = `[${bundleName}] ${taskName}`
    const auth = await getAuthClient()
    const calendarClient = calendar({auth, version: 'v3'})
    const config = getConfig()
    const calendarId = (config.calendarId as string) || 'primary'
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone

    await calendarClient.events.insert({
      calendarId,
      requestBody: {
        end: {dateTime: endTime.toISOString(), timeZone: localTz},
        start: {dateTime: startTime.toISOString(), timeZone: localTz},
        summary: eventTitle,
      },
    })

    this.log(`Event created: ${eventTitle}`)
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  private runTimer(): Promise<{endTime: Date; startTime: Date} | null> {
    return new Promise((resolve) => {
      const startTime = new Date()
      let pausedDuration = 0
      let pauseStartTime: Date | null = null
      let isPaused = false
      let isStopped = false

      // Set up keypress detection
      readline.emitKeypressEvents(process.stdin)
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
      }

      process.stdin.resume()

      const updateDisplay = () => {
        if (isStopped) return

        const now = new Date()
        let elapsed = now.getTime() - startTime.getTime() - pausedDuration
        if (isPaused && pauseStartTime) {
          elapsed -= now.getTime() - pauseStartTime.getTime()
        }

        const status = isPaused ? ' [PAUSED]' : ''
        process.stdout.write(`\r${this.formatDuration(elapsed)}${status}  (p=pause, s=stop)   `)
      }

      const interval = setInterval(updateDisplay, 1000)
      updateDisplay()

      const cleanup = () => {
        clearInterval(interval)
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false)
        }

        process.stdin.pause()
        process.stdin.removeListener('keypress', onKeypress)
        process.stdout.write('\n')
      }

      const onKeypress = (_str: string, key: {ctrl: boolean; name: string}) => {
        if (key.ctrl && key.name === 'c') {
          isStopped = true
          cleanup()
          resolve(null)
          return
        }

        if (key.name === 'p') {
          if (isPaused) {
            // Resume
            if (pauseStartTime) {
              pausedDuration += new Date().getTime() - pauseStartTime.getTime()
              pauseStartTime = null
            }

            isPaused = false
          } else {
            // Pause
            isPaused = true
            pauseStartTime = new Date()
          }

          updateDisplay()
        }

        if (key.name === 's') {
          isStopped = true
          cleanup()

          const endTime = new Date()
          // Adjust end time to exclude paused duration
          const adjustedEndTime = new Date(endTime.getTime() - pausedDuration)
          if (isPaused && pauseStartTime) {
            adjustedEndTime.setTime(adjustedEndTime.getTime() - (endTime.getTime() - pauseStartTime.getTime()))
          }

          resolve({endTime: adjustedEndTime, startTime})
        }
      }

      process.stdin.on('keypress', onKeypress)
    })
  }
}
