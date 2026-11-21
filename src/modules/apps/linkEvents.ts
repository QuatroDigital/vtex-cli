import { appendFileSync, writeFileSync } from 'fs'
import { createAppsClient } from '../../api/clients/IOClients/infra/Apps'
import log from '../../api/logger'

interface BuildStatusMessage {
  body: { code: string; message?: string; details?: { errorCode?: string } }
}

// `vtex link --events-file`: one JSON object per line, for scripts and agents that follow a link
// without parsing its terminal output, which also carries yarn's.
export const createLinkEventsWriter = (path: string, appId: string) => {
  writeFileSync(path, '')
  const emit = (event: Record<string, unknown>) =>
    appendFileSync(path, `${JSON.stringify({ ts: new Date().toISOString(), app: appId, ...event })}\n`)

  // A build can report success while the workspace keeps serving an older link (a patch on top of
  // a failed initial build), so readiness is confirmed against the linked version itself.
  const confirmLinked = async () => {
    const { data } = await createAppsClient().listApps()
    const [name] = appId.split('@')
    // `_source` is in the API response (`vtex ls` filters on it) but not in the client's typings.
    const linked = data.find(
      ({ app, _source }: { app: string; _source?: string }) => _source === 'link' && app.split('@')[0] === name
    )
    const linkedId = linked ? linked.app.split('+build')[0] : null
    emit(linkedId === appId ? { event: 'ready' } : { event: 'stale', linked: linkedId })
  }

  const onBuildStatus = ({ body: { code, message, details } }: BuildStatusMessage) => {
    emit({ event: 'build', status: code, ...(code === 'fail' && { errorCode: details?.errorCode, message }) })
    if (code === 'success') {
      confirmLinked().catch(err => {
        log.debug('Failed to confirm the linked version', err)
        emit({ event: 'stale', linked: null, error: err.message })
      })
    }
  }

  return { emit, onBuildStatus }
}
