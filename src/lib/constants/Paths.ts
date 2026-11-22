import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'
import { EnvVariablesConstants } from './EnvVariables'

// A project (or a git worktree) opts into its own login and workspace by having a `.vtex/session`
// folder: the nearest one from the working directory up wins, so separate terminals can work on
// separate accounts or workspaces at once. Anything under the home folder reaches `~/.vtex` last.
export const resolveVtexFolder = (env = process.env, cwd = process.cwd(), home = homedir()): string => {
  const fromEnv = env[EnvVariablesConstants.VTEX_HOME]
  if (fromEnv) {
    return resolve(cwd, fromEnv)
  }

  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    const candidate = join(dir, '.vtex')
    if (existsSync(join(candidate, 'session'))) {
      return candidate
    }

    if (dirname(dir) === dir) {
      return join(home, '.vtex')
    }
  }
}

const RUNTIME_FOLDERS = ['session', 'logs', 'telemetry', 'pretasks']

// A project's `.vtex/` may also hold committed files (VTEX repos keep CI metadata there), so only the
// folders the CLI writes are ignored, each by its own `.gitignore`: the session holds login tokens.
export const ensureRuntimeFoldersIgnored = (vtexFolder: string, home = homedir()) => {
  if (vtexFolder === join(home, '.vtex')) {
    return
  }

  RUNTIME_FOLDERS.forEach(name => {
    const gitignore = join(vtexFolder, name, '.gitignore')
    if (!existsSync(gitignore)) {
      mkdirSync(join(vtexFolder, name), { recursive: true })
      writeFileSync(gitignore, '# Created by the VTEX CLI: machine-local login tokens and logs.\n*\n')
    }
  })
}

export class PathConstants {
  public static readonly VTEX_FOLDER = resolveVtexFolder()

  public static readonly PRETASKS_FOLDER = join(PathConstants.VTEX_FOLDER, 'pretasks')
  public static readonly TELEMETRY_FOLDER = join(PathConstants.VTEX_FOLDER, 'telemetry')
  public static readonly LOGS_FOLDER = join(PathConstants.VTEX_FOLDER, 'logs')
  public static readonly SESSION_FOLDER = join(PathConstants.VTEX_FOLDER, 'session')
}
