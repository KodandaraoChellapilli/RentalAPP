import { useCallback, useState } from "react";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Empty, ErrorText, Loading, Screen, Title } from "../../../src/components/ui";
import { JobCard } from "../../../src/components/JobCard";
import { api } from "../../../src/lib/api";
import { friendlyError } from "../../../src/lib/errors";
import type { Job } from "../../../src/types";

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ jobs: Job[] }>("/api/me/jobs");
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(friendlyError(err, "Could not load jobs."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!jobs.length && !error && refreshing) return <Loading />;

  return (
    <Screen onRefresh={load} refreshing={refreshing}>
      <Title
        title="Assigned work"
        subtitle="Open a delivery or pickup. Photos, notes, and a condition confirm are required before you can complete the job."
      />
      <ErrorText message={error} />
      {jobs.length === 0 ? (
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
