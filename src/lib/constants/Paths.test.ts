import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { ensureRuntimeFoldersIgnored, resolveVtexFolder } from './Paths'

describe('resolveVtexFolder', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'vtex-home-')))
  const home = join(root, 'home')
  const project = join(root, 'project')
  const appFolder = join(project, 'packages', 'app')
  mkdirSync(join(project, '.vtex', 'session'), { recursive: true })
  mkdirSync(appFolder, { recursive: true })

  it('uses VTEX_HOME, resolved from the working directory, over any project folder', () => {
    expect(resolveVtexFolder({ VTEX_HOME: 'custom' }, appFolder, home)).toBe(join(appFolder, 'custom'))
  })

  it('uses the nearest .vtex/session above the working directory', () => {
    expect(resolveVtexFolder({}, appFolder, home)).toBe(join(project, '.vtex'))
  })

  it("uses the git repository's root, also from a worktree of it", () => {
    const repo = join(root, 'repo')
    const worktree = join(repo, 'tmp', 'feature')
    const worktreeGitDir = join(repo, '.git', 'worktrees', 'feature')
    mkdirSync(worktreeGitDir, { recursive: true })
    mkdirSync(join(repo, 'packages', 'app'), { recursive: true })
    mkdirSync(join(worktree, 'packages', 'app'), { recursive: true })
    writeFileSync(join(worktreeGitDir, 'commondir'), '../..\n')
    writeFileSync(join(worktree, '.git'), `gitdir: ${worktreeGitDir}\n`)

    expect(resolveVtexFolder({}, join(repo, 'packages', 'app'), home)).toBe(join(repo, '.vtex'))
    expect(resolveVtexFolder({}, join(worktree, 'packages', 'app'), home)).toBe(join(repo, '.vtex'))
  })

  it('falls back to ~/.vtex outside any project or repository', () => {
    expect(resolveVtexFolder({}, root, home)).toBe(join(home, '.vtex'))
  })
})

describe('ensureRuntimeFoldersIgnored', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'vtex-ignore-')))
  const home = join(root, 'home')

  it("ignores the CLI's own folders inside a project, never the project's .vtex itself", () => {
    const vtexFolder = join(root, 'project', '.vtex')
    ensureRuntimeFoldersIgnored(vtexFolder, home)
    expect(readFileSync(join(vtexFolder, 'session', '.gitignore'), 'utf8')).toMatch(/^\*$/m)
    expect(existsSync(join(vtexFolder, '.gitignore'))).toBe(false)
  })

  it('leaves ~/.vtex alone', () => {
    ensureRuntimeFoldersIgnored(join(home, '.vtex'), home)
    expect(existsSync(join(home, '.vtex', 'session', '.gitignore'))).toBe(false)
  })
})
