import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";
import { Input } from "./Input";

describe("FormField", () => {
  it("associates the label with the control via htmlFor/id", () => {
    render(
      <FormField label="Email" htmlFor="email-field">
        <Input id="email-field" />
      </FormField>,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders a description between the label and the control", () => {
    render(
      <FormField label="Email" htmlFor="email-field" description="We never share this.">
        <Input id="email-field" />
      </FormField>,
    );
    expect(screen.getByText("We never share this.")).toBeInTheDocument();
  });

  it("shows a required marker next to the label when required", () => {
    render(
      <FormField label="Email" htmlFor="email-field" required>
        <Input id="email-field" />
      </FormField>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders an accessible error message when error is set", () => {
    render(
      <FormField label="Email" htmlFor="email-field" error="Email is required.">
        <Input id="email-field" />
      </FormField>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required.");
  });

  it("renders no error element when error is absent", () => {
    render(
      <FormField label="Email" htmlFor="email-field">
        <Input id="email-field" />
      </FormField>,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("works with an arbitrary custom control, not just Input", () => {
    render(
      <FormField label="Custom">
        <button type="button">A custom control</button>
      </FormField>,
    );
    expect(screen.getByRole("button", { name: "A custom control" })).toBeInTheDocument();
  });
});
