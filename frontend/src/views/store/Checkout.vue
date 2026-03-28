<template>
  <div class="checkout">
    <h1>Checkout</h1>

    <div v-if="stripeMode !== 'unknown'" class="stripe-mode-banner" :class="stripeMode">
      <strong>Stripe Mode:</strong>
      <span v-if="stripeMode === 'test'">Test mode enabled (no real charges).</span>
      <span v-else-if="stripeMode === 'live'">Live mode enabled (real charges).</span>
    </div>

    <div v-else class="stripe-mode-banner unknown">
      <strong>Stripe Mode:</strong>
      <span>Publishable key not set in frontend environment (`VITE_STRIPE_PUBLISHABLE_KEY`).</span>
    </div>

    <div class="checkout-container">
      <div class="checkout-form">
        <form @submit.prevent="submitOrder">
          <p v-if="statusMessage" class="form-status" :class="statusType" aria-live="polite">
            {{ statusMessage }}
          </p>

          <!-- Shipping Information -->
          <section class="form-section">
            <h2>Shipping Address</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input 
                  id="firstName"
                  v-model="form.firstName" 
                  type="text" 
                  autocomplete="given-name"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input 
                  id="lastName"
                  v-model="form.lastName" 
                  type="text" 
                  autocomplete="family-name"
                  required
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                id="email"
                v-model="form.email" 
                type="email" 
                autocomplete="email"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                id="phone"
                v-model="form.phone" 
                type="tel" 
                autocomplete="tel"
                inputmode="tel"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="address">Street Address</label>
              <input 
                id="address"
                v-model="form.address" 
                type="text" 
                autocomplete="street-address"
                required
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="city">City</label>
                <input 
                  id="city"
                  v-model="form.city" 
                  type="text" 
                  autocomplete="address-level2"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="state">State</label>
                <input 
                  id="state"
                  v-model="form.state" 
                  type="text" 
                  autocomplete="address-level1"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="zip">Zip Code</label>
                <input 
                  id="zip"
                  v-model="form.zip" 
                  type="text" 
                  autocomplete="postal-code"
                  inputmode="numeric"
                  required
                  class="form-input"
                />
              </div>
            </div>
          </section>

          <!-- Shipping Method -->
          <section class="form-section">
            <h2>Shipping Method</h2>
            
            <div class="shipping-options">
              <div v-if="shippingMethods.length === 1" class="single-option-display">
                <span class="option-text">
                  <span class="option-title">{{ shippingMethods[0].name }}</span>
                  <span class="option-price">${{ shippingMethods[0].price.toFixed(2) }}</span>
                </span>
              </div>
              <label v-else v-for="method in shippingMethods" :key="method.id" class="radio-option">
                <input 
                  v-model="form.shippingMethod" 
                  type="radio" 
                  :value="method.id"
                />
                <span class="option-text">
                  <span class="option-title">{{ method.name }}</span>
                  <span class="option-price">${{ method.price.toFixed(2) }}</span>
                </span>
              </label>
            </div>
          </section>

          <!-- Payment Information -->
          <section class="form-section">
            <h2>Payment Information</h2>
            <p class="payment-note">
              You will be securely redirected to Stripe to enter your card details and complete payment.
            </p>
          </section>

          <!-- Terms and Conditions -->
          <section class="form-section">
            <label class="checkbox-option">
              <input v-model="form.agreeTerms" type="checkbox" required />
              <span>I agree to the terms and conditions</span>
            </label>
          </section>

          <button type="submit" class="btn btn-primary btn-large" :disabled="isSubmitting">
            {{ isSubmitting ? 'Redirecting to Stripe...' : 'Continue to Secure Payment' }}
          </button>
        </form>
      </div>

      <!-- Order Summary -->
      <div class="order-summary">
        <h2>Order Summary</h2>
        
        <div class="summary-items">
          <div v-for="item in orderItems" :key="item.id" class="summary-item">
            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-qty">Qty: {{ item.quantity }}</p>
            </div>
            <p class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</p>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-row">
          <span>Subtotal:</span>
          <span>${{ subtotal.toFixed(2) }}</span>
        </div>

        <div class="summary-row">
          <span>Shipping:</span>
          <span>${{ shippingCost.toFixed(2) }}</span>
        </div>

        <div class="summary-row">
          <span>Tax (10%):</span>
          <span>${{ tax.toFixed(2) }}</span>
        </div>

        <div class="summary-row total">
          <span>Total:</span>
          <span>${{ total.toFixed(2) }}</span>
        </div>

        <div class="trust-badges">
          <p>✓ Secure checkout</p>
          <p>✓ 30-day returns</p>
          <p>✓ Free customer support</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { loadStripe } from '@stripe/stripe-js'

