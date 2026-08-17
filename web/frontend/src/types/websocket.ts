// WebSocket 相关类型定义

/** WebSocket 连接状态 */
export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** WebSocket 事件类型 */
export type WSEventType =
  | 'analysis_started'
  | 'analysis_progress'
  | 'agent_status'
  | 'message'
  | 'report_update'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'error';

/** WebSocket 事件 */
export interface WSEvent<T = unknown> {
  type: WSEventType;
  data: T;
  timestamp: string;
}
