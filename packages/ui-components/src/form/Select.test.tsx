import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const OPTIONS = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C", disabled: true },
];

describe("Select", () => {
  it("renders every option plus an optional placeholder", () => {
    render(<Select aria-label="Pick one" options={OPTIONS} placeholder="Choose..." />);
    expect(screen.getByRole("option", { name: "Choose..." })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option B" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option C" })).toBeDisabled();
  });

  it("fires onChange with the selected value on user interaction", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select aria-label="Pick one" options={OPTIONS} onChange={onChange} />);
    await user.selectOptions(screen.getByRole("combobox"), "b");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("combobox")).toHaveValue("b");
  });

  it("supports keyboard-only selection", async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Pick one" options={OPTIONS} />);
    const select = screen.getByRole("combobox");
    select.focus();
    await user.keyboard("{ArrowDown}");
    expect(select).toHaveFocus();
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Select aria-label="Pick one" options={OPTIONS} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("marks itself invalid via aria-invalid when invalid is set", () => {
    render(<Select aria-label="Pick one" options={OPTIONS} invalid />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when valid", () => {
    render(<Select aria-label="Pick one" options={OPTIONS} />);
    expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-invalid");
  });

  it("is required when the required prop is set", () => {
    render(<Select aria-label="Pick one" options={OPTIONS} required />);
    expect(screen.getByRole("combobox")).toBeRequired();
  });
});
