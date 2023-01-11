import axios, { AxiosError, AxiosInstance } from 'axios'
import * as querystring from 'node:querystring'
import {
  CLI_SERVER_ADDRESS_CALLBACK,
  getUserCredentials,
  KEYCLOAK_SERVER_ADDRESS,
} from '../utils'

type GetDeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
};

type GetTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
};

type GetUserInfoResponse = {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
};

export class KeycloakService {
  http: AxiosInstance;
  realm: string;
  clientId: string;

  constructor() {
    const realm = 'oclif-keycloak'

    this.http = axios.create({
      baseURL: `${KEYCLOAK_SERVER_ADDRESS}/auth/realms/${realm}/protocol/openid-connect`,
    })

    this.clientId = realm // using the same name by the way
  }

  async getDeviceCode(): Promise<GetDeviceCodeResponse> {
    const { data } = await this.http.post(
      '/auth/device',
      {
        client_id: this.clientId,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    return data
  }

  async poolToken(
    deviceCode: string,
    interval: number,
  ): Promise<GetTokenResponse> {
    const getToken = () =>
      this.http
        .post(
          '/token',
          {
            client_id: this.clientId,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        .then(({ data }) => data)
        .catch(error => {
          if (error instanceof AxiosError) {
            const { error: err } = error.response?.data

            if (err === 'authorization_pending') return null
          }

          throw error
        })

    let response = await getToken()

    while (!response) {
      response = await new Promise(resolve => {
        setTimeout(async () => {
          resolve(await getToken())
        }, interval * 1100) // interval equal to 1 is equivalent to 1.1 seconds between one request and another
      })
    }

    return response
  }

  async getUserInfo(): Promise<GetUserInfoResponse | null> {
    const userCredentials = getUserCredentials()

    if (!userCredentials?.accessToken) return null

    try {
      const { data } = await this.http.get('/userinfo', {
        headers: {
          Authorization: `Bearer ${userCredentials.accessToken}`,
        },
      })
      return data
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401)
        return null

      throw error
    }
  }

  async logout(): Promise<void | null> {
    const userCredentials = getUserCredentials()

    if (!userCredentials?.refreshToken) return null

    try {
      const { data } = await this.http.post(
        '/logout',
        {
          client_id: this.clientId,
          refresh_token: userCredentials.refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      return data
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401)
        return null

      throw error
    }
  }

  getAuthorizationCodeURL(codeChallenge: string, state: string): string {
    const queryParams = querystring.stringify({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: CLI_SERVER_ADDRESS_CALLBACK,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    return `${KEYCLOAK_SERVER_ADDRESS}/auth/realms/${this.clientId}/protocol/openid-connect/auth?${queryParams}`
  }

  async getAuthorizationCodeToken(code: string, codeVerifier: string): Promise<GetTokenResponse> {
    return this.http
      .post(
        '/token',
        {
          client_id: this.clientId,
          redirect_uri: CLI_SERVER_ADDRESS_CALLBACK,
          grant_type: 'authorization_code',
          code,
          code_verifier: codeVerifier,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      .then(({ data }) => data)
  }
}
