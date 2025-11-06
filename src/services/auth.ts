import {GoogleAuth} from 'google-auth-library'
import * as fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {getConfig} from './config.js'

function getServiceAccountKeyPath(): string {
  // Priority 1: Environment variable
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    return process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
  }

  // Priority 2: Config file
  try {
    const config = getConfig()
    if (config?.serviceAccountKeyPath && typeof config.serviceAccountKeyPath === 'string') {
      return config.serviceAccountKeyPath
    }
  } catch (error) {
    // Silently ignore config file errors and fall back to default
    console.log(
      'Unable to read service account key path from config file (falling back to default auth file location):',
      (error as Error).message,
    )
  }

  // Priority 3: Default path
  return path.join(os.homedir(), '.config', '.okcli-sa-key.json')
}

export async function getAuthClient(): Promise<GoogleAuth> {
  const serviceAccountKeyPath = getServiceAccountKeyPath()

  if (!fs.existsSync(serviceAccountKeyPath)) {
    throw new Error(
      `Service account key file not found at ${serviceAccountKeyPath}. ` +
        'Please set GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable, configure it in ~/.config/okc/conf.json, or place the key file at the default location.',
    )
  }

  const auth = new GoogleAuth({
    keyFile: serviceAccountKeyPath,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  })

  return auth
}
