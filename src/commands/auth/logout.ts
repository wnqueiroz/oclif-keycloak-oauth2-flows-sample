import {Command} from '@oclif/core'

import {KeycloakService} from '../../services/keycloak.service'
import {saveUserCredentials} from '../../utils'

export default class AuthLogout extends Command {
  static description = 'Log out of Keycloak';

  public async run(): Promise<void> {
    const keycloakService = new KeycloakService()

    await keycloakService.logout()

    saveUserCredentials({
      accessToken: '',
      deviceCode: '',
      refreshToken: '',
    })

    this.log('Logged out of Keycloak ✅')
  }
}
