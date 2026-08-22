import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No products yet." />);
    expect(screen.getByText("No products yet.")).toBeInTheDocument();
  });

  it("renders an optional description", () => {
    render(<EmptyState title="No products yet." description="Add your first product to get started." />);
    expect(screen.getByText("Add your first product to get started.")).toBeInTheDocument();
  });

  it("renders primary and secondary actions when given", () => {
    render(
      <EmptyState
        title="No products yet."
        primaryAction={<button type="button">Add Product</button>}
        secondaryAction={<button type="button">Import</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
  });

  it("renders no action row when no actions are given", () => {
    const { container } = render(<EmptyState title="No products yet." />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("applies compact spacing/type when compact is set", () => {
    const { container } = render(<EmptyState title="No products yet." compact />);
    expect(container.firstElementChild).toHaveClass("p-4");
    expect(container.firstElementChild).not.toHaveClass("p-8");
  });

  it("hides the icon slot entirely when no icon is given", () => {
    const { container } = render(<EmptyState title="No products yet." />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
