type BroadcastCommand = {
  id: number;
  payload: string;
};

type Pending = {
  command: BroadcastCommand;
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  sent: boolean;
};

let sendToWebView:
  | ((command: BroadcastCommand) => void)
  | null = null;

let ready = false;
let nextId = 1;

const pending = new Map<number, Pending>();

function rejectPending(reason: string) {
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error(reason));
  }
  pending.clear();
}

function flushPending() {
  if (!ready || !sendToWebView) return;

  for (const request of pending.values()) {
    if (!request.sent) {
      request.sent = true;
      sendToWebView(request.command);
    }
  }
}

export function attachGGWaveBridge(
  send: (command: BroadcastCommand) => void
) {
  sendToWebView = send;
  ready = false;

  console.log("[GGWave] Android WebView attached");

  return () => {
    if (sendToWebView !== send) return;
    sendToWebView = null;
    ready = false;
    rejectPending("GGWave WebView disconnected");
  };
}

export function handleGGWaveMessage(raw: string) {
  let message: any;

  try {
    message = JSON.parse(raw);
  } catch {
    console.error("[GGWave] Invalid bridge message:", raw);
    return;
  }

  if (message.type === "ready") {
    ready = true;
    console.log("[GGWave] Engine ready! DSS disabled.");
    flushPending();
    return;
  }

  if (message.type === "init-error") {
    ready = false;
    console.error("[GGWave] Initialization failed:", message.error);
    rejectPending(String(message.error));
    return;
  }

  if (message.type === "started") {
    console.log("[GGWave] Broadcasting:", message.payload);
    console.log("[GGWave] Audio bytes:", message.bytes);
    return;
  }

  const request = pending.get(message.id);
  if (!request) return;

  clearTimeout(request.timer);
  pending.delete(message.id);

  if (message.type === "complete") {
    console.log("[GGWave] Broadcast complete!");
    request.resolve();
  } else {
    console.error("[GGWave] Broadcast failed:", message.error);
    request.reject(new Error(String(message.error)));
  }
}

export function play_string_as_ggwave(
  payload: string
): Promise<void> {
  if (!sendToWebView) {
    return Promise.reject(
      new Error("GGWave Android WebView is not mounted")
    );
  }

  const command = {
    id: nextId++,
    payload,
  };

  console.log("[GGWave] TX PAYLOAD:", JSON.stringify(payload));

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(command.id);
      reject(new Error("GGWave broadcast timed out"));
    }, 30000);

    pending.set(command.id, {
      command,
      resolve,
      reject,
      timer,
      sent: false,
    });

    flushPending();
  });
}

export async function listen_ggwaveform(
  _onMessage: (text: string) => void
): Promise<() => void> {
  throw new Error(
    "Android GGWave microphone reception is not implemented yet."
  );
}
