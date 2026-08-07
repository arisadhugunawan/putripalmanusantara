"use client";

import { Button, FieldError, Input, Label, Textarea } from "@ppn/ui-components";
import type { ProductSummary } from "@ppn/shared-types";
import { FormEvent, useState } from "react";
import { ApiRequestError, submitQuotationRequest } from "@/lib/api-client";

/**
 * Contact page's own inquiry form — a sibling of QuotationForm.tsx, not a shared component,
 * since it needs a Privacy Policy consent checkbox that no other QuotationForm call site
 * (Homepage, product pages, Facilities CTA) asked for; changing the shared component would
 * have rippled into all of them. Submits to the same quotation-requests endpoint, since
 * "Request Quotation" is exactly what this form is for.
 */
export function ContactInquiryForm({ products, className }: { products: ProductSummary[]; className?: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

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
      phone: String(formData.get("phone") ?? "") || undefined,
      product_id: String(formData.get("product_id") ?? "") || undefined,
      estimated_quantity: String(formData.get("estimated_quantity") ?? "") || undefined,
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    const validation = validate(form, consent);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("submitting");
    setErrorMessage(null);
    try {
      await submitQuotationRequest({ ...form, source_page: "/contact" });
      setStatus("success");
      formEl.reset();
      setConsent(false);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiRequestError ? error.message : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className={className} role="status">
        <p className="text-h3 text-neutral-900">Thank you — your inquiry has been sent.</p>
        <p className="mt-2 text-body text-neutral-600">
          Our export team will get back to you shortly by email or WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      {/* Honeypot — must stay empty (docs/05-api.md §6). Hidden from sighted users, still in the tab flow avoidance. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="cif-website">Website</label>
        <input id="cif-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="cif-name">Full Name</Label>
          <Input id="cif-name" name="name" invalid={!!errors.name} required />
          <FieldError>{errors.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="cif-company">Company Name</Label>
          <Input id="cif-company" name="company" invalid={!!errors.company} required />
          <FieldError>{errors.company}</FieldError>
        </div>
        <div>
          <Label htmlFor="cif-country">Country</Label>
          <Input id="cif-country" name="country" invalid={!!errors.country} required />
          <FieldError>{errors.country}</FieldError>
        </div>
        <div>
          <Label htmlFor="cif-email">Email Address</Label>
          <Input id="cif-email" name="email" type="email" invalid={!!errors.email} required />
          <FieldError>{errors.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="cif-phone">Phone Number (optional)</Label>
          <Input id="cif-phone" name="phone" type="tel" />
        </div>
        <div>
          <Label htmlFor="cif-product">Product of Interest</Label>
          <select
            id="cif-product"
            name="product_id"
            className="w-full rounded-field border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-900 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="">Select a product (optional)</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cif-quantity">Estimated Quantity (optional)</Label>
          <Input id="cif-quantity" name="estimated_quantity" placeholder="e.g. 2 containers/month" />
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="cif-message">Message</Label>
        <Textarea id="cif-message" name="message" invalid={!!errors.message} required />
        <FieldError>{errors.message}</FieldError>
      </div>

      <div className="mt-5 flex items-start gap-2.5">
        <input
          id="cif-consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          aria-invalid={!!errors.consent}
          className="mt-1 h-4 w-4 shrink-0 rounded-sm border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="cif-consent" className="text-body text-neutral-600">
          I agree that CV Putri Palma Nusantara may use the information above to respond to
          my inquiry.
        </label>
      </div>
      <FieldError>{errors.consent}</FieldError>

      {status === "error" && (
        <p role="alert" className="mt-4 text-small text-red-600">
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Request Quotation"}
      </Button>
    </form>
  );
}

interface FieldErrors {
  name?: string;
  company?: string;
  country?: string;
  email?: string;
  message?: string;
  consent?: string;
}

function validate(
  form: { name: string; company: string; country: string; email: string; message: string },
  consent: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.company.trim()) errors.company = "Company is required.";
  if (!form.country.trim()) errors.country = "Country is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  if (!form.message.trim()) errors.message = "Please tell us what you need.";
  if (!consent) errors.consent = "Please agree to the Privacy Policy to continue.";
  return errors;
}
