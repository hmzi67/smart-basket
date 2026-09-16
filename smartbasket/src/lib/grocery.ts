/**
 * Shared grocery/product rules.
 *
 * `sellableFilter` is the single definition of "a customer may see and buy this".
 * Every customer-facing query (listing, detail page, search) spreads it in, so an
 * item that is out of stock or switched off by the admin cannot be reached by
 * calling the API directly.
 */
export const sellableFilter = { isAvailable: true, stock: { $gt: 0 } } as const

export const DEFAULT_PAGE_SIZE = 12
export const MAX_PAGE_SIZE = 48
