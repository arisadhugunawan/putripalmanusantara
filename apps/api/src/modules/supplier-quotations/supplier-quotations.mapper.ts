import type {
  SupplierQuotationItemModel as SupplierQuotationItem,
  SupplierQuotationModel as SupplierQuotation,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends SupplierQuotationItem {
  product?: { id: string; name: string } | null;
}

interface SupplierRfqSummaryRelation {
  id: string;
  supplierRfqNumber: string;
}

type SupplierQuotationWithRelations = SupplierQuotation & {
  supplierCompany?: { id: string; name: string } | null;
  supplierRfq?: SupplierRfqSummaryRelation | null;
  items?: ItemWithProduct[];
  _count?: { items: number };
};

export interface SupplierQuotationItemSummary {
  id: string;
  productId: string;
  product: { id: string; name: string } | null;
  productNameSnapshot: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string | null;
  subtotal: string;
  specifications: string | null;
  notes: string | null;
}

export interface SupplierQuotationSummary {
  id: string;
  supplierQuotationNumber: string;
  supplierRfqId: string;
  supplierCompanyId: string;
  supplierCompany: { id: string; name: string } | null;
  status: string;
  quotationDate: string | null;
  validUntil: string | null;
  currency: string;
  subtotal: string;
  discount: string | null;
  shippingCost: string | null;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: SupplierQuotationItemSummary[];
  supplierRfq?: SupplierRfqSummaryRelation;
}

function toSupplierQuotationItem(
  item: ItemWithProduct,
): SupplierQuotationItemSummary {
  return {
    id: item.id,
    productId: item.productId,
    product: item.product ?? null,
    productNameSnapshot: item.productNameSnapshot,
    quantity: item.quantity.toString(),
    unit: item.unit,
    unitPrice: item.unitPrice.toString(),
    discount: item.discount ? item.discount.toString() : null,
    subtotal: item.subtotal.toString(),
    specifications: item.specifications,
    notes: item.notes,
  };
}

export function toSupplierQuotation(
  supplierQuotation: SupplierQuotationWithRelations,
): SupplierQuotationSummary {
  return {
    id: supplierQuotation.id,
    supplierQuotationNumber: supplierQuotation.supplierQuotationNumber,
    supplierRfqId: supplierQuotation.supplierRfqId,
    supplierCompanyId: supplierQuotation.supplierCompanyId,
    supplierCompany: supplierQuotation.supplierCompany ?? null,
    status: supplierQuotation.status,
    quotationDate: supplierQuotation.quotationDate
      ? supplierQuotation.quotationDate.toISOString()
      : null,
    validUntil: supplierQuotation.validUntil
      ? supplierQuotation.validUntil.toISOString()
      : null,
    currency: supplierQuotation.currency,
    subtotal: supplierQuotation.subtotal.toString(),
    discount: supplierQuotation.discount
      ? supplierQuotation.discount.toString()
      : null,
    shippingCost: supplierQuotation.shippingCost
      ? supplierQuotation.shippingCost.toString()
      : null,
    total: supplierQuotation.total.toString(),
    notes: supplierQuotation.notes,
    createdAt: supplierQuotation.createdAt.toISOString(),
    updatedAt: supplierQuotation.updatedAt.toISOString(),
    ...(supplierQuotation._count && {
      itemCount: supplierQuotation._count.items,
    }),
    ...(supplierQuotation.items && {
      items: supplierQuotation.items.map(toSupplierQuotationItem),
    }),
    ...(supplierQuotation.supplierRfq && {
      supplierRfq: supplierQuotation.supplierRfq,
    }),
  };
}
