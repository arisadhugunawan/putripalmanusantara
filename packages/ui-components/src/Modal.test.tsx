import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders with dialog semantics and the given title/content/footer", () => {
    render(
      <Modal onClose={() => {}} title="Delete this item?" footer={<button type="button">Confirm</button>}>
        <p>This cannot be undone.</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Delete this item?" })).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("calls onClose when the Escape key is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal onClose={onClose} title="Test" />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the overlay, but not when clicking inside the dialog box", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal onClose={onClose} title="Test">
        <p>Inside content</p>
      </Modal>,
    );
    await user.click(screen.getByText("Inside content"));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a close button by default and calls onClose when clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal onClose={onClose} title="Test" />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides the close button when hideCloseButton is set", () => {
    render(<Modal onClose={() => {}} title="Test" hideCloseButton />);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("moves initial focus to the given initialFocusRef element", () => {
    function Wrapper() {
      const ref = { current: null } as React.RefObject<HTMLButtonElement | null>;
      return (
        <Modal onClose={() => {}} title="Test" hideCloseButton initialFocusRef={ref} footer={<button ref={ref} type="button">Cancel</button>}>
          content
        </Modal>
      );
    }
    render(<Wrapper />);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("falls back to focusing the close button when no initialFocusRef is given", () => {
    render(<Modal onClose={() => {}} title="Test" />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });
});
