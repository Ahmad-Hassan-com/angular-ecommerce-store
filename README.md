# Cartwheel: Angular E-Commerce Store

**Live demo: _coming soon_**

A storefront built with **Angular 22**, **NgRx** and **Angular Material (M3)** on top of the free [Fake Store API](https://fakestoreapi.com). Browse and filter products, manage a cart that survives reloads, check out through a validated three-step form, and review past orders.

## Features

- **Product catalogue** with debounced search, category, price-range and rating filters, five sort orders and pagination. All filter state lives in the URL, so results can be shared and survive refresh and the Back button. Malformed query parameters are ignored and out-of-range pages are clamped.
- **Product details** with a quantity stepper, an "already in your cart" indicator and related products from the same category.
- **Cart managed with NgRx**: an `@ngrx/entity` slice with add, update, remove and undo. Quantities are capped per item, and a meta-reducer persists the cart and order history to `localStorage` and restores them on startup.
- **Multi-step checkout** built with Reactive Forms and `mat-stepper`:
  1. Shipping: required fields, email, phone and postal-code checks, and the address from the last order filled in for returning customers.
  2. Delivery and payment: standard or express delivery (free standard shipping over $100), and card validation with a Luhn check, an expiry date that must not be in the past, a CVC check, card-brand detection and as-you-type formatting.
  3. Review: a summary of everything, with links back to edit each step.
  
  A route guard keeps an empty cart out of checkout.
- **Order placement** goes through an NgRx effect that posts the cart to the Fake Store API, then saves the order, clears the cart and opens the confirmation page. Only the card brand and last four digits are stored.
- **Order history** with a details page for each order: items, totals, delivery estimate in business days, shipping address and payment summary.
- **Polish**: loading skeletons, error states with retry, empty states, snackbars with "View cart" and "Undo" actions, dark mode with no flash on load, responsive layouts down to 360px, and accessible labels throughout.
- **Modern Angular**: standalone components, signals (`input`, `model`, `computed`, `linkedSignal`, `selectSignal`), zoneless change detection, the new control flow, functional effects and guards, and a lazy-loaded route for every page.

## Run it

```bash
npm install
npm start          # http://localhost:4200
npm test           # unit tests (Vitest)
npm run build      # production build in dist/ecommerce-store/browser
```

Use the test card `4242 4242 4242 4242` with any future expiry date and any 3-digit CVC. No real payment is taken.

## Project structure

```
src/app/
  core/             models, Fake Store API client, pricing rules, card validators, theme
  store/            NgRx: products, cart and orders slices, effects, persistence meta-reducer
  layout/header.ts  toolbar with cart badge and theme toggle
  shared/           rating stars, quantity stepper, order totals
  features/
    products/       list (search, filters, pagination), card, details, filter logic
    cart/           cart page with free-shipping progress
    checkout/       three-step checkout with Reactive Forms
    orders/         order history and order details
```

## State management

| Slice | Holds | Persisted |
|-------|-------|-----------|
| `products` | Catalogue as an entity collection, plus load status and error | No (refetched) |
| `cart` | Cart lines as an entity collection keyed by product id | Yes |
| `orders` | Placed orders (newest first), plus placing status and error | Orders only |

Placing an order dispatches `[Orders] Place Order`. An effect posts the cart to `POST /carts` and dispatches `Place Order Success`. The cart reducer empties itself on that same action, and a second effect navigates to the confirmation page.

## Tests

Unit tests cover the cart reducer, the pricing rules, the card validators and the product filtering and sorting logic.
