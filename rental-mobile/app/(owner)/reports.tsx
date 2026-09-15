import { useCallback, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Badge, Card, Empty, ErrorText, Loading, Screen, Stat, Title } from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { friendlyError } from "../../src/lib/errors";
import { formatWhen } from "../../src/lib/format";
import { colors, statusLabel } from "../../src/theme";
import type { Job } from "../../src/types";

type Reports = {
  estimatedChargesLabel: string;
  activeCount: number;
  completedAmountLabel: string;
  completedCount: number;
  weekHoursLabel: string;
  equipmentCount: number;
  byStatus: Record<string, number>;
  upcoming: Job[];
};

export default function ReportsScreen() {
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api<Reports>("/api/reports"));
      setError(null);
    } catch (err) {
      setError(friendlyError(err, "Could not load reports."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!data && !error) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title
        title="Reports"
        subtitle="Totals come from the same billing and clock rules as the website. No separate mobile math."
      />
      <ErrorText message={error} />
      {data ? (
        <>
          <Card>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <Stat label="Estimated" value={data.estimatedChargesLabel} />
              <Stat label="Completed" value={data.completedAmountLabel} />
              <Stat label="Crew hours" value={data.weekHoursLabel} />
              <Stat label="Machines" value={data.equipmentCount} />
            </View>
            <Text style={styles.sub}>
              {data.activeCount} active · {data.completedCount} completed
            </Text>
          </Card>

          <Title title="Fleet by status" />
          <Card style={{ paddingVertical: 8 }}>
            {Object.keys(data.byStatus).length === 0 ? (
              <Text style={styles.meta}>No status breakdown yet.</Text>
            ) : (
              Object.entries(data.byStatus).map(([status, count], index, arr) => (
                <View
                  key={status}
                  style={[styles.statusRow, index < arr.length - 1 && styles.statusBorder]}
                >
                  <Text style={styles.statusLabel}>{statusLabel(status)}</Text>
                  <Text style={styles.statusCount}>{count}</Text>
                </View>
              ))
            )}
          </Card>

          <Title title="Upcoming work" />
          {data.upcoming.length === 0 ? (
            <Empty title="Nothing upcoming" body="Scheduled deliveries and pickups will list here." />
          ) : (
            data.upcoming.map((event) => (
              <Card key={event.id}>
                <Badge status={event.type} />
                <Text style={styles.itemTitle}>{event.equipment?.label || event.title}</Text>
                <Text style={styles.meta}>
                  {formatWhen(event.startAt)} · {event.customer?.name || "No customer"}
                </Text>
                <Text style={styles.meta}>{event.employee?.name || "Unassigned"}</Text>
              </Card>
            ))
          )}
        </>
      ) : (
        <Empty title="Reports unavailable" body="Check Wi-Fi and pull to refresh." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.muted, marginTop: 4 },
  meta: { color: colors.muted, marginTop: 3 },
  itemTitle: { fontWeight: "700", fontSize: 16, marginTop: 8, color: colors.ink },
  statusRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  statusBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  statusLabel: { color: colors.ink, fontWeight: "600" },
  statusCount: { color: colors.ink, fontWeight: "700" },
});
