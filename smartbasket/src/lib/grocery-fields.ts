export const groceryCategories = ['Fruits & Vegetables', 'Dairy & Eggs', 'Rice, Atta & Grains', 'Snacks & Biscuits', 'Spices & Masalas', 'Beverages & Drinks', 'Personal Care', 'Household Essentials', 'Instant & Packaged Food', 'Baby & Pet Care']
export const groceryUnits = ['kg', 'g', 'liter', 'ml', 'piece', 'pack']
export function parseGroceryForm(form: FormData) {
  const text = (key: string) => { const value = form.get(key); return typeof value === 'string' ? value.trim() : '' }
  const name = text('name'), category = text('category'), unit = text('unit'), price = text('price'), description = text('description')
  const stock = Number(text('stock'))
  const available = text('isAvailable')
  if (!name || name.length > 150) return { error: 'Name is required and must be under 150 characters' } as const
  if (!groceryCategories.includes(category) || !groceryUnits.includes(unit)) return { error: 'Select a valid category and unit' } as const
  if (!price || !Number.isFinite(Number(price)) || Number(price) <= 0) return { error: 'Price must be greater than zero' } as const
  if (!text('stock') || !Number.isSafeInteger(stock) || stock < 0) return { error: 'Stock must be a whole number of zero or more' } as const
  if (available !== 'true' && available !== 'false') return { error: 'Select product availability' } as const
  if (description.length > 2000) return { error: 'Description must be under 2000 characters' } as const
  const file = form.get('image')
  if (file && (!(file instanceof Blob) || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024 || file.size === 0)) return { error: 'Choose an image up to 5 MB' } as const
  return { data: { name, category, unit, price: String(Number(price)), description, stock, isAvailable: available === 'true' }, file: file instanceof Blob ? file : null } as const
}
