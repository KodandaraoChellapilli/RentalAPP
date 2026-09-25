import { ReactNode, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, scale, space, statusColor, statusLabel, typeScale } from "../theme";
import { OfflineBanner } from "./OfflineBanner";

export function Screen({
  children,
  onRefresh,
  refreshing,
  footer,
  scroll = true,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = footer ? 28 : 32 + Math.max(insets.bottom, 12);
  const data = useMemo(() => [{ key: "screen-body" }], []);

  const body = scroll ? (
    <FlatList
      style={styles.scroll}
      data={data}
      keyExtractor={(item) => item.key}
      renderItem={() => <View>{children}</View>}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator
      alwaysBounceVertical
      bounces
      scrollEnabled
      nestedScrollEnabled
      refreshControl={
        onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined
      }
    />
  ) : (
    <View style={[styles.scroll, styles.content, { paddingBottom: bottomPad }]}>{children}</View>
  );

  return (
    <View style={styles.safe}>
      <OfflineBanner />
      {body}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View>
      ) : null}
    </View>
  );
}

export function Kicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function Title({ title, subtitle, kicker }: { title: string; subtitle?: string; kicker?: string }) {
  return (
    <View style={styles.titleWrap}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  disabled,
  variant = "primary",
  pending,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "dark" | "ghost" | "danger";
  pending?: boolean;
}) {
  const background =
    variant === "dark"
      ? colors.button
      : variant === "ghost"
        ? colors.outlineButtonBg ?? colors.surface
        : variant === "danger"
          ? colors.danger
          : colors.accent;
  const color = variant === "ghost" ? colors.ink : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || pending}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: variant === "ghost" ? colors.border : "transparent",
          opacity: disabled || pending ? 0.45 : pressed ? 0.88 : 1,
        },
      ]}
    >
      {pending ? <ActivityIndicator color={color} /> : <Text style={[styles.buttonText, { color }]}>{label}</Text>}
    </Pressable>
  );
}

export function Badge({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}14`, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function Empty({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: 12 }}>
          <Button label={actionLabel} variant="ghost" onPress={onAction} />
        </View>
      ) : null}
    </Card>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  const offline = /can't reach|wifi|wi-fi|offline|yard server/i.test(message);
  return (
    <View style={[styles.error, offline && styles.errorOffline]}>
      <Text style={[styles.errorText, offline && styles.errorOfflineText]}>
        {offline ? "Connection" : "Something went wrong"}
      </Text>
      <Text style={[styles.errorBody, offline && styles.errorOfflineText]}>{message}</Text>
    </View>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function Row({
  title,
  meta,
  onPress,
  right,
}: {
  title: string;
  meta?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const inner = (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {meta ? <Text style={styles.subtitle}>{meta}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return inner;
  return <Pressable onPress={onPress}>{inner}</Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: space.screen },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.screen,
    paddingTop: 12,
  },
  kicker: {
    color: colors.muted,
    fontSize: typeScale.kicker,
    fontWeight: "600",
    marginBottom: 2,
  },
  titleWrap: { marginBottom: space.md },
  title: { fontSize: typeScale.title, fontWeight: "700", color: colors.ink, letterSpacing: -0.4, lineHeight: scale(32) },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: typeScale.subtitle, lineHeight: scale(20) },
  sectionWrap: { marginTop: space.sm, marginBottom: space.sm },
  sectionTitle: { fontSize: scale(16), fontWeight: "700", color: colors.ink },
  sectionSub: { marginTop: 2, color: colors.muted, fontSize: typeScale.subtitle, lineHeight: scale(20) },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: scale(14),
    marginBottom: scale(12),
  },
  button: {
    minHeight: scale(50),
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
  },
  buttonText: { fontWeight: "700", fontSize: scale(16) },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: typeScale.caption, fontWeight: "700" },
  emptyCard: { borderStyle: "dashed", backgroundColor: colors.bg },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 4 },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
  },
  errorOffline: {
    backgroundColor: colors.warningBg,
    borderColor: `${colors.warning}33`,
  },
  errorText: { color: colors.danger, fontWeight: "700" },
  errorOfflineText: { color: colors.warning },
  errorBody: { color: colors.danger, marginTop: 4, lineHeight: 18, fontSize: typeScale.subtitle },
  stat: { flex: 1, minWidth: "45%", marginBottom: 12 },
  statLabel: {
    color: colors.muted,
    fontSize: typeScale.kicker,
    fontWeight: "600",
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.ink, marginTop: 4 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: 12 },
  loadingText: { color: colors.muted, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
});
