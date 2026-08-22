import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, TableEmptyRow } from "./Table";

describe("Table", () => {
  it("renders a real table with the given header and rows", () => {
    render(
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Copra</td>
            <td>Published</td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Copra" })).toBeInTheDocument();
  });

  it("wraps the table in a horizontal-scroll container so a wide table never overflows the page", () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </Table>,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("overflow-x-auto");
    expect(wrapper?.querySelector("table")).toBeInTheDocument();
  });

  it("TableEmptyRow spans the full column count with the given message", () => {
    render(
      <Table>
        <tbody>
          <TableEmptyRow colSpan={3}>No products yet.</TableEmptyRow>
        </tbody>
      </Table>,
    );
    const cell = screen.getByRole("cell", { name: "No products yet." });
    expect(cell).toHaveAttribute("colspan", "3");
  });
});
