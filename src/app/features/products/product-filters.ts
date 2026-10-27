import { Product } from '../../core/models';

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export const PAGE_SIZES = [8, 12, 20];
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

export interface ProductFilters {
  query: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  sort: SortOption;
}

/** Raw query-string values, as bound to the list component's inputs. */
export interface FilterParams {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  rating?: string;
  sort?: string;
}

const toNumber = (value: string | undefined): number | null => {
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** Turns untrusted URL parameters into a valid filter set, dropping anything malformed. */
export function parseFilters(params: FilterParams): ProductFilters {
  const sort = SORT_OPTIONS.find((o) => o.value === params.sort)?.value ?? 'featured';
  return {
    query: (params.q ?? '').trim(),
    category: params.category?.trim() || null,
    minPrice: toNumber(params.min),
    maxPrice: toNumber(params.max),
    minRating: toNumber(params.rating),
    sort,
  };
}

export function filterProducts(products: readonly Product[], filters: ProductFilters): Product[] {
  const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);

  const result = products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.minPrice !== null && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;
    if (filters.minRating !== null && p.rating.rate < filters.minRating) return false;
    if (terms.length) {
      const haystack = `${p.title} ${p.category} ${p.description}`.toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case 'price-asc':
      return result.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return result.sort((a, b) => b.price - a.price);
    case 'rating':
      return result.sort(
        (a, b) => b.rating.rate - a.rating.rate || b.rating.count - a.rating.count,
      );
    case 'name':
      return result.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return result;
  }
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    !!filters.query ||
    filters.category !== null ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.minRating !== null
  );
}
