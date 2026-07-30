import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Mail, Send, Phone } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { seoToMeta } from "@/lib/seo";
import { useT } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const SALES_EMAIL = "sales@adlautomotive.com";

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

const formSchema = z.object({
  name: z.string().trim().min(2, "validation.nameRequired").max(100),
  email: z.string().trim().email("validation.emailInvalid").max(255),
  phone: z.string().trim().min(6, "validation.phoneRequired").max(30),
  company: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(3, "validation.subjectRequired").max(150),
  message: z.string().trim().min(10, "validation.messageRequired").max(1500),
});

type FormValues = z.infer<typeof formSchema>;
type Errors = Partial<Record<keyof FormValues, string>>;

function ContactPage() {
  const t = useT();
  const { product, sku } = Route.useSearch();

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

  const set = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const mailBody = useMemo(
    () =>
      [
        `Name: ${values.name}`,
        `Email: ${values.email}`,
        `Phone: ${values.phone}`,
        values.company ? `Company: ${values.company}` : null,
        product ? `Product: ${product}` : null,
        sku ? `SKU: ${sku}` : null,
        "",
        values.message,
      ]
        .filter(Boolean)
        .join("\n"),
    [values, product, sku],
  );

  const handleSubmit = (e: React.FormEvent) => {
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

    const href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(mailBody)}`;
    window.location.href = href;
    toast.success(t("contact.opening", "Opening your email app to send the enquiry…"));
  };

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${SALES_EMAIL}\nSubject: ${values.subject}\n\n${mailBody}`);
      toast.success(t("contact.copied", "Enquiry details copied to clipboard"));
    } catch {
      toast.error(t("contact.copyFailed", "Could not copy. Please email us directly."));
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

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a className="inline-flex items-center gap-2 font-medium text-primary" href={`mailto:${SALES_EMAIL}`}>
            <Mail className="h-4 w-4" /> {SALES_EMAIL}
          </a>
        </div>

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

          {field("message", t("contact.message", "Message"), true,
            <Textarea id="message" rows={6} value={values.message} onChange={set("message")} maxLength={1500} />)}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="h-11 flex-1">
              <Send className="h-4 w-4" /> {t("contact.send", "Send enquiry")}
            </Button>
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={copyDetails}>
              <Phone className="h-4 w-4" /> {t("contact.copy", "Copy details")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("contact.note", "Your enquiry is sent to our sales team at sales@adlautomotive.com.")}
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
