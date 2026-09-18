import { Text } from "react-native";
import { Badge } from "./ui";
import { StripeCard } from "./StripeCard";
import { cardStyles, colors } from "../theme";
import { formatWhen } from "../lib/format";
import type { Job } from "../types";

export function JobCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  const pickup = job.type === "PICKUP";
  return (
    <StripeCard
      stripeColor={pickup ? colors.warning : colors.accent}
      onPress={onOpen}
      accessibilityLabel={pickup ? "Open pickup inspection" : "Open delivery inspection"}
    >
      <Badge status={job.type} />
      {job.statusLabel ? <Text style={cardStyles.cardMeta}>{job.statusLabel}</Text> : null}
      <Text style={cardStyles.cardTitle}>{job.equipment?.label || job.title}</Text>
      <Text style={cardStyles.cardMeta}>{job.customer?.name}</Text>
      <Text style={cardStyles.cardMeta}>{job.destination || "No destination yet"}</Text>
      <Text style={cardStyles.cardMeta}>{formatWhen(job.startAt)}</Text>
      {job.source === "CUSTOMER" ? (
        <Text style={cardStyles.cardMeta}>Customer requested pickup</Text>
      ) : null}
      <Text style={cardStyles.cardCta}>{pickup ? "Open pickup" : "Open delivery"} →</Text>
    </StripeCard>
  );
}
