import React, { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, AppState, Alert, Linking } from "react-native";
import { requestRecordingPermissionsAsync } from "expo-audio";
import WebView from "react-native-webview";

import { GGWAVE_JS_BASE64 } from "@/utils/ggwave-webview-source";

import {
  attachGGWaveBridge,
  handleGGWaveMessage,
} from "@/utils/ggwave-utils";

const HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<script>
(function () {
  function report(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  }

  async function initialize() {
    try {
      const binary = atob("${GGWAVE_JS_BASE64}");

      const bytes = Uint8Array.from(
        binary,
        c => c.charCodeAt(0)
      );

      const source = new TextDecoder("utf-8").decode(bytes);

      const script = document.createElement("script");

      script.textContent =
        source + ";window.__ggwaveFactory = ggwave_factory;";

      document.head.appendChild(script);

      const ggwave = await window.__ggwaveFactory();

      const parameters = ggwave.getDefaultParameters();

      parameters.sampleRateInp = 48000;
      parameters.sampleRateOut = 48000;

      // IMPORTANT: DSS was causing incompatible transmissions.
      parameters.operatingMode &=
        ~ggwave.GGWAVE_OPERATING_MODE_USE_DSS;

      const instance = ggwave.init(parameters);


      // Android GGWave microphone receiver.
      let rxStream = null;
      let rxContext = null;
      let rxSource = null;
      let rxProcessor = null;
      let rxGain = null;
      let rxStarting = false;
      let rxGeneration = 0;
      let lastDecodeError = 0;

      window.stopGGWaveListening = async function() {
        rxGeneration++;

        if (rxProcessor) {
          rxProcessor.onaudioprocess = null;
          try { rxProcessor.disconnect(); } catch (_) {}
        }

        if (rxSource) {
          try { rxSource.disconnect(); } catch (_) {}
        }

        if (rxGain) {
          try { rxGain.disconnect(); } catch (_) {}
        }

        if (rxStream) {
          rxStream.getTracks().forEach(function(track) {
            track.stop();
          });
        }

        if (rxContext) {
          try { await rxContext.close(); } catch (_) {}
        }

        rxStream = null;
        rxContext = null;
        rxSource = null;
        rxProcessor = null;
        rxGain = null;
        rxStarting = false;

        report({ type: "rx-status", status: "stopped" });
      };

      window.startGGWaveListening = async function() {
        if (rxContext || rxStarting) return;

        const generation = ++rxGeneration;
        rxStarting = true;

        let stream = null;
        let context = null;
        let source = null;
        let processor = null;
        let gain = null;

        try {
          if (!navigator.mediaDevices ||
              !navigator.mediaDevices.getUserMedia) {
            throw new Error(
              "getUserMedia unavailable. Origin: " +
              location.origin +
              ", secure: " + window.isSecureContext
            );
          }

          report({
            type: "rx-status",
            status: "requesting microphone"
          });

          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              autoGainControl: false,
              noiseSuppression: false
            }
          });

          if (generation !== rxGeneration) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

          context = new AudioContextClass({
            sampleRate: 48000
          });

          if (context.sampleRate !== 48000) {
            throw new Error(
              "Expected 48000 Hz, got " + context.sampleRate
            );
          }

          source = context.createMediaStreamSource(stream);
          processor = context.createScriptProcessor(1024, 1, 1);

          // Connect to the audio graph without audible output.
          gain = context.createGain();
          gain.gain.value = 0;

          processor.onaudioprocess = function(event) {
            try {
              const samples = new Float32Array(
                event.inputBuffer.getChannelData(0)
              );

              const bytes = new Int8Array(samples.buffer);
              const decoded = ggwave.decode(instance, bytes);

              if (decoded && decoded.length > 0) {
                const output = Uint8Array.from(
                  decoded,
                  value => value & 255
                );

                const text = new TextDecoder(
                  "utf-8",
                  { fatal: true }
                ).decode(output);

                report({
                  type: "rx-message",
                  text: text,
                  hex: Array.from(output)
                    .map(b => b.toString(16).padStart(2, "0"))
                    .join(" ")
                });
              }
            } catch (error) {
              // Avoid flooding logs for every audio buffer.
              if (Date.now() - lastDecodeError > 5000) {
                lastDecodeError = Date.now();
                report({
                  type: "rx-error",
                  error: String(error)
                });
              }
            }
          };

          source.connect(processor);
          processor.connect(gain);
          gain.connect(context.destination);

          await context.resume();

          if (generation !== rxGeneration) {
            stream.getTracks().forEach(t => t.stop());
            processor.disconnect();
            source.disconnect();
            gain.disconnect();
            await context.close();
            return;
          }

          rxStream = stream;
          rxContext = context;
          rxSource = source;
          rxProcessor = processor;
          rxGain = gain;

          report({
            type: "rx-status",
            status: "listening",
            sampleRate: context.sampleRate
          });

        } catch (error) {
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }

          if (processor) {
            try { processor.disconnect(); } catch (_) {}
          }

          if (source) {
            try { source.disconnect(); } catch (_) {}
          }

          if (gain) {
            try { gain.disconnect(); } catch (_) {}
          }

          if (context) {
            try { await context.close(); } catch (_) {}
          }

          report({
            type: "rx-error",
            error: String(error),
            origin: location.origin,
            secure: window.isSecureContext
          });

        } finally {
          rxStarting = false;
        }
      };

      let broadcasting = false;

      window.broadcastGGWave = async function(command) {
        const id = command.id;
        const payload = command.payload;

        if (broadcasting) {
          report({
            type: "error",
            id,
            error: "Broadcast already in progress"
          });
          return;
        }

        broadcasting = true;
        let context = null;

        try {
          const waveform = ggwave.encode(
            instance,
            payload,
            ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
            10
          );

          if (!waveform || waveform.byteLength === 0) {
            throw new Error("GGWave returned no audio");
          }

          const samples = new Float32Array(
            waveform.buffer,
            waveform.byteOffset,
            waveform.byteLength / 4
          );

          const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

          context = new AudioContextClass({
            sampleRate: 48000
          });

          const buffer = context.createBuffer(
            1,
            samples.length,
            48000
          );

          buffer.getChannelData(0).set(samples);

          const player = context.createBufferSource();

          player.buffer = buffer;
          player.connect(context.destination);

          const finished = new Promise(resolve => {
            player.onended = resolve;
          });

          await context.resume();

          if (context.state !== "running") {
            throw new Error("AudioContext could not start");
          }

          player.start();

          report({
            type: "started",
            id,
            payload,
            bytes: waveform.byteLength
          });

          await finished;

          report({
            type: "complete",
            id
          });

        } catch (error) {
          report({
            type: "error",
            id,
            error: String(error)
          });

        } finally {
          if (context) {
            try {
              await context.close();
            } catch (_) {}
          }

          broadcasting = false;
        }
      };

      report({ type: "ready" });

    } catch (error) {
      report({
        type: "init-error",
        error: String(error)
      });
    }
  }

  initialize();
})();
</script>
</body>
</html>
`;

export default function GGWaveAndroidHost() {
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const permissionRef = useRef(false);
  const foregroundRef = useRef(AppState.currentState === "active");
  const recentRef = useRef({ text: "", time: 0 });
  const lastSentRef = useRef({ text: "", time: 0 });

  const syncListening = useCallback(() => {
    if (!readyRef.current || !webViewRef.current) return;

    const shouldListen =
      foregroundRef.current && permissionRef.current;

    webViewRef.current.injectJavaScript(
      shouldListen
        ? "window.startGGWaveListening(); true;"
        : "window.stopGGWaveListening(); true;"
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    requestRecordingPermissionsAsync()
      .then(result => {
        if (!mounted) return;

        permissionRef.current = result.granted;

        console.log(
          "[GGWave RX] Microphone permission:",
          result.granted ? "granted" : "denied"
        );

        syncListening();
      })
      .catch(error => {
        console.error("[GGWave RX] Permission error:", error);
      });

    const subscription = AppState.addEventListener(
      "change",
      state => {
        foregroundRef.current = state === "active";
        syncListening();
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [syncListening]);

  const sendCommand = useCallback((command: {
    id: number;
    payload: string;
  }) => {
    webViewRef.current?.injectJavaScript(
      "window.broadcastGGWave(" +
      JSON.stringify(command) +
      "); true;"
    );
  }, []);

  useEffect(() => {
    return attachGGWaveBridge(sendCommand);
  }, [sendCommand]);

  return (
    <View pointerEvents="none" style={styles.hidden}>
      <WebView
        ref={webViewRef}
        source={{ html: HTML, baseUrl: "https://appassets.androidplatform.net/" }}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={(event) => {
          const raw = event.nativeEvent.data;
          let message: any;

          try {
            message = JSON.parse(raw);
          } catch {
            handleGGWaveMessage(raw);
            return;
          }

          if (message.type === "ready") {
            readyRef.current = true;
            handleGGWaveMessage(raw);
            syncListening();
            return;
          }

          if (message.type === "started") {
            lastSentRef.current = {
              text: message.payload,
              time: Date.now(),
            };
          }

          if (message.type === "rx-status") {
            console.log("[GGWave RX]", message.status);
            return;
          }

          if (message.type === "rx-error") {
            console.error("[GGWave RX]", message.error);
            return;
          }

          if (message.type === "rx-message") {
            const text = String(message.text || "").trim();

            console.log("[GGWave RX] RECEIVED:", text);
            console.log("[GGWave RX] HEX:", message.hex);

            const now = Date.now();

            // Ignore our own recent broadcasts.
            if (
              text === lastSentRef.current.text &&
              now - lastSentRef.current.time < 15000
            ) {
              return;
            }

            // Suppress repeated prompts from the same audio.
            if (
              text === recentRef.current.text &&
              now - recentRef.current.time < 30000
            ) {
              return;
            }

            recentRef.current = { text, time: now };

            // Firebase identifiers can be handled here later.
            // For now, prompt only for HTTPS links.
            let valid = false;

            try {
              const url = new URL(text);
              valid =
                url.protocol === "https:" &&
                Boolean(url.hostname);
            } catch {}

            if (!valid) {
              console.log("[GGWave RX] Not an HTTPS link.");
              return;
            }

            Alert.alert(
              "Link received",
              text,
              [
                {
                  text: "Decline",
                  style: "cancel",
                },
                {
                  text: "Accept",
                  onPress: () => {
                    Linking.openURL(text).catch(error => {
                      console.error(
                        "[GGWave RX] Couldn't open link:",
                        error
                      );
                    });
                  },
                },
              ],
              { cancelable: true }
            );

            return;
          }

          handleGGWaveMessage(raw);
        }}
        onError={(event) => {
          handleGGWaveMessage(JSON.stringify({
            type: "init-error",
            error: event.nativeEvent.description,
          }));
        }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 2,
    height: 2,
    opacity: 0.01,
  },
});
