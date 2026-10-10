import { Prisma } from '../../../generated/prisma/client';

// Deliberately isolated from `SalesQuotationsService` — pure functions, no Prisma I/O, directly
// unit-testable without mocking anything. Every money value is `Prisma.Decimal` (decimal.js)
// throughout; never a plain JS `number`, which cannot represent Decimal(14,2) exactly.

export function calculateItemSubtotal(
  quantity: number,
  unitPrice: number,
  discount?: number,
): Prisma.Decimal {
  return new Prisma.Decimal(quantity)
    .mul(new Prisma.Decimal(unitPrice))
    .sub(new Prisma.Decimal(discount ?? 0));
}

export function calculateQuotationTotals(
  itemSubtotals: Prisma.Decimal[],
  discount?: number,
  shippingCost?: number,
): { subtotal: Prisma.Decimal; total: Prisma.Decimal } {
  const subtotal = itemSubtotals.reduce(
    (sum, value) => sum.add(value),
    new Prisma.Decimal(0),
  );
  const total = subtotal
    .sub(new Prisma.Decimal(discount ?? 0))
    .add(new Prisma.Decimal(shippingCost ?? 0));
  return { subtotal, total };
}
