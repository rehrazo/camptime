import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cartItems')) || [])

  const normalizeProduct = (product = {}) => {
    const id = product.id ?? product.product_id
    return {
      id,
      productId: id,
      name: product.name || 'Product',
      category: product.category || '',
      price: Number(product.price) || 0,
      image: product.image || product.image_url || '/images/placeholder-product.jpg',
      quantity: Math.max(1, Number(product.quantity) || 1),
    }
  }

  const total = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  const itemCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const addItem = (product, quantity = 1) => {
    const normalized = normalizeProduct({ ...product, quantity })
    const existingItem = items.value.find((item) => item.id === normalized.id)

    if (existingItem) {
      existingItem.quantity += normalized.quantity
    } else {
      items.value.push(normalized)
    }

    saveToLocalStorage()
  }

  const removeItem = (productId) => {
    items.value = items.value.filter((item) => item.id !== productId)
    saveToLocalStorage()
  }

  const updateQuantity = (productId, quantity) => {
    const item = items.value.find((item) => item.id === productId)
    if (item) {
      item.quantity = quantity
      if (item.quantity <= 0) {
        removeItem(productId)
      } else {
        saveToLocalStorage()
      }
    }
  }

  const clearCart = () => {
    items.value = []
    saveToLocalStorage()
  }

  const saveToLocalStorage = () => {
    localStorage.setItem('cartItems', JSON.stringify(items.value))
  }

  return {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }
})