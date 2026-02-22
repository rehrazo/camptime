<template>
  <div class="shipping-management">
    <!-- Header -->
    <div class="management-header">
      <h1>Shipping Management</h1>
      <button @click="showNewShipping = true" class="btn btn-primary">
        + Add Shipping Group
      </button>
    </div>

    <!-- Tabs -->
    <div class="management-tabs">
      <button 
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Shipping Groups Section -->
    <section v-if="activeTab === 'Shipping Groups'" class="shipping-groups-section">
      <div class="section-header">
        <h2>Shipping Groups</h2>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search shipping groups..."
          class="search-input"
        />
      </div>

      <div class="shipping-groups-grid">
        <div v-for="group in filteredShippingGroups" :key="group.id" class="shipping-card">
          <div class="card-header">
            <h3>{{ group.name }}</h3>
            <span class="status-badge" :class="group.active ? 'active' : 'inactive'">
              {{ group.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="card-details">
            <p><strong>Regions:</strong> {{ group.regions.join(', ') }}</p>
            <p><strong>Base Rate:</strong> ${{ group.baseRate.toFixed(2) }}</p>
            <p v-if="group.freeShippingThreshold" class="free-shipping">
              Free shipping on orders over ${{ group.freeShippingThreshold.toFixed(2) }}
            </p>
          </div>

          <div class="shipping-methods">
            <h4>Methods:</h4>
            <div class="method-list">
              <span v-for="method in group.methods" :key="method" class="method-badge">
                {{ method }}
              </span>
            </div>
          </div>

          <div class="card-stats">
            <span>📦 {{ group.ordersCount }} orders</span>
            <span>💰 ${{ group.revenue.toFixed(2) }}</span>
          </div>

          <div class="card-actions">
            <button @click="editShippingGroup(group)" class="btn btn-secondary btn-small">Edit</button>
            <button @click="toggleShippingStatus(group)" class="btn btn-secondary btn-small">
              {{ group.active ? 'Disable' : 'Enable' }}
            </button>
            <button @click="deleteShippingGroup(group.id)" class="btn btn-danger btn-small">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Shipping Rates Section -->
    <section v-if="activeTab === 'Shipping Rates'" class="shipping-rates-section">
      <h2>Configure Shipping Rates</h2>

      <div class="rates-controls">
        <select v-model="selectedGroup" class="filter-select">
          <option value="">Select Shipping Group</option>
          <option v-for="group in shippingGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>

      <div class="rates-table-container">
        <table class="rates-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Min Weight</th>
              <th>Max Weight</th>
              <th>Cost</th>
              <th>Estimated Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rate in displayedRates" :key="rate.id">
              <td class="method-name">{{ rate.method }}</td>
              <td>{{ rate.minWeight }} lbs</td>
              <td>{{ rate.maxWeight || 'Unlimited' }} lbs</td>
              <td class="cost-value">${{ rate.cost.toFixed(2) }}</td>
              <td>{{ rate.estimatedDays }}</td>
              <td>
                <span class="status-badge" :class="rate.active ? 'active' : 'inactive'">
                  {{ rate.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editRate(rate)" class="btn-small">✎</button>
                <button @click="deleteRate(rate.id)" class="btn-small delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button @click="showNewRate = true" class="btn btn-primary">+ Add Shipping Rate</button>
    </section>

    <!-- Shipping Rules Section -->
    <section v-if="activeTab === 'Shipping Rules'" class="shipping-rules-section">
      <h2>Shipping Rules & Restrictions</h2>

      <div class="rules-list">
        <div v-for="rule in shippingRules" :key="rule.id" class="rule-card">
          <div class="rule-header">
            <h3>{{ rule.name }}</h3>
            <span class="priority-badge">Priority: {{ rule.priority }}</span>
          </div>

          <p class="rule-description">{{ rule.description }}</p>

          <div class="rule-conditions">
            <h4>Conditions:</h4>
            <ul>
              <li v-for="condition in rule.conditions" :key="condition">
                {{ condition }}
              </li>
            </ul>
          </div>

          <div class="rule-actions">
            <button @click="editRule(rule)" class="btn btn-secondary btn-small">Edit</button>
            <button @click="toggleRuleStatus(rule)" class="btn btn-secondary btn-small">
              {{ rule.active ? 'Disable' : 'Enable' }}
            </button>
            <button @click="deleteRule(rule.id)" class="btn btn-danger btn-small">Delete</button>
          </div>
        </div>
      </div>

      <button @click="showNewRule = true" class="btn btn-primary">+ Add Shipping Rule</button>
    </section>

    <!-- Shipping Settings Section -->
    <section v-if="activeTab === 'Settings'" class="shipping-settings-section">
      <h2>Shipping Settings</h2>

      <div class="settings-form">
        <div class="settings-group">
          <h3>General Settings</h3>

          <div class="form-group">
            <label>Default Shipping Method</label>
            <select v-model="settings.defaultMethod" class="form-input">
              <option value="standard">Standard Shipping</option>
              <option value="express">Express Shipping</option>
              <option value="overnight">Overnight Shipping</option>
            </select>
          </div>

          <label class="checkbox-option">
            <input v-model="settings.calculateByWeight" type="checkbox" />
            <span>Calculate shipping cost by weight</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.calculateByZone" type="checkbox" />
            <span>Calculate shipping cost by zone</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.roundShippingCost" type="checkbox" />
            <span>Round shipping cost to nearest dollar</span>
          </label>
        </div>

        <div class="settings-group">
          <h3>Shipping Restrictions</h3>

          <label class="checkbox-option">
            <input v-model="settings.restrictFreeShippingDigital" type="checkbox" />
            <span>Restrict free shipping on digital products</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.restrictOversizedItems" type="checkbox" />
            <span>Restrict shipping for oversized items</span>
          </label>

          <div class="form-group">
            <label>Maximum Package Weight (lbs)</label>
            <input 
              v-model.number="settings.maxPackageWeight"
              type="number"
              min="0"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Prohibited Countries (comma-separated)</label>
            <textarea 
              v-model="settings.prohibitedCountries"
              class="form-input"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="settings-group">
          <h3>Processing & Delivery</h3>

          <div class="form-group">
            <label>Processing Time (days)</label>
            <input 
              v-model.number="settings.processingTime"
              type="number"
              min="0"
              class="form-input"
            />
          </div>

          <label class="checkbox-option">
            <input v-model="settings.excludeWeekendsFromDelivery" type="checkbox" />
            <span>Exclude weekends from delivery estimates</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.excludeHolidaysFromDelivery" type="checkbox" />
            <span>Exclude holidays from delivery estimates</span>
          </label>
        </div>

        <div class="settings-group">
          <h3>Carrier Integration</h3>

          <label class="checkbox-option">
            <input v-model="settings.enableRealTimeRates" type="checkbox" />
            <span>Enable real-time carrier rates (FedEx, UPS, USPS)</span>
          </label>

          <div v-if="settings.enableRealTimeRates" class="carrier-settings">
            <div class="form-group">
              <label>FedEx API Key</label>
              <input type="password" placeholder="Enter your FedEx API key" class="form-input" />
            </div>

            <div class="form-group">
              <label>UPS API Key</label>
              <input type="password" placeholder="Enter your UPS API key" class="form-input" />
            </div>

            <div class="form-group">
              <label>USPS API Key</label>
              <input type="password" placeholder="Enter your USPS API key" class="form-input" />
            </div>
          </div>
        </div>

        <button @click="saveShippingSettings" class="btn btn-primary">Save Settings</button>
      </div>
    </section>

    <!-- Shipping Group Editor Modal -->
    <div v-if="showShippingEditor" class="modal-overlay" @click.self="showShippingEditor = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingShippingGroup ? 'Edit Shipping Group' : 'New Shipping Group' }}</h2>
          <button @click="showShippingEditor = false" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveShippingGroup" class="shipping-form">
          <div class="form-group">
            <label>Group Name</label>
            <input 
              v-model="editingShippingGroup.name"
              type="text"
              placeholder="e.g., Domestic Shipping"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Regions</label>
            <div class="checkbox-list">
              <label v-for="region in regions" :key="region" class="checkbox-option">
                <input 
                  v-model="editingShippingGroup.regions"
                  type="checkbox"
                  :value="region"
                />
                <span>{{ region }}</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Base Rate ($)</label>
              <input 
                v-model.number="editingShippingGroup.baseRate"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label>Free Shipping Over ($)</label>
              <input 
                v-model.number="editingShippingGroup.freeShippingThreshold"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Shipping Methods</label>
            <div class="checkbox-list">
              <label v-for="method in shippingMethods" :key="method" class="checkbox-option">
                <input 
                  v-model="editingShippingGroup.methods"
                  type="checkbox"
                  :value="method"
                />
                <span>{{ method }}</span>
              </label>
            </div>
          </div>

          <label class="checkbox-option">
            <input v-model="editingShippingGroup.active" type="checkbox" />
            <span>Active</span>
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingShippingGroup?.id ? 'Update Shipping Group' : 'Create Shipping Group' }}
            </button>
            <button type="button" @click="showShippingEditor = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ShippingManagement',
  setup() {
    const activeTab = ref('Shipping Groups')
    const searchQuery = ref('')
    const selectedGroup = ref('')
    const showShippingEditor = ref(false)
    const showNewRate = ref(false)
    const showNewRule = ref(false)
    const editingShippingGroup = ref(null)

    const tabs = ['Shipping Groups', 'Shipping Rates', 'Shipping Rules', 'Settings']

    const regions = [
      'Domestic (US)',
      'Canada',
      'Mexico',
      'Europe',
      'Asia',
      'Australia',
      'International',
    ]

    const shippingMethods = [
      'Standard Shipping',
      'Express Shipping',
      'Overnight Shipping',
      'Ground',
      'Flat Rate',
    ]

    const shippingGroups = ref([
      {
        id: 1,
        name: 'Domestic Shipping',
        regions: ['Domestic (US)'],
        baseRate: 9.99,
        freeShippingThreshold: 50,
        methods: ['Standard Shipping', 'Express Shipping', 'Overnight Shipping'],
        ordersCount: 1523,
        revenue: 45670.23,
        active: true,
      },
      {
        id: 2,
        name: 'International Shipping',
        regions: ['Canada', 'Mexico', 'Europe', 'Asia', 'Australia'],
        baseRate: 24.99,
        freeShippingThreshold: 150,
        methods: ['Standard Shipping', 'Express Shipping'],
        ordersCount: 342,
        revenue: 12450.50,
        active: true,
      },
      {
        id: 3,
        name: 'Canada Only',
        regions: ['Canada'],
        baseRate: 14.99,
        freeShippingThreshold: 75,
        methods: ['Standard Shipping', 'Express Shipping'],
        ordersCount: 267,
        revenue: 8920.75,
        active: true,
      },
    ])

    const shippingRates = ref([
      {
        id: 1,
        method: 'Standard Shipping',
        minWeight: 0,
        maxWeight: 5,
        cost: 5.99,
        estimatedDays: '5-7',
        active: true,
      },
      {
        id: 2,
        method: 'Standard Shipping',
        minWeight: 5,
        maxWeight: 10,
        cost: 8.99,
        estimatedDays: '5-7',
        active: true,
      },
      {
        id: 3,
        method: 'Express Shipping',
        minWeight: 0,
        maxWeight: 5,
        cost: 14.99,
        estimatedDays: '2-3',
        active: true,
      },
      {
        id: 4,
        method: 'Overnight Shipping',
        minWeight: 0,
        maxWeight: 5,
        cost: 34.99,
        estimatedDays: '1',
        active: true,
      },
    ])

    const shippingRules = ref([
      {
        id: 1,
        name: 'Free Shipping on Orders Over $50',
        description: 'Apply free standard shipping to orders exceeding $50',
        priority: 1,
        conditions: [
          'Order subtotal >= $50',
          'Standard shipping method selected',
        ],
        active: true,
      },
      {
        id: 2,
        name: 'Restrict Overnight to Domestic',
        description: 'Overnight shipping only available for domestic orders',
        priority: 2,
        conditions: [
          'Shipping destination is US',
          'Order placed before 2 PM EST',
        ],
        active: true,
      },
      {
        id: 3,
        name: 'Additional Charge for Oversized Items',
        description: 'Add handling fee for items over 50 lbs',
        priority: 3,
        conditions: [
          'Item weight > 50 lbs',
          'Add $15 handling fee',
        ],
        active: false,
      },
    ])

    const settings = ref({
      defaultMethod: 'standard',
      calculateByWeight: true,
      calculateByZone: false,
      roundShippingCost: true,
      restrictFreeShippingDigital: true,
      restrictOversizedItems: true,
      maxPackageWeight: 150,
      prohibitedCountries: 'North Korea\nIran\nSyria',
      processingTime: 1,
      excludeWeekendsFromDelivery: true,
      excludeHolidaysFromDelivery: true,
      enableRealTimeRates: false,
    })

    const filteredShippingGroups = computed(() => {
      return shippingGroups.value.filter(group => {
        const matchesSearch = !searchQuery.value ||
          group.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          group.regions.some(r => r.toLowerCase().includes(searchQuery.value.toLowerCase()))

        return matchesSearch
      })
    })

    const displayedRates = computed(() => {
      if (!selectedGroup.value) return shippingRates.value
      return shippingRates.value
    })

    const editShippingGroup = (group) => {
      editingShippingGroup.value = { 
        ...group, 
        regions: [...group.regions],
        methods: [...group.methods],
      }
      showShippingEditor.value = true
    }

    const saveShippingGroup = () => {
      if (editingShippingGroup.value.id) {
        const index = shippingGroups.value.findIndex(g => g.id === editingShippingGroup.value.id)
        shippingGroups.value[index] = editingShippingGroup.value
      } else {
        editingShippingGroup.value.id = Math.max(...shippingGroups.value.map(g => g.id)) + 1
        editingShippingGroup.value.ordersCount = 0
        editingShippingGroup.value.revenue = 0
        shippingGroups.value.push(editingShippingGroup.value)
      }
      showShippingEditor.value = false
      editingShippingGroup.value = null
      alert('Shipping group saved successfully!')
    }

    const toggleShippingStatus = (group) => {
      group.active = !group.active
    }

    const deleteShippingGroup = (id) => {
      if (confirm('Are you sure you want to delete this shipping group?')) {
        shippingGroups.value = shippingGroups.value.filter(g => g.id !== id)
      }
    }

    const editRate = (rate) => {
      console.log('Edit rate:', rate)
    }

    const deleteRate = (id) => {
      if (confirm('Are you sure you want to delete this rate?')) {
        shippingRates.value = shippingRates.value.filter(r => r.id !== id)
      }
    }

    const editRule = (rule) => {
      console.log('Edit rule:', rule)
    }

    const toggleRuleStatus = (rule) => {
      rule.active = !rule.active
    }

    const deleteRule = (id) => {
      if (confirm('Are you sure you want to delete this rule?')) {
        shippingRules.value = shippingRules.value.filter(r => r.id !== id)
      }
    }

    const saveShippingSettings = () => {
      console.log('Shipping settings saved:', settings.value)
      alert('Shipping settings saved successfully!')
    }

    return {
      activeTab,
      searchQuery,
      selectedGroup,
      showShippingEditor,
      showNewRate,
      showNewRule,
      editingShippingGroup,
      tabs,
      regions,
      shippingMethods,
      shippingGroups,
      shippingRates,
      shippingRules,
      settings,
      filteredShippingGroups,
      displayedRates,
      editShippingGroup,
      saveShippingGroup,
      toggleShippingStatus,
      deleteShippingGroup,
      editRate,
      deleteRate,
      editRule,
      toggleRuleStatus,
      deleteRule,
      saveShippingSettings,
    }
  },
}
</script>

<style scoped>
.shipping-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.management-header h1 {
  margin: 0;
  color: #333;
}

.management-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

/* Shipping Groups Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: #333;
}

.search-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

.shipping-groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.shipping-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.shipping-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.shipping-card h3 {
  margin: 0;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #842029;
}

.card-details {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.card-details p {
  margin: 0.5rem 0;
  color: #555;
  font-size: 0.95rem;
}

.free-shipping {
  color: #27ae60;
  font-weight: 600;
}

.shipping-methods {
  margin-bottom: 1rem;
}

.shipping-methods h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
}

.method-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.method-badge {
  background-color: #e8f0ff;
  color: #667eea;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
}

.card-stats {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  font-size: 0.85rem