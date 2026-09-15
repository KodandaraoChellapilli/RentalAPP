import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Empty, ErrorText, Loading, Screen, Stat, Title } from "../../src/components/ui";
import { Sheet } from "../../src/components/Sheet";
import { ApiError, api } from "../../src/lib/api";
import { friendlyError } from "../../src/lib/errors";
import { formatWhen } from "../../src/lib/format";
import { successFeedback, tapFeedback, warnFeedback } from "../../src/lib/haptics";
import { colors, radius, space } from "../../src/theme";
import type { TimeEntry } from "../../src/types";

type ClockState = {
  clockedIn: boolean;
  todayLabel: string;
  weekLabel: string;
  openEntry: TimeEntry | null;
  recent: TimeEntry[];
};

export default function ClockScreen() {
  const [data, setData] = useState<ClockState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmOut, setConfirmOut] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<ClockState>("/api/me/clock"));
      setError(null);
    } catch (err) {
      setError(friendlyError(err, "Could not load time clock."));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 2800);
    return () => clearTimeout(timer);
  }, [flash]);

  async function punch(path: "/api/me/clock/in" | "/api/me/clock/out") {
    setPending(true);
    setError(null);
    try {
      await api(path, { method: "POST" });
      if (path.endsWith("/out")) successFeedback();
      else tapFeedback();
      setConfirmOut(false);
      setFlash(path.endsWith("/out") ? "Clocked out. Shift saved." : "Clocked in. Timer started.");
      await load();
    } catch (err) {
      setConfirmOut(false);
      warnFeedback();
      setError(err instanceof ApiError ? err.message : "Could not update clock.");
    } finally {
      setPending(false);
    }
  }

  if (!data && !error) return <Loading />;

  const clockedIn = Boolean(data?.clockedIn && data.openEntry?.clockIn);
  const liveMs = clockedIn && data?.openEntry?.clockIn
    ? Math.max(0, now - new Date(data.openEntry.clockIn).getTime())
    : 0;
  const heroLabel = clockedIn ? formatLive(liveMs) : data?.todayLabel || "0h";

  return (
    <Screen
      onRefresh={load}
      footer={
        data ? (
          clockedIn ? (
            <Button
              label="Clock out"
              variant="dark"
              pending={pending}
              onPress={() => setConfirmOut(true)}
            />
          ) : (
            <Button
              label="Clock in"
              pending={pending}
              onPress={() => punch("/api/me/clock/in")}
            />
          )
        ) : (
          <Button label="Retry" onPress={load} />
        )
      }
    >
      <Title
        title="Time clock"
        subtitle="Employee work hours only. This does not change rental duration, deliveries, or pickups."
      />
      <ErrorText message={error} />
      {flash ? (
        <View style={styles.flash}>
          <Text style={styles.flashText}>{flash}</Text>
        </View>
      ) : null}

      {data ? (
        <>
          <View style={[styles.hero, clockedIn ? styles.heroIn : styles.heroOut]}>
            <Text style={styles.heroKicker}>{clockedIn ? "Clocked in" : "Not clocked in"}</Text>
            <Text style={styles.heroTime}>{heroLabel}</Text>
            <Text style={styles.heroMeta}>
              {clockedIn
                ? `Started ${formatWhen(data.openEntry?.clockIn)} · ${data.todayLabel} today`
                : `${data.todayLabel} today · ${data.weekLabel} this week`}
            </Text>
          </View>

          <Card>
            <View style={{ flexDirection: "row" }}>
              <Stat label="Today" value={data.todayLabel} />
              <Stat label="This week" value={data.weekLabel} />
            </View>
            <View style={styles.note}>
              <Text style={styles.noteText}>
                Punching the clock tracks your shift. Completing a delivery or pickup tracks the machine — those are separate.
              </Text>
            </View>
          </Card>

          <Title title="Recent punches" />
          {data.recent.length === 0 ? (
            <Empty title="No punches yet" body="Clock in to start your day. Your shifts will list here." />
          ) : (
            data.recent.map((entry) => {
              const running = !entry.clockOut;
              const duration = running && entry.clockIn
                ? formatLive(Math.max(0, now - new Date(entry.clockIn).getTime()))
                : entry.durationLabel;
              return (
                <Card key={entry.id}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.punchIn}>{formatWhen(entry.clockIn)}</Text>
                      <Text style={styles.punchOut}>
                        {entry.clockOut ? formatWhen(entry.clockOut) : "In progress"}
                      </Text>
                    </View>
                    <View style={[styles.pill, running && styles.pillLive]}>
                      <Text style={[styles.pillText, running && styles.pillTextLive]}>{duration}</Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </>
      ) : (
        <Empty title="Clock unavailable" body="Check Wi-Fi and retry. Your last punches are safe on the server." />
      )}

      <Sheet
        visible={confirmOut}
        title="Clock out?"
        body={
          clockedIn
            ? `This ends your current shift (${formatLive(liveMs)} so far). Rental jobs and machine time are not affected.`
            : "This ends your current shift. Rental jobs are not affected."
        }
        confirmLabel="Clock out"
        pending={pending}
        onClose={() => setConfirmOut(false)}
        onConfirm={() => punch("/api/me/clock/out")}
      />
    </Screen>
  );
}

function formatLive(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: 12,
  },
  heroIn: { backgroundColor: colors.success },
  heroOut: { backgroundColor: colors.ink },
  heroKicker: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroTime: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "700",
    marginTop: 8,
  },
  heroMeta: {
    color: "rgba(255,255,255,0.78)",
    marginTop: 6,
    lineHeight: 20,
  },
  note: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 4,
  },
  noteText: { color: colors.muted, lineHeight: 20, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  punchIn: { fontWeight: "700", color: colors.ink },
  punchOut: { color: colors.muted, marginTop: 2 },
  pill: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLive: { backgroundColor: colors.successBg },
  pillText: { fontWeight: "700", color: colors.ink },
  pillTextLive: { color: colors.success },
  flash: {
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  flashText: { color: colors.success, fontWeight: "700" },
});
