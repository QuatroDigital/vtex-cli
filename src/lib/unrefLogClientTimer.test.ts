import { spawnSync } from 'child_process'

describe('unrefLogClientTimer', () => {
  it("lets the process exit right after loading @vtex/api, instead of waiting for the log client's 5 s timer", () => {
    const script = `require('ts-node/register/transpile-only')
      require('./src/lib/unrefLogClientTimer').unrefLogClientTimer()
      require('@vtex/api')`
    const started = Date.now()
    const { status } = spawnSync(process.execPath, ['-e', script], { cwd: `${__dirname}/../..`, timeout: 15000 })
    expect(status).toBe(0)
    expect(Date.now() - started).toBeLessThan(4000)
  })
})
