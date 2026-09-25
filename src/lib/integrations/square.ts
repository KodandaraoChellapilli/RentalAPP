/**
 * Square is not connected. This module only describes the future boundary.
 * It does not call Square and does not invent payment results.
 */
export function squareConfig() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN || "";
  const locationId = process.env.SQUARE_LOCATION_ID || "";
  return {
    configured: Boolean(accessToken && locationId),
    locationId: locationId || null,
  };
}

export function squareIntegrationStatus() {
  const config = squareConfig();
  return {
    provider: "square" as const,
    connected: false,
    configured: config.configured,
    message: config.configured
      ? "Square credentials are present, but invoice sync is not implemented."
      : "Square is not configured. Invoices in this app are tracking only.",
  };
}
