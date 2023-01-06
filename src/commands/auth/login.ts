import {CliUx, Command, Flags} from '@oclif/core'

import {CLIError, ExitError} from '@oclif/core/lib/errors'
import * as http from 'node:http'
import * as querystring from 'node:querystring'

import {KeycloakService} from '../../services/keycloak.service'
import {
  CLI_SERVER_ADDRESS,
  CLI_SERVER_ADDRESS_CALLBACK,
  generatePkceChallenge,
  getUserCredentials,
  saveUserCredentials,
  UserCredentials,
} from '../../utils'

type AuthoricationCodeCallbackParams = {
  state: string;
  code: string;
  session_state: string;
};

export default class AuthLogin extends Command {
  static description = 'Authenticate with Keycloak';

  keycloakService = new KeycloakService();

  static flags = {
    flow: Flags.string({
      char: 'f',
      description: 'Authentication flow',
      options: ['device-code', 'authorization-code'],
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogin)

    try {
      await this.checkUserAlreadyLoggedIn()

      let userCredentials: UserCredentials = {
        accessToken: '',
        refreshToken: '',
      }

      switch (flags.flow) {
      case 'device-code':
        userCredentials = await this.startDeviceCodeFlow()
        break
      case 'authorization-code':
        userCredentials = await this.startAuthorizationCodeFlow()
        break
      default:
        userCredentials = await this.startDeviceCodeFlow()
        break
      }

      CliUx.ux.action.stop('done ✅')

      saveUserCredentials(userCredentials)
    } catch (error) {
      if (
        (error instanceof CLIError && error.message === 'ctrl-c') ||
        error instanceof ExitError
      )
        this.exit(0)
      else if (error instanceof Error) {
        CliUx.ux.action.stop(error.message)

        this.exit(1)
      }
    }
  }

  private async checkUserAlreadyLoggedIn() {
    const userCredentials = getUserCredentials()

    if (!userCredentials) return

    const alreadyLoggedIn = (
      Object.keys(userCredentials) as Array<keyof typeof userCredentials>
    ).every(key => Boolean(userCredentials[key]))

    if (!alreadyLoggedIn) return

    const reAuthenticate = await CliUx.ux.confirm(
      "You're already logged. Do you want to re-authenticate? (y/n)",
    )

    if (!reAuthenticate) this.exit(0)
  }

  private async startDeviceCodeFlow(): Promise<UserCredentials> {
    const {device_code, interval, verification_uri, user_code} =
      await this.keycloakService.getDeviceCode()

    this.log(`⚠️  First copy your one-time code: ${user_code}`)

    await CliUx.ux.anykey('Press any key to open Keycloak in your browser')

    await CliUx.ux.open(verification_uri)

    CliUx.ux.action.start('Waiting for authentication')

    const {access_token, refresh_token} =
      await this.keycloakService.poolToken(device_code, interval)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
    }
  }

  private async startAuthorizationCodeFlow(): Promise<UserCredentials> {
    const {codeVerifier, codeChallenge, state} = generatePkceChallenge()
    const port = CLI_SERVER_ADDRESS.split(':').pop()
    const callbackPath = CLI_SERVER_ADDRESS_CALLBACK.split(':')[2].replace(
      port!,
      '',
    )

    const authorizationCodeURL = this.keycloakService.getAuthorizationCodeURL(
      codeChallenge,
      state,
    )

    let authoricationCodeCallbackParams

    const server = http
    .createServer((req, res) => {
      if (req?.url?.startsWith(callbackPath)) {
        const params = querystring.decode(
          req?.url.replace(`${callbackPath}?`, ''),
        ) as AuthoricationCodeCallbackParams

        authoricationCodeCallbackParams = params

        res.end('You can close this browser now.')

        res.socket?.end()
        res.socket?.destroy()
        server.close()
      } else {
        // TODO: handle an invalid URL address
        res.end('Unsupported')
      }
    })
    .listen(port)

    await CliUx.ux.anykey('Press any key to open Keycloak in your browser')

    await CliUx.ux.open(authorizationCodeURL)

    CliUx.ux.action.start('Waiting for authentication')

    while (authoricationCodeCallbackParams === undefined) {
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
    }

    const {code, state: stateFromParams} =
      authoricationCodeCallbackParams as AuthoricationCodeCallbackParams

    if (stateFromParams !== state) throw new Error('Possible CSRF attack. Aborting login! ⚠️')

    const {access_token, refresh_token} =
      await this.keycloakService.getAuthorizationCodeToken(code, codeVerifier)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
    }
  }
}
