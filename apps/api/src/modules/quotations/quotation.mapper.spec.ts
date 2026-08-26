import { toQuotationRequest } from './quotation.mapper';
import type {
  ProductModel as Product,
  QuotationRequestModel as QuotationRequest,
} from '../../../generated/prisma/models';

function stubQuotationRow(
  overrides: Partial<QuotationRequest & { product: Product | null }> = {},
): QuotationRequest & { product: Product | null } {
  return {
    id: 'quotation-1',
    type: 'quotation',
    name: 'Jane Buyer',
    company: 'Acme Import Co',
    country: 'United States',
    email: 'jane@acme-import.example',
    phone: null,
    productId: null,
    productNameSnapshot: null,
    product: null,
    estimatedQuantity: null,
    message: 'Interested in a quotation.',
    status: 'new',
    sourcePage: 'products/coconut-shell-charcoal',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function stubProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    name: 'Coconut Shell Charcoal',
    ...overrides,
  } as Product;
}

describe('toQuotationRequest — product identity resolution (P2-2)', () => {
  // C: live Product exists — existing behavior preserved.
  it('returns the live Product.name when the product relation is present', () => {
    const row = stubQuotationRow({
      productId: 'product-1',
      productNameSnapshot: 'Old Snapshot Name',
      product: stubProduct({ name: 'Coconut Shell Charcoal' }),
    });

    const result = toQuotationRequest(row);

    expect(result.product_name).toBe('Coconut Shell Charcoal');
  });

  // D: Product deleted — productId is SET NULL, relation is null, snapshot is the only
  // surviving source of the product's identity.
  it('falls back to productNameSnapshot when the product relation is null (Product deleted)', () => {
    const row = stubQuotationRow({
      productId: null,
      productNameSnapshot: 'Coconut Shell Charcoal',
      product: null,
    });

    const result = toQuotationRequest(row);

    expect(result.product_name).toBe('Coconut Shell Charcoal');
    expect(result.product_id).toBeNull();
  });

  // E: neither a live product nor a snapshot — e.g. a general_contact submission, or a
  // quotation submitted with no product_id at all.
  it('returns null when there is neither a live product nor a snapshot', () => {
    const row = stubQuotationRow({
      productId: null,
      productNameSnapshot: null,
      product: null,
    });

    const result = toQuotationRequest(row);

    expect(result.product_name).toBeNull();
  });

  // F: the live Product's name changed after the quotation was created — the mapper must
  // prefer the current live name (API compatibility with existing behavior) over the
  // historical snapshot; the snapshot only ever surfaces once the live relation is gone.
  it('prefers the current live Product.name over an older snapshot when the product was renamed', () => {
    const row = stubQuotationRow({
      productId: 'product-1',
      productNameSnapshot: 'Coconut Shell Charcoal',
      product: stubProduct({ name: 'Coconut Shell Charcoal Briquette' }),
    });

    const result = toQuotationRequest(row);

    expect(result.product_name).toBe('Coconut Shell Charcoal Briquette');
  });

  it('does not change unrelated fields', () => {
    const row = stubQuotationRow({
      productId: null,
      productNameSnapshot: 'Coconut Shell Charcoal',
      product: null,
      phone: '+1234567890',
      estimatedQuantity: '500 kg',
    });

    const result = toQuotationRequest(row);

    expect(result.phone).toBe('+1234567890');
    expect(result.estimated_quantity).toBe('500 kg');
    expect(result.id).toBe('quotation-1');
    expect(result.status).toBe('new');
  });
});
