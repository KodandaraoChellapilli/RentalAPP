import { useCallback, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Badge, Card, Empty, ErrorText, Loading, Screen, Stat, Title } from "../../src/components/ui";
import { EquipmentCard } from "../../src/components/EquipmentCard";
import { api } from "../../src/lib/api";
import { friendlyError } from "../../src/lib/errors";
import { formatWhen } from "../../src/lib/format";
import { colors, radius } from "../../src/theme";
import type { Equipment, Job, Rental } from "../../src/types";

type Dashboard = {
  counts: Record<string, number>;
  estimatedChargesLabel: string;
  completedTodayAmountLabel: string;
  overdueCount: number;
  clockedInCount: number;
  todayDeliveries: number;
  todayPickups: number;
  activeRentals: Rental[];
  openEvents: Job[];
  needingAttention: Equipment[];
  employees: Array<{ id: string; name: string; clockedIn: boolean; todayLabel: string; jobsToday: number }>;
};

export default function OwnerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api<Dashboard>("/api/dashboard"));
      setError(null);
    } catch (err) {
      setError(friendlyError(err, "Could not load dashboard."));
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
        title="Yard overview"
        subtitle="Live rentals, crew on shift, and machines that need attention. Charges use the same billing rules as the website."
      />
      <ErrorText message={error} />
      {data ? (
        <>
          <Card>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <Stat label="On rent" value={data.counts.onRent ?? 0} />
              <Stat label="Available" value={data.counts.available ?? 0} />
              <Stat label="Est. charges" value={data.estimatedChargesLabel} />
              <Stat label="Clocked in" value={data.clockedInCount} />
            </View>
            <View style={styles.pulse}>
              <Text style={styles.pulseText}>
                {data.todayDeliveries} deliveries · {data.todayPickups} pickups today
                {data.overdueCount > 0 ? ` · ${data.overdueCount} overdue` : ""}
              </Text>
              <Text style={styles.pulseSub}>Completed today {data.completedTodayAmountLabel}</Text>
            </View>
          </Card>

          <Title title="Crew on site" />
          {data.employees.length === 0 ? (
            <Empty title="No employees" body="Add crew on the website." />
          ) : (
            <Card style={{ paddingVertical: 8 }}>
              {data.employees.map((employee, index) => (
                <View
                  key={employee.id}
                  style={[styles.crewRow, index < data.employees.length - 1 && styles.crewBorder]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.crewName}>{employee.name}</Text>
                    <Text style={styles.meta}>
                      {employee.todayLabel} today · {employee.jobsToday} job{employee.jobsToday === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <View style={[styles.dot, employee.clockedIn ? styles.dotOn : styles.dotOff]} />
                  <Text style={[styles.crewStatus, employee.clockedIn && { color: colors.success }]}>
                    {employee.clockedIn ? "In" : "Out"}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          <Title title="Active rentals" />
          {data.activeRentals.length === 0 ? (
            <Empty title="Nothing on rent" body="Scheduled and active jobs will show here." />
          ) : (
            data.activeRentals.map((rental) => (
              <Pressable
                key={rental.id}
                onPress={() => {
                  if (rental.equipment?.id) {
                    router.push(`/(owner)/equipment/${rental.equipment.id}` as Href);
                  }
                }}
                style={({ pressed }) => pressed && { opacity: 0.92 }}
              >
                <Card>
                  <Badge status={rental.status} />
                  <Text style={styles.itemTitle}>{rental.equipment?.label}</Text>
                  <Text style={styles.meta}>{rental.customer?.name}</Text>
                  <Text style={styles.meta}>{rental.destination || "No destination"}</Text>
                  <Text style={styles.amount}>
                    {rental.charge.formatted}
                    {rental.charge.isEstimate ? " estimated" : ""}
                  </Text>
                  {rental.equipment?.id ? <Text style={styles.link}>Open equipment →</Text> : null}
                </Card>
              </Pressable>
            ))
          )}

          <Title title="Open jobs" />
          {data.openEvents.length === 0 ? (
            <Empty title="No open assignments" body="Deliveries and pickups will appear when scheduled." />
          ) : (
            data.openEvents.map((job) => (
              <Card key={job.id}>
                <Badge status={job.type} />
                <Text style={styles.itemTitle}>{job.equipment?.label || job.title}</Text>
                <Text style={styles.meta}>
                  {formatWhen(job.startAt)} · {job.employee?.name || "Unassigned"}
                </Text>
                <Text style={styles.meta}>{job.customer?.name}</Text>
              </Card>
            ))
          )}

          <Title title="Needs attention" />
          {data.needingAttention.length === 0 ? (
            <Empty title="Fleet looks healthy" body="No machines in maintenance or out of service." />
          ) : (
            data.needingAttention.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                meta={item.type}
                onOpen={() => router.push(`/(owner)/equipment/${item.id}` as Href)}
              />
            ))
          )}
        </>
      ) : (
        <Empty title="Dashboard unavailable" body="Check Wi-Fi and pull to refresh." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pulse: {
    marginTop: 4,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: 12,
  },
  pulseText: { color: colors.ink, fontWeight: "600" },
  pulseSub: { color: colors.muted, marginTop: 4 },
  crewRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
  crewBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  crewName: { fontWeight: "700", color: colors.ink },
  crewStatus: { fontWeight: "700", color: colors.muted, width: 28, textAlign: "right" },
  dot: { width: 10, height: 10, borderRadius: 999 },
  dotOn: { backgroundColor: colors.success },
  dotOff: { backgroundColor: colors.line },
  itemTitle: { fontWeight: "700", fontSize: 16, marginTop: 8, color: colors.ink },
  meta: { color: colors.muted, marginTop: 3 },
  amount: { marginTop: 8, fontWeight: "700", color: colors.ink },
  link: { marginTop: 10, color: colors.accent, fontWeight: "700" },
});
