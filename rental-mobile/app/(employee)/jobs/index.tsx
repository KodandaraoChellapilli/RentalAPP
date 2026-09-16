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

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title
        kicker="Field work"
        title="Assigned work"
        subtitle="Open a delivery or pickup. Photos, notes, and a condition confirm are required before you can complete the job."
      />
      <ErrorText message={error} />
      {!jobs?.length ? (
        <Empty title="No open assignments" body="When the owner assigns you a delivery or pickup, it will show here." />
      ) : (
        jobs.map((job) => (
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
        ))
      )}
    </Screen>
  );
}
