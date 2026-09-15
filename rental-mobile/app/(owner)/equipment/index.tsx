import { useCallback, useMemo, useState, useLayoutEffect } from "react";
import { useFocusEffect, useNavigation, useRouter, type Href } from "expo-router";
import { Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { EquipmentCard } from "../../../src/components/EquipmentCard";
import { FilterChips } from "../../../src/components/FilterChips";
import { SignOutButton } from "../../../src/components/SignOutButton";
import { api } from "../../../src/lib/api";
import { friendlyError } from "../../../src/lib/errors";
import type { Equipment } from "../../../src/types";

export default function OwnerEquipment() {
  const router = useRouter();
  const navigation = useNavigation();
  const [items, setItems] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <SignOutButton /> });
  }, [navigation]);

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

  const counts = useMemo(() => {
    const next: Record<string, number> = { ALL: items.length };
    for (const item of items) {
      next[item.status] = (next[item.status] || 0) + 1;
    }
    return next;
  }, [items]);

  const filtered = filter === "ALL" ? items : items.filter((item) => item.status === filter);

  if (!items.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title="Fleet" subtitle="Tap a machine for condition history, current rental, and before/after photos." />
      <ErrorText message={error} />
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "ALL", label: "All", count: counts.ALL || 0 },
          { value: "AVAILABLE", label: "Available", count: counts.AVAILABLE || 0 },
          { value: "ON_RENT", label: "On rent", count: counts.ON_RENT || 0 },
          { value: "MAINTENANCE", label: "Maintenance", count: counts.MAINTENANCE || 0 },
          { value: "OUT_OF_SERVICE", label: "Out of service", count: counts.OUT_OF_SERVICE || 0 },
        ]}
      />
      {filtered.length === 0 ? (
        <Empty
          title={items.length === 0 ? "No equipment" : "Nothing in this filter"}
          body={items.length === 0 ? "Add machines on the website." : "Try another status chip."}
        />
      ) : (
        filtered.map((item) => (
          <EquipmentCard
            key={item.id}
            item={item}
            onOpen={() => router.push(`/(owner)/equipment/${item.id}` as Href)}
          />
        ))
      )}
    </Screen>
  );
}
