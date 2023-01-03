<h1>oclif-keycloak-device-auth-sample</h1>

Example of how to implement a device authentication flow in a Command Line Interface (CLI) using oclif and Keycloak! 🚀

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g oclif-keycloak-device-auth-sample
$ cli COMMAND
running command...
$ cli (--version)
oclif-keycloak-device-auth-sample/0.0.0 darwin-x64 node-v16.17.1
$ cli --help [COMMAND]
USAGE
  $ cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cli auth login`](#cli-auth-login)
* [`cli auth logout`](#cli-auth-logout)
* [`cli auth status`](#cli-auth-status)
* [`cli help [COMMAND]`](#cli-help-command)

## `cli auth login`

Authenticate with Keycloak

```
USAGE
  $ cli auth login

DESCRIPTION
  Authenticate with Keycloak
```

## `cli auth logout`

Log out of Keycloak

```
USAGE
  $ cli auth logout

DESCRIPTION
  Log out of Keycloak
```

## `cli auth status`

View authentication status

```
USAGE
  $ cli auth status

DESCRIPTION
  View authentication status
```

## `cli help [COMMAND]`

Display help for cli.

```
USAGE
  $ cli help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.20/src/commands/help.ts)_
<!-- commandsstop -->
