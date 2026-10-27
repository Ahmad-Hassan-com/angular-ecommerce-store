import { createSelector } from '@ngrx/store';
import { Product } from '../core/models';
import { adminFeature } from './admin.feature';
import { productsFeature } from './products.feature';

/** API products have no cost data, so until the admin sets one they're assumed to cost 60% of price. */
export const DEFAULT_COST_RATIO = 0.6;

export const defaultCost = (price: number) => Math.round(price * DEFAULT_COST_RATIO * 100) / 100;

/** The shop's full catalogue: Fake Store API products followed by the admin's own. */
export const selectCatalog = createSelector(
  productsFeature.selectAllProducts,
  adminFeature.selectProducts,
  (apiProducts, ownProducts): Product[] => [...apiProducts, ...ownProducts],
);

export const selectCatalogEntities = createSelector(
  selectCatalog,
  (products): Record<number, Product | undefined> =>
    Object.fromEntries(products.map((p) => [p.id, p])),
);

export const selectCategories = createSelector(selectCatalog, (products) =>
  [...new Set(products.map((p) => p.category))].sort(),
);

/** Highest price rounded up to the next $10, used as the price slider's upper bound. */
export const selectPriceCeiling = createSelector(selectCatalog, (products) =>
  Math.max(10, Math.ceil(Math.max(0, ...products.map((p) => p.price)) / 10) * 10),
);

/** Unit cost of every product, by id. */
export const selectUnitCosts = createSelector(
  selectCatalog,
  adminFeature.selectCosts,
  (products, costs): Record<number, number> =>
    Object.fromEntries(
      products.map((p) => [
        p.id,
        'cost' in p ? (p.cost as number) : (costs[p.id] ?? defaultCost(p.price)),
      ]),
    ),
);
