import { spawn } from 'child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { findRunningLinks, isLinkCommand, stopRunningLinks } from './runningLinks'

describe('isLinkCommand', () => {
  it.each([
    ['node /repo/node_modules/.bin/vtex link', true],
    ['/usr/local/bin/node /cli/bin/run --path apps/my-app link --events-file tmp/link.jsonl', true],
    ['node /repo/node_modules/.bin/vtex link --stop', false],
    ['node /repo/node_modules/.bin/vtex link --help', false],
    ['node /repo/node_modules/.bin/vtex unlink', false],
    ['npm exec vtex link', false],
    ['sh -c npm run css:watch & cd theme && /repo/node_modules/.bin/vtex link', false],
  ])('%s → %s', (command, expected) => {
    expect(isLinkCommand(command)).toBe(expected)
  })
})

describe('findRunningLinks and stopRunningLinks', () => {
  const app = mkdtempSync(join(tmpdir(), 'vtex-link-'))
  mkdirSync(join(app, 'react'))
  writeFileSync(join(app, 'manifest.json'), '{}')

  it('finds a link started in a subfolder of the app, and stops it', async () => {
    const link = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)', '/cli/bin/vtex', 'link'], {
      cwd: join(app, 'react'),
    })
    const exited = new Promise(resolve => link.on('exit', (_, signal) => resolve(signal)))
    await new Promise(resolve => setTimeout(resolve, 300))

    expect(findRunningLinks(app)).toEqual([link.pid])
    expect(await stopRunningLinks(app)).toEqual([link.pid])
    expect(await exited).toBe('SIGTERM')
    expect(findRunningLinks(app)).toEqual([])
  })
})
