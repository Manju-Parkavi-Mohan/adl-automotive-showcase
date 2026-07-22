import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/site/CartProvider";
import { useAuth } from "@/components/site/AuthProvider";
import { CheckoutSteps } from "@/components/site/CheckoutSteps";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import {
  listMyAddresses,
  saveAddress,
  deleteAddress,
  type SavedAddress,
} from "@/lib/woo/addresses.functions";
import {
  createPaymentOrder,
  captureOrder,
  getPayPalConfig,
} from "@/lib/paypal/paypal.functions";
import { toast } from "sonner";
import { seoToMeta } from "@/lib/seo";
import { Money } from "@/components/site/Money";
import { useLocale } from "@/i18n/LocaleProvider";
import { CountrySelect } from "@/components/site/CountrySelect";
import { PhoneField } from "@/components/site/PhoneField";

export const Route = createFileRoute("/{-$lang}/checkout")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Secure Checkout — ADL Automotive",
      description: "Complete your order securely with worldwide shipping and expert support.",
      url: "/checkout",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, country: detectedCountry } = useLocale();
  const defaultCountry = (detectedCountry ?? "US").toUpperCase();
  const [ready, setReady] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState<"address" | "shipping" | "payment">("address");
  const qc = useQueryClient();
  const isSignedIn = !!user?.customerId;

  // Address book (signed-in users only)
  const { data: savedAddresses = [], isLoading: loadingAddresses } = useQuery({
    queryKey: ["my-addresses", user?.customerId ?? 0],
    queryFn: () => listMyAddresses(),
    enabled: isSignedIn,
    staleTime: 30_000,
  });

  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [shipToSame, setShipToSame] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTarget, setAddTarget] = useState<"billing" | "shipping">("billing");

  // Auto-select first address once loaded
  useEffect(() => {
    if (!isSignedIn) return;
    if (savedAddresses.length > 0 && !selectedBillingId) {
      setSelectedBillingId(savedAddresses[0].id);
    }
  }, [isSignedIn, savedAddresses, selectedBillingId]);

  const [form, setForm] = useState({
    first_name: user?.firstName ?? "",
    last_name: user?.lastName ?? "",
    email: user?.email ?? "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: defaultCountry,
    phone: "",
    note: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const guestFormMissing =
    !form.first_name ||
    !form.last_name ||
    !form.email ||
    !form.phone ||
    !form.address_1 ||
    !form.city ||
    !form.postcode ||
    form.country.length !== 2;

  // Selected billing / shipping address objects
  const billingAddr = useMemo(
    () => savedAddresses.find((a) => a.id === selectedBillingId) ?? null,
    [savedAddresses, selectedBillingId],
  );
  const shippingAddr = useMemo(
    () =>
      shipToSame
        ? billingAddr
        : savedAddresses.find((a) => a.id === selectedShippingId) ?? null,
    [savedAddresses, selectedShippingId, shipToSame, billingAddr],
  );

  const currentStep: "address" | "shipping" | "payment" = step;
  const stepLabel = currentStep === "payment" ? "payment" : currentStep;

  const addressStepValid = isSignedIn
    ? !!billingAddr && (shipToSame || !!shippingAddr)
    : !guestFormMissing;

  // Build order payload from whichever mode is active
  const buildOrderPayload = () => {
    if (isSignedIn && billingAddr) {
      const bill = {
        first_name: billingAddr.first_name,
        last_name: billingAddr.last_name,
        address_1: billingAddr.address_1,
        address_2: billingAddr.address_2 ?? "",
        city: billingAddr.city,
        state: billingAddr.state ?? "",
        postcode: billingAddr.postcode,
        country: billingAddr.country,
        email: billingAddr.email || user?.email || "",
        phone: billingAddr.phone ?? "",
      };
      const ship = shipToSame || !shippingAddr ? bill : {
        first_name: shippingAddr.first_name,
        last_name: shippingAddr.last_name,
        address_1: shippingAddr.address_1,
        address_2: shippingAddr.address_2 ?? "",
        city: shippingAddr.city,
        state: shippingAddr.state ?? "",
        postcode: shippingAddr.postcode,
        country: shippingAddr.country,
        email: shippingAddr.email || user?.email || "",
        phone: shippingAddr.phone ?? "",
      };
      return {
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        billing: bill,
        shipping: ship,
        customer_note: form.note || undefined,
      };
    }
    return {
      items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      billing: {
        first_name: form.first_name,
        last_name: form.last_name,
        address_1: form.address_1,
        address_2: form.address_2,
        city: form.city,
        state: form.state,
        postcode: form.postcode,
        country: form.country,
        email: form.email,
        phone: form.phone,
      },
      customer_note: form.note || undefined,
    };
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-px mx-auto max-w-[1400px] py-20 text-center">
          <h1 className="text-2xl font-bold">{t("checkout.emptyCart")}</h1>
          <Button asChild className="mt-6"><Link to="/{-$lang}/products" search={{}}>{t("cart.browse")}</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <CheckoutSteps
          current={stepLabel}
          onNavigate={(s) => {
            if (s === "cart") {
              navigate({ to: "/{-$lang}/cart" }).catch(() => {});
              return;
            }
            if (s === "address" || s === "shipping" || s === "payment") {
              setStep(s);
            }
          }}
        />
        <h1 className="text-3xl font-bold tracking-tight">{t("checkout.title")}</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {step === "address" && (
              <AddressStep
                isSignedIn={isSignedIn}
                loading={loadingAddresses}
                addresses={savedAddresses}
                selectedBillingId={selectedBillingId}
                setSelectedBillingId={setSelectedBillingId}
                selectedShippingId={selectedShippingId}
                setSelectedShippingId={setSelectedShippingId}
                shipToSame={shipToSame}
                setShipToSame={setShipToSame}
                onAddClick={(target) => {
                  setAddTarget(target);
                  setShowAddForm(true);
                }}
                showAddForm={showAddForm}
                onCloseForm={() => setShowAddForm(false)}
                onSaved={(list, newest) => {
                  qc.setQueryData(["my-addresses", user?.customerId ?? 0], list);
                  if (newest) {
                    if (addTarget === "billing") setSelectedBillingId(newest.id);
                    else setSelectedShippingId(newest.id);
                  }
                  setShowAddForm(false);
                }}
                onDeleted={(list) =>
                  qc.setQueryData(["my-addresses", user?.customerId ?? 0], list)
                }
                defaults={{
                  first_name: user?.firstName ?? "",
                  last_name: user?.lastName ?? "",
                  email: user?.email ?? "",
                }}
                guestForm={form}
                updateGuestForm={(k) => update(k as keyof typeof form)}
                setGuestCountry={(v) => setForm((f) => ({ ...f, country: v.toUpperCase() }))}
                note={form.note}
                onNoteChange={update("note")}
              />
            )}

            {step === "shipping" && (
              <ShippingStep
                billing={billingAddr}
                shipping={shippingAddr}
                shipToSame={shipToSame}
                isSignedIn={isSignedIn}
                guestForm={form}
                onBack={() => setStep("address")}
                note={form.note}
                onNoteChange={update("note")}
              />
            )}

            {step === "payment" && (
              <PaymentSummary
                billing={billingAddr}
                shipping={shippingAddr}
                shipToSame={shipToSame}
                isSignedIn={isSignedIn}
                guestForm={form}
                onBack={() => setStep("shipping")}
              />
            )}
          </div>

          <aside className="h-fit space-y-4 rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-bold">{t("checkout.yourOrder")}</h2>
            <ul className="space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-3">
                  <span className="line-clamp-2 text-foreground/80">{i.name} <bdi dir="ltr">× {i.quantity}</bdi></span>
                  <Money usd={i.price * i.quantity} className="shrink-0 font-medium" />
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-border" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("cart.subtotal")}</span><Money usd={subtotal} className="font-medium" /></div>
            <div className="flex justify-between text-base font-bold"><span>{t("cart.total")}</span><Money usd={subtotal} /></div>

            {step === "address" && (
              <Button
                className="mt-2 w-full"
                disabled={!addressStepValid}
                onClick={() => setStep("shipping")}
              >
                Continue to Shipping
              </Button>
            )}

            {step === "shipping" && (
              <Button className="mt-2 w-full" onClick={() => setStep("payment")}>
                Continue to Payment
              </Button>
            )}

            {step === "payment" && (
              <>
                <label className="flex items-start gap-2 rounded-md border border-border bg-white p-3 text-xs text-foreground">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    className="mt-0.5"
                    aria-label="Accept terms and conditions"
                  />
                  <span>
                    I have read and agree to the{" "}
                    <Link to="/{-$lang}/terms" target="_blank" className="font-medium text-primary underline underline-offset-2">
                      Terms &amp; Conditions
                    </Link>
                    .
                  </span>
                </label>
                {!termsAccepted ? (
                  <p className="text-xs text-muted-foreground">
                    Please accept the Terms &amp; Conditions to continue with payment.
                  </p>
                ) : (
                  <PayPalButtons
                    buildOrder={buildOrderPayload}
                    total={subtotal}
                    onCaptured={(res) => {
                      clear();
                      navigate({
                        to: "/{-$lang}/checkout/return",
                        search: { status: "success", order_id: res.wcOrderId, order_key: "" },
                      }).catch(() => {});
                    }}
                    onReady={() => setReady(true)}
                  />
                )}
                {!ready && termsAccepted && (
                  <p className="text-xs text-muted-foreground">Loading PayPal…</p>
                )}
              </>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

// ------------- Address Step -------------

function AddressCard({
  addr,
  selected,
  onSelect,
  onDelete,
  disabled,
}: {
  addr: SavedAddress;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "relative rounded-lg border p-4 text-left transition " +
        (selected
          ? "border-primary ring-2 ring-primary/40 bg-primary/5"
          : "border-border bg-white hover:border-primary/60")
      }
      disabled={disabled}
    >
      {selected && (
        <span className="absolute end-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <p className="font-semibold">
        {addr.first_name} {addr.last_name}
      </p>
      {addr.email && <p className="mt-0.5 text-xs text-muted-foreground">{addr.email}</p>}
      {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
      <p className="mt-2 text-sm text-foreground/80">{addr.address_1}</p>
      {addr.address_2 && <p className="text-sm text-foreground/80">{addr.address_2}</p>}
      <p className="text-sm text-foreground/80">
        {addr.city}
        {addr.state ? `, ${addr.state}` : ""} {addr.postcode}
      </p>
      <p className="text-sm text-foreground/80">{addr.country}</p>
      <span
        role="button"
        tabIndex={0}
        aria-label="Delete address"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Delete this address?")) onDelete();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            if (confirm("Delete this address?")) onDelete();
          }
        }}
        className="absolute bottom-3 end-3 inline-flex cursor-pointer items-center rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function AddButtonCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-[140px] place-items-center rounded-lg border border-dashed border-border bg-white p-4 text-muted-foreground hover:border-primary hover:text-primary"
    >
      <div className="flex flex-col items-center gap-1">
        <Plus className="h-6 w-6" />
        <span className="text-sm font-medium">Add new address</span>
      </div>
    </button>
  );
}

function AddressStep(props: {
  isSignedIn: boolean;
  loading: boolean;
  addresses: SavedAddress[];
  selectedBillingId: string | null;
  setSelectedBillingId: (id: string) => void;
  selectedShippingId: string | null;
  setSelectedShippingId: (id: string) => void;
  shipToSame: boolean;
  setShipToSame: (v: boolean) => void;
  onAddClick: (target: "billing" | "shipping") => void;
  showAddForm: boolean;
  onCloseForm: () => void;
  onSaved: (list: SavedAddress[], newest?: SavedAddress) => void;
  onDeleted: (list: SavedAddress[]) => void;
  defaults: { first_name: string; last_name: string; email: string };
  guestForm: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
    note: string;
  };
  updateGuestForm: (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setGuestCountry: (v: string) => void;
  note: string;
  onNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  const {
    isSignedIn,
    loading,
    addresses,
    selectedBillingId,
    setSelectedBillingId,
    selectedShippingId,
    setSelectedShippingId,
    shipToSame,
    setShipToSame,
    onAddClick,
    showAddForm,
    onCloseForm,
    onSaved,
    onDeleted,
    defaults,
    guestForm,
    updateGuestForm,
    setGuestCountry,
  } = props;

  if (!isSignedIn) {
    return (
      <div className="space-y-6 rounded-xl border border-border bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold">Billing details</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link to="/{-$lang}/account/login" className="text-primary underline underline-offset-2">
              Sign in
            </Link>{" "}
            to save this address to your profile for next time.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required><Input required value={guestForm.first_name} onChange={updateGuestForm("first_name")} /></Field>
          <Field label="Last name" required><Input required value={guestForm.last_name} onChange={updateGuestForm("last_name")} /></Field>
          <Field label="Email" required><Input type="email" required value={guestForm.email} onChange={updateGuestForm("email")} /></Field>
          <Field label="Phone" required>
            <PhoneField
              value={guestForm.phone}
              onChange={(v) => setForm((prev) => ({ ...prev, phone: v }))}
              defaultCountry={guestForm.country || defaultCountry}
            />
          </Field>
          <Field label="Address" required className="sm:col-span-2"><Input required value={guestForm.address_1} onChange={updateGuestForm("address_1")} /></Field>
          <Field label="Apartment, suite, etc." className="sm:col-span-2"><Input value={guestForm.address_2} onChange={updateGuestForm("address_2")} /></Field>
          <Field label="City" required><Input required value={guestForm.city} onChange={updateGuestForm("city")} /></Field>
          <Field label="State / Region"><Input value={guestForm.state} onChange={updateGuestForm("state")} /></Field>
          <Field label="Postcode" required><Input required value={guestForm.postcode} onChange={updateGuestForm("postcode")} /></Field>
          <Field label="Country" required>
            <CountrySelect
              value={guestForm.country}
              onChange={(code) => setGuestCountry(code)}
            />
          </Field>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Select billing address</h2>
          <label className="flex items-center gap-2 text-sm font-medium">
            Ship to same address
            <Switch checked={shipToSame} onCheckedChange={setShipToSame} />
          </label>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading your addresses…</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <AddressCard
                key={a.id}
                addr={a}
                selected={selectedBillingId === a.id}
                onSelect={() => setSelectedBillingId(a.id)}
                onDelete={async () => {
                  try {
                    const list = await deleteAddress({ data: { id: a.id } });
                    onDeleted(list);
                    toast.success("Address removed");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to delete");
                  }
                }}
              />
            ))}
            <AddButtonCard onClick={() => onAddClick("billing")} />
          </div>
        )}
      </div>

      {!shipToSame && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Select shipping address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <AddressCard
                key={a.id}
                addr={a}
                selected={selectedShippingId === a.id}
                onSelect={() => setSelectedShippingId(a.id)}
                onDelete={async () => {
                  try {
                    const list = await deleteAddress({ data: { id: a.id } });
                    onDeleted(list);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to delete");
                  }
                }}
              />
            ))}
            <AddButtonCard onClick={() => onAddClick("shipping")} />
          </div>
        </div>
      )}

      {showAddForm && (
        <AddAddressForm
          defaults={defaults}
          onCancel={onCloseForm}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function AddAddressForm({
  defaults,
  onCancel,
  onSaved,
}: {
  defaults: { first_name: string; last_name: string; email: string };
  onCancel: () => void;
  onSaved: (list: SavedAddress[], newest?: SavedAddress) => void;
}) {
  const [f, setF] = useState({
    label: "",
    first_name: defaults.first_name || "",
    last_name: defaults.last_name || "",
    email: defaults.email || "",
    phone: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "US",
  });
  const mut = useMutation({
    mutationFn: async () => saveAddress({ data: { address: f } }),
    onSuccess: (list) => {
      const newest = list[list.length - 1];
      toast.success("Address saved");
      onSaved(list, newest);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save"),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: k === "country" ? e.target.value.toUpperCase() : e.target.value }));

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Add new address</h3>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Label (optional)" className="sm:col-span-2"><Input placeholder="Home, Office…" value={f.label} onChange={set("label")} /></Field>
        <Field label="First name" required><Input value={f.first_name} onChange={set("first_name")} /></Field>
        <Field label="Last name" required><Input value={f.last_name} onChange={set("last_name")} /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={set("email")} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Address" required className="sm:col-span-2"><Input value={f.address_1} onChange={set("address_1")} /></Field>
        <Field label="Apartment, suite, etc." className="sm:col-span-2"><Input value={f.address_2} onChange={set("address_2")} /></Field>
        <Field label="City" required><Input value={f.city} onChange={set("city")} /></Field>
        <Field label="State / Region"><Input value={f.state} onChange={set("state")} /></Field>
        <Field label="Postcode" required><Input value={f.postcode} onChange={set("postcode")} /></Field>
        <Field label="Country (2-letter)" required><Input maxLength={2} value={f.country} onChange={set("country")} /></Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => mut.mutate()}
          disabled={
            mut.isPending ||
            !f.first_name ||
            !f.last_name ||
            !f.address_1 ||
            !f.city ||
            !f.postcode ||
            f.country.length !== 2
          }
        >
          {mut.isPending ? "Saving…" : "Save address"}
        </Button>
      </div>
    </div>
  );
}

function AddressPreview({ title, addr, guestForm, isSignedIn, onEdit }: {
  title: string;
  addr: SavedAddress | null;
  guestForm: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
  };
  isSignedIn: boolean;
  onEdit: () => void;
}) {
  const src = isSignedIn && addr ? addr : {
    id: "guest",
    first_name: guestForm.first_name,
    last_name: guestForm.last_name,
    email: guestForm.email,
    phone: guestForm.phone,
    address_1: guestForm.address_1,
    address_2: guestForm.address_2,
    city: guestForm.city,
    state: guestForm.state,
    postcode: guestForm.postcode,
    country: guestForm.country,
  } as SavedAddress;
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      <div className="mt-3 text-sm text-foreground/80">
        <p className="font-medium text-foreground">{src.first_name} {src.last_name}</p>
        {src.email && <p className="text-xs text-muted-foreground">{src.email}</p>}
        {src.phone && <p className="text-xs text-muted-foreground">{src.phone}</p>}
        <p className="mt-1">{src.address_1}</p>
        {src.address_2 && <p>{src.address_2}</p>}
        <p>{src.city}{src.state ? `, ${src.state}` : ""} {src.postcode}</p>
        <p>{src.country}</p>
      </div>
    </div>
  );
}

function ShippingStep({
  billing,
  shipping,
  shipToSame,
  isSignedIn,
  guestForm,
  onBack,
  note,
  onNoteChange,
}: {
  billing: SavedAddress | null;
  shipping: SavedAddress | null;
  shipToSame: boolean;
  isSignedIn: boolean;
  guestForm: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
  };
  onBack: () => void;
  note: string;
  onNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <AddressPreview title="Billing address" addr={billing} guestForm={guestForm} isSignedIn={isSignedIn} onEdit={onBack} />
        <AddressPreview
          title={shipToSame ? "Shipping (same as billing)" : "Shipping address"}
          addr={shipToSame ? billing : shipping}
          guestForm={guestForm}
          isSignedIn={isSignedIn}
          onEdit={onBack}
        />
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold">Shipping method</h2>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-primary bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <input type="radio" name="shipping" defaultChecked className="h-4 w-4 accent-primary" />
              <div>
                <p className="font-medium">Standard Shipping</p>
                <p className="text-xs text-muted-foreground">Calculated with your order — typically 3–7 business days worldwide.</p>
              </div>
            </div>
            <span className="text-sm font-semibold">Calculated at checkout</span>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <Field label="Order note (optional)">
          <textarea
            value={note}
            onChange={onNoteChange}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back to address</Button>
      </div>
    </div>
  );
}

