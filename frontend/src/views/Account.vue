<template>
  <div class="account">
    <div class="account-container">
      <div class="sidebar">
        <div class="user-profile">
          <div class="avatar">
            <img :src="user.avatar" :alt="user.name" />
          </div>
          <h2>{{ user.name }}</h2>
          <p class="user-email">{{ user.email }}</p>
          <p class="member-since">Member since {{ formatDate(user.createdAt) }}</p>
        </div>

        <nav class="sidebar-menu">
          <button 
            v-for="item in menuItems"
            :key="item.id"
            @click="activeTab = item.id"
            class="menu-item"
            :class="{ active: activeTab === item.id }"
          >
            <span class="menu-icon">{{ item.icon }}</span>
            <span class="menu-text">{{ item.label }}</span>
          </button>
        </nav>
      </div>

      <div class="content">
        <!-- Profile Information Tab -->
        <section v-if="activeTab === 'profile'" class="tab-content">
          <h2>Profile Information</h2>
          <form @submit.prevent="updateProfile" class="form">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input 
                  id="firstName"
                  v-model="profileForm.firstName"
                  type="text"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input 
                  id="lastName"
                  v-model="profileForm.lastName"
                  type="text"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                id="email"
                v-model="profileForm.email"
                type="email"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                id="phone"
                v-model="profileForm.phone"
                type="tel"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea 
                id="bio"
                v-model="profileForm.bio"
                class="form-input"
                rows="4"
              ></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Save Changes</button>
          </form>
        </section>

        <!-- Addresses Tab -->
        <section v-if="activeTab === 'addresses'" class="tab-content">
          <div class="section-header">
            <h2>Saved Addresses</h2>
            <button @click="showAddressForm = !showAddressForm" class="btn btn-secondary">
              {{ showAddressForm ? 'Cancel' : '+ Add New Address' }}
            </button>
          </div>

          <form v-if="showAddressForm" @submit.prevent="addAddress" class="form">
            <div class="form-group">
              <label for="addressLabel">Address Label</label>
              <input 
                id="addressLabel"
                v-model="newAddress.label"
                type="text"
                placeholder="e.g., Home, Work"
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="addressStreet">Street Address</label>
                <input 
                  id="addressStreet"
                  v-model="newAddress.street"
                  type="text"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="addressCity">City</label>
                <input 
                  id="addressCity"
                  v-model="newAddress.city"
                  type="text"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="addressState">State</label>
                <input 
                  id="addressState"
                  v-model="newAddress.state"
                  type="text"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="addressZip">Zip Code</label>
                <input 
                  id="addressZip"
                  v-model="newAddress.zip"
                  type="text"
                  class="form-input"
                />
              </div>
            </div>

            <button type="submit" class="btn btn-primary">Save Address</button>
          </form>

          <div class="addresses-list">
            <div v-for="address in user.addresses" :key="address.id" class="address-card">
              <div class="address-header">
                <h4>{{ address.label }}</h4>
                <div class="address-actions">
                  <button @click="editAddress(address)" class="action-btn">Edit</button>
                  <button @click="deleteAddress(address.id)" class="action-btn delete">Delete</button>
                </div>
              </div>
              <p>{{ address.street }}</p>
              <p>{{ address.city }}, {{ address.state }} {{ address.zip }}</p>
            </div>
          </div>
        </section>

        <!-- Payment Methods Tab -->
        <section v-if="activeTab === 'payments'" class="tab-content">
          <div class="section-header">
            <h2>Payment Methods</h2>
            <button @click="showPaymentForm = !showPaymentForm" class="btn btn-secondary">
              {{ showPaymentForm ? 'Cancel' : '+ Add Payment Method' }}
            </button>
          </div>

          <form v-if="showPaymentForm" @submit.prevent="addPaymentMethod" class="form">
            <div class="form-group">
              <label for="cardholderName">Cardholder Name</label>
              <input 
                id="cardholderName"
                v-model="newPayment.name"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="cardNumber">Card Number</label>
              <input 
                id="cardNumber"
                v-model="newPayment.number"
                type="text"
                placeholder="1234 5678 9012 3456"
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="expiry">Expiration Date</label>
                <input 
                  id="expiry"
                  v-model="newPayment.expiry"
                  type="text"
                  placeholder="MM/YY"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="cvv">CVV</label>
                <input 
                  id="cvv"
                  v-model="newPayment.cvv"
                  type="text"
                  placeholder="123"
                  class="form-input"
                />
              </div>
            </div>

            <button type="submit" class="btn btn-primary">Save Card</button>
          </form>

          <div class="payments-list">
            <div v-for="payment in user.payments" :key="payment.id" class="payment-card">
              <div class="payment-header">
                <span class="card-icon">💳</span>
                <span class="card-number">**** **** **** {{ payment.lastFour }}</span>
                <div class="payment-actions">
                  <button @click="deletePayment(payment.id)" class="action-btn delete">Delete</button>
                </div>
              </div>
              <p>{{ payment.name }} | Expires {{ payment.expiry }}</p>
            </div>
          </div>
        </section>

        <!-- Order History Tab -->
        <section v-if="activeTab === 'orders'" class="tab-content">
          <h2>Order History</h2>
          <div class="orders-list">
            <div v-for="order in user.orders" :key="order.id" class="order-card">
              <div class="order-header">
                <div>
                  <p class="order-number">Order #{{ order.id }}</p>
                  <p class="order-date">{{ formatDate(order.date) }}</p>
                </div>
                <div class="order-status" :class="order.status.toLowerCase()">
                  {{ order.status }}
                </div>
              </div>
              <div class="order-items">
                <p v-for="item in order.items" :key="item.id" class="order-item">
                  {{ item.name }} (x{{ item.quantity }}) - ${{ (item.price * item.quantity).toFixed(2) }}
                </p>
              </div>
              <div class="order-footer">
                <p class="order-total">Total: <strong>${{ order.total.toFixed(2) }}</strong></p>
                <router-link :to="`/order-confirmation/${order.id}`" class="btn btn-secondary btn-small">
                  View Details
                </router-link>
              </div>
            </div>
          </div>
        </section>

        <!-- Preferences Tab -->
        <section v-if="activeTab === 'preferences'" class="tab-content">
          <h2>Preferences</h2>
          <form @submit.prevent="updatePreferences" class="form">
            <div class="preference-group">
              <label class="checkbox-option">
                <input v-model="preferences.newsletter" type="checkbox" />
                <span>Receive promotional emails</span>
              </label>
              <p class="help-text">Get updates on new products and special offers</p>
            </div>

            <div class="preference-group">
              <label class="checkbox-option">
                <input v-model="preferences.orderUpdates" type="checkbox" />
                <span>Order update notifications</span>
              </label>
              <p class="help-text">Be notified when your orders ship and arrive</p>
            </div>

            <div class="preference-group">
              <label class="checkbox-option">
                <input v-model="preferences.reviews" type="checkbox" />
                <span>Product review requests</span>
              </label>
              <p class="help-text">Get asked to review products you've purchased</p>
            </div>

            <div class="preference-group">
              <h3>Email Frequency</h3>
              <label class="radio-option">
                <input v-model="preferences.emailFrequency" type="radio" value="weekly" />
                <span>Weekly</span>
              </label>
              <label class="radio-option">
                <input v-model="preferences.emailFrequency" type="radio" value="monthly" />
                <span>Monthly</span>
              </label>
              <label class="radio-option">
                <input v-model="preferences.emailFrequency" type="radio" value="never" />
                <span>Never</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary">Save Preferences</button>
          </form>
        </section>

        <!-- Security Tab -->
        <section v-if="activeTab === 'security'" class="tab-content">
          <h2>Security</h2>
          
          <div class="security-section">
            <h3>Change Password</h3>
            <form @submit.prevent="changePassword" class="form">
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <input 
                  id="currentPassword"
                  v-model="passwordForm.current"
                  type="password"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="newPassword">New Password</label>
                <input 
                  id="newPassword"
                  v-model="passwordForm.new"
                  type="password"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input 
                  id="confirmPassword"
                  v-model="passwordForm.confirm"
                  type="password"
                  class="form-input"
                />
              </div>

              <button type="submit" class="btn btn-primary">Update Password</button>
            </form>
          </div>

          <div class="security-section">
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account</p>
            <button class="btn btn-secondary">Enable 2FA</button>
          </div>

          <div class="security-section danger-zone">
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data</p>
            <button @click="deleteAccount" class="btn btn-danger">Delete Account</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Account',
  setup() {
    const activeTab = ref('profile')
    const showAddressForm = ref(false)
    const showPaymentForm = ref(false)

    const menuItems = [
      { id: 'profile', label: 'Profile Information', icon: '👤' },
      { id: 'addresses', label: 'Addresses', icon: '📍' },
      { id: 'payments', label: 'Payment Methods', icon: '💳' },
      { id: 'orders', label: 'Order History', icon: '📦' },
      { id: 'preferences', label: 'Preferences', icon: '⚙️' },
      { id: 'security', label: 'Security', icon: '🔒' },
    ]

    const user = ref({
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://i.pravatar.cc/150?img=1',
      createdAt: new Date('2024-01-15'),
      addresses: [
        {
          id: 1,
          label: 'Home',
          street: '123 Main St',
          city: 'Denver',
          state: 'CO',
          zip: '80202',
        },
        {
          id: 2,
          label: 'Work',
          street: '456 Business Ave',
          city: 'Denver',
          state: 'CO',
          zip: '80203',
        },
      ],
      payments: [
        {
          id: 1,
          name: 'John Doe',
          lastFour: '4242',
          expiry: '12/26',
        },
      ],
      orders: [
        {
          id: 'ORD-001',
          date: new Date('2026-02-15'),
          status: 'Delivered',
          items: [
            { id: 1, name: 'Mountain Tent', quantity: 1, price: 199.99 },
          ],
          total: 219.99,
        },
        {
          id: 'ORD-002',
          date: new Date('2026-02-10'),
          status: 'Shipped',
          items: [
            { id: 2, name: 'Sleeping Bag', quantity: 2, price: 79.99 },
          ],
          total: 175.98,
        },
      ],
    })

    const profileForm = ref({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      bio: '',
    })

    const newAddress = ref({
      label: '',
      street: '',
      city: '',
      state: '',
      zip: '',
    })

    const newPayment = ref({
      name: '',
      number: '',
      expiry: '',
      cvv: '',
    })

    const passwordForm = ref({
      current: '',
      new: '',
      confirm: '',
    })

    const preferences = ref({
      newsletter: true,
      orderUpdates: true,
      reviews: false,
      emailFrequency: 'weekly',
    })

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const updateProfile = () => {
      console.log('Profile updated:', profileForm.value)
      alert('Profile updated successfully!')
    }

    const addAddress = () => {
      if (newAddress.value.label && newAddress.value.street) {
        user.value.addresses.push({
          id: Date.now(),
          ...newAddress.value,
        })
        newAddress.value = { label: '', street: '', city: '', state: '', zip: '' }
        showAddressForm.value = false
        alert('Address added successfully!')
      }
    }

    const editAddress = (address) => {
      console.log('Edit address:', address)
    }

    const deleteAddress = (addressId) => {
      if (confirm('Are you sure you want to delete this address?')) {
        user.value.addresses = user.value.addresses.filter(a => a.id !== addressId)
      }
    }

    const addPaymentMethod = () => {
      if (newPayment.value.name && newPayment.value.number) {
        user.value.payments.push({
          id: Date.now(),
          name: newPayment.value.name,
          lastFour: newPayment.value.number.slice(-4),
          expiry: newPayment.value.expiry,
        })
        newPayment.value = { name: '', number: '', expiry: '', cvv: '' }
        showPaymentForm.value = false
        alert('Payment method added successfully!')
      }
    }

    const deletePayment = (paymentId) => {
      if (confirm('Are you sure you want to delete this payment method?')) {
        user.value.payments = user.value.payments.filter(p => p.id !== paymentId)
      }
    }

    const updatePreferences = () => {
      console.log('Preferences updated:', preferences.value)
      alert('Preferences updated successfully!')
    }

    const changePassword = () => {
      if (passwordForm.value.new !== passwordForm.value.confirm) {
        alert('Passwords do not match!')
        return
      }
      console.log('Password changed')
      alert('Password changed successfully!')
      passwordForm.value = { current: '', new: '', confirm: '' }
    }

    const deleteAccount = () => {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        console.log('Account deleted')
      }
    }

    return {
      activeTab,
      showAddressForm,
      showPaymentForm,
      menuItems,
      user,
      profileForm,
      newAddress,
      newPayment,
      passwordForm,
      preferences,
      formatDate,
      updateProfile,
      addAddress,
      editAddress,
      deleteAddress,
      addPaymentMethod,
      deletePayment,
      updatePreferences,
      changePassword,
      deleteAccount,
    }
  },
}
</script>

