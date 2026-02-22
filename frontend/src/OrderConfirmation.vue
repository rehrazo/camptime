<template>
  <div class="order-confirmation">
    <div class="confirmation-container">
      <div class="success-header">
        <div class="success-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase</p>
      </div>

      <div v-if="order" class="confirmation-content">
        <!-- Order Number -->
        <section class="info-section">
          <h2>Order Number</h2>
          <p class="order-number">{{ order.orderId }}</p>
          <p class="order-date">Placed on {{ formatDate(order.createdAt) }}</p>
        </section>

        <!-- Shipping Information -->
        <section class="info-section">
          <h2>Shipping To</h2>
          <div class="info-box">
            <p><strong>{{ order.customer.firstName }} {{ order.customer.lastName }}</strong></p>
            <p>{{ order.shipping.address }}</p>
            <p>{{ order.shipping.city }}, {{ order.shipping.state }} {{ order.shipping.zip }}</p>
            <p>{{ order.customer.email }}</p>
            <p>{{ order.customer.phone }}</p>
          </div>
        </section>

        <!-- Shipping Method -->
        <section class="info-section">
          <h2>Shipping Method</h2>
          <div class="info-box">
            <p><strong>{{ getShippingMethodName(order.shipping.method) }}</strong></p>
            <p>Estimated delivery: {{ getEstimatedDelivery(order.shipping.method) }}</p>
          </div>
        </section>

        <!-- Order Items -->
        <section class="info-section">
          <h2>Order Items</h2>
          <div class="items-table">
            <div class="table-header">
              <div class="col-name">Product</div>
              <div class="col-price">Price</div>
              <div class="col-qty">Quantity</div>
              <div class="col-total">Total</div>
            </div>
            <div v-for="item in order.items" :key="item.id" class="table-row">
              <div class="col-name">{{ item.name }}</div>
              <div class="col-price">${{ item.price.toFixed(2) }}</div>
              <div class="col-qty">{{ item.quantity }}</div>
              <div class="col-total">${{ (item.price * item.quantity).toFixed(2) }}</div>
            </div>
          </div>
        </section>

        <!-- Order Summary -->
        <section class="info-section">
          <h2>Order Summary</h2>
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${{ order.totals.subtotal.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Shipping:</span>
              <span>${{ order.totals.shipping.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <span>${{ order.totals.tax.toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>${{ order.totals.total.toFixed(2) }}</span>
            </div>
          </div>
        </section>

        <!-- What's Next -->
        <section class="info-section">
          <h2>What's Next?</h2>
          <div class="next-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Confirmation Email</h3>
                <p>We've sent a confirmation email to {{ order.customer.email }}</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Order Processing</h3>
                <p>Your order is being prepared for shipment</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Shipment Notification</h3>
                <p>You'll receive a tracking number once your order ships</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="actions">
          <router-link to="/products" class="btn btn-primary">Continue Shopping</router-link>
          <router-link to="/" class="btn btn-secondary">Return to Home</router-link>
        </div>
      </div>

      <div v-else class="loading">
        <p>Loading order details...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'OrderConfirmation',
  setup() {
    const route = useRoute()
    const order = ref(null)

    onMounted(async () => {
      try {
        const response = await fetch(`/api/orders/${route.params.orderId}`)
        const data = await response.json()
        order.value = data
      } catch (error) {
        console.error('Error fetching order:', error)
      }
    })

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const getShippingMethodName = (method) => {
      const names = {
        standard: 'Standard Shipping (5-7 days)',
        express: 'Express Shipping (2-3 days)',
        overnight: 'Overnight Shipping',
      }
      return names[method] || 'Standard Shipping'
    }

    const getEstimatedDelivery = (method) => {
      const today = new Date()
      let deliveryDate = new Date(today)

      switch (method) {
        case 'standard':
          deliveryDate.setDate(today.getDate() + 7)
          break
        case 'express':
          deliveryDate.setDate(today.getDate() + 3)
          break
        case 'overnight':
          deliveryDate.setDate(today.getDate() + 1)
          break
      }

      return deliveryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }

    return {
      order,
      formatDate,
      getShippingMethodName,
      getEstimatedDelivery,
    }
  },
}
</script>

<style scoped>
.order-confirmation {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.confirmation-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
}

.success-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.success-header p {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

.confirmation-content {
  margin-top: 2rem;
}

.info-section {
  margin-bottom: 2.5rem;
}

.info-section h2 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.order-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin: 0.5rem 0;
  font-family: 'Courier New', monospace;
}

.order-date {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

.info-box {
  background-color: #f9f9f9;
  border-left: 4px solid #667eea;
  padding: 1.5rem;
  border-radius: 4px;
}

.info-box p {
  margin: 0.5rem 0;
  color: #555;
  line-height: 1.6;
}

.info-box strong {
  color: #333;
}

.items-table {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  background-color: #f5f5f5;
  padding: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.col-price,
.col-qty,
.col-total {
  text-align: right;
}

.summary-box {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1.5rem;
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
  font-size: 1.2rem;
  font-weight: 700;
  color: #667eea;
  padding-top: 1rem;
}

.next-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.step {
  display: flex;
  gap: 1rem;
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 4px;
  border-left: 4px solid #667eea;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.step-content p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
}

.btn {
  flex: 1;
  padding: 1rem;
  border-radius: 4px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .confirmation-container {
    padding: 1rem;
  }

  .success-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .success-header h1 {
    font-size: 1.8rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1.5fr 1fr 1fr;
  }

  .col-qty {
    display: none;
  }

  .actions {
    flex-direction: column;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>