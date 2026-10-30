export function playWaveform(waveform: Int8Array) {
  // Reinterpret the bytes as 32-bit floats (the format ggwave produces)
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
