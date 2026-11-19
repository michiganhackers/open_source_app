import React, { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
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
        source={{ html: HTML }}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={(event) => {
          handleGGWaveMessage(event.nativeEvent.data);
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
