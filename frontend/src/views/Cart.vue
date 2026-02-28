<template>
  <div class="cart">
    <h1>Shopping Cart</h1>

    <div v-if="cartItems.length > 0" class="cart-container">
      <div class="cart-items">
        <div v-for="item in cartItems" :key="item.id" class="cart-item">
          <img :src="item.image" :alt="item.name" class="item-image" />
          
          <div class="item-details">
            <h3>{{ item.name }}</h3>
            <p v-if="item.variantSummary" class="item-variant">{{ item.variantSummary }}</p>
            <p class="item-category">{{ item.category }}</p>
            <p class="item-price">${{ item.price.toFixed(2) }}</p>
          </div>

          <div class="quantity-control">
            <button @click="decrementQuantity(item.id)" class="qty-btn">−</button>
            <input 
              v-model.number="item.quantity" 
              type="number" 
              min="1"
              class="qty-input"
              @change="updateQuantity(item.id, item.quantity)"
            />
            <button @click="incrementQuantity(item.id)" class="qty-btn">+</button>
          </div>

          <p class="item-total">${{ (item.price * item.quantity).toFixed(2) }}</p>

          <button @click="removeItem(item.id)" class="remove-btn">Remove</button>
        </div>
      </div>

      <div class="cart-summary">
        <h2>Order Summary</h2>
        
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>${{ subtotal.toFixed(2) }}</span>
        </div>

        <div class="summary-row">
          <span>Tax (10%):</span>
          <span>${{ tax.toFixed(2) }}</span>
        </div>

        <div class="summary-row">
          <span>Shipping:</span>
          <span>{{ shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}` }}</span>
        </div>

        <div class="discount-section" v-if="!couponApplied">
          <input 
            v-model="couponCode"
            type="text"
            placeholder="Enter coupon code"
            class="coupon-input"
          />
          <button @click="applyCoupon" class="btn btn-secondary">Apply</button>
        </div>

        <div v-if="couponApplied" class="coupon-applied">
          <p>✓ Coupon applied: {{ couponCode }}</p>
        </div>

        <div class="summary-row total">
          <span>Total:</span>
          <span>${{ total.toFixed(2) }}</span>
        </div>

        <button @click="checkout" class="btn btn-primary btn-large">
          Proceed to Checkout
        </button>

        <router-link to="/products" class="btn btn-secondary btn-large">
          Continue Shopping
        </router-link>
      </div>
    </div>

    <div v-else class="empty-cart">
      <h2>Your cart is empty</h2>
      <p>Add some camping gear to get started!</p>
      <router-link to="/products" class="btn btn-primary">Shop Now</router-link>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'

export default {
  name: 'Cart',
  setup() {
    const router = useRouter()
    const cartStore = useCartStore()
    const cartItems = computed(() => cartStore.items)
    const couponCode = ref('')
    const couponApplied = ref(false)
    const discountPercentage = ref(0)

    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
    })

    const discount = computed(() => {
      return subtotal.value * (discountPercentage.value / 100)
    })

    const tax = computed(() => {
      return (subtotal.value - discount.value) * 0.1
    })

    const shipping = computed(() => {
      return subtotal.value - discount.value >= 50 ? 0 : 9.99
    })

    const total = computed(() => {
      return subtotal.value - discount.value + tax.value + shipping.value
    })

    const incrementQuantity = (itemId) => {
      const item = cartItems.value.find((currentItem) => currentItem.id === itemId)
      if (item && item.quantity < 99) {
        cartStore.updateQuantity(itemId, item.quantity + 1)
      }
    }

    const decrementQuantity = (itemId) => {
      const item = cartItems.value.find((currentItem) => currentItem.id === itemId)
      if (item && item.quantity > 1) {
        cartStore.updateQuantity(itemId, item.quantity - 1)
      }
    }

    const updateQuantity = (itemId, newQuantity) => {
      cartStore.updateQuantity(itemId, Math.max(1, Math.min(99, Number(newQuantity) || 1)))
    }

    const removeItem = (itemId) => {
      cartStore.removeItem(itemId)
    }

    const applyCoupon = () => {
      if (couponCode.value.toUpperCase() === 'CAMP10') {
        discountPercentage.value = 10
        couponApplied.value = true
      } else if (couponCode.value.toUpperCase() === 'CAMP20') {
        discountPercentage.value = 20
        couponApplied.value = true
      } else {
        alert('Invalid coupon code')
      }
    }

    const checkout = () => {
      if (!cartItems.value.length) {
        return
      }
      router.push('/checkout')
    }

    return {
      cartItems,
      couponCode,
      couponApplied,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      incrementQuantity,
      decrementQuantity,
      updateQuantity,
      removeItem,
      applyCoupon,
      checkout,
    }
  },
}
</script>

<style scoped>
.cart {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.cart h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.cart-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 100px 1fr 150px 100px 80px;
  gap: 1rem;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.item-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.item-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.item-category {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.item-variant {
  color: #444;
  font-size: 0.85rem;
  margin: 0.25rem 0;
}

.item-price {
  color: #667eea;
  font-weight: 600;
  margin: 0.5rem 0 0 0;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 2px;
  font-size: 1.2rem;
  transition: background-color 0.3s;
}

.qty-btn:hover {
  background-color: #e0e0e0;
}

.qty-input {
  width: 50px;
  text-align: center;
  border: none;
  font-size: 1rem;
}

.item-total {
  font-weight: 600;
  color: #667eea;
  text-align: right;
}

.remove-btn {
  padding: 0.5rem 1rem;
  background-color: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.remove-btn:hover {
  background-color: #ee5a52;
}

.cart-summary {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.cart-summary h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.summary-row.total {
  border-bottom: none;
  font-size: 1.3rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 1.5rem;
  padding-bottom: 0;
}

.discount-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.coupon-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.coupon-applied {
  background-color: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.btn-large {
  padding: 1rem;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #d0d0d0;
}

.empty-cart {
  text-align: center;
  padding: 3rem;
}

.empty-cart h2 {
  margin-bottom: 1rem;
  color: #333;
}

.empty-cart p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.empty-cart .btn {
  width: auto;
  display: inline-block;
  padding: 0.75rem 2rem;
}

@media (max-width: 768px) {
  .cart-container {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 80px 1fr;
    gap: 0.75rem;
  }

  .item-details,
  .quantity-control,
  .item-total,
  .remove-btn {
    grid-column: 2;
  }

  .item-image {
    grid-row: 1 / 3;
    width: 80px;
    height: 80px;
  }

  .quantity-control {
    justify-self: flex-start;
  }

  .cart-summary {
    position: static;
  }
}
</style>