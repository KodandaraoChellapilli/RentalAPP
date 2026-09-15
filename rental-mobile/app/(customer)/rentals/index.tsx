import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { RentalCard } from "../../../src/components/RentalCard";
import { api } from "../../../src/lib/api";
import { friendlyError } from "../../../src/lib/errors";
import { useAuth } from "../../../src/lib/auth";
import { colors } from "../../../src/theme";
import type { Rental } from "../../../src/types";

export default function CustomerRentals() {
  const router = useRouter();
  const { user } = useAuth();
  const [active, setActive] = useState<Rental[]>([]);
  const [history, setHistory] = useState<Rental[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ active: Rental[]; history: Rental[] }>("/api/my/rentals");
      setActive(data.active);
      setHistory(data.history);
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

  if (!active.length && !history.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title
        title="My equipment"
        subtitle="Only your company’s rentals are shown here. Other customers never appear in this list."
      />
      {user?.name ? (
        <Text style={{ color: colors.muted, marginBottom: 12, marginTop: -8 }}>
          Signed in as {user.name}
        </Text>
      ) : null}
      <ErrorText message={error} />

      <Title title="On rent / scheduled" subtitle="Amounts stay estimated until pickup is completed." />
      {active.length === 0 ? (
        <Empty title="Nothing out right now" body="When equipment is delivered to your jobsite, it will appear here." />
      ) : (
        active.map((rental) => (
          <RentalCard
            key={rental.id}
            rental={rental}
            mode="active"
            onOpen={() => router.push(`/(customer)/rentals/${rental.id}` as Href)}
          />
        ))
      )}

      <Title title="History" subtitle="Final amounts and return photos show after pickup." />
      {history.length === 0 ? (
        <Empty title="No completed rentals yet" body="Finished jobs list here with final charges." />
      ) : (
        history.map((rental) => (
          <RentalCard
            key={rental.id}
            rental={rental}
            mode="history"
            onOpen={() => router.push(`/(customer)/rentals/${rental.id}` as Href)}
          />
        ))
      )}
    </Screen>
  );
}
