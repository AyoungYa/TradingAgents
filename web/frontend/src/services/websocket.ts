// WebSocket 服务
import { io, type Socket } from 'socket.io-client';
import type { WebSocketStatus } from '@/types/websocket';

type MessageHandler = (data: unknown) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private handlers: Map<string, Set<MessageHandler>> = new Map();

  /** 连接 WebSocket */
  connect(url?: string): void {
    if (this.socket?.connected) return;

    this.setStatus('connecting');

    this.socket = io(url || import.meta.env.VITE_WS_URL || '', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.setStatus('connected');
    });

    this.socket.on('disconnect', () => {
      this.setStatus('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.setStatus('error');
    });
  }

  /** 断开连接 */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  /** 订阅事件 */
  on(event: string, handler: MessageHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    this.socket?.on(event, handler);
  }

  /** 取消订阅 */
  off(event: string, handler?: MessageHandler): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
      this.socket?.off(event, handler);
    } else {
      this.handlers.get(event)?.forEach((h) => {
        this.socket?.off(event, h);
      });
      this.handlers.delete(event);
    }
  }

  /** 发送事件 */
  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  /** 获取连接状态 */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /** 设置状态并通知 */
  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.handlers.get('status_change')?.forEach((h) => h(status));
  }
}

/** 全局 WebSocket 服务单例 */
export const wsService = new WebSocketService();
export default wsService;
