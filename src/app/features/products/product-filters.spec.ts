import { Product } from '../../core/models';
import { filterProducts, parseFilters } from './product-filters';

const product = (id: number, overrides: Partial<Product>): Product => ({
  id,
  title: `Product ${id}`,
  price: 10,
  description: '',
  category: 'electronics',
  image: '',
  rating: { rate: 3, count: 1 },
  ...overrides,
});

const products = [
  product(1, {
    title: 'Cotton Jacket',
    price: 55,
    category: "men's clothing",
    rating: { rate: 4.7, count: 500 },
  }),
  product(2, {
    title: 'Gold Ring',
    price: 168,
    category: 'jewelery',
    rating: { rate: 3.9, count: 70 },
  }),
  product(3, {
    title: 'SSD Drive',
    price: 109,
    description: 'fast storage',
    rating: { rate: 4.8, count: 319 },
  }),
  product(4, {
    title: 'Rain Jacket',
    price: 39.99,
    category: "women's clothing",
    rating: { rate: 3.8, count: 679 },
  }),
];

const ids = (list: Product[]) => list.map((p) => p.id);

describe('parseFilters', () => {
  it('ignores malformed URL values', () => {
    expect(
      parseFilters({ min: 'abc', max: '-5', rating: '', sort: 'random', q: '  ring ' }),
    ).toEqual({
      query: 'ring',
      category: null,
      minPrice: null,
      maxPrice: null,
      minRating: null,
      sort: 'featured',
    });
  });
});

describe('filterProducts', () => {
  it('matches every search term across title, category and description', () => {
    expect(ids(filterProducts(products, parseFilters({ q: 'jacket' })))).toEqual([1, 4]);
    expect(ids(filterProducts(products, parseFilters({ q: 'fast storage' })))).toEqual([3]);
    expect(ids(filterProducts(products, parseFilters({ q: 'jacket gold' })))).toEqual([]);
  });

  it('combines category, price and rating filters', () => {
    const filters = parseFilters({ min: '40', max: '120', rating: '4' });
    expect(ids(filterProducts(products, filters))).toEqual([1, 3]);
    expect(ids(filterProducts(products, parseFilters({ category: 'jewelery' })))).toEqual([2]);
  });

  it('sorts without mutating the input', () => {
    const copy = [...products];
    expect(ids(filterProducts(products, parseFilters({ sort: 'price-asc' })))).toEqual([
      4, 1, 3, 2,
    ]);
    expect(ids(filterProducts(products, parseFilters({ sort: 'rating' })))).toEqual([3, 1, 2, 4]);
    expect(products).toEqual(copy);
  });
});
