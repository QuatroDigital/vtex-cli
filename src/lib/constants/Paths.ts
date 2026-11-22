import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'
import { EnvVariablesConstants } from './EnvVariables'

// The login and workspace live in a `.vtex` folder: `VTEX_HOME` if set, else the nearest `.vtex/session`
// from the working directory up (a folder that wants its own session), else the git repository's root,
// so every package of a monorepo shares one session. A worktree's `.git` file leads back to the main
// checkout, so worktrees share its session too. Outside any repository, `~/.vtex`.
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

    const dotGit = join(dir, '.git')
    if (existsSync(dotGit)) {
      if (statSync(dotGit).isDirectory()) {
        return candidate
      }

      // `gitdir: <main>/.git/worktrees/<name>`, whose `commondir` points back to `<main>/.git`.
      const gitDir = resolve(
        dir,
        readFileSync(dotGit, 'utf8')
          .replace(/^gitdir:/, '')
          .trim()
      )
      const commonDir = join(gitDir, 'commondir')
      return existsSync(commonDir)
        ? join(dirname(resolve(gitDir, readFileSync(commonDir, 'utf8').trim())), '.vtex')
        : candidate
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
