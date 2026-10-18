/* eslint-disable @typescript-eslint/unbound-method -- every `XController.prototype.x` reference
 * below is a metadata lookup key passed to `Reflect.getMetadata`, never an actual method call. */
import { AppController } from '../app.controller';
import { AuthController } from '../auth/auth.controller';
import { MediaController } from '../media/media.controller';
import { AboutCompanyController } from '../modules/about-company/about-company.controller';
import { AiPublicController } from '../modules/ai/ai-public.controller';
import { ArticlesController } from '../modules/articles/articles.controller';
import { BrandingController } from '../modules/branding/branding.controller';
import { ContactPageController } from '../modules/contact-page/contact-page.controller';
import { FaqsController } from '../modules/faqs/faqs.controller';
import { FooterController } from '../modules/footer/footer.controller';
import { GalleryController } from '../modules/gallery/gallery.controller';
import { HomepageController } from '../modules/homepage/homepage.controller';
import { PageHeaderController } from '../modules/page-headers/page-header.controller';
import { AdminProductsController } from '../modules/products/admin-products.controller';
import { ProductsController } from '../modules/products/products.controller';
import { AdminQuotationsController } from '../modules/quotations/admin-quotations.controller';
import { QuotationsController } from '../modules/quotations/quotations.controller';
import { SettingsController } from '../modules/settings/settings.controller';

// Metadata keys written by @nestjs/throttler's decorators (`throttler.constants`, not exported
// from the package root), suffixed with the throttler name — this app only defines `default`.
const SKIP = 'THROTTLER:SKIPdefault';
const LIMIT = 'THROTTLER:LIMITdefault';

const skipped = (target: object): unknown => Reflect.getMetadata(SKIP, target);
const limit = (target: object): unknown => Reflect.getMetadata(LIMIT, target);

/** Locks in the rate-limit policy from app.module: the website's own server fetches public
 * content for every visitor from a single IP, so those reads must never count against the
 * global per-IP limit — while login, public forms and AI endpoints keep their own bounds. */
describe('Throttle policy', () => {
  it('exempts every public read-only content controller from the global limit', () => {
    const publicContentControllers = [
      AppController,
      AboutCompanyController,
      ArticlesController,
      BrandingController,
      ContactPageController,
      FaqsController,
      FooterController,
      GalleryController,
      HomepageController,
      PageHeaderController,
      ProductsController,
      SettingsController,
    ];

    for (const controller of publicContentControllers) {
      expect({
        controller: controller.name,
        skipped: skipped(controller),
      }).toEqual({
        controller: controller.name,
        skipped: true,
      });
    }
  });

  it('exempts only the read endpoints of the public AI controller', () => {
    expect(skipped(AiPublicController)).toBeUndefined();
    expect(skipped(AiPublicController.prototype.findSettings)).toBe(true);
    expect(skipped(AiPublicController.prototype.findQuickQuestions)).toBe(true);
  });

  it('keeps explicit limits on login, public forms and AI writes', () => {
    expect(limit(AuthController.prototype.login)).toBe(5);
    expect(limit(QuotationsController.prototype.createQuotationRequest)).toBe(
      5,
    );
    expect(limit(QuotationsController.prototype.createContact)).toBe(5);
    expect(limit(AiPublicController.prototype.chat)).toBe(20);
    expect(limit(AiPublicController.prototype.recordEvent)).toBe(30);

    for (const target of [
      AuthController,
      QuotationsController,
      AuthController.prototype.login,
      QuotationsController.prototype.createQuotationRequest,
      QuotationsController.prototype.createContact,
      AiPublicController.prototype.chat,
      AiPublicController.prototype.recordEvent,
      AiPublicController.prototype.generateWhatsapp,
    ]) {
      expect(skipped(target)).toBeUndefined();
    }
  });

  it('leaves admin controllers under the global limit', () => {
    for (const controller of [
      AdminProductsController,
      AdminQuotationsController,
      MediaController,
    ]) {
      expect(skipped(controller)).toBeUndefined();
    }
  });
});
