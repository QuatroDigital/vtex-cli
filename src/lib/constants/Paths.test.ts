import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync } from 'fs'
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

  it('falls back to ~/.vtex when no project folder exists', () => {
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
