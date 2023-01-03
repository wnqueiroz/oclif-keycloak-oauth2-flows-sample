import {Command} from '@oclif/core'

import {KeycloakService} from '../../services/keycloak.service'

export default class AuthStatus extends Command {
  static description = 'View authentication status';

  public async run(): Promise<void> {
    const keycloakService = new KeycloakService()

    const userInfo = await keycloakService.getUserInfo()

    if (userInfo) {
      this.log(`Logged as ${userInfo.preferred_username} <${userInfo.email}>`)
    } else {
      this.log("You're not logged. Run cli auth login to authenticate.")
      this.exit(0)
    }
  }
}
