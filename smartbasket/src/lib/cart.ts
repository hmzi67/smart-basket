/**
 * Cart money rules, shared by the Redux cart slice (client) and the order route
 * (server) so both agree on what an order costs.
 */
export const FREE_DELIVERY_THRESHOLD = 100
export const DELIVERY_FEE = 40

export const calcDeliveryFee = (subTotal: number) =>
    subTotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE

export const calcTotals = (items: { price: string | number; quantity: number }[]) => {
    const subTotal = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
    )
    const deliveryFee = calcDeliveryFee(subTotal)
    return { subTotal, deliveryFee, finalTotal: subTotal + deliveryFee }
}
