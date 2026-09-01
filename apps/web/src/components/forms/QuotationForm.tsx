"use client";

import { Button, FieldError, Input, Label, Textarea } from "@ppn/ui-components";
import type { ProductSummary } from "@ppn/shared-types";
import { FormEvent, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary.d";
import { ApiRequestError, submitQuotationRequest } from "@/lib/api-client";

export interface QuotationFormProps {
  sourcePage: string;
  /** When set, the product is fixed and shown as read-only text instead of a picker (FR-PROD-09). */
  productId?: string;
  productName?: string;
  /** Product picker options, shown only when productId is not fixed. */
  products?: ProductSummary[];
  className?: string;
  dictionary: Dictionary;
}

interface FieldErrors {
  name?: string;
  company?: string;
  country?: string;
  email?: string;
  message?: string;
}

function validate(
  form: {
    name: string;
    company: string;
    country: string;
    email: string;
    message: string;
  },
  dictionary: Dictionary,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = dictionary.quotationForm.nameRequired;
  if (!form.company.trim()) errors.company = dictionary.quotationForm.companyRequired;
  if (!form.country.trim()) errors.country = dictionary.quotationForm.countryRequired;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = dictionary.quotationForm.emailInvalid;
  if (!form.message.trim()) errors.message = dictionary.quotationForm.messageRequired;
  return errors;
}

export function QuotationForm({
  sourcePage,
  productId,
  productName,
  products,
  className,
  dictionary,
}: QuotationFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(productId ?? "");
  // A synchronous guard, not just `status === "submitting"` in the render: several submit
  // events dispatched in the same tick (rapid/double-click, a bouncing Enter key) all run
  // handleSubmit before React re-renders the disabled button, so a state check alone lets
  // duplicates through — this ref is set before any await, closing that window.
  const submittingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
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
      estimated_quantity: String(formData.get("estimated_quantity") ?? "") || undefined,
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    const validation = validate(form, dictionary);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    submittingRef.current = true;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      await submitQuotationRequest({
        ...form,
        // `selectedProductId` defaults to "" (the picker's "optional" empty option) — `??`
        // only falls through on null/undefined, not on an empty string, so without the `||`
        // an unselected picker sent product_id: "" straight to the API instead of omitting it.
        product_id: productId ?? (selectedProductId || undefined),
        source_page: sourcePage,
      });
      setStatus("success");
      formEl.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiRequestError ? error.message : dictionary.quotationForm.genericError,
      );
    } finally {
      submittingRef.current = false;
    }
  }

  if (status === "success") {
    return (
      <div className={className} role="status">
        <p className="text-h3 text-neutral-900">{dictionary.quotationForm.successTitle}</p>
        <p className="mt-2 text-body text-neutral-600">
          {dictionary.quotationForm.successBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      {/* Honeypot — must stay empty (docs/05-api.md §6). Hidden from sighted users, still in the tab flow avoidance. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">{dictionary.quotationForm.websiteHoneypotLabel}</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="qf-name">{dictionary.quotationForm.nameLabel}</Label>
          <Input id="qf-name" name="name" invalid={!!errors.name} required />
          <FieldError>{errors.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="qf-company">{dictionary.quotationForm.companyLabel}</Label>
          <Input id="qf-company" name="company" invalid={!!errors.company} required />
          <FieldError>{errors.company}</FieldError>
        </div>
        <div>
          <Label htmlFor="qf-country">{dictionary.quotationForm.countryLabel}</Label>
          <Input id="qf-country" name="country" invalid={!!errors.country} required />
          <FieldError>{errors.country}</FieldError>
        </div>
        <div>
          <Label htmlFor="qf-email">{dictionary.quotationForm.emailLabel}</Label>
          <Input id="qf-email" name="email" type="email" invalid={!!errors.email} required />
          <FieldError>{errors.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="qf-phone">{dictionary.quotationForm.phoneLabel}</Label>
          <Input id="qf-phone" name="phone" type="tel" />
        </div>

        {productId ? (
          <div>
            <Label>{dictionary.quotationForm.productFixedLabel}</Label>
            <p className="rounded-field border border-neutral-300 bg-neutral-100 px-4 py-2.5 text-body text-neutral-900">
              {productName}
            </p>
          </div>
        ) : products && products.length > 0 ? (
          <div>
            <Label htmlFor="qf-product">{dictionary.quotationForm.productLabel}</Label>
            <select
              id="qf-product"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="w-full rounded-field border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-900 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">{dictionary.quotationForm.productPlaceholder}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <Label htmlFor="qf-quantity">{dictionary.quotationForm.quantityLabel}</Label>
          <Input id="qf-quantity" name="estimated_quantity" placeholder={dictionary.quotationForm.quantityPlaceholder} />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="qf-message">{dictionary.quotationForm.messageLabel}</Label>
        <Textarea id="qf-message" name="message" invalid={!!errors.message} required />
        <FieldError>{errors.message}</FieldError>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-4 text-small text-red-600">
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" ? dictionary.quotationForm.submittingCta : dictionary.quotationForm.submitCta}
      </Button>
    </form>
  );
}
