import type { DecorativeGraphic as SharedDecorativeGraphic } from '@ppn/shared-types';
import type { DecorativeGraphicModel as DecorativeGraphic } from '../../../generated/prisma/models';

export function toDecorativeGraphic(
  graphic: DecorativeGraphic,
): SharedDecorativeGraphic {
  return {
    id: graphic.id,
    page: graphic.page,
    variant: graphic.variant,
    placement: graphic.placement,
    opacity: graphic.opacity,
    scale: graphic.scale,
    order: graphic.order,
    enabled: graphic.enabled,
  };
}
