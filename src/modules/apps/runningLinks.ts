import { execFileSync } from 'child_process'
import { existsSync, readlinkSync, realpathSync } from 'fs'
import { basename, dirname, join } from 'path'

// The process table is the registry of running links: there is no state file to write, and nothing stale to clean up.
// ponytail: splits `ps` output on spaces, so a node or CLI path containing spaces is not recognized.
export const isLinkCommand = (command: string) => {
  const [executable, ...args] = command.trim().split(/\s+/)
  const entry = args.findIndex(arg => /(^|\/)(vtex|bin\/run)$/.test(arg))
  if (basename(executable) !== 'node' || entry === -1) {
    return false
  }

  // `--path <dir>` may come before the command (bin/run handles it).
  const rest = args.slice(entry + 1).filter((_, i, all) => all[i - 1] !== '--path')
  const [commandName] = rest.filter(arg => !arg.startsWith('-'))
  return commandName === 'link' && !rest.some(arg => ['--stop', '-h', '--help'].includes(arg))
}

const cwdOf = (pid: number) =>
  process.platform === 'linux'
    ? readlinkSync(`/proc/${pid}/cwd`)
    : execFileSync('lsof', ['-a', '-d', 'cwd', '-p', String(pid), '-Fn'], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .split('\n')
        .find(line => line.startsWith('n'))
        ?.slice(1)

// A link started in a subfolder watches the nearest folder above it with a manifest, as `getAppRoot` does.
const appRootOf = (dir: string): string | undefined => {
  if (existsSync(join(dir, 'manifest.json'))) {
    return realpathSync(dir)
  }

  return dirname(dir) === dir ? undefined : appRootOf(dirname(dir))
}

export const findRunningLinks = (appRoot: string): number[] => {
  if (process.platform === 'win32') {
    return []
  }

  const root = realpathSync(appRoot)
  return execFileSync('ps', ['-axo', 'pid=,command='])
    .toString()
    .split('\n')
    .map(line => line.trim().match(/^(\d+)\s+(.*)$/))
    .filter(match => match && Number(match[1]) !== process.pid && isLinkCommand(match[2]))
    .map(match => Number(match[1]))
    .filter(pid => {
      try {
        return appRootOf(cwdOf(pid)) === root
      } catch {
        return false // exited meanwhile, or owned by another user
      }
    })
}

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

// Only the CLI process is signalled, never its process group: a link started from another program's shell shares
// that program's group. A wrapping script ends its own helpers when the CLI exits (e.g. a `trap ... EXIT`).
export const stopRunningLinks = async (appRoot: string, timeoutMs = 10000) => {
  if (process.platform === 'win32') {
    throw new Error('vtex link --stop is not supported on Windows.')
  }

  const pids = findRunningLinks(appRoot)
  pids.forEach(pid => process.kill(pid, 'SIGTERM'))

  const deadline = Date.now() + timeoutMs
  while (pids.some(isAlive) && Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Re-checked so a PID reused since the SIGTERM is never killed.
  const stuck = pids.filter(pid => isAlive(pid) && findRunningLinks(appRoot).includes(pid))
  stuck.forEach(pid => process.kill(pid, 'SIGKILL'))
  return pids
}
