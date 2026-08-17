// WebSocket 连接状态管理
import { create } from 'zustand';
import type { WebSocketStatus } from '@/types/websocket';
import wsService from '@/services/websocket';

interface WebSocketState {
  status: WebSocketStatus;
  taskId: string | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  setTaskId: (id: string | null) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  status: 'disconnected',
  taskId: null,

  connect: () => {
    wsService.connect();
    // 监听状态变化
    wsService.on('status_change', (status) => {
      set({ status: status as WebSocketStatus });
    });
  },
  disconnect: () => {
    wsService.disconnect();
    set({ status: 'disconnected' });
  },
  setTaskId: (taskId) => set({ taskId }),
}));
