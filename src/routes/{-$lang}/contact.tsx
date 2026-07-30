import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { seoToMeta } from "@/lib/seo";
import { useT } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendEnquiry } from "@/lib/contact/enquiry.functions";
import { enquirySchema } from "@/lib/contact/enquiry.schema";

const searchSchema = z.object({
  product: z.string().optional(),
  sku: z.string().optional(),
});

export const Route = createFileRoute("/{-$lang}/contact")({
  validateSearch: searchSchema,
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Contact Sales — ADL Automotive",
      description:
        "Get in touch with the ADL Automotive sales team for product enquiries, pricing and support on diagnostic tools and ECU programmers.",
      url: "/contact",
    }),
  }),
  component: ContactPage,
});

const formSchema = enquirySchema.omit({ product: true, sku: true });

type FormValues = z.infer<typeof formSchema>;
type Errors = Partial<Record<keyof FormValues, string>>;

function ContactPage() {
  const t = useT();
  const { product, sku } = Route.useSearch();
  const submit = useServerFn(sendEnquiry);

  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: product ? `Enquiry: ${product}` : "",
    message: product
      ? `I would like more information about "${product}"${sku ? ` (SKU: ${sku})` : ""}.`
      : "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (!next[key]) next[key] = t(issue.message, issue.message);
      }
      setErrors(next);
      toast.error(t("contact.fixErrors", "Please complete the required fields."));
      return;
    }

    setSubmitting(true);
    try {
      await submit({ data: { ...parsed.data, product, sku } });
      setSent(true);
      toast.success(t("contact.sent", "Your enquiry has been sent to our sales team."));
    } catch {
      toast.error(t("contact.sendFailed", "We couldn't send your enquiry. Please try again shortly."));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof FormValues,
    label: string,
    required: boolean,
    input: React.ReactNode,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
      </Label>
      {input}
      {errors[key] && <p className="text-xs font-medium text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-3xl py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight">{t("contact.title", "Contact Sales")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("contact.subtitle", "Tell us what you need and our team will get back to you shortly.")}
        </p>

        {sent ? (
          <div className="mt-8 rounded-xl bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">
              {t("contact.sentTitle", "Enquiry sent")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                "contact.sentBody",
                "Thank you! Your enquiry has been emailed to our sales team and they will get back to you shortly.",
              )}
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5 rounded-xl bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            {field("name", t("contact.name", "Full name"), true,
              <Input id="name" value={values.name} onChange={set("name")} maxLength={100} autoComplete="name" />)}
            {field("email", t("contact.email", "Email"), true,
              <Input id="email" type="email" value={values.email} onChange={set("email")} maxLength={255} autoComplete="email" />)}
            {field("phone", t("contact.phone", "Phone"), true,
              <Input id="phone" type="tel" value={values.phone} onChange={set("phone")} maxLength={30} autoComplete="tel" />)}
            {field("company", t("contact.company", "Company (optional)"), false,
              <Input id="company" value={values.company ?? ""} onChange={set("company")} maxLength={120} autoComplete="organization" />)}
          </div>

          {field("subject", t("contact.subject", "Subject"), true,
            <Input id="subject" value={values.subject} onChange={set("subject")} maxLength={150} />)}

          {field("message", t("contact.message", "Message"), false,
            <Textarea id="message" rows={6} value={values.message ?? ""} onChange={set("message")} maxLength={5000} />)}

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? t("contact.sending", "Sending…") : t("contact.send", "Send enquiry")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("contact.note", "Your enquiry goes straight to our sales team.")}
          </p>
        </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
