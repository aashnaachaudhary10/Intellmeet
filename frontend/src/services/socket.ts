import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let currentToken: string | null = null

/**
 * Returns a connected socket for the given auth token.
 * If the token has changed (different user / re-login) the old socket is
 * fully disconnected and a fresh one is created, so two accounts never
 * share the same connection.
 */
export const getSocket = (authToken?: string): Socket => {
  const token = authToken ?? currentToken

  // Re-create if the token changed (user switched) or socket is dead
  if (socket && (currentToken !== token || !socket.connected)) {
    socket.disconnect()
    socket = null
  }

  if (!socket) {
    currentToken = token ?? null
    socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
      // Pass the access token so the server middleware can verify identity
      auth: { token: currentToken ?? '' },
      // Reconnection settings: retry but with a limit so stale sockets
      // don't ghost-join rooms after long idle periods
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    currentToken = null
  }
}
