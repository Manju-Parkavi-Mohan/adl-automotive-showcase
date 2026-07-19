# Multi-step Checkout with Saved Addresses

## Goals

1. Let signed-in users save multiple billing/shipping addresses on their profile and reuse them at checkout instead of re-typing.
2. Split checkout into three steps: **Address → Shipping → Payment** (still one page, state-driven).
3. "Ship to same address" toggle; when off, pick a different saved address for shipping (no separate form to retype).
4. Breadcrumb renders on a single line on mobile.

## Data Storage

Addresses are stored on the WooCommerce customer via `meta_data` under a single key `adl_addresses` whose value is a JSON-serialised array of address objects, each with a stable `id` (uuid). This lets us keep multiple addresses without touching Woo's built-in single `billing`/`shipping` slots (those still get written on order creation for compatibility).

On first load, if the meta key is empty but the customer has default `billing` populated, we seed the list with that entry so the address book is never blank.

## Server Functions (new `src/lib/woo/addresses.functions.ts`)

- `listMyAddresses()` — returns `SavedAddress[]` for the current session's customer.
- `saveAddress({ address })` — upserts (id present) or appends (no id); returns updated list.
- `deleteAddress({ id })` — removes; returns updated list.

All read/write to `/customers/:id` `meta_data` and require an authenticated session.

## UI Changes

### `src/components/site/CheckoutSteps.tsx`
- Replace `flex-wrap` with `flex-nowrap overflow-x-auto` + `whitespace-nowrap` and shrink text/gap on mobile so all six steps fit one line (with hidden scrollbar).

### `src/routes/{-$lang}/checkout.tsx`
- Introduce `step` state: `"address" | "shipping" | "payment"`.
- **Address step**:
  - Query `listMyAddresses` (only for signed-in users; guests fall back to the current single form).
  - Render address cards in a 2-col grid with a "+" card to add new.
  - Selected billing highlighted with primary ring; "Ship to same address" toggle; when off, second card grid to pick shipping.
  - "Add new address" opens an inline dialog/section with the existing field set; on save calls `saveAddress`.
  - `Continue to Shipping` disabled until billing (and shipping if separate) selected.
- **Shipping step**:
  - Shows chosen addresses (edit link → back to address step) plus a single "Standard Shipping" radio (free / calculated). Free-form since WC shipping-zone selection is out of scope for this iteration.
  - Back / `Continue to Payment` buttons.
- **Payment step**:
  - Existing PayPal buttons; `buildOrder` now uses the selected saved addresses.
- Guests (not signed in) see the existing single billing form on the address step — no address book.

## Breadcrumb Reference

Preserve current wording (`Cart › Address › Shipping › Payment › Confirm › Complete`); adjust styles only.

## Out of Scope

- Real WooCommerce shipping-zone/rate integration (kept as single flat option).
- Editing an existing saved address inline (delete + add-new covers it for this pass).
