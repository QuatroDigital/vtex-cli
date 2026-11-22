import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { findRepoRoot } from './repoRoot'

describe('findRepoRoot', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'vtex-repo-')))
  const repo = join(root, 'repo')
  const worktree = join(repo, 'tmp', 'feature')
  const worktreeGitDir = join(repo, '.git', 'worktrees', 'feature')
  mkdirSync(worktreeGitDir, { recursive: true })
  mkdirSync(join(repo, 'packages', 'app'), { recursive: true })
  mkdirSync(join(worktree, 'packages', 'app'), { recursive: true })
  writeFileSync(join(worktreeGitDir, 'commondir'), '../..\n')
  writeFileSync(join(worktree, '.git'), `gitdir: ${worktreeGitDir}\n`)

  it('finds the repository root from a subfolder, and the main checkout from a worktree', () => {
    expect(findRepoRoot(join(repo, 'packages', 'app'))).toBe(repo)
    expect(findRepoRoot(join(worktree, 'packages', 'app'))).toBe(repo)
  })

  it('returns undefined outside any repository', () => {
    expect(findRepoRoot(root)).toBeUndefined()
  })
})
