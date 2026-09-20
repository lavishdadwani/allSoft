// Shared between the main-thread axios client and the ZIP web worker, both of
// which need to know the backend's custom auth header name without duplicating
// the literal in two places. Deliberately has no localStorage/DOM dependency so
// it's safe to import from a worker.
export const AUTH_HEADER_NAME = 'token'

// Fired on `window` when the API rejects a request as unauthorized, so any part
// of the app that cares about session validity (AuthContext) can react without
// the axios layer needing to know about React state.
export const SESSION_EXPIRED_EVENT = 'dms:session-expired'
