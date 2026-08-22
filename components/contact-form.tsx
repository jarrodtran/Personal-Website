"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { contactSchema } from "@/lib/contact";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "success" | "error";

async function submitContact(input: {
  name: string;
  email: string;
  message: string;
  honeypot: string;
}) {
  if (input.honeypot) {
    return { ok: true as const };
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const endpoint = site.contact.formEndpoint;
  if (endpoint) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      return {
        ok: false as const,
        errors: {
          form: [
            "Something went wrong sending the message. Please email me directly.",
          ],
        },
      };
    }

    return { ok: true as const };
  }

  const subject = encodeURIComponent(`Conversation with ${parsed.data.name}`);
  const body = encodeURIComponent(
    `${parsed.data.message}\n\n${parsed.data.name}\n${parsed.data.email}`,
  );
  window.location.href = `mailto:${site.contact.email}?subject=${subject}&body=${body}`;
  return { ok: true as const };
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );
  const hasEndpoint = Boolean(site.contact.formEndpoint);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("submitting");
    setErrors({});

    const result = await submitContact({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      honeypot: String(data.get("company") ?? ""),
    });

    if (!result.ok) {
      setErrors(result.errors);
      setStatus("error");
      return;
    }

    if (hasEndpoint) {
      form.reset();
    }
    setStatus("success");
  }

  const fieldClass =
    "mt-2 w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={fieldClass}
          placeholder="Your name"
        />
        {errors.name ? (
          <p
            id="name-error"
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
          >
            {errors.name[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldClass}
          placeholder="you@company.com"
        />
        {errors.email ? (
          <p
            id="email-error"
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
          >
            {errors.email[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={cn(fieldClass, "resize-y")}
          placeholder="What you’re exploring, and how I might help."
        />
        {errors.message ? (
          <p
            id="message-error"
            className="mt-1.5 text-sm text-red-600 dark:text-red-400"
          >
            {errors.message[0]}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex w-full items-center justify-center rounded-sm px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting"
          ? hasEndpoint
            ? "Sending…"
            : "Opening…"
          : hasEndpoint
            ? "Send message"
            : "Open email draft"}
      </button>

      <p className="sr-only" aria-live="polite">
        {status === "success"
          ? hasEndpoint
            ? "Message sent."
            : "Email draft opened."
          : status === "error"
            ? "Please fix the form errors."
            : ""}
      </p>

      {status === "success" ? (
        <p className="text-muted-foreground text-sm">
          {hasEndpoint
            ? "Thanks. I'll get back to you shortly."
            : "Your email draft should be open. If it isn’t, write me directly."}
        </p>
      ) : null}

      {errors.form ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errors.form[0]}
        </p>
      ) : null}

      {!hasEndpoint ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          This opens your mail app with the message filled in. Nothing is sent
          from this page.
        </p>
      ) : null}
    </form>
  );
}
