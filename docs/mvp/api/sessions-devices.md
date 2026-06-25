# Sessions and Devices

Track active sessions for security and multi-device support.

## Endpoints

### GET /api/sessions

List active sessions for current user. Returns array with: `id`, `deviceName`, `os`, `browser`, `ip` (anonymized), `lastSeen`, `createdAt`, `isCurrent`.

### DELETE /api/sessions/:id

Revoke specific session. Immediate logout on target device.

### DELETE /api/sessions

Revoke all sessions except current. "Logout everywhere."

### POST /api/sessions/revoke-offline

Mark offline sessions expired after 15+ days inactivity.

## Session Entity

Fields:

- `id`: UUID
- `user_id`: UUID
- `refresh_token_hash`: hashed token (never store plain)
- `device_name`: user-friendly name (e.g., "My iPhone")
- `os`: operating system
- `browser`: browser name
- `ip_address`: last known IP (anonymized)
- `last_seen_at`: timestamp of last request
- `created_at`: session start
- `expires_at`: token expiration
- `revoked_at`: null until revoked
- `revoked_by`: "user" | "server" | "security"

## Device Name

- Auto-detect on first login (OS + browser)
- User can rename: "Work Laptop", "Mom's iPad"
- Stored in `device_name` field
- Displayed in session list

## Last Seen

- Updated on every authenticated request
- Stored in `last_seen_at`
- Display as "2 minutes ago", "Yesterday", etc.

## Offline Remembered Sessions

- "Remember me" checkbox on login
- Extends session to 15+ days
- Refresh token stored in httpOnly cookie
- Client retries sync on reconnect
- If revoked while offline, reject on next request

## Server Revocation on Reconnect

When offline device reconnects:

1. Server checks if session revoked
2. If revoked, return 401 Unauthorized
3. Client deletes local data (security)
4. Redirect to login

Revocation reasons:

- User clicked "logout everywhere"
- Password changed
- Security flag (suspicious activity)

## Audit Events

Log to `audit_log`:

- Actions: `session_created`, `session_revoked`, `session_revoked_security`, `session_extended`
- Fields: `user_id`, `session_id`, `ip_address`, `user_agent`, `timestamp`

## Security Features

- Revoke all sessions on password change
- Notify user of new device login (email)
- Max 5 active sessions per user
- Daily cron deletes expired/revoked sessions (>30 days)
