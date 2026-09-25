import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Card, Empty, ErrorText, Loading, Screen, Title } from "../../../../src/components/ui";
import { PhotoPicker } from "../../../../src/components/PhotoPicker";
import { PhotoGrid } from "../../../../src/components/PhotoGrid";
import { Stepper } from "../../../../src/components/Stepper";
import { Checklist } from "../../../../src/components/Checklist";
import { ConfirmToggle } from "../../../../src/components/ConfirmToggle";
import { Choice, ChoiceRow } from "../../../../src/components/Choice";
import { Field } from "../../../../src/components/Field";
import { Sheet } from "../../../../src/components/Sheet";
import { SuccessState } from "../../../../src/components/SuccessState";
import { api, appendPhotos } from "../../../../src/lib/api";
import { friendlyError } from "../../../../src/lib/errors";
import { formatWhen } from "../../../../src/lib/format";
import { successFeedback, tapFeedback, warnFeedback } from "../../../../src/lib/haptics";
import { colors } from "../../../../src/theme";
import type { Job, LocalPhoto, Photo, Rental } from "../../../../src/types";

const STEPS = ["Job", "Inspect", "Photos", "Complete"];

export default function PickupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [rental, setRental] = useState<(Rental & { beforePhotos?: Photo[] }) | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [hasIssue, setHasIssue] = useState<boolean | null>(null);
  const [afterStatus, setAfterStatus] = useState("AVAILABLE");
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [damageOpen, setDamageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ job: Job | null; rental: (Rental & { beforePhotos?: Photo[] }) | null }>(
        `/api/pickups/${id}`,
      );
      setJob(data.job);
      setRental(data.rental);
      setError(null);
    } catch (err) {
      setJob(null);
      setRental(null);
      setError(friendlyError(err, "Could not load pickup."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const nextStatus =
    hasIssue === true ? (afterStatus === "OUT_OF_SERVICE" ? "OUT_OF_SERVICE" : "MAINTENANCE") : afterStatus;
  const checks = useMemo(
    () => [
      { label: "Return condition notes (3+ characters)", done: notes.trim().length >= 3 },
      { label: "Condition confirmed", done: confirmed },
      { label: "At least 1 after photo", done: photos.length > 0 },
      { label: "Damage question answered", done: hasIssue !== null },
    ],
    [notes, confirmed, photos.length, hasIssue],
  );
  const ready = Boolean(rental?.id) && checks.every((item) => item.done);
  const step = !rental ? 0 : ready ? 3 : photos.length > 0 ? 2 : hasIssue === true ? 1 : 0;

  async function complete() {
    if (!ready || !rental) return;
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("rentalId", rental.id);
      form.append("notes", notes.trim());
      form.append("conditionConfirmed", "true");
      form.append("hasIssue", hasIssue === true ? "yes" : "no");
      form.append("afterStatus", hasIssue === true && nextStatus === "AVAILABLE" ? "MAINTENANCE" : nextStatus);
      appendPhotos(form, photos);
      await api(`/api/pickups/${id}/complete`, { method: "POST", body: form });
      successFeedback();
      setConfirmOpen(false);
      setDone(true);
    } catch (err) {
      setConfirmOpen(false);
      warnFeedback();
      setError(friendlyError(err, "Could not complete pickup."));
    } finally {
      setPending(false);
    }
  }

  if (loading && !rental && !error) return <Loading />;

  if (done) {
    const statusNote =
      hasIssue === true
        ? `This machine is marked ${nextStatus === "OUT_OF_SERVICE" ? "Out of service" : "Maintenance"}, not Available.`
        : "After photos are stored and the final rental amount has been calculated.";
    return (
      <Screen>
        <SuccessState
          title="Pickup recorded"
          body={statusNote}
          actionLabel="Back to jobs"
          onAction={() => router.replace("/(employee)/jobs")}
        />
      </Screen>
    );
  }

  if (!rental) {
    return (
      <Screen>
        <Title title="Pickup inspection" subtitle="Could not open this assignment." />
        <ErrorText message={error} />
        <Empty title="Pickup unavailable" body="Pull to refresh from Jobs, or retry if the yard server dropped." />
        <Button label="Retry" onPress={load} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label={ready ? "Review and complete" : "Complete pickup"}
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
      <Title title="Pickup" subtitle="Photograph the return and note any damage." />
      <ErrorText message={error} />
      <Card>
        <Badge status="PICKUP" />
        <Text style={{ fontWeight: "700", fontSize: 18, marginTop: 8, color: colors.ink }}>
          {rental.equipment?.label}
        </Text>
        <Text style={{ color: colors.muted }}>{rental.customer?.name}</Text>
        <Text style={{ color: colors.muted }}>Started {formatWhen(rental.startAt)}</Text>
        {job?.startAt ? <Text style={{ color: colors.muted }}>Scheduled pickup {formatWhen(job.startAt)}</Text> : null}
        <Text style={{ marginTop: 8, fontWeight: "700", color: colors.ink }}>
          {rental.charge.formatted}
          {rental.charge.isEstimate ? " estimated until pickup" : ""}
        </Text>
      </Card>
      <Card>
        <PhotoGrid
          label="Before-delivery photos"
          photos={rental.beforePhotos || []}
          empty="No before photos on file. Photograph the return condition anyway."
        />
      </Card>
      <Card>
        <Checklist items={checks} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>Damage or issue?</Text>
          {hasIssue === true ? (
            <Pressable onPress={() => setDamageOpen(true)} hitSlop={8}>
              <Text style={{ color: colors.accent, fontWeight: "700" }}>Change status</Text>
            </Pressable>
          ) : null}
        </View>
        <ChoiceRow>
          <Choice
            label="No"
            selected={hasIssue === false}
            onPress={() => {
              setHasIssue(false);
              setAfterStatus("AVAILABLE");
            }}
          />
          <Choice
            label="Yes"
            selected={hasIssue === true}
            onPress={() => {
              setHasIssue(true);
              setAfterStatus(afterStatus === "OUT_OF_SERVICE" ? "OUT_OF_SERVICE" : "MAINTENANCE");
              setDamageOpen(true);
            }}
          />
        </ChoiceRow>
        {hasIssue === true ? (
          <Text style={{ color: colors.warning, fontWeight: "700", marginBottom: 12 }}>
            Machine will be {nextStatus === "OUT_OF_SERVICE" ? "Out of service" : "Maintenance"} — not Available.
          </Text>
        ) : null}
        <Field
          label="Condition notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="At least 3 characters — compare to the before photos"
        />
        <ConfirmToggle
          value={confirmed}
          onChange={setConfirmed}
          label="I confirm the return condition is recorded."
        />
        <PhotoPicker photos={photos} onChange={setPhotos} requiredLabel="at least 1 after-pickup photo" />
      </Card>
      <Sheet
        visible={damageOpen}
        title="Report damage"
        body="Damage cannot leave this machine Available. Choose how it should be taken out of the rental pool."
        confirmLabel="Save damage report"
        onClose={() => {
          setDamageOpen(false);
          if (afterStatus === "AVAILABLE") {
            setHasIssue(false);
          }
        }}
        onConfirm={() => {
          if (afterStatus === "AVAILABLE") setAfterStatus("MAINTENANCE");
          setDamageOpen(false);
        }}
      >
        <ChoiceRow>
          <Choice label="Maintenance" selected={afterStatus !== "OUT_OF_SERVICE"} onPress={() => setAfterStatus("MAINTENANCE")} />
          <Choice
            label="Out of service"
            selected={afterStatus === "OUT_OF_SERVICE"}
            onPress={() => setAfterStatus("OUT_OF_SERVICE")}
          />
        </ChoiceRow>
      </Sheet>
      <Sheet
        visible={confirmOpen}
        title="Complete this pickup?"
        body={
          hasIssue === true
            ? `After photos will be stored and this machine will be marked ${nextStatus === "OUT_OF_SERVICE" ? "Out of service" : "Maintenance"}. The final rental amount will be calculated.`
            : "After photos will be stored and the final rental amount will be calculated."
        }
        confirmLabel="Complete pickup"
        pending={pending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={complete}
      />
    </Screen>
  );
}
