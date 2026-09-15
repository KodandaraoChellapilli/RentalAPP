import { useCallback, useMemo, useState } from "react";
import { Pressable, Text } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Badge, Card, Empty, ErrorText, Loading, Screen, Title } from "../../src/components/ui";
import { FilterChips } from "../../src/components/FilterChips";
import { api } from "../../src/lib/api";
import { friendlyError } from "../../src/lib/errors";
import { formatWhen } from "../../src/lib/format";
import { colors } from "../../src/theme";
import type { Rental } from "../../src/types";

export default function OwnerRentals() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ rentals: Rental[] }>("/api/rentals");
      setRentals(data.rentals);
      setError(null);
    } catch (err) {
      setError(friendlyError(err, "Could not load rentals."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const next: Record<string, number> = { ALL: rentals.length };
    for (const rental of rentals) {
      next[rental.status] = (next[rental.status] || 0) + 1;
    }
    return next;
  }, [rentals]);

  const filtered = filter === "ALL" ? rentals : rentals.filter((rental) => rental.status === filter);

  if (!rentals.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title="Rentals" subtitle="Active amounts are estimates until pickup. Final amounts use the same billing rules as the website." />
      <ErrorText message={error} />
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "ALL", label: "All", count: counts.ALL || 0 },
          { value: "ACTIVE", label: "Active", count: counts.ACTIVE || 0 },
          { value: "SCHEDULED", label: "Scheduled", count: counts.SCHEDULED || 0 },
          { value: "COMPLETED", label: "Completed", count: counts.COMPLETED || 0 },
        ]}
      />
      {filtered.length === 0 ? (
        <Empty
          title={rentals.length === 0 ? "No rentals yet" : "Nothing in this filter"}
          body={rentals.length === 0 ? "Scheduled deliveries will create rental records." : "Try another status chip."}
        />
      ) : (
        filtered.map((rental) => (
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
              <Text style={{ fontWeight: "700", fontSize: 16, marginTop: 8, color: colors.ink }}>
                {rental.equipment?.label}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 3 }}>{rental.customer?.name}</Text>
              <Text style={{ color: colors.muted, marginTop: 3 }}>{rental.destination || "No destination"}</Text>
              <Text style={{ marginTop: 8, fontWeight: "700", color: colors.ink }}>
                {rental.charge.formatted}
                {rental.charge.isEstimate ? " estimated" : " final"}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Start {formatWhen(rental.startAt)} · Pickup {formatWhen(rental.expectedPickupAt)}
              </Text>
              {rental.equipment?.id ? (
                <Text style={{ marginTop: 10, color: colors.accent, fontWeight: "700" }}>Open equipment →</Text>
              ) : null}
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
