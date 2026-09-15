import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Badge, Button, Card, Empty, ErrorText, Loading, Screen, Title } from "../../src/components/ui";
import { api } from "../../src/lib/api";
import { friendlyError } from "../../src/lib/errors";
import { colors } from "../../src/theme";
import type { Equipment } from "../../src/types";

export default function EmployeeEquipment() {
  const router = useRouter();
  const [items, setItems] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ equipment: Equipment[] }>("/api/equipment");
      setItems(data.equipment);
      setError(null);
    } catch (err) {
      setError(friendlyError(err, "Could not load equipment."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!items.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title="Assigned equipment" subtitle="Machines on your deliveries and pickups." />
      <ErrorText message={error} />
      {items.length === 0 ? (
        <Empty title="No assigned equipment" body="When a job is assigned, the machine will show here." />
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <Text style={{ fontWeight: "700", fontSize: 16, color: colors.ink }}>{item.label}</Text>
            <Text style={{ color: colors.muted, marginVertical: 4 }}>{item.customerName || item.type}</Text>
            <Badge status={item.status} />
            {item.latestJobId ? (
              <View style={{ marginTop: 12 }}>
                <Button
                  label={item.latestJobType === "PICKUP" ? "Open pickup" : "Open delivery"}
                  onPress={() =>
                    router.push(
                      (item.latestJobType === "PICKUP"
                        ? `/(employee)/jobs/pickup/${item.latestJobId}`
                        : `/(employee)/jobs/deliver/${item.latestJobId}`) as Href,
                    )
                  }
                />
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
