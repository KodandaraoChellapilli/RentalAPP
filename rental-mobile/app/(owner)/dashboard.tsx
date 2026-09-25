import { useCallback } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Badge, Card, Empty, ErrorText, Loading, Screen, SectionTitle, Stat, Title } from "../../src/components/ui";
import { EquipmentCard } from "../../src/components/EquipmentCard";
import { useAuth } from "../../src/lib/auth";
import { useFocusedLoad } from "../../src/hooks/useFocusedLoad";
import { api } from "../../src/lib/api";
import { formatWhen, welcomeTitle } from "../../src/lib/format";
import { colors } from "../../src/theme";
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
  todayEvents?: Job[];
  openEvents: Job[];
  needingAttention: Equipment[];
  employees: Array<{ id: string; name: string; clockedIn: boolean; todayLabel: string; jobsToday: number }>;
};

export default function OwnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const fetchDashboard = useCallback(() => api<Dashboard>("/api/dashboard"), []);
  const { data, error, refreshing, load, initialLoading } = useFocusedLoad(fetchDashboard, "Could not load dashboard.");

  if (initialLoading) return <Loading label="Loading yard overview…" />;

  const todayJobs = data?.todayEvents?.length ? data.todayEvents : data?.openEvents.slice(0, 6) || [];

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title={welcomeTitle(user?.name, "Dashboard")} subtitle="Active rentals and today's transports." />
      <ErrorText message={error} />
      {data ? (
        <>
          <Card>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <Stat label="Active rentals" value={data.counts.activeRentals ?? 0} />
              <Stat label="On rent" value={data.counts.onRent ?? 0} />
              <Stat label="Est. charges" value={data.estimatedChargesLabel} />
              <Stat label="Today's jobs" value={data.todayDeliveries + data.todayPickups} />
            </View>
            {data.overdueCount > 0 ? (
              <Text style={styles.overdue}>{data.overdueCount} overdue transport{data.overdueCount === 1 ? "" : "s"}</Text>
            ) : (
              <Text style={styles.meta}>
                {data.clockedInCount} clocked in · {data.counts.needingAttention ?? 0} need attention
              </Text>
            )}
          </Card>

          <SectionTitle title="Active rentals" />
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
                  <View style={styles.rowTop}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {rental.equipment?.label}
                    </Text>
                    <Badge status={rental.status} />
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {rental.customer?.name}
                  </Text>
                  <Text style={styles.amount}>
                    {rental.charge.formatted}
                    {rental.charge.isEstimate ? " est." : ""}
                  </Text>
                </Card>
              </Pressable>
            ))
          )}

          <SectionTitle title="Today's transports" />
          {todayJobs.length === 0 ? (
            <Empty title="No transports today" body="Deliveries and pickups will appear when scheduled." />
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {todayJobs.map((job, index) => (
                <Pressable
                  key={job.id}
                  onPress={() => router.push("/(owner)/transports" as Href)}
                  style={[styles.listRow, index < todayJobs.length - 1 && styles.listBorder]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {job.equipment?.label || job.title}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {job.type === "PICKUP" ? "Pickup" : "Delivery"} · {job.customer?.name} · {formatWhen(job.startAt)}
                    </Text>
                  </View>
                  <Badge status={job.status || job.type} />
                </Pressable>
              ))}
            </Card>
          )}

          <SectionTitle title="Crew" />
          {data.employees.length === 0 ? (
            <Empty title="No employees" body="Add crew on the website." />
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {data.employees.map((employee, index) => (
                <View key={employee.id} style={[styles.listRow, index < data.employees.length - 1 && styles.listBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{employee.name}</Text>
                    <Text style={styles.meta}>
                      {employee.todayLabel} · {employee.jobsToday} job{employee.jobsToday === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <Text style={[styles.crewStatus, employee.clockedIn && { color: colors.success }]}>
                    {employee.clockedIn ? "In" : "Out"}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          <SectionTitle title="Needs attention" />
          {data.needingAttention.length === 0 ? (
            <Empty title="No attention items" body="No machines in maintenance or out of service." />
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
  overdue: { color: colors.warning, fontWeight: "600", marginTop: 4 },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
  listBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  itemTitle: { fontWeight: "700", fontSize: 15, color: colors.ink },
  meta: { color: colors.muted, marginTop: 3, fontSize: 13 },
  amount: { marginTop: 6, fontWeight: "700", color: colors.ink },
  crewStatus: { fontWeight: "700", color: colors.muted, width: 28, textAlign: "right" },
});
