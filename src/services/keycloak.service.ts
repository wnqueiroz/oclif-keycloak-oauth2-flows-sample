import axios, {AxiosError, AxiosInstance} from 'axios'
import {getUserCredentials} from '../utils'

type GetDeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
};

type PoolTokenResponse = {
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
    this.http = axios.create({
      baseURL: 'http://127.0.0.1:8080',
    })
    this.realm = 'oclif-keycloak'
    this.clientId = 'oclif-keycloak'
  }

  async getDeviceCode(): Promise<GetDeviceCodeResponse> {
    const {data} = await this.http.post(
      `/auth/realms/${this.realm}/protocol/openid-connect/auth/device`,
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
  ): Promise<PoolTokenResponse> {
    const getToken = () =>
      this.http
      .post(
        `/auth/realms/${this.realm}/protocol/openid-connect/token`,
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
      .then(({data}) => data)
      .catch(error => {
        if (error instanceof AxiosError) {
          const {error: err} = error.response?.data

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
      const {data} = await this.http.get(
        `/auth/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${userCredentials.accessToken}`,
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
}
