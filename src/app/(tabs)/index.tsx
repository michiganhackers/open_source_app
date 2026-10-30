import { useEffect, useState } from "react";
import { AccessibilityInfo, Button, StyleSheet, View } from "react-native";
import ggwave_factory from "ggwave";

import { ConfirmSheet, type ConfirmRequest } from "@/components/confirm-sheet";
import { LinkNote } from "@/components/link-note";
import { PayloadInput } from "@/components/payload-input";
import { PrimaryButton } from "@/components/primary-button";
import { PulseRing } from "@/components/pulse-ring";
import { ScreenContainer } from "@/components/screen-container";
import { SegmentedControl } from "@/components/segmented-control";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Waveform } from "@/components/waveform";
import { MAX_PAYLOAD_LENGTH } from "@/constants/limits";
import { Spacing } from "@/constants/theme";
import { useBroadcast } from "@/hooks/use-broadcast";
import { useListen, type ReceivedMessage } from "@/hooks/use-listen";
import { usePayloadActions } from "@/hooks/use-payload-actions";
import { useTheme } from "@/hooks/use-theme";
import { useShareDraft, type ShareDraft } from "@/state/share-draft";
import type { TransmissionOrigin } from "@/types/transmission";
import { formatRelativeTime } from "@/utils/format";
import { getSafeUrl, sanitizePayload } from "@/utils/payload";
import { findSensitiveReasons } from "@/utils/sensitive";
import { playWaveform } from "@/utils/ggwave-utils";

type Mode = "send" | "receive";

const MODE_OPTIONS = [
  { value: "send", label: "Send" },
  { value: "receive", label: "Receive" },
] as const;

export default function ShareScreen() {
  const theme = useTheme();
  const broadcast = useBroadcast();
  const listen = useListen();
  const { draft, clearDraft } = useShareDraft();
  const { copy, requestOpen, linkSheet } = usePayloadActions();

  const [mode, setMode] = useState<Mode>("send");
  const [text, setText] = useState("");
  const [origin, setOrigin] = useState<TransmissionOrigin>("local");
  const [sensitiveCheck, setSensitiveCheck] = useState<ConfirmRequest | null>(
    null,
  );

  const isBroadcasting = broadcast.status === "broadcasting";
  const isListening = listen.status === "listening";
  const busy = isBroadcasting || isListening;
  const statusLabel = isBroadcasting
    ? "Broadcasting"
    : isListening
      ? "Listening"
      : "Idle";

  // Apply a re-broadcast draft during render (React's "adjust state on prop change" pattern),
  // then clear it from the shared store so it isn't re-applied on remount.
  const [appliedDraft, setAppliedDraft] = useState<ShareDraft | null>(null);
  if (draft && draft !== appliedDraft) {
    setAppliedDraft(draft);
    setText(draft.payload);
    setOrigin(draft.origin);
    setMode("send");
  }
  useEffect(() => {
    if (draft) clearDraft();
  }, [draft, clearDraft]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(statusLabel);
  }, [statusLabel]);

  const trimmedLength = text.trim().length;
  const canBroadcast =
    trimmedLength > 0 && trimmedLength <= MAX_PAYLOAD_LENGTH && !busy;

  const onChangeText = (value: string) => {
    setText(value);
    if (value.trim().length === 0) setOrigin("local");
    if (broadcast.status === "sent" || broadcast.status === "error")
      broadcast.reset();
  };

  const onBroadcastPress = async () => {
    if (isBroadcasting) {
      broadcast.stop();
      return;
    }
    const payload = sanitizePayload(text);
    if (!payload) return;
    const reasons = findSensitiveReasons(payload);
    if (reasons.length > 0) {
      setSensitiveCheck({
        title: "This might be private",
        message:
          "Anyone nearby can hear and decode a broadcast. Make sure this is safe to share publicly.",
        reasons,
        confirmLabel: "Broadcast anyway",
      });
      return;
    }
    playWaveform(await testGGWAVE(payload));
    broadcast.start(payload, origin);
  };

  async function testGGWAVE(payload: string): Promise<Int8Array> {
    return ggwave_factory().then((ggwave) => {
      // create ggwave instance with default parameters
      let parameters = ggwave.getDefaultParameters();

      parameters.operatingMode |= ggwave.GGWAVE_OPERATING_MODE_USE_DSS;

      let instance = ggwave.init(parameters);
      console.log("instance: " + instance);

      // generate audio waveform for string "hello js"
      let waveform = ggwave.encode(
        instance,
        payload,
        ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
        10,
      );

      // decode the audio waveform back to text
      let res = ggwave.decode(instance, waveform);

      if (new TextDecoder("utf-8").decode(res) !== payload) {
        process.exit(1);
      }

      return waveform;
    });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <ThemedText type="subtitle" style={{ color: theme.primary }}>
            Share
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Send messages over sound, or listen for nearby ones.
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: busy ? theme.primary : theme.backgroundElement },
          ]}
          accessibilityLabel={`Status: ${statusLabel}`}
        >
          <ThemedText
            type="smallBold"
            style={{ color: busy ? theme.onPrimary : theme.textSecondary }}
          >
            {statusLabel}
          </ThemedText>
        </View>
      </View>

      <SegmentedControl
        options={MODE_OPTIONS}
        value={mode}
        onChange={setMode}
        disabled={busy}
        accessibilityLabel="Share mode"
      />

      {mode === "send" ? (
        <ThemedView type="backgroundElement" style={styles.panel}>
          <PayloadInput
            value={text}
            onChange={onChangeText}
            editable={!isBroadcasting}
          />
          {origin === "received" && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              This text came from an unverified sender.
            </ThemedText>
          )}
          <Waveform active={isBroadcasting} progress={broadcast.progress} />
          <PrimaryButton
            label={
              isBroadcasting
                ? "Stop"
                : broadcast.status === "sent"
                  ? "Sent!"
                  : "Broadcast"
            }
            icon={isBroadcasting ? "close" : "share"}
            variant={isBroadcasting ? "outline" : "filled"}
            size="large"
            disabled={!isBroadcasting && !canBroadcast}
            onPress={onBroadcastPress}
            accessibilityLabel={
              isBroadcasting ? "Stop broadcasting" : "Broadcast message"
            }
          />
        </ThemedView>
      ) : (
        <ThemedView
          type="backgroundElement"
          style={[styles.panel, styles.receivePanel]}
        >
          {listen.status === "received" && listen.received ? (
            <ReceivedCard
              message={listen.received}
              onCopy={() => copy(listen.received!.payload)}
              onOpen={() => requestOpen(listen.received!.payload)}
              onListenAgain={listen.start}
              onDismiss={listen.dismiss}
            />
          ) : (
            <>
              <PulseRing active={isListening} />
              <ThemedText
                type="smallBold"
                themeColor={
                  listen.status === "error" ? undefined : "textSecondary"
                }
                style={
                  listen.status === "error"
                    ? { color: theme.danger }
                    : undefined
                }
                accessibilityLiveRegion="polite"
              >
                {isListening
                  ? `Listening... ${listen.secondsLeft}s`
                  : listen.status === "error"
                    ? "Couldn't reach the mock server. Try again."
                    : "Tap Listen to receive nearby messages"}
              </ThemedText>
              <PrimaryButton
                label={isListening ? "Stop" : "Listen"}
                icon={isListening ? "close" : "listen"}
                variant={isListening ? "outline" : "filled"}
                size="large"
                onPress={isListening ? listen.stop : listen.start}
                accessibilityLabel={
                  isListening ? "Stop listening" : "Start listening"
                }
                style={styles.wideButton}
              />
            </>
          )}
        </ThemedView>
      )}

      <ConfirmSheet
        request={sensitiveCheck}
        onCancel={() => setSensitiveCheck(null)}
        onConfirm={() => {
          setSensitiveCheck(null);
          const payload = sanitizePayload(text);
          if (payload) broadcast.start(payload, origin);
        }}
      />
      {linkSheet}
    </ScreenContainer>
  );
}

