import { useCallback, useMemo, useState, useLayoutEffect } from "react";
import { useFocusEffect, useNavigation, useRouter, type Href } from "expo-router";
import { Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { EquipmentCard } from "../../../src/components/EquipmentCard";
import { FilterChips } from "../../../src/components/FilterChips";
import { SearchBar } from "../../../src/components/SearchBar";
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
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "ALL" && item.status !== filter) return false;
      if (!needle) return true;
      return `${item.number} ${item.name} ${item.type} ${item.label}`.toLowerCase().includes(needle);
    });
  }, [items, filter, query]);

  if (!items.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title="Equipment" subtitle="Condition history, current rental, and before/after photos." />
      <ErrorText message={error} />
      <SearchBar value={query} onChange={setQuery} placeholder="Search equipment" />
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
          title={items.length === 0 ? "No equipment" : "Nothing matches"}
          body={items.length === 0 ? "Add machines on the website." : "Try another search or status."}
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
