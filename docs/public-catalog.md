# Public equipment catalog

The rental platform remains the only equipment database. A separate marketing website may call this read-only endpoint. It does not require a login and does not return customers, rentals, invoices, documents, or photos that are not already public equipment photos.

`GET /api/public/equipment`

Each item:

- `id`, `number`, `name`, `type`
- `status`
- `available` (`true` only when status is `AVAILABLE`)
- `rate`, `billingUnit`, `rateLabel`
- `photoUrl` only for a photo that is not attached to a rental

It does not return equipment notes, customer names, invoices, insurance documents, damage or condition notes, or employee names. Rental before/after photos are not included. `POST`, `PUT`, and `DELETE` are not supported.

Do not point the marketing site at owner, customer, or document routes.
