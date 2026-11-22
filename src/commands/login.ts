import { flags as oclifFlags } from '@oclif/command'

import { CustomCommand } from '../api/oclif/CustomCommand'
import authLogin from '../modules/auth/login'

import { ColorifyConstants } from '../api/constants/Colors'

export default class Login extends CustomCommand {
  static description = `Logs in to a ${ColorifyConstants.ID('VTEX account')}.`

  static examples = [
    `${ColorifyConstants.COMMAND_OR_VTEX_REF('vtex login')}`,
    `${ColorifyConstants.COMMAND_OR_VTEX_REF('vtex login')} storecomponents`,
    `${ColorifyConstants.COMMAND_OR_VTEX_REF('vtex login')} storecomponents --local`,
  ]

  static flags = {
    ...CustomCommand.globalFlags,
    workspace: oclifFlags.string({
      char: 'w',
      description: `Logs in the specified ${ColorifyConstants.ID('workspace')}.`,
    }),
    // Read by bin/run, which points the CLI folder at the repository before any module loads.
    local: oclifFlags.boolean({
      description:
        "Keeps this login in the git repository's root .vtex/ folder, shared by every folder and worktree inside it, instead of ~/.vtex.",
    }),
  }

  static args = [
    { name: 'account', required: false, description: `${ColorifyConstants.ID('Account')} name to log in.` },
  ]

  async run() {
    const {
      args: { account },
      flags: { workspace },
    } = this.parse(Login)

    await authLogin({ account, workspace })
  }
}
