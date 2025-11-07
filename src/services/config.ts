import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function getConfig(): Record<string, unknown> {
  const configPath = path.join(os.homedir(), '.config', 'okc', 'conf.json')

  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8')
    const config = JSON.parse(configContent)
    return config
  }

  throw new Error('Config file not found at ' + configPath)
}
