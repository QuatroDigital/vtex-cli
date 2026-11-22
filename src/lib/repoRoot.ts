import { existsSync, readFileSync, statSync } from 'fs'
import { dirname, join, resolve } from 'path'

// The git repository's root from `cwd` up. A worktree resolves to its main checkout, so `vtex login
// --local` run from a worktree creates the session the main checkout and its worktrees share.
export const findRepoRoot = (cwd: string): string | undefined => {
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    const dotGit = join(dir, '.git')
    if (existsSync(dotGit)) {
      if (statSync(dotGit).isDirectory()) {
        return dir
      }

      // `gitdir: <main>/.git/worktrees/<name>`, whose `commondir` points back to `<main>/.git`.
      const gitDir = resolve(
        dir,
        readFileSync(dotGit, 'utf8')
          .replace(/^gitdir:/, '')
          .trim()
      )
      const commonDir = join(gitDir, 'commondir')
      return existsSync(commonDir) ? dirname(resolve(gitDir, readFileSync(commonDir, 'utf8').trim())) : dir
    }

    if (dirname(dir) === dir) {
      return undefined
    }
  }
}
