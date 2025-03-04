ok-computer-cli
=================

The OK-Computer CLI


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ok-computer-cli.svg)](https://npmjs.org/package/ok-computer-cli)
[![Downloads/week](https://img.shields.io/npm/dw/ok-computer-cli.svg)](https://npmjs.org/package/ok-computer-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g ok-computer-cli
$ okc COMMAND
running command...
$ okc (--version)
ok-computer-cli/0.0.0 darwin-arm64 node-v20.15.0
$ okc --help [COMMAND]
USAGE
  $ okc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`okc auth`](#okc-auth)
* [`okc help [COMMAND]`](#okc-help-command)
* [`okc hours [QUERY]`](#okc-hours-query)
* [`okc plugins`](#okc-plugins)
* [`okc plugins add PLUGIN`](#okc-plugins-add-plugin)
* [`okc plugins:inspect PLUGIN...`](#okc-pluginsinspect-plugin)
* [`okc plugins install PLUGIN`](#okc-plugins-install-plugin)
* [`okc plugins link PATH`](#okc-plugins-link-path)
* [`okc plugins remove [PLUGIN]`](#okc-plugins-remove-plugin)
* [`okc plugins reset`](#okc-plugins-reset)
* [`okc plugins uninstall [PLUGIN]`](#okc-plugins-uninstall-plugin)
* [`okc plugins unlink [PLUGIN]`](#okc-plugins-unlink-plugin)
* [`okc plugins update`](#okc-plugins-update)

## `okc auth`

Authenticate with Google Calendar

```
USAGE
  $ okc auth

DESCRIPTION
  Authenticate with Google Calendar
```

_See code: [src/commands/auth.ts](https://github.com/xbill82/ok-computer-cli/blob/v0.0.0/src/commands/auth.ts)_

## `okc help [COMMAND]`

Display help for okc.

```
USAGE
  $ okc help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for okc.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.20/src/commands/help.ts)_

## `okc hours [QUERY]`

Calculate hours spent on epics from Google Calendar events

```
USAGE
  $ okc hours [QUERY] [-e <value>] [-s <value>] [-v]

ARGUMENTS
  QUERY  [default: *] Epic name to search for in event titles

FLAGS
  -e, --end-date=<value>    [default: 2025-03-04] End date (YYYY-MM-DD)
  -s, --start-date=<value>  [default: 2024-12-04] Start date (YYYY-MM-DD)
  -v, --verbose             Shows the matching events

DESCRIPTION
  Calculate hours spent on epics from Google Calendar events
```

_See code: [src/commands/hours.ts](https://github.com/xbill82/ok-computer-cli/blob/v0.0.0/src/commands/hours.ts)_

## `okc plugins`

List installed plugins.

```
USAGE
  $ okc plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ okc plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/index.ts)_

## `okc plugins add PLUGIN`

Installs a plugin into okc.

```
USAGE
  $ okc plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into okc.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the OKC_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the OKC_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ okc plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ okc plugins add myplugin

  Install a plugin from a github url.

    $ okc plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ okc plugins add someuser/someplugin
```

## `okc plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ okc plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ okc plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/inspect.ts)_

## `okc plugins install PLUGIN`

Installs a plugin into okc.

```
USAGE
  $ okc plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into okc.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the OKC_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the OKC_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ okc plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ okc plugins install myplugin

  Install a plugin from a github url.

    $ okc plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ okc plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/install.ts)_

## `okc plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ okc plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ okc plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/link.ts)_

## `okc plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ okc plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ okc plugins unlink
  $ okc plugins remove

EXAMPLES
  $ okc plugins remove myplugin
```

## `okc plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ okc plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/reset.ts)_

## `okc plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ okc plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ okc plugins unlink
  $ okc plugins remove

EXAMPLES
  $ okc plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/uninstall.ts)_

## `okc plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ okc plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ okc plugins unlink
  $ okc plugins remove

EXAMPLES
  $ okc plugins unlink myplugin
```

## `okc plugins update`

Update installed plugins.

```
USAGE
  $ okc plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/update.ts)_
<!-- commandsstop -->
