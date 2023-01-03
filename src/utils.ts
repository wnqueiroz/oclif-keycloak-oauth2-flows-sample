import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const CONFIG_PATH = path.resolve(os.homedir(), '.clirc')

type UserCredentials = {
  deviceCode: string;
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
