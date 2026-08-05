"use client";

import { Button, Card, Input, Label } from "@ppn/ui-components";
import { FormEvent, useState } from "react";
import { ApiRequestError, useAuth } from "@/lib/admin/auth-context";

// FR-CMS-01 / docs/07-user-flow.md §7 — admin login, no public registration.
export default function AdminLoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan. Silakan coba lagi.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-h3 text-neutral-900">Masuk Admin</h1>
        <p className="mt-1 text-body text-neutral-600">CV Putri Palma Nusantara</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="password">Kata Sandi</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {error && (
            <p role="alert" className="text-small text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
