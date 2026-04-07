import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { startPolling } from '#/lib/server/polling';

startPolling(60_000);

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request)
  },
})