function ReceivedCard({
  message,
  onCopy,
  onOpen,
  onListenAgain,
  onDismiss,
}: {
  message: ReceivedMessage;
  onCopy: () => void;
  onOpen: () => void;
  onListenAgain: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const canOpen = getSafeUrl(message.payload) !== null;

  return (
    <View style={styles.receivedCard}>
      <ThemedText type="smallBold" style={{ color: theme.primary }}>
        Message received
      </ThemedText>
      <View
        style={[
          styles.payloadBox,
          { backgroundColor: theme.background, borderColor: theme.border },
        ]}
      >
        <ThemedText selectable style={styles.receivedPayload}>
          {message.payload}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Unverified sender · {formatRelativeTime(message.receivedAt)}
      </ThemedText>
      <LinkNote payload={message.payload} />
      <View style={styles.receivedActions}>
        <PrimaryButton
          label="Copy"
          icon="copy"
          variant="outline"
          size="small"
          onPress={onCopy}
        />
        {canOpen && (
          <PrimaryButton
            label="Open link"
            icon="open"
            variant="outline"
            size="small"
            onPress={onOpen}
          />
        )}
        <PrimaryButton
          label="Listen again"
          icon="listen"
          size="small"
          onPress={onListenAgain}
        />
        <PrimaryButton
          label="Dismiss"
          variant="ghost"
          size="small"
          onPress={onDismiss}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.three,
  },
  statusPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    marginTop: Spacing.two,
  },
  panel: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  receivePanel: {
    alignItems: "center",
    minHeight: 420,
    justifyContent: "center",
  },
  wideButton: {
    alignSelf: "stretch",
  },
  receivedCard: {
    alignSelf: "stretch",
    gap: Spacing.three,
  },
  payloadBox: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  receivedPayload: {
    fontSize: 18,
    lineHeight: 26,
  },
  receivedActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
});
