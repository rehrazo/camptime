<template>
  <div class="cart-page">
    <h1>Shopping Cart</h1>

    <div v-if="cartItems.length > 0" class="cart-container">
      <!-- Cart Items Section -->
      <div class="cart-items-section">
        <div class="items-header">
          <h2>Items in Cart ({{ cartItems.length }})</h2>
          <button @click="clearCart" class="btn-link">Clear Cart</button>
        </div>

        <!-- Cart Items List -->
        <div class="cart-items">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <img :src="item.image" :alt="item.name" class="item-image" />
            
            <div class="item-details">
              <h3>{{ item.name }}</h3>
              <p class="item-category">{{ item.category }}</p>
              <p v-if="item.onSale" class="sale-label">On Sale!</p>
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

            <div class="item-pricing">
              <p v-if="item.onSale" class="original-price">
                ${{ item.originalPrice.toFixed(2) }}
              </p>
              <p class="item-price">${{ item.price.toFixed(2) }}</p>
            </div>

            <div class="item-total">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </div>

            <button @click="removeItem(item.id)" class="remove-btn" title="Remove from cart">
              ✕
            </button>
          </div>
        </div>

        <!-- Recommendations Section -->
        <div class="recommendations">
          <h3>You might also like</h3>
          <div class="recommendations-grid">
            <div v-for="product in recommendations" :key="product.id" class="rec-item">
              <img :src="product.image" :alt="product.name" />
              <h4>{{ product.name }}</h4>
              <p class="price">${{ product.price.toFixed(2) }}</p>
              <button @click="addToCart(product)" class="btn btn-secondary btn-small">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Summary Section -->
      <div class="order-summary">
        <h2>Order Summary</h2>

        <!-- Coupon Section -->
        <div class="coupon-section">
          <h3>Have a coupon code?</h3>
          <div class="coupon-input-group">
            <input 
              v-model="couponCode"
              type="text"
              placeholder="Enter coupon code"
              class="coupon-input"
              @keyup.enter="applyCoupon"
            />
            <button @click="applyCoupon" :disabled="!couponCode" class="btn btn-secondary">
              Apply
            </button>
          </div>

          <div v-if="appliedCoupon" class="coupon-applied">
            <p class="success">✓ Coupon applied: {{ appliedCoupon.code }}</p>
            <p class="discount-text">Discount: -${{ appliedCoupon.discount.toFixed(2) }}</p>
            <button @click="removeCoupon" class="btn-link remove-coupon">Remove</button>
          </div>

          <div v-if="couponError" class="coupon-error">
            ✕ {{ couponError }}
          </div>

          <!-- Available Coupons Info -->
          <div class="available-coupons">
            <p class="info-title">💡 Available Coupons:</p>
            <ul>
              <li v-for="coupon in availableCoupons" :key="coupon.code">
                <strong>{{ coupon.code }}</strong>: {{ coupon.description }} 
                (Min: ${{ coupon.minAmount }})
              </li>
            </ul>
          </div>
        </div>

        <!-- Order Details -->
        <div class="order-details">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>

          <div v-if="appliedCoupon" class="summary-row discount-row">
            <span>Discount ({{ appliedCoupon.code }}):</span>
            <span>-${{ appliedCoupon.discount.toFixed(2) }}</span>
          </div>

          <div class="summary-row">
            <span>Shipping:</span>
            <span class="shipping-cost">
              {{ shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}` }}
            </span>
            <span v-if="shippingCost === 0" class="free-shipping-badge">Free Shipping!</span>
          </div>

          <div class="summary-row">
            <span>Tax (10%):</span>
            <span>${{ tax.toFixed(2) }}</span>
          </div>

          <div class="summary-divider"></div>

          <div class="summary-row total">
            <span>Total:</span>
            <span>${{ total.toFixed(2) }}</span>
          </div>

          <!-- Shipping Options -->
          <div class="shipping-options">
            <h3>Shipping Method</h3>
            <label v-for="method in shippingMethods" :key="method.id" class="shipping-option">
              <input 
                v-model="selectedShippingMethod"
                type="radio"
                :value="method.id"
              />
              <span class="option-text">
                <span class="method-name">{{ method.name }}</span>
                <span class="method-time">{{ method.time }}</span>
              </span>
              <span class="method-price">${{ method.price.toFixed(2) }}</span>
            </label>
          </div>

          <!-- Promotional Banner -->
          <div v-if="!appliedCoupon && subtotal < 50" class="promo-banner">
            <p>🎉 Add ${{ (50 - subtotal).toFixed(2) }} more to get FREE SHIPPING!</p>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button @click="proceedToCheckout" class="btn btn-primary btn-large">
              Proceed to Checkout
            </button>
            <router-link to="/products" class="btn btn-secondary btn-large">
              Continue Shopping
            </router-link>
          </div>

          <!-- Trust Badges -->
          <div class="trust-badges">
            <p>🔒 Secure Checkout</p>
            <p>📦 Free Returns</p>
            <p>💳 Multiple Payment Methods</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty Cart -->
    <div v-else class="empty-cart">
      <div class="empty-icon">🛒</div>
      <h2>Your cart is empty</h2>
      <p>Start shopping to add items to your cart!</p>
      <router-link to="/products" class="btn btn-primary btn-large">
        Continue Shopping
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'CartEnhanced',
  setup() {
    const router = useRouter()
    const couponCode = ref('')
    const appliedCoupon = ref(null)
    const couponError = ref('')
    const selectedShippingMethod = ref('standard')

    const cartItems = ref([
      {
        id: 1,
        name: 'Mountain Tent Pro',
        category: 'Tents',
        price: 199.99,
        originalPrice: 249.99,
        image: '/images/tent.jpg',
        quantity: 1,
        onSale: true,
      },
      {
        id: 2,
        name: 'Sleeping Bag Deluxe',
        category: 'Sleeping Bags',
        price: 89.99,
        originalPrice: 89.99,
        image: '/images/sleeping-bag.jpg',
        quantity: 2,
        onSale: false,
      },
    ])

    const recommendations = [
      {
        id: 101,
        name: 'Camping Stove',
        price: 45.99,
        image: '/images/stove.jpg',
      },
      {
        id: 102,
        name: 'Sleeping Pad',
        price: 59.99,
        image: '/images/pad.jpg',
      },
      {
        id: 103,
        name: 'Lantern LED',
        price: 34.99,
        image: '/images/lantern.jpg',
      },
      {
        id: 104,
        name: 'Water Bottle',
        price: 24.99,
        image: '/images/bottle.jpg',
      },
    ]

    const availableCoupons = [
      {
        code: 'CAMP10',
        description: '10% off entire order',
        discount: 0.10,
        minAmount: 0,
      },
      {
        code: 'CAMP20',
        description: '20% off orders over $100',
        discount: 0.20,
        minAmount: 100,
      },
      {
        code: 'NEWCUSTOMER',
        description: '$15 off your first order',
        discount: 15,
        minAmount: 0,
        isFixed: true,
      },
      {
        code: 'SUMMER25',
        description: '25% off orders over $200',
        discount: 0.25,
        minAmount: 200,
      },
    ]

    const shippingMethods = [
      { id: 'standard', name: 'Standard Shipping', time: '5-7 business days', price: 9.99 },
      { id: 'express', name: 'Express Shipping', time: '2-3 business days', price: 24.99 },
      { id: 'overnight', name: 'Overnight Shipping', time: 'Next business day', price: 49.99 },
    ]

    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
    })

    const shippingCost = computed(() => {
      if (subtotal.value >= 50) return 0
      const method = shippingMethods.find(m => m.id === selectedShippingMethod.value)
      return method ? method.price : 9.99
    })

    const discountAmount = computed(() => {
      if (!appliedCoupon.value) return 0

      if (appliedCoupon.value.isFixed) {
        return appliedCoupon.value.discount
      }
      return subtotal.value * appliedCoupon.value.discount
    })

    const tax = computed(() => {
      return (subtotal.value - discountAmount.value + shippingCost.value) * 0.1
    })

    const total = computed(() => {
      return subtotal.value - discountAmount.value + shippingCost.value + tax.value
    })

    const incrementQuantity = (itemId) => {
      const item = cartItems.value.find(i => i.id === itemId)
      if (item && item.quantity < 99) {
        item.quantity++
      }
    }

    const decrementQuantity = (itemId) => {
      const item = cartItems.value.find(i => i.id === itemId)
      if (item && item.quantity > 1) {
        item.quantity--
      }
    }

    const updateQuantity = (itemId, newQuantity) => {
      const item = cartItems.value.find(i => i.id === itemId)
      if (item) {
        item.quantity = Math.max(1, Math.min(99, newQuantity))
      }
    }

    const removeItem = (itemId) => {
      cartItems.value = cartItems.value.filter(item => item.id !== itemId)
    }

    const applyCoupon = () => {
      couponError.value = ''

      if (!couponCode.value.trim()) {
        couponError.value = 'Please enter a coupon code'
        return
      }

      const coupon = availableCoupons.find(
        c => c.code.toUpperCase() === couponCode.value.toUpperCase()
      )

      if (!coupon) {
        couponError.value = 'Invalid coupon code'
        return
      }

      if (subtotal.value < coupon.minAmount) {
        couponError.value = `Minimum order of $${coupon.minAmount} required for this coupon`
        return
      }

      let discount = 0
      if (coupon.isFixed) {
        discount = coupon.discount
      } else {
        discount = subtotal.value * coupon.discount
      }

      appliedCoupon.value = {
        code: coupon.code,
        discount: discount,
        percentage: !coupon.isFixed,
      }

      couponCode.value = ''
    }

    const removeCoupon = () => {
      appliedCoupon.value = null
      couponCode.value = ''
      couponError.value = ''
    }

    const clearCart = () => {
      if (confirm('Are you sure you want to clear your cart?')) {
        cartItems.value = []
        appliedCoupon.value = null
      }
    }

    const addToCart = (product) => {
      const existingItem = cartItems.value.find(item => item.id === product.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        cartItems.value.push({
          ...product,
          quantity: 1,
          originalPrice: product.price,
          onSale: false,
        })
      }
    }

    const proceedToCheckout = () => {
      router.push('/checkout')
    }

    return {
      cartItems,
      couponCode,
      appliedCoupon,
      couponError,
      selectedShippingMethod,
      recommendations,
      availableCoupons,
      shippingMethods,
      subtotal,
      shippingCost,
      discountAmount,
      tax,
      total,
      incrementQuantity,
      decrementQuantity,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      clearCart,
      addToCart,
      proceedToCheckout,
    }
  },
}
</script>

<style scoped>
.cart-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f9f9f9;
  min-height: 100vh;
}

.cart-page h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.cart-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

/* Cart Items Section */
.cart-items-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #667eea;
}

.items-header h2 {
  margin: 0;
  color: #333;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-link:hover {
  color: #5568d3;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 100px 1fr 150px 100px 100px 80px;
  gap: 1rem;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.3s;
}

.cart-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.item-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.item-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.item-category {
  color: #666;
  font-size: 0.8rem;
  margin: 0.25rem 0;
}

.sale-label {
  color: #ff6b6b;
  font-size: 0.75rem;
  font-weight: 700;
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

.item-pricing {
  text-align: right;
}

.original-price {
  margin: 0;
  color: #999;
  text-decoration: line-through;
  font-size: 0.8rem;
}

.item-price {
  margin: 0.25rem 0 0 0;
  color: #667eea;
  font-weight: 700;
  font-size: 1.1rem;
}

.item-total {
  font-weight: 700;
  color: #667eea;
  text-align: right;
  font-size: 1rem;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.2rem;
  transition: all 0.3s;
  color: #999;
}

.remove-btn:hover {
  background-color: #ff6b6b;
  color: white;
}

/* Recommendations */
.recommendations {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
}

.recommendations h3 {
  margin-top: 0;
  color: #333;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.rec-item {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
}

.rec-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rec-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.rec-item h4 {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #333;
}

.rec-item .price {
  color: #667eea;
  font-weight: 600;
  margin: 0.5rem 0;
}

/* Order Summary */
.order-summary {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.order-summary h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.order-summary h3 {
  margin: 1rem 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

/* Coupon Section */
.coupon-section {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.coupon-input-group {
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

.coupon-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #667eea;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5568d3;
}

.coupon-applied {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.coupon-applied p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.coupon-applied .success {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.discount-text {
  color: #0c5460;
}

.remove-coupon {
  color: #0c5460;
  text-decoration: underline;
}

.coupon-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.available-coupons {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.75rem;
}

.info-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.available-coupons ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.available-coupons li {
  padding: 0.5rem 0;
  font-size: 0.8rem;
  color: #666;
}

/* Order Details */
.order-details {
  border-top: 1px solid #ddd;
  padding-top: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
  color: #555;
}

.summary-row.total {
  border-bottom: none;
  font-size: 1.3rem;
  font-weight: 700;
  color: #667eea;
  padding-top: 1rem;
  margin-bottom: 1rem;
}

.summary-row.discount-row {
  color: #ff6b6b;
  font-weight: 600;
}

.shipping-cost {
  color: #00b894;
  font-weight: 600;
}

.free-shipping-badge {
  background-color: #d4edda;
  color: #155724;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.summary-divider {
  height: 2px;
  background-color: #e0e0e0;
  margin: 1rem 0;
}

.shipping-options {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.shipping-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.shipping-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.method-name {
  font-weight: 600;
  color: #333;
}

.method-time {
  font-size: 0.8rem;
  color: #999;
}

.method-price {
  font-weight: 600;
  color: #667eea;
}

.promo-banner {
  background: linear-gradient(135deg, #ffd93d 0%, #ffeb3b 100%);
  color: #333;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  text-align: center;
  font-weight: 600;
}

.promo-banner p {
  margin: 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}

.btn-large {
  padding: 1rem;
  text-decoration: none;
  text-align: center;
  display: block;
}

.trust-badges {
  background: #f0f8ff;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #667eea;
}

.trust-badges p {
  margin: 0.5rem 0;
  color: #333;
  font-size: 0.85rem;
}

/* Empty Cart */
.empty-cart {
  background: white;
  border-radius: 8px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-cart h2 {
  color: #333;
  margin-bottom: 1rem;
}

.empty-cart p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
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
  .item-pricing,
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

  .order-summary {
    position: static;
  }

  .recommendations-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-large {
    width: 100%;
  }
}
</style>