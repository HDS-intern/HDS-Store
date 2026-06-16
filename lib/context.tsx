'use client'

import { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { CartItem, User, Order, Product } from '@/lib/types'
import { PRODUCTS } from '@/lib/mockData'

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  cart: CartItem[]
  addToCart: (product: Product, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  wishlist: string[]
  addToWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
  orders: Order[]
  addOrder: (order: Order) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, { productId: product.id, quantity, product }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId))
  }, [])

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      )
    }
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId)
      return total + (product?.price || 0) * item.quantity
    }, 0)
  }, [cart])

  const addToWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev : [...prev, productId]
    )
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId))
  }, [])

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [...prev, order])
    clearCart()
  }, [clearCart])

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartTotal,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        orders,
        addOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
