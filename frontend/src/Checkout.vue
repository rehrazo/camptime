<template>
  <div class="checkout">
    <h1>Checkout</h1>

    <div class="checkout-container">
      <div class="checkout-form">
        <form @submit.prevent="submitOrder">
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
              <label class="radio-option">
                <input 
                  v-model="form.shippingMethod" 
                  type="radio" 
                  value="standard"
                />
                <span class="option-text">
                  <span class="option-title">Standard Shipping (5-7 days)</span>
                  <span class="option-price">$9.99</span>
                </span>
              </label>
              <label class="radio-option">
                <input 
                  v-model="form.shippingMethod" 
                  type="radio" 
                  value="express"
                />
                <span class="option-text">
                  <span class="option-title">Express Shipping (2-3 days)</span>
                  <span class="option-price">$24.99</span>
                </span>
              </label>
              <label class="radio-option">
                <input 
                  v-model="form.shippingMethod" 
                  type="radio" 
                  value="overnight"
                />
                <span class="option-text">
                  <span class="option-title">Overnight Shipping</span>
                  <span class="option-price">$49.99</span>
                </span>
              </label>
            </div>
          </section>

          <!-- Payment Information -->
          <section class="form-section">
            <h2>Payment Information</h2>
            
            <div class="form-group">
              <label for="cardName">Name on Card</label>
              <input 
                id="cardName"
                v-model="form.cardName" 
                type="text" 
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="cardNumber">Card Number</label>
              <input 
                id="cardNumber"
                v-model="form.cardNumber" 
                type="text" 
                placeholder="1234 5678 9012 3456"
                required
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="expiry">Expiration Date</label>
                <input 
                  id="expiry"
                  v-model="form.expiry" 
                  type="text" 
                  placeholder="MM/YY"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="cvv">CVV</label>
                <input 
                  id="cvv"
                  v-model="form.cvv" 
                  type="text" 
                  placeholder="123"
                  required
                  class="form-input"
                />
              </div>
            </div>

            <label class="checkbox-option">
              <input v-model="form.billingSameAsShipping" type="checkbox" />
              <span>Billing address same as shipping</span>
            </label>
          </section>

          <!-- Terms and Conditions -->
          <section class="form-section">
            <label class="checkbox-option">
              <input v-model="form.agreeTerms" type="checkbox" required />
              <span>I agree to the terms and conditions</span>
            </label>
          </section>

          <button type="submit" class="btn btn-primary btn-large">
            Complete Order
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Checkout',
  setup() {
    const router = useRouter()
    
    const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      shippingMethod: 'standard',
      cardName: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
      billingSameAsShipping: true,
      agreeTerms: false,
    })

    // Mock order items
    const orderItems = ref([
      {
        id: 1,
        name: 'Mountain Tent',
        price: 199.99,
        quantity: 1,
      },
      {
        id: 2,
        name: 'Sleeping Bag',
        price: 79.99,
        quantity: 2,
      },
    ])

    const subtotal = computed(() => {
      return orderItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
    })

    const shippingCost = computed(() => {
      const method = form.value.shippingMethod
      const costs = {
        standard: 9.99,
        express: 24.99,
        overnight: 49.99,
      }
      return costs[method] || 9.99
    })

    const tax = computed(() => {
      return (subtotal.value + shippingCost.value) * 0.1
    })

    const total = computed(() => {
      return subtotal.value + shippingCost.value + tax.value
    })

    const submitOrder = async () => {
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
          items: orderItems.value,
          totals: {
            subtotal: subtotal.value,
            shipping: shippingCost.value,
            tax: tax.value,
            total: total.value,
          },
        }

        // Send to backend
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        })

        if (response.ok) {
          const result = await response.json()
          // Redirect to order confirmation
          router.push(`/order-confirmation/${result.orderId}`)
        } else {
          alert('Error submitting order')
        }
      } catch (error) {
        console.error('Error submitting order:', error)
        alert('Error submitting order. Please try again.')
      }
    }

    return {
      form,
      orderItems,
      subtotal,
      shippingCost,
      tax,
      total,
      submitOrder,
    }
  },
}
</script>

<style scoped>
.checkout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.checkout h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.checkout-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.checkout-form {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h2 {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  color: #333;
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
  color: #333;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.shipping-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.3s;
}

.radio-option:hover,
.checkbox-option:hover {
  border-color: #667eea;
  background-color: #f9f9f9;
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
  accent-color: #667eea;
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
  color: #667eea;
  font-weight: 600;
}

.checkbox-option {
  border: none;
  padding: 0.5rem 0;
  gap: 0.75rem;
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
  background-color: #667eea;
  color: white;
  margin-top: 1rem;
}

.btn-primary:hover {
  background-color: #5568d3;
}

.btn-large {
  padding: 1.2rem;
}

.order-summary {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 20px;
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
  border-bottom: 1px solid #e0e0e0;
}

.item-name {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.item-qty {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.item-price {
  font-weight: 600;
  color: #667eea;
}

.summary-divider {
  height: 1px;
  background-color: #ddd;
  margin: 1rem 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: #555;
}

.summary-row.total {
  font-size: 1.2rem;
  font-weight: 700;
  color: #667eea;
  padding-top: 1rem;
  margin-bottom: 1.5rem;
}

.trust-badges {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
  margin-top: 1rem;
}

.trust-badges p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .checkout-container {
    grid-template-columns: 1fr;
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
  }
}
</style>