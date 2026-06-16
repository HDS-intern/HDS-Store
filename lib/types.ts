export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  subcategory: string
  rating: number
  reviews: number
  inStock: boolean
  specs: Record<string, string>
  description: string
  features: string[]
  images: string[]
}

export interface CartItem {
  productId: string
  quantity: number
  product?: Product
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  role: 'customer' | 'admin'
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  deliveryDate?: Date
  trackingNumber?: string
  shippingAddress: string
  deliveryMethod: string
}

export interface FilterOptions {
  categories: string[]
  priceRange: [number, number]
  ratings: number[]
  inStock: boolean
}
