import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Badge, Button, Card, Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { RemoteImage } from "../../../src/components/RemoteImage";
import { SearchBar } from "../../../src/components/SearchBar";
import { api } from "../../../src/lib/api";
import { friendlyError } from "../../../src/lib/errors";
import { colors, radius, scale } from "../../../src/theme";
import type { Equipment } from "../../../src/types";

export default function EmployeeEquipment() {
  const router = useRouter();
  const [items, setItems] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.number} ${item.name} ${item.type} ${item.label} ${item.customerName || ""}`.toLowerCase().includes(needle),
    );
  }, [items, query]);

  if (!items.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title
        title="Assigned equipment"
        subtitle="Machines on your transports. Open a machine for rental history and before/after photos."
      />
      <ErrorText message={error} />
      <SearchBar value={query} onChange={setQuery} placeholder="Search equipment" />
      {filtered.length === 0 ? (
        <Empty
          title={items.length === 0 ? "No assigned equipment" : "Nothing matches"}
          body={
            items.length === 0
              ? "When a delivery or pickup is assigned, the machine will show here."
              : "Try a different search."
          }
        />
      ) : (
        filtered.map((item) => (
          <Card key={item.id}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <RemoteImage uri={item.photoUrl} style={{ width: scale(84), height: scale(84), borderRadius: radius.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 16, color: colors.ink }}>{item.label}</Text>
                <Text style={{ color: colors.muted, marginVertical: 4 }}>{item.customerName || item.type}</Text>
                <Badge status={item.status} />
              </View>
            </View>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Button
                label="View rental history"
                variant="ghost"
                onPress={() => router.push(`/(employee)/equipment/${item.id}` as Href)}
              />
              {item.latestJobId ? (
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
              ) : null}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
