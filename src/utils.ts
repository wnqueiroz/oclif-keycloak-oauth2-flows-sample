import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import EventEmitter = require('node:events');

const CONFIG_PATH = path.resolve(os.homedir(), '.clirc')
export const CLI_SERVER_ADDRESS = 'http://127.0.0.1:5657'
export const CLI_SERVER_ADDRESS_CALLBACK = `${CLI_SERVER_ADDRESS}/auth/callback`
export const KEYCLOAK_SERVER_ADDRESS = 'http://127.0.0.1:8080'

export type UserCredentials = {
  accessToken: string;
  refreshToken: string;
};

export const saveUserCredentials = (data: UserCredentials): void => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
  })
}

export const getUserCredentials = (): UserCredentials | null => {
  try {
    const content = fs.readFileSync(CONFIG_PATH, {
      encoding: 'utf-8',
    })

    return JSON.parse(content) as UserCredentials
  } catch {
    return null
  }
}

export const generatePkceChallenge = () => {
  const codeVerifier = crypto.randomBytes(64).toString('hex')

  const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '')

  return {
    state: crypto.randomBytes(32).toString('hex'),
    codeVerifier,
    codeChallenge,
  }
}

export const waitFor = <T>(
  eventName: string,
  emitter: EventEmitter,
): Promise<T> => {
  const promise = new Promise<T>((resolve, reject) => {
    const handleEvent = (eventData: any): void => {
      eventData instanceof Error ? reject(eventData) : resolve(eventData)

      emitter.removeListener(eventName, handleEvent)
    }

    emitter.addListener(eventName, handleEvent)
  })

  return promise
}
