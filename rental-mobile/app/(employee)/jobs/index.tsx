import { useCallback } from "react";
import { useRouter, type Href } from "expo-router";
import { Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { JobCard } from "../../../src/components/JobCard";
import { useFocusedLoad } from "../../../src/hooks/useFocusedLoad";
import { api } from "../../../src/lib/api";
import type { Job } from "../../../src/types";

export default function JobsScreen() {
  const router = useRouter();

  const fetchJobs = useCallback(async () => {
    const data = await api<{ jobs: Job[] }>("/api/me/jobs");
    return data.jobs;
  }, []);

  const { data: jobs, error, refreshing, load, initialLoading } = useFocusedLoad(fetchJobs, "Could not load jobs.");

  if (initialLoading) return <Loading label="Loading assignments…" />;

  const nextJob = jobs?.[0];
  const rest = jobs?.slice(1) || [];

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title title="Transports" subtitle="Your assigned deliveries and pickups." />
      <ErrorText message={error} />
      {!jobs?.length ? (
        <Empty title="No open transports" body="When a delivery or pickup is assigned to you, it will show here." />
      ) : (
        <>
          {nextJob ? (
            <JobCard
              key={nextJob.id}
              featured
              job={nextJob}
              onOpen={() =>
                router.push(
                  (nextJob.type === "PICKUP"
                    ? `/(employee)/jobs/pickup/${nextJob.id}`
                    : `/(employee)/jobs/deliver/${nextJob.id}`) as Href,
                )
              }
            />
          ) : null}
          {rest.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onOpen={() =>
                router.push(
                  (job.type === "PICKUP"
                    ? `/(employee)/jobs/pickup/${job.id}`
                    : `/(employee)/jobs/deliver/${job.id}`) as Href,
                )
              }
            />
          ))}
        </>
      )}
    </Screen>
  );
}
