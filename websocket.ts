import { ConnectionState, WSMessage } from '../types/market';

type MessageHandler = (msg: WSMessage) => void;
type StatusHandler = (status: ConnectionState) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private status: ConnectionState = 'OFFLINE';
  private reconnectAttempts = 0;
  private maxReconnectDelay = 8000;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private isIntentionallyClosed = false;

  constructor() {
    // auto-bind
  }

  public connect() {
    this.isIntentionallyClosed = false;
    this.clearTimers();
    this.setStatus('CONNECTING');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('LIVE');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          for (const handler of this.messageHandlers) {
            handler(data);
          }
        } catch (e) {
          console.error('[WS Client] Failed to parse message', e);
        }
      };

      this.ws.onerror = () => {
        // ws.onclose will trigger next
      };

      this.ws.onclose = () => {
        this.clearHeartbeat();
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        } else {
          this.setStatus('OFFLINE');
        }
      };
    } catch (err) {
      console.error('[WS Client] Connection initialization error', err);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }
    this.setStatus('OFFLINE');
  }

  public send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  public getStatus(): ConnectionState {
    return this.status;
  }

  private setStatus(newStatus: ConnectionState) {
    this.status = newStatus;
    for (const h of this.statusHandlers) {
      h(newStatus);
    }
  }

  private scheduleReconnect() {
    this.setStatus('RECONNECTING');
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);

    this.clearTimers();
    this.reconnectTimer = setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 15000);
  }

  private clearHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearHeartbeat();
  }
}

export const wsClient = new WebSocketClient();
