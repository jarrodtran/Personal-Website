import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Name is too long."),
  email: z.email("Please enter a valid email."),
  message: z
    .string()
    .trim()
    .min(10, "A bit more context helps. At least a sentence.")
    .max(5000, "Message is too long."),
});

export type ContactInput = z.infer<typeof contactSchema>;