function PaymentSummary({
  billing,
  shipping,
  shipToSame,
  isSignedIn,
  guestForm,
  onBack,
}: {
  billing: SavedAddress | null;
  shipping: SavedAddress | null;
  shipToSame: boolean;
  isSignedIn: boolean;
  guestForm: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
  };
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <AddressPreview title="Billing address" addr={billing} guestForm={guestForm} isSignedIn={isSignedIn} onEdit={onBack} />
        <AddressPreview
          title={shipToSame ? "Shipping (same as billing)" : "Shipping address"}
          addr={shipToSame ? billing : shipping}
          guestForm={guestForm}
          isSignedIn={isSignedIn}
          onEdit={onBack}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back to shipping</Button>
      </div>
    </div>
  );
}

// ------------- PayPal Buttons -------------

type PayPalNamespace = {
  Buttons: (opts: {
    style?: Record<string, unknown>;
    fundingSource?: unknown;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => Promise<void> };
  FUNDING?: Record<string, unknown>;
  Applepay?: () => {
    config: () => Promise<{ isEligible: boolean; merchantCapabilities: string[]; supportedNetworks: string[]; countryCode: string; currencyCode: string }>;
    validateMerchant: (opts: { validationUrl: string; displayName?: string }) => Promise<unknown>;
    confirmOrder: (opts: { orderId: string; token: unknown; billingContact?: unknown; shippingContact?: unknown }) => Promise<unknown>;
  };
  Googlepay?: () => {
    config: () => Promise<{ isEligible?: boolean; allowedPaymentMethods: unknown[]; merchantInfo: unknown; apiVersion: number; apiVersionMinor: number; countryCode?: string }>;
    confirmOrder: (opts: { orderId: string; paymentMethodData: unknown }) => Promise<{ status?: string }>;
  };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
    ApplePaySession?: {
      new (version: number, req: unknown): ApplePaySessionInstance;
      canMakePayments: () => boolean;
      supportsVersion: (v: number) => boolean;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
    };
    google?: {
      payments?: {
        api?: {
          PaymentsClient: new (opts: { environment: "TEST" | "PRODUCTION" }) => {
            isReadyToPay: (req: unknown) => Promise<{ result: boolean }>;
            createButton: (opts: { onClick: () => void; buttonSizeMode?: string; buttonType?: string; buttonColor?: string }) => HTMLElement;
            loadPaymentData: (req: unknown) => Promise<unknown>;
          };
        };
      };
    };
  }
}

type ApplePaySessionInstance = {
  onvalidatemerchant: (event: { validationURL: string }) => void;
  onpaymentauthorized: (event: { payment: { token: unknown; billingContact?: unknown; shippingContact?: unknown } }) => void;
  oncancel: () => void;
  completeMerchantValidation: (session: unknown) => void;
  completePayment: (status: number) => void;
  begin: () => void;
  abort: () => void;
};

let sdkPromise: Promise<PayPalNamespace> | null = null;
let sdkKey: string | null = null;

function loadPayPalSdk(clientId: string, currency: string): Promise<PayPalNamespace> {
  const key = `${clientId}:${currency}:apm`;
  if (sdkPromise && sdkKey === key) return sdkPromise;
  sdkKey = key;
  sdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.paypal) return resolve(window.paypal);
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons,applepay,googlepay",
      "enable-funding": "venmo",
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal SDK failed to initialise"));
    };
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

let googlePaySdkPromise: Promise<void> | null = null;
function loadGooglePaySdk(): Promise<void> {
  if (googlePaySdkPromise) return googlePaySdkPromise;
  googlePaySdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.google?.payments?.api) return resolve();
    const s = document.createElement("script");
    s.src = "https://pay.google.com/gp/p/js/pay.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Pay SDK"));
    document.head.appendChild(s);
  });
  return googlePaySdkPromise;
}

let applePaySdkPromise: Promise<void> | null = null;
function loadApplePaySdk(): Promise<void> {
  if (applePaySdkPromise) return applePaySdkPromise;
  applePaySdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.ApplePaySession) return resolve();
    const s = document.createElement("script");
    s.src = "https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Apple Pay SDK"));
    document.head.appendChild(s);
  });
  return applePaySdkPromise;
}

type OrderPayload = {
  items: Array<{ product_id: number; quantity: number; variation_id?: number }>;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email?: string;
    phone?: string;
  };
  shipping?: OrderPayload["billing"];
  customer_note?: string;
  currency?: string;
};

function PayPalButtons({
  buildOrder,
  total,
  onCaptured,
  onReady,
}: {
  buildOrder: () => OrderPayload;
  total: number;
  onCaptured: (res: { wcOrderId: number; paypalOrderId: string }) => void;
  onReady: () => void;
}) {
  const paypalRef = useRef<HTMLDivElement | null>(null);
  const applePayRef = useRef<HTMLDivElement | null>(null);
  const googlePayRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applePayEligible, setApplePayEligible] = useState(false);
  const [googlePayEligible, setGooglePayEligible] = useState(false);
  const buildOrderRef = useRef(buildOrder);
  buildOrderRef.current = buildOrder;
  const totalRef = useRef(total);
  totalRef.current = total;

  useEffect(() => {
    let cancelled = false;
    let buttons: { close?: () => Promise<void> } | null = null;

    (async () => {
      try {
        const config = await getPayPalConfig();
        if (cancelled) return;
        const paypal = await loadPayPalSdk(config.clientId, config.currency);
        if (cancelled) return;

        const createOrder = async () => {
          setError(null);
          const res = await createPaymentOrder({ data: buildOrderRef.current() });
          return res.paypalOrderId;
        };
        const doCapture = async (paypalOrderId: string) => {
          const res = await captureOrder({ data: { paypalOrderId } });
          if (!res.ok) {
            setError(res.error);
            toast.error(res.error);
            return;
          }
          onCaptured({ wcOrderId: res.wcOrderId, paypalOrderId: res.paypalOrderId });
        };
        const handleError = (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
          setError(msg);
          toast.error(msg);
        };

        // Main PayPal (renders Venmo automatically when eligible)
        if (paypalRef.current) {
          const b = paypal.Buttons({
            style: { layout: "vertical", shape: "rect", label: "paypal" },
            createOrder,
            onApprove: async (data) => doCapture(data.orderID),
            onCancel: () => toast.message("Payment cancelled. You can try again when you're ready."),
            onError: handleError,
          });
          await b.render(paypalRef.current);
          buttons = b;
        }
        if (!cancelled) onReady();

        // Apple Pay
        (async () => {
          try {
            if (!paypal.Applepay) return;
            if (typeof window === "undefined" || !window.ApplePaySession) {
              await loadApplePaySdk().catch(() => {});
            }
            if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) return;
            const applepay = paypal.Applepay();
            const cfg = await applepay.config();
            if (cancelled || !cfg.isEligible || !applePayRef.current) return;
            setApplePayEligible(true);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.setAttribute("aria-label", "Pay with Apple Pay");
            btn.style.cssText =
              "-webkit-appearance:-apple-pay-button;-apple-pay-button-type:pay;-apple-pay-button-style:black;width:100%;height:44px;border-radius:6px;border:0;cursor:pointer;";
            btn.addEventListener("click", async () => {
              try {
                const orderId = await createOrder();
                const billing = buildOrderRef.current().billing;
                const paymentRequest = {
                  countryCode: cfg.countryCode || (billing.country || "US"),
                  currencyCode: cfg.currencyCode || config.currency,
                  merchantCapabilities: cfg.merchantCapabilities,
                  supportedNetworks: cfg.supportedNetworks,
                  requiredBillingContactFields: ["postalAddress", "name"],
                  total: { label: "ADL Automotive", amount: totalRef.current.toFixed(2) },
                };
                const Session = window.ApplePaySession!;
                const session = new Session(4, paymentRequest);
                session.onvalidatemerchant = async (event) => {
                  try {
                    const merchantSession = await applepay.validateMerchant({
                      validationUrl: event.validationURL,
                      displayName: "ADL Automotive",
                    });
                    session.completeMerchantValidation(merchantSession);
                  } catch (err) {
                    session.abort();
                    handleError(err);
                  }
                };
                session.onpaymentauthorized = async (event) => {
                  try {
                    await applepay.confirmOrder({
                      orderId,
                      token: event.payment.token,
                      billingContact: event.payment.billingContact,
                      shippingContact: event.payment.shippingContact,
                    });
                    session.completePayment(Session.STATUS_SUCCESS);
                    await doCapture(orderId);
                  } catch (err) {
                    session.completePayment(Session.STATUS_FAILURE);
                    handleError(err);
                  }
                };
                session.oncancel = () =>
                  toast.message("Payment cancelled. You can try again when you're ready.");
                session.begin();
              } catch (err) {
                handleError(err);
              }
            });
            applePayRef.current.innerHTML = "";
            applePayRef.current.appendChild(btn);
          } catch {
            // silently skip if Apple Pay init fails
          }
        })();

        // Google Pay
        (async () => {
          try {
            if (!paypal.Googlepay) return;
            await loadGooglePaySdk();
            const googlepay = paypal.Googlepay();
            const cfg = await googlepay.config();
            if (cancelled) return;
            const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
            if (!PaymentsClient) return;
            const client = new PaymentsClient({
              environment: config.env === "live" ? "PRODUCTION" : "TEST",
            });
            const ready = await client.isReadyToPay({
              apiVersion: cfg.apiVersion,
              apiVersionMinor: cfg.apiVersionMinor,
              allowedPaymentMethods: cfg.allowedPaymentMethods,
            });
            if (!ready.result || !googlePayRef.current) return;
            setGooglePayEligible(true);

            const btn = client.createButton({
              buttonSizeMode: "fill",
              buttonType: "pay",
              buttonColor: "black",
              onClick: async () => {
                try {
                  const orderId = await createOrder();
                  const paymentData = await client.loadPaymentData({
                    apiVersion: cfg.apiVersion,
                    apiVersionMinor: cfg.apiVersionMinor,
                    allowedPaymentMethods: cfg.allowedPaymentMethods,
                    merchantInfo: cfg.merchantInfo,
                    transactionInfo: {
                      countryCode: cfg.countryCode || "US",
                      currencyCode: config.currency,
                      totalPriceStatus: "FINAL",
                      totalPrice: totalRef.current.toFixed(2),
                    },
                  });
                  const confirm = await googlepay.confirmOrder({
                    orderId,
                    paymentMethodData: (paymentData as { paymentMethodData: unknown }).paymentMethodData,
                  });
                  if (confirm.status && confirm.status !== "APPROVED") {
                    handleError(new Error(`Google Pay: ${confirm.status}`));
                    return;
                  }
                  await doCapture(orderId);
                } catch (err) {
                  const anyErr = err as { statusCode?: string };
                  if (anyErr && anyErr.statusCode === "CANCELED") {
                    toast.message("Payment cancelled.");
                    return;
                  }
                  handleError(err);
                }
              },
            });
            googlePayRef.current.innerHTML = "";
            googlePayRef.current.appendChild(btn);
          } catch {
            // silently skip if Google Pay init fails
          }
        })();
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Could not initialise PayPal";
        setError(msg);
      }
    })();

    return () => {
      cancelled = true;
      try {
        void buttons?.close?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div ref={paypalRef} />
      <div ref={applePayRef} style={{ display: applePayEligible ? "block" : "none" }} />
      <div ref={googlePayRef} style={{ display: googlePayEligible ? "block" : "none" }} />
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}