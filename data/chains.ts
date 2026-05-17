/**
 * Chain options offered as variants on every product in the "chains" category.
 *
 * To add a chain:
 *   1. Drop the chain photo into /public/chains/  (e.g. snake.jpg, box.jpg)
 *   2. Add an entry below — id is the URL-safe slug, name is the customer-
 *      facing label, image is the relative URL, priceModifier (optional) is
 *      added to the base product price in INR.
 *
 * While this list is empty, the chain selector on the product page is hidden
 * and chain products behave like normal products (single price, single SKU).
 */

export type ChainOption = {
  id: string;
  name: string;
  image: string;
  /** INR added to the base product price (default 0). */
  priceModifier?: number;
};

export const CHAIN_OPTIONS: ChainOption[] = [
  {
    id: "box-24",
    name: "Box chain · 24\"",
    image: "/chains/box-24.jpg",
  },
];

export const chainById = (id?: string | null): ChainOption | undefined =>
  id ? CHAIN_OPTIONS.find((c) => c.id === id) : undefined;

export const hasChainOptions = (): boolean => CHAIN_OPTIONS.length > 0;
