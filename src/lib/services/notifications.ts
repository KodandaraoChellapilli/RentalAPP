import { COMPANY_NAME } from "../brand";
import { formatDateTime } from "../utils";

export const NOTIFICATION_TYPES = [
  "DELIVERY_SCHEDULED",
  "DELIVERY_CONFIRMED",
  "EQUIPMENT_DELIVERED",
  "PICKUP_REQUESTED",
  "PICKUP_SCHEDULED",
  "EQUIPMENT_PICKED_UP",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationPayload = {
  type: NotificationType;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  equipmentLabel?: string | null;
  when?: Date | string | null;
  location?: string | null;
};

export type NotificationResult = {
  type: NotificationType;
  sent: boolean;
  skipped: boolean;
  channels: string[];
  reason?: string;
  subject: string;
  body: string;
};

export function emailProviderConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      process.env.SMTP_URL ||
      process.env.SMTP_HOST,
  );
}

export function smsProviderConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

export function buildNotificationMessage(payload: NotificationPayload) {
  const when = payload.when ? formatDateTime(payload.when) : "the scheduled time";
  const location = payload.location?.trim() || "the jobsite";
  const equipment = payload.equipmentLabel || "your equipment";

  switch (payload.type) {
    case "DELIVERY_SCHEDULED":
      return {
        subject: `${COMPANY_NAME}: delivery scheduled`,
        body: `Your equipment delivery is scheduled for ${when} at ${location}. ${equipment}.`,
      };
    case "DELIVERY_CONFIRMED":
      return {
        subject: `${COMPANY_NAME}: delivery confirmed`,
        body: `Thanks for confirming. ${equipment} is still scheduled for ${when} at ${location}.`,
      };
    case "EQUIPMENT_DELIVERED":
      return {
        subject: `${COMPANY_NAME}: equipment delivered`,
        body: `${equipment} has been delivered to ${location}. The rental is now active.`,
      };
    case "PICKUP_REQUESTED":
      return {
        subject: `${COMPANY_NAME}: pickup requested`,
        body: `We received your pickup request for ${equipment} at ${location} on ${when}. The rental stays active until pickup is completed.`,
      };
    case "PICKUP_SCHEDULED":
      return {
        subject: `${COMPANY_NAME}: pickup scheduled`,
        body: `Pickup for ${equipment} is scheduled for ${when} at ${location}.`,
      };
    case "EQUIPMENT_PICKED_UP":
      return {
        subject: `${COMPANY_NAME}: equipment picked up`,
        body: `${equipment} has been picked up. The rental is complete.`,
      };
  }
}

export async function notifyRentalEvent(payload: NotificationPayload): Promise<NotificationResult> {
  const message = buildNotificationMessage(payload);
  const channels: string[] = [];
  if (emailProviderConfigured() && payload.customerEmail) channels.push("email");
  if (smsProviderConfigured() && payload.customerPhone) channels.push("sms");

  if (channels.length === 0) {
    const reason = "No email/SMS provider configured";
    console.info(`[notify] skipped (${reason})`, payload.type, payload.customerEmail || payload.customerPhone || "no recipient");
    return { type: payload.type, sent: false, skipped: true, channels, reason, ...message };
  }

  // Providers are detected but not wired until credentials are verified in this environment.
  const reason = "Provider credentials are present, but email/SMS sending is not enabled yet";
  console.info(`[notify] not sent (${reason})`, payload.type, channels.join(","));
  return { type: payload.type, sent: false, skipped: true, channels, reason, ...message };
}
