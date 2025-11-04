import io from 'socket.io-client';

let socketInstance: any = null;

export type SocketHandlers = {
  onConnect?: (id: string) => void;
  onNewTransaction?: (tx: any) => void;
  onTransactionUpdated?: (tx: any) => void;
  onNewAnomaly?: (an: any) => void;
  onAnomalyUpdated?: (an: any) => void;
  onAnomalyDeleted?: (id: string) => void;
};

export function getSocket(token?: string) {
  if (socketInstance) return socketInstance;

  const base = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || '';
  const url = base || undefined; // undefined lets socket use current origin

  socketInstance = io(url || '', {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
  });

  return socketInstance;
}

export function addSocketListeners(socket: any, handlers: SocketHandlers = {}) {
  if (handlers.onConnect) {
    socket.on('connect', () => handlers.onConnect?.(socket.id));
  }

  socket.on('newTransaction', (tx: any) => handlers.onNewTransaction?.(tx));
  socket.on('transactionUpdated', (tx: any) => handlers.onTransactionUpdated?.(tx));
  socket.on('newAnomaly', (an: any) => handlers.onNewAnomaly?.(an));
  socket.on('anomalyUpdated', (an: any) => handlers.onAnomalyUpdated?.(an));
  socket.on('anomalyDeleted', (id: any) => handlers.onAnomalyDeleted?.(id));

  // optional error handlers
  socket.on('connect_error', (err: any) => console.error('Socket connect_error', err));
  socket.on('disconnect', (reason: any) => console.log('Socket disconnected', reason));

  return () => {
    socket.off('connect');
    socket.off('newTransaction');
    socket.off('transactionUpdated');
    socket.off('newAnomaly');
    socket.off('anomalyUpdated');
    socket.off('anomalyDeleted');
    socket.off('connect_error');
    socket.off('disconnect');
  };
}

export function disconnectSocket() {
  if (socketInstance) {
    try {
      socketInstance.disconnect();
    } catch (err) {
      // ignore
    }
    socketInstance = null;
  }
}
