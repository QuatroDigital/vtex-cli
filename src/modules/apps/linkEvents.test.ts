import { mkdtempSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createLinkEventsWriter } from './linkEvents'

const listApps = jest.fn()
jest.mock('../../api/clients/IOClients/infra/Apps', () => ({ createAppsClient: () => ({ listApps }) }))
jest.mock('../../api/logger', () => ({ __esModule: true, default: { debug: jest.fn() } }))

const readEvents = (path: string) =>
  readFileSync(path, 'utf8')
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))

const settle = () => new Promise(resolve => setImmediate(resolve))

describe('createLinkEventsWriter', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'link-events-')), 'events.jsonl')

  it('reports ready only when the workspace links the local version', async () => {
    listApps.mockResolvedValueOnce({ data: [{ app: 'vendor.app@1.2.0+build1', _source: 'link' }] })
    const { onBuildStatus } = createLinkEventsWriter(path, 'vendor.app@1.2.0')
    onBuildStatus({ body: { code: 'success' } })
    await settle()
    expect(readEvents(path).map(({ event, status }) => status ?? event)).toEqual(['success', 'ready'])
  })

  it('reports stale when a build succeeds but an older link is still served', async () => {
    listApps.mockResolvedValueOnce({ data: [{ app: 'vendor.app@1.1.0+build9', _source: 'link' }] })
    const { onBuildStatus } = createLinkEventsWriter(path, 'vendor.app@1.2.0')
    onBuildStatus({ body: { code: 'fail', message: 'boom', details: { errorCode: 'GenericError' } } })
    onBuildStatus({ body: { code: 'success' } })
    await settle()
    const [fail, , stale] = readEvents(path)
    expect(fail).toMatchObject({ event: 'build', status: 'fail', errorCode: 'GenericError', message: 'boom' })
    expect(stale).toMatchObject({ event: 'stale', linked: 'vendor.app@1.1.0' })
  })
})
