# Simplify Checkout to 2 Steps

## Why
Today checkout is a 3-screen flow (`Address → Shipping → Payment`) inside a 6-step breadcrumb (`Cart › Address › Shipping › Payment › Confirm › Complete`). The Shipping screen only re-displays the address the user just picked plus a single non-selectable "Standard Shipping" line — no real choice happens, so it feels like a duplicate of Address and adds a click for nothing.

## New flow

```text
Cart  ›  Details  ›  Payment  ›  Complete
         (address +      (PayPal +
          shipping        T&Cs)
          summary)
```

Two in-page steps instead of three; four breadcrumb nodes instead of six.

### Step 1 — Details (was Address)
- Same UI as today's Address step: address book cards for signed-in users, guest form otherwise, "Ship to same address" toggle, "+ Add new address".
- Add a small inline "Shipping method" block at the bottom of this step showing the single Standard Shipping line (free / calculated later) — informational only, no radio needed since there's one option. Keeps the info visible without a dedicated screen.
- Order-note textarea stays here.
- Sidebar CTA becomes **Continue to Payment** (skips the old Shipping screen).

### Step 2 — Payment
- Unchanged: order summary recap of chosen billing/shipping, T&C checkbox, PayPal buttons.
- "Back" returns to Details.

### Breadcrumb
- Update `CheckoutStep` union in `src/components/site/CheckoutSteps.tsx` from
  `cart | address | shipping | payment | confirm | complete`
  to
  `cart | details | payment | complete`,
  and the `STEPS` array accordingly.
- `Confirm` is dropped from the breadcrumb — the Payment step already is the confirm-and-pay screen (T&Cs + PayPal), so a separate "Confirm" node is misleading. `Complete` is still rendered by the post-payment return route.

## Files touched

- `src/components/site/CheckoutSteps.tsx` — shrink the step list + type.
- `src/routes/{-$lang}/checkout.tsx` — drop the `"shipping"` branch of `step` state, fold the shipping summary block into `AddressStep` (or render it inline under it), update sidebar CTA labels, update `onNavigate` mapping, remove the `ShippingStep` component (or keep the file but stop rendering it).
- `src/routes/{-$lang}/checkout_.return.tsx` — if it passes `current="complete"` to `CheckoutSteps`, keep as-is; if it references `"confirm"`, change to `"complete"`.

## Out of scope
- Real shipping-zone/rate selection (still a single flat option).
- Any change to PayPal, address book storage, or order creation logic.
- Guest vs. signed-in behavior differences beyond what already exists.
