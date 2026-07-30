import { createServerFn } from "@tanstack/react-start";
import { enquirySchema } from "./enquiry.schema";

export const sendEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => enquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { sendEnquiryEmail } = await import("./enquiry.server");
    await sendEnquiryEmail(data);
    return { ok: true as const };
  });