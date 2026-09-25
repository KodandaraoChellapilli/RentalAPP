# Public equipment catalog

The rental platform remains the only equipment database. A separate marketing website may call this read-only endpoint. It does not require a login and does not return customers, rentals, invoices, documents, or photos that are not already public equipment photos.

`GET /api/public/equipment`

Each item:

- `id`, `number`, `name`, `type`
- `status`
- `available` (`true` only when status is `AVAILABLE`)
- `rate`, `billingUnit`, `rateLabel`
- `description` (the equipment notes field)
- `photoUrl` when a photo exists

Do not point the marketing site at owner, customer, or document routes.
