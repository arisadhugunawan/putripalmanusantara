"use client";

import { Button, FieldError, Input, Label, Textarea } from "@ppn/ui-components";
import { FormEvent, useState } from "react";
import { ApiRequestError, submitContact } from "@/lib/api-client";

interface FieldErrors {
  name?: string;
  company?: string;
  country?: string;
  email?: string;
  message?: string;
}

function validate(form: {
  name: string;
  company: string;
  country: string;
  email: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.company.trim()) errors.company = "Company is required.";
  if (!form.country.trim()) errors.country = "Country is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  if (!form.message.trim()) errors.message = "Please enter a message.";
  return errors;
}

/** FR-CONTACT-01/04/05 — general contact form with client + server-side validation. */
export function ContactForm({ className }: { className?: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Captured before any `await` — event.currentTarget is nulled out by the DOM once
    // synchronous event dispatch finishes, so reading it after an await returns null.
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const form = {
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      country: String(formData.get("country") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("submitting");
    setErrorMessage(null);
    try {
      await submitContact({ ...form, source_page: "/contact" });
      setStatus("success");
      formEl.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className={className} role="status">
        <p className="text-h3 text-neutral-900">Thank you for reaching out.</p>
        <p className="mt-2 text-body text-neutral-600">
          We&apos;ve received your message and will respond as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cf-name">Name</Label>
          <Input id="cf-name" name="name" invalid={!!errors.name} required />
          <FieldError>{errors.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="cf-company">Company</Label>
          <Input id="cf-company" name="company" invalid={!!errors.company} required />
          <FieldError>{errors.company}</FieldError>
        </div>
        <div>
          <Label htmlFor="cf-country">Country</Label>
          <Input id="cf-country" name="country" invalid={!!errors.country} required />
          <FieldError>{errors.country}</FieldError>
        </div>
        <div>
          <Label htmlFor="cf-email">Email</Label>
          <Input id="cf-email" name="email" type="email" invalid={!!errors.email} required />
          <FieldError>{errors.email}</FieldError>
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="cf-message">Message</Label>
        <Textarea id="cf-message" name="message" invalid={!!errors.message} required />
        <FieldError>{errors.message}</FieldError>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-4 text-small text-red-600">
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
