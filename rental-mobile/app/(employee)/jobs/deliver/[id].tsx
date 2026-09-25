import { useCallback, useMemo, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Card, Empty, ErrorText, Loading, Screen, Title } from "../../../../src/components/ui";
import { PhotoPicker } from "../../../../src/components/PhotoPicker";
import { Stepper } from "../../../../src/components/Stepper";
import { Checklist } from "../../../../src/components/Checklist";
import { ConfirmToggle } from "../../../../src/components/ConfirmToggle";
import { Field } from "../../../../src/components/Field";
import { Sheet } from "../../../../src/components/Sheet";
import { SuccessState } from "../../../../src/components/SuccessState";
import { api, appendPhotos } from "../../../../src/lib/api";
import { friendlyError } from "../../../../src/lib/errors";
import { formatWhen } from "../../../../src/lib/format";
import { successFeedback, tapFeedback, warnFeedback } from "../../../../src/lib/haptics";
import { colors } from "../../../../src/theme";
import type { Job, LocalPhoto } from "../../../../src/types";

const STEPS = ["Job", "Inspect", "Photos", "Complete"];

export default function DeliverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ job: Job }>(`/api/deliveries/${id}`);
      setJob(data.job);
      setDestination(data.job.destination || data.job.rental?.destination || "");
      setError(null);
    } catch (err) {
      setJob(null);
      setError(friendlyError(err, "Could not load delivery."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const checks = useMemo(
    () => [
      { label: "Destination", done: destination.trim().length > 0 },
      { label: "Condition notes (3+ characters)", done: notes.trim().length >= 3 },
      { label: "Condition confirmed", done: confirmed },
      { label: "At least 1 before photo", done: photos.length > 0 },
    ],
    [destination, notes, confirmed, photos.length],
  );
  const ready = checks.every((item) => item.done);
  const step = !job ? 0 : ready ? 3 : photos.length > 0 ? 2 : destination || notes || confirmed ? 1 : 0;

  async function complete() {
    if (!job || !ready) return;
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("rentalId", job.rentalId || job.rental?.id || "");
      form.append("equipmentId", job.equipment?.id || "");
      form.append("customerId", job.customer?.id || "");
      form.append("destination", destination.trim());
      form.append("notes", notes.trim());
      form.append("conditionConfirmed", "true");
      appendPhotos(form, photos);
      await api(`/api/deliveries/${id}/complete`, { method: "POST", body: form });
      successFeedback();
      setConfirmOpen(false);
      setDone(true);
    } catch (err) {
      setConfirmOpen(false);
      warnFeedback();
      setError(friendlyError(err, "Could not complete delivery."));
    } finally {
      setPending(false);
    }
  }

  if (loading && !job && !error) return <Loading />;

  if (done) {
    return (
      <Screen>
        <SuccessState
          title="Delivery recorded"
          body="Before photos are stored. The rental is now Active / On Rent."
          actionLabel="Back to jobs"
          onAction={() => router.replace("/(employee)/jobs")}
        />
      </Screen>
    );
  }

  if (!job) {
    return (
      <Screen>
        <Title title="Delivery inspection" subtitle="Could not open this assignment." />
        <ErrorText message={error} />
        <Empty title="Delivery unavailable" body="Pull to refresh from Jobs, or retry if the yard server dropped." />
        <Button label="Retry" onPress={load} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label={ready ? "Review and complete" : "Complete delivery"}
          onPress={() => {
            tapFeedback();
            setConfirmOpen(true);
          }}
          disabled={!ready}
          pending={pending}
        />
      }
    >
      <Stepper steps={STEPS} current={step} />
      <Title title="Delivery" subtitle="Photograph the machine before it leaves." />
      <ErrorText message={error} />
      <Card>
        <Badge status="DELIVERY" />
        <Text style={{ fontWeight: "700", fontSize: 18, marginTop: 8, color: colors.ink }}>
          {job.equipment?.label}
        </Text>
        <Text style={{ color: colors.muted }}>{job.customer?.name}</Text>
        <Text style={{ color: colors.muted }}>{formatWhen(job.startAt)}</Text>
      </Card>
      <Card>
        <Checklist items={checks} />
        <Field
          label="Destination"
          value={destination}
          onChangeText={setDestination}
          placeholder="Jobsite address"
        />
        <Field
          label="Condition notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="At least 3 characters — scratches, hours, fuel, attachments"
        />
        <ConfirmToggle
          value={confirmed}
          onChange={setConfirmed}
          label="I confirm the equipment condition is recorded."
        />
        <PhotoPicker photos={photos} onChange={setPhotos} requiredLabel="at least 1 before-delivery photo" />
      </Card>
      <Sheet
        visible={confirmOpen}
        title="Complete this delivery?"
        body="This stores the before photos and marks the rental Active / On Rent. You cannot undo this from the phone."
        confirmLabel="Complete delivery"
        pending={pending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={complete}
      />
    </Screen>
  );
}
