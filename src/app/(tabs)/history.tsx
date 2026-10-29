import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { AnimatedIcon } from "@/components/animated-icon";
import { PrimaryButton } from "@/components/primary-button";
import { useScreenPadding } from "@/components/screen-container";
import { SegmentedControl } from "@/components/segmented-control";
import { ThemedText } from "@/components/themed-text";
import { TransmissionCard } from "@/components/transmission-card";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { usePayloadActions } from "@/hooks/use-payload-actions";
import { useRebroadcast } from "@/hooks/use-rebroadcast";
import { useTheme } from "@/hooks/use-theme";
import { useTransmissions } from "@/hooks/use-transmissions";
import type { HistoryFilter, Transmission } from "@/types/transmission";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
] as const;

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const padding = useScreenPadding();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const history = useTransmissions(filter);
  const { copy, requestOpen, linkSheet } = usePayloadActions();
  const { requestRebroadcast, confirmSheet } = useRebroadcast();

  const onPress = useCallback(
    (item: Transmission) =>
      router.push({ pathname: "/history/[id]", params: { id: item.id } }),
    [router],
  );
  const onCopy = useCallback(
    (item: Transmission) => copy(item.payload),
    [copy],
  );
  const onOpen = useCallback(
    (item: Transmission) => requestOpen(item.payload),
    [requestOpen],
  );

  const header = (
    <View style={styles.header}>
      <View>
        <ThemedText type="subtitle" style={{ color: theme.primary }}>
          History
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Everything this device has sent or received.
        </ThemedText>
      </View>
      <SegmentedControl
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Filter history"
      />
    </View>
  );

  const renderEmpty = () => {
    if (history.loading) return <SkeletonList />;
    if (history.error) {
      return (
        <View style={styles.centered}>
          <ThemedText type="smallBold" style={{ color: theme.danger }}>
            Can&apos;t reach the mock server
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.centerText}
          >
            Make sure `npm run mock-server` is running and EXPO_PUBLIC_API_URL
            is correct.
          </ThemedText>
          <PrimaryButton label="Retry" onPress={history.retry} />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <AnimatedIcon />
        <ThemedText type="smallBold">Nothing here yet</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.centerText}
        >
          {filter === "received"
            ? "Messages you receive will show up here."
            : "Broadcast a message and it will show up here."}
        </ThemedText>
        <PrimaryButton
          label="Go to Share"
          icon="share"
          onPress={() => router.navigate("/")}
        />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <FlatList
        data={history.loading ? [] : history.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransmissionCard
            item={item}
            onPress={onPress}
            onRebroadcast={requestRebroadcast}
            onCopy={onCopy}
            onOpen={onOpen}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          history.loadingMore ? (
            <ActivityIndicator color={theme.primary} style={styles.footer} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={history.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={history.refreshing}
            onRefresh={history.refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={[styles.content, padding]}
      />
      {linkSheet}
      {confirmSheet}
    </View>
  );
}

function SkeletonList() {
  const theme = useTheme();
  return (
    <View style={styles.skeletonList} accessibilityLabel="Loading history">
      {[0, 1, 2, 3].map((key) => (
        <View
          key={key}
          style={[
            styles.skeleton,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <View
            style={[
              styles.skeletonLine,
              { width: "40%", backgroundColor: theme.backgroundSelected },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: "85%", backgroundColor: theme.backgroundSelected },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: "60%", backgroundColor: theme.backgroundSelected },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: Spacing.four,
    flexGrow: 1,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  separator: {
    height: Spacing.three,
  },
  footer: {
    marginVertical: Spacing.four,
  },
  centered: {
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  centerText: {
    textAlign: "center",
  },
  skeletonList: {
    gap: Spacing.three,
  },
  skeleton: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
