// قناة لحظية عبر Supabase Realtime: إشارة صغيرة عند أي تعديل كي تتحدث بقية الأجهزة فوراً
const WS_URL = 'wss://tuwtwpqnqjvpaymayxpu.supabase.co/realtime/v1/websocket';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d3R3cHFucWp2cGF5bWF5eHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzg5ODMsImV4cCI6MjEwODY1NDk4M30.ZDF23ITRcQWRRm66l1V8RhPGffIUGD9NqNq4VRCwARU';
const TOPIC = 'realtime:rt-lab-sync';

export function getRealtimeDeviceId(): string {
  try {
    let id = localStorage.getItem('rt_lab_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('rt_lab_device_id', id);
    }
    return id;
  } catch {
    return 'dev-anon';
  }
}

let socket: WebSocket | null = null;
let joined = false;
let joinRef: string | null = null;
let refCounter = 0;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let onRemoteChange: (() => void) | null = null;
let stopped = false;

function send(msg: Record<string, unknown>) {
  try {
    if (socket && socket.readyState === 1) socket.send(JSON.stringify(msg));
  } catch {
    /* تجاهل */
  }
}

function scheduleReconnect() {
  if (stopped) return;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connect(), 5000);
}

function connect() {
  if (stopped) return;
  try {
    socket = new WebSocket(`${WS_URL}?apikey=${API_KEY}&vsn=1.0.0`);
  } catch {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    joined = false;
    joinRef = String(++refCounter);
    send({
      topic: TOPIC,
      event: 'phx_join',
      payload: { config: { broadcast: { self: false }, presence: { enabled: false } } },
      ref: joinRef,
      join_ref: joinRef,
    });
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = setInterval(() => {
      send({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++refCounter), join_ref: null });
    }, 25000);
  };

  socket.onmessage = (event: MessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(event.data as string);
    } catch {
      return;
    }
    if (msg.event === 'phx_reply') {
      if (msg.payload && msg.payload.status === 'ok') joined = true;
      return;
    }
    if (msg.event === 'broadcast') {
      const inner = (msg.payload && msg.payload.payload) || {};
      if (inner.from && inner.from === getRealtimeDeviceId()) return;
      try {
        if (onRemoteChange) onRemoteChange();
      } catch {
        /* تجاهل */
      }
    }
  };

  socket.onclose = () => {
    joined = false;
    joinRef = null;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    scheduleReconnect();
  };

  socket.onerror = () => {
    try {
      socket?.close();
    } catch {
      /* تجاهل */
    }
  };
}

export function startRealtimeChannel(handler: () => void) {
  onRemoteChange = handler;
  if (socket && (socket.readyState === 0 || socket.readyState === 1)) return;
  stopped = false;
  connect();
}

export function broadcastCloudChange(kind = 'update') {
  if (!socket || socket.readyState !== 1 || !joined) return;
  send({
    topic: TOPIC,
    event: 'broadcast',
    payload: { type: 'broadcast', event: 'change', payload: { from: getRealtimeDeviceId(), at: Date.now(), kind } },
    ref: String(++refCounter),
    join_ref: joinRef,
  });
}
