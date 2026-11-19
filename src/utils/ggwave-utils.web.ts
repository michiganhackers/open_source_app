import ggwave_factory from "ggwave";

let state_promise: Promise<GgwaveState> | null = null;

// Use this whenever you need ggwave. It is never null.
export function get_ggwave(): Promise<GgwaveState> {
  if (state_promise === null) {
    state_promise = (async () => {
      const ggwave = await ggwave_factory();

      const parameters = ggwave.getDefaultParameters();
      parameters.sampleRateInp = 48000;
      parameters.sampleRateOut = 48000;
      parameters.operatingMode |= ggwave.GGWAVE_OPERATING_MODE_USE_DSS;

      const instance = ggwave.init(parameters);
      return { ggwave, instance };
    })();
  }
  return state_promise;
}

export async function string_to_ggwaveform(
  payload: string,
): Promise<Int8Array> {
  const { ggwave, instance } = await get_ggwave();
  return ggwave.encode(
    instance,
    payload,
    ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
    10,
  );
}

export function play_ggwaveform(waveform: Int8Array) {
  const floats = new Float32Array(
    waveform.buffer,
    waveform.byteOffset,
    waveform.byteLength / 4,
  );

  const audioCtx = new AudioContext({ sampleRate: 48000 });
  const buffer = audioCtx.createBuffer(1, floats.length, 48000);
  buffer.getChannelData(0).set(floats);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

export async function listen_ggwaveform(onMessage: (text: string) => void) {
  const { ggwave, instance } = await get_ggwave();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
    },
  });

  const context = new AudioContext({ sampleRate: 48000 });
  const source = context.createMediaStreamSource(stream);
  const recorder = context.createScriptProcessor(1024, 1, 1);

  recorder.onaudioprocess = (e) => {
    const floats = new Float32Array(e.inputBuffer.getChannelData(0));
    const bytes = new Int8Array(floats.buffer);

    const result = ggwave.decode(instance, bytes);
    if (result && result.length > 0) {
      onMessage(new TextDecoder("utf-8").decode(result));
    }
  };

  source.connect(recorder);
  recorder.connect(context.destination);

  // call this to stop listening
  return () => {
    recorder.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    context.close();
  };
}

export async function play_string_as_ggwave(payload: string) {
  await play_ggwaveform(await string_to_ggwaveform(payload));
}
