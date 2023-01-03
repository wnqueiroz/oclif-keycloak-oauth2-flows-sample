import {CliUx, Command} from '@oclif/core'

import {CLIError, ExitError} from '@oclif/core/lib/errors'

import {KeycloakService} from '../../services/keycloak.service'
import {getUserCredentials, saveUserCredentials} from '../../utils'

export default class AuthLogin extends Command {
  static description = 'Authenticate with Keycloak';

  public async run(): Promise<void> {
    try {
      await this.checkUserAlreadyLoggedIn()

      const keycloakService = new KeycloakService()

      const {device_code, interval, verification_uri, user_code} =
        await keycloakService.getDeviceCode()

      this.log(`⚠️  First copy your one-time code: ${user_code}`)

      await CliUx.ux.anykey('Press any key to open Keycloak in your browser')

      await CliUx.ux.open(verification_uri)

      CliUx.ux.action.start('Waiting for authentication')

      const {access_token, refresh_token} = await keycloakService.poolToken(
        device_code,
        interval,
      )

      CliUx.ux.action.stop('done ✅')

      saveUserCredentials({
        accessToken: access_token,
        deviceCode: device_code,
        refreshToken: refresh_token,
      })
    } catch (error) {
      if (
        (error instanceof CLIError && error.message === 'ctrl-c') ||
        error instanceof ExitError
      )
        this.exit(0)
      else console.error(error)
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
}
