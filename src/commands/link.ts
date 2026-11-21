import { flags as oclifFlags } from '@oclif/command'
import { resolve } from 'path'

import { CustomCommand } from '../api/oclif/CustomCommand'
import { appLink } from '../modules/apps/link'

import { ColorifyConstants } from '../api/constants/Colors'

export default class Link extends CustomCommand {
  static description = `Syncs the app in the current directory with the ${ColorifyConstants.ID(
    'development workspace'
  )} in use.`

  static examples = [`${ColorifyConstants.COMMAND_OR_VTEX_REF('vtex link')} -a youraccount -w yourworkspace`]

  static flags = {
    ...CustomCommand.globalFlags,
    account: oclifFlags.string({
      char: 'a',
      description: `Starts a development session in the specified ${ColorifyConstants.ID(
        'account'
      )}. Must be paired with the ${ColorifyConstants.COMMAND_OR_VTEX_REF('--workspace')} flag.`,
      required: false,
      dependsOn: ['workspace'],
    }),
    clean: oclifFlags.boolean({ char: 'c', description: 'Cleans builder cache', default: false }),
    'events-file': oclifFlags.string({
      description:
        'Writes the build events as JSON lines to this file (emptied at start): build start/success/fail, then ready, or stale when the workspace still serves another linked version.',
      required: false,
    }),
    setup: oclifFlags.boolean({
      char: 's',
      description: `Locally sets typings before linking [see ${ColorifyConstants.COMMAND_OR_VTEX_REF(
        'vtex setup --help'
      )}]`,
      default: false,
    }),
    'no-watch': oclifFlags.boolean({
      description: "Doesn't watch for file changes after the initial link.",
      default: false,
    }),
    unsafe: oclifFlags.boolean({
      char: 'u',
      description: 'Allows linking the app despite Typescript errors.',
      default: false,
    }),
    workspace: oclifFlags.string({
      char: 'w',
      description: `Starts a development session in the specified ${ColorifyConstants.ID(
        'workspace'
      )}. Can be paired with the ${ColorifyConstants.COMMAND_OR_VTEX_REF(
        '--account'
      )} flag to switch from the current ${ColorifyConstants.ID('account')} and ${ColorifyConstants.ID('workspace')}.`,
      required: false,
    }),
  }

  static args = []

  async run() {
    const {
      flags,
      flags: { account, setup, clean, unsafe, workspace },
    } = this.parse(Link)
    const noWatch = flags['no-watch']
    const eventsFile = flags['events-file'] && resolve(flags['events-file'])
    await appLink({ account, workspace, setup, clean, unsafe, noWatch, eventsFile })
  }
}
