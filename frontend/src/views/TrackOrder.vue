<template>
  <div class="track-page">
    <div class="track-container">
      <h1>Track Order</h1>
      <p class="intro">Enter your order details below to view the latest shipment status.</p>

      <form class="track-form" @submit.prevent="trackOrder">
        <div class="form-group">
          <label for="orderNumber">Order Number</label>
          <input id="orderNumber" v-model="orderNumber" type="text" placeholder="e.g. ORD-12345" required />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="you@example.com" required />
        </div>

        <button type="submit" class="btn-track">Track My Order</button>
      </form>

      <div v-if="statusMessage" class="status-message">
        <p>{{ statusMessage }}</p>
      </div>

      <section class="help-box">
        <h2>Need help with tracking?</h2>
        <p>If you can’t find your shipment updates, contact support with your order number and we’ll help right away.</p>
        <router-link to="/contact" class="support-link">Contact Support</router-link>
      </section>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'TrackOrder',
  setup() {
    const orderNumber = ref('')
    const email = ref('')
    const statusMessage = ref('')

    const trackOrder = () => {
      statusMessage.value = 'Tracking lookup submitted. Order tracking integration can be connected to your order API next.'
    }

    return {
      orderNumber,
      email,
      statusMessage,
      trackOrder,
    }
  },
}
</script>

<style scoped>
.track-page {
  background: var(--color-sand);
  min-height: 100%;
}

.track-container {
  max-width: 760px;
  margin: 0 auto;
  padding: 2.5rem 1rem;
}

h1 {
  margin: 0 0 0.75rem;
  color: #2B2B2B;
}

.intro {
  margin-bottom: 1.5rem;
}

.track-form {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem;
  display: grid;
  gap: 0.9rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-weight: 600;
}

input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.65rem;
}

.btn-track {
  background: #2F4F3E;
  color: var(--color-sand);
  border: none;
  border-radius: 4px;
  padding: 0.7rem 1rem;
  font-weight: 700;
}

.status-message {
  margin-top: 1rem;
  background: #fff;
  border-radius: 8px;
  padding: 0.9rem 1rem;
}

.help-box {
  margin-top: 1rem;
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
}

.help-box h2 {
  color: #2F4F3E;
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.support-link {
  font-weight: 700;
}
</style>