<style scoped>
.account {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.account-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.sidebar {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.user-profile {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.avatar {
  margin-bottom: 1rem;
}

.avatar img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #667eea;
}

.user-profile h2 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1.3rem;
}

.user-email {
  color: #666;
  margin: 0.25rem 0;
  font-size: 0.95rem;
}

.member-since {
  color: #999;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  color: #333;
  transition: all 0.3s;
}

.menu-item:hover {
  background-color: #f0f0f0;
  color: #667eea;
}

.menu-item.active {
  background-color: #667eea;
  color: white;
}

.menu-icon {
  font-size: 1.2rem;
}

.menu-text {
  font-weight: 500;
  font-size: 0.95rem;
}

.content {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2rem;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  border: none;
  padding: 0;
}

.form {
  margin-bottom: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.radio-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.help-text {
  color: #999;
  font-size: 0.85rem;
  margin: -0.5rem 0 1rem 0;
}

.preference-group {
  margin-bottom: 1.5rem;
}

.preference-group h3 {
  margin: 1rem 0 0.75rem 0;
  color: #333;
}

.addresses-list,
.payments-list,
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.address-card,
.payment-card,
.order-card {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  transition: box-shadow 0.3s;
}

.address-card:hover,
.payment-card:hover,
.order-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.address-header,
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.address-header h4 {
  margin: 0;
  color: #333;
}

.address-actions,
.payment-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background-color: #e0e0e0;
}

.action-btn.delete {
  color: #ff6b6b;
}

.action-btn.delete:hover {
  background-color: #ffe0e0;
}

.address-card p,
.payment-card p {
  margin: 0.25rem 0;
  color: #666;
  font-size: 0.95rem;
}

.payment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-icon {
  font-size: 1.5rem;
}

.card-number {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.order-header {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.order-number {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.order-date {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.85rem;
}

.order-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.order-status.delivered {
  background-color: #d4edda;
  color: #155724;
}

.order-status.shipped {
  background-color: #cfe2ff;
  color: #084298;
}

.order-status.processing {
  background-color: #fff3cd;
  color: #664d03;
}

.order-status.cancelled {
  background-color: #f8d7da;
  color: #842029;
}

.order-items {
  margin: 1rem 0;
}

.order-item {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.95rem;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #e0e0e0;
}

.order-total {
  margin: 0;
  color: #333;
}

.btn {
  padding: 0.75rem 1.5rem;
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

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-danger {
  background-color: #ff6b6b;
  color: white;
}

.btn-danger:hover {
  background-color: #ee5a52;
}

.security-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.security-section:last-child {
  border-bottom: none;
}

.security-section h3 {
  margin-top: 0;
  color: #333;
}

.danger-zone {
  background-color: #fff5f5;
  padding: 1.5rem;
  border-radius: 4px;
  border-left: 4px solid #ff6b6b;
}

@media (max-width: 768px) {
  .account-container {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>