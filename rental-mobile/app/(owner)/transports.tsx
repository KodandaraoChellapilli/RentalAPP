import { useCallback, useMemo, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { Empty, ErrorText, Loading, Screen, Title } from "../../src/components/ui";
import { FilterChips } from "../../src/components/FilterChips";
import { JobCard } from "../../src/components/JobCard";
import { useFocusedLoad } from "../../src/hooks/useFocusedLoad";
import { api } from "../../src/lib/api";
import { transportHref } from "../../src/lib/format";
import type { Job } from "../../src/types";

export default function OwnerTransports() {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");

  const fetchTransports = useCallback(async () => {
    const data = await api<{ transports: Job[] }>("/api/transports");
    return data.transports;
  }, []);

  const { data: jobs, error, refreshing, load, initialLoading } = useFocusedLoad(
    fetchTransports,
    "Could not load transports.",
  );

  const counts = useMemo(() => {
    const list = jobs || [];
    return {
      ALL: list.length,
      DELIVERY: list.filter((job) => job.type === "DELIVERY").length,
      PICKUP: list.filter((job) => job.type === "PICKUP").length,
      OPEN: list.filter((job) => !job.completedAt).length,
    };
  }, [jobs]);

  const filtered = useMemo(() => {
    const list = jobs || [];
    if (filter === "DELIVERY" || filter === "PICKUP") return list.filter((job) => job.type === filter);
    if (filter === "OPEN") return list.filter((job) => !job.completedAt);
    return list;
  }, [jobs, filter]);

  if (initialLoading) return <Loading label="Loading transports…" />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title="Transports" subtitle="Deliveries and pickups. Completing a delivery starts the rental; completing a pickup closes it." />
      <ErrorText message={error} />
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "ALL", label: "All", count: counts.ALL },
          { value: "OPEN", label: "Open", count: counts.OPEN },
          { value: "DELIVERY", label: "Deliveries", count: counts.DELIVERY },
          { value: "PICKUP", label: "Pickups", count: counts.PICKUP },
        ]}
      />
      {filtered.length === 0 ? (
        <Empty
          title={jobs?.length ? "Nothing in this filter" : "No transports yet"}
          body="Schedule a delivery when a rental starts, or a pickup when a customer is ready to return a machine."
        />
      ) : (
        filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onOpen={() => {
              if (job.completedAt) {
                if (job.equipment?.id) router.push(`/(owner)/equipment/${job.equipment.id}` as Href);
                return;
              }
              router.push(transportHref(job) as Href);
            }}
          />
        ))
      )}
    </Screen>
  );
}