export default {
  name: 'Checkout',
  setup() {
    const router = useRouter()
    const cartStore = useCartStore()
    const fallbackShippingMethods = [
      { id: 'standard', name: 'Standard Shipping (5-7 days)', price: 9.99 },
      { id: 'express', name: 'Express Shipping (2-3 days)', price: 24.99 },
      { id: 'overnight', name: 'Overnight Shipping', price: 49.99 },
    ]
    const shippingMethods = ref([...fallbackShippingMethods])
    
    const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      shippingMethod: shippingMethods.value[0]?.id || '',
      agreeTerms: false,
    })

    const isSubmitting = ref(false)
    const statusMessage = ref('')
    const statusType = ref('error')
    const taxRate = ref(0)

    const loadTaxRate = async () => {
      try {
        const response = await fetch('/api/tax-rates')
        const data = await response.json()
        const rates = Array.isArray(data?.data) ? data.data : []
        if (rates.length) {
          taxRate.value = Number(rates[0].rate) || 0
        }
      } catch (_err) {
        // keep at 0
      }
    }

    const loadShippingGroups = async () => {
      try {
        const response = await fetch('/api/shipping-groups')
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          return
        }

        const groups = Array.isArray(data?.data) ? data.data : []
        if (!groups.length) {
          return
        }

        shippingMethods.value = groups.map((group) => ({
          id: String(group.id),
          name: String(group.name || 'Shipping'),
          price: Number(group.cost || 0),
        }))

        const hasCurrentSelection = shippingMethods.value.some(
          (entry) => entry.id === String(form.value.shippingMethod)
        )

        if (!hasCurrentSelection) {
          form.value.shippingMethod = shippingMethods.value[0]?.id || ''
        }
      } catch (_error) {
        // keep fallback shipping methods
      }
    }

    const orderItems = computed(() => cartStore.items)

    const subtotal = computed(() => {
      return orderItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
    })

    const shippingCost = computed(() => {
      const method = form.value.shippingMethod
      const selectedMethod = shippingMethods.value.find((item) => item.id === method)
      return selectedMethod ? selectedMethod.price : Number(shippingMethods.value[0]?.price || 0)
    })

    const tax = computed(() => {
      return (subtotal.value + shippingCost.value) * taxRate.value
    })

    const total = computed(() => {
      return subtotal.value + shippingCost.value + tax.value
    })

    const stripePublishableKey = computed(() => String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim())

    const stripeMode = computed(() => {
      const key = stripePublishableKey.value
      if (!key) {
        return 'unknown'
      }

      if (key.startsWith('pk_test_')) {
        return 'test'
      }

      if (key.startsWith('pk_live_')) {
        return 'live'
      }

      return 'unknown'
    })

    const submitOrder = async () => {
      if (!orderItems.value.length) {
        statusType.value = 'error'
        statusMessage.value = 'Your cart is empty.'
        router.push('/products')
        return
      }

      if (isSubmitting.value) {
        return
      }

      statusMessage.value = ''
      isSubmitting.value = true

      try {
        const orderData = {
          customer: {
            firstName: form.value.firstName,
            lastName: form.value.lastName,
            email: form.value.email,
            phone: form.value.phone,
          },
          shipping: {
            address: form.value.address,
            city: form.value.city,
            state: form.value.state,
            zip: form.value.zip,
            method: form.value.shippingMethod,
          },
          items: orderItems.value.map((item) => ({
            id: item.id,
            productId: item.productId || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          totals: {
            subtotal: subtotal.value,
            shipping: shippingCost.value,
            tax: tax.value,
            total: total.value,
          },
        }

        const response = await fetch('/api/payments/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        })

        if (response.ok) {
          const result = await response.json()
          const publishableKey = result.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

          if (publishableKey && result.sessionId) {
            const stripe = await loadStripe(publishableKey)
            const redirectResult = await stripe.redirectToCheckout({ sessionId: result.sessionId })

            if (redirectResult?.error) {
              throw new Error(redirectResult.error.message || 'Stripe redirect failed')
            }
            return
          }

          if (result.url) {
            window.location.href = result.url
            return
          }

          throw new Error('Stripe checkout session could not be started')
        } else {
          const errorData = await response.json().catch(() => ({}))
          statusType.value = 'error'
          statusMessage.value = errorData.error || 'Unable to start secure checkout. Please try again.'
        }
      } catch (error) {
        console.error('Error submitting order:', error)
        statusType.value = 'error'
        statusMessage.value = 'Error submitting order. Please try again.'
      } finally {
        isSubmitting.value = false
      }
    }

    onMounted(() => {
      loadTaxRate()
      loadShippingGroups()
    })

    return {
      form,
      shippingMethods,
      orderItems,
      subtotal,
      shippingCost,
      tax,
      total,
      stripeMode,
      statusMessage,
      statusType,
      isSubmitting,
      submitOrder,
    }
  },
}
</script>

<style scoped>
.checkout {
  max-width: 1240px;
  margin: 0 auto;
  padding: 2.25rem 1.5rem;
}

.checkout h1 {
  font-size: clamp(1.9rem, 3vw, 2.35rem);
  margin-bottom: 1.4rem;
  color: var(--dark-coffee);
}

.stripe-mode-banner {
  margin: -0.8rem 0 1.2rem;
  padding: 0.75rem 0.9rem;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.92rem;
}

.stripe-mode-banner.test {
  background: var(--state-warning-bg);
  border-color: var(--state-warning-border);
  color: var(--state-warning-text);
}

.stripe-mode-banner.live {
  background: var(--state-success-bg);
  border-color: var(--state-success-border);
  color: var(--state-success-text);
}

.stripe-mode-banner.unknown {
  background: var(--state-error-bg);
  border-color: var(--state-error-border);
  color: var(--state-error-text);
}

.checkout-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.checkout-form {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.9rem;
  box-shadow: 0 8px 24px rgba(65, 39, 34, 0.06);
}

.form-status {
  margin: 0 0 1rem;
  padding: 0.75rem 0.85rem;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 0.94rem;
}

.form-status.error {
  background: var(--state-error-bg);
  border-color: var(--state-error-border);
  color: var(--state-error-text);
}

.form-status.success {
  background: var(--state-success-bg);
  border-color: var(--state-success-border);
  color: var(--state-success-text);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h2 {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.form-input {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(12, 124, 89, 0.18);
}

.shipping-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.single-option-display {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--apricot-cream-muted);
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  transition: all 0.3s;
}

.radio-option:hover,
.checkbox-option:hover {
  border-color: var(--color-accent);
  background-color: var(--apricot-cream-muted);
}

.radio-option input[type="radio"],
.checkbox-option input[type="checkbox"] {
  margin-right: 1rem;
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.radio-option input[type="radio"]:checked,
.checkbox-option input[type="checkbox"]:checked {
  accent-color: var(--color-accent);
}

.option-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.option-title {
  font-weight: 500;
}

.option-price {
  color: var(--color-accent);
  font-weight: 600;
}

.checkbox-option {
  border: none;
  padding: 0.5rem 0;
  gap: 0.75rem;
}

.payment-note {
  margin: 0;
  color: var(--dark-coffee);
  background: rgba(246, 216, 174, 0.35);
  border: 1px solid rgba(65, 39, 34, 0.18);
  border-radius: 6px;
  padding: 0.85rem;
}

.btn {
  width: 100%;
  padding: 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
  font-weight: 600;
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
  margin-top: 1rem;
}

.btn-primary:hover {
  background-color: var(--color-accent-dark);
}

.btn-large {
  padding: 1.2rem;
}

.order-summary {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 14px;
  box-shadow: 0 8px 24px rgba(65, 39, 34, 0.06);
}

.order-summary h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.summary-items {
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.item-name {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.item-qty {
  color: var(--color-text-subtle);
  font-size: 0.9rem;
  margin: 0;
}

.item-price {
  font-weight: 600;
  color: var(--color-accent);
}

.summary-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: 1rem 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: var(--color-text-subtle);
}

.summary-row.total {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-accent);
  padding-top: 1rem;
  margin-bottom: 1.5rem;
}

.trust-badges {
  background: white;
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
  margin-top: 1rem;
}

.trust-badges p {
  margin: 0.5rem 0;
  color: var(--color-text-subtle);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .checkout {
    padding: 1.25rem 1rem;
  }

  .checkout-container {
    grid-template-columns: 1fr;
  }

  .checkout-form {
    padding: 1.2rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .option-text {
    flex-direction: column;
    align-items: flex-start;
  }

  .option-price {
    margin-top: 0.5rem;
  }

  .order-summary {
    position: static;
    padding: 1.2rem;
  }
}
</style>