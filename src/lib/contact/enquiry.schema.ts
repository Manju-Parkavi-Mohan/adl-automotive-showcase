import { z } from "zod";

// Single-line fields reject control chars / newlines to block header injection.
const line = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !/[\r\n\u0000-\u001f]/.test(v), "validation.invalidCharacters");

export const enquirySchema = z.object({
  name: line(100).pipe(z.string().min(2, "validation.nameRequired")),
  email: z.string().trim().max(255).email("validation.emailInvalid"),
  phone: line(30).pipe(z.string().min(6, "validation.phoneRequired")),
  company: line(120).optional(),
  subject: line(150).pipe(z.string().min(3, "validation.subjectRequired")),
  message: z.string().trim().max(5000).optional(),
  product: line(200).optional(),
  sku: line(100).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;