# Square

Square is not integrated. Invoices in this app record Paid or Unpaid only. No payment is sent to Square, and the app does not invent a Square response.

Later integration needs, from Sam:

- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- Whether a West Ridge invoice should create a Square invoice, or only store a Square payment link
- Which Square location and which staff member owns the Square account

`src/lib/integrations/square.ts` reports whether those variables exist. It does not call Square.
