<template>
  <div class="tax-management">
    <!-- Header -->
    <div class="management-header">
      <h1>Tax Management</h1>
      <button @click="showNewTax = true" class="btn btn-primary">
        + Add Tax Group
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

    <!-- Tax Groups Section -->
    <section v-if="activeTab === 'Tax Groups'" class="tax-groups-section">
      <div class="section-header">
        <h2>Tax Groups</h2>
        <div class="header-controls">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search tax groups..."
            class="search-input"
          />
          <select v-model="countryFilter" class="filter-select">
            <option value="">All Countries</option>
            <option value="us">United States</option>
            <option value="ca">Canada</option>
            <option value="uk">United Kingdom</option>
            <option value="eu">European Union</option>
          </select>
        </div>
      </div>

      <div class="tax-groups-grid">
        <div v-for="group in filteredTaxGroups" :key="group.id" class="tax-group-card">
          <div class="group-header">
            <h3>{{ group.name }}</h3>
            <span class="group-type-badge" :class="`type-${group.type}`">
              {{ group.type }}
            </span>
          </div>

          <div class="group-details">
            <p><strong>Country/Region:</strong> {{ group.region }}</p>
            <p><strong>Rate:</strong> {{ group.rate }}%</p>
            <p v-if="group.description" class="description">{{ group.description }}</p>
          </div>

          <div class="group-rules">
            <h4>Applied To:</h4>
            <div class="rule-badges">
              <span v-for="rule in group.appliedTo" :key="rule" class="rule-badge">
                {{ rule }}
              </span>
            </div>
          </div>

          <div class="group-stats">
            <span>📦 {{ group.productsCount }} products</span>
            <span>💰 {{ group.revenue | formatCurrency }}</span>
          </div>

          <div class="group-actions">
            <button @click="editTaxGroup(group)" class="btn btn-secondary btn-small">Edit</button>
            <button @click="toggleTaxStatus(group)" class="btn btn-secondary btn-small">
              {{ group.active ? 'Disable' : 'Enable' }}
            </button>
            <button @click="deleteTaxGroup(group.id)" class="btn btn-danger btn-small">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Tax Rates Section -->
    <section v-if="activeTab === 'Tax Rates'" class="tax-rates-section">
      <h2>View & Configure Tax Rates</h2>
      
      <div class="tax-rates-table-container">
        <table class="tax-rates-table">
          <thead>
            <tr>
              <th>Region/State</th>
              <th>Country</th>
              <th>Tax Rate (%)</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rate in allTaxRates" :key="rate.id">
              <td>{{ rate.region }}</td>
              <td>{{ rate.country }}</td>
              <td class="rate-value">
                <input 
                  v-model.number="rate.rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="rate-input"
                  @change="updateTaxRate(rate)"
                />
              </td>
              <td>{{ rate.type }}</td>
              <td>
                <span class="status-badge" :class="rate.active ? 'active' : 'inactive'">
                  {{ rate.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="action-buttons">
                <button @click="editTaxRate(rate)" class="btn-edit">✎</button>
                <button @click="deleteTaxRate(rate.id)" class="btn-delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tax Rules Section -->
    <section v-if="activeTab === 'Tax Rules'" class="tax-rules-section">
      <h2>Tax Calculation Rules</h2>
      
      <div class="rules-list">
        <div v-for="rule in taxRules" :key="rule.id" class="rule-card">
          <div class="rule-header">
            <h3>{{ rule.name }}</h3>
            <span class="rule-priority">Priority: {{ rule.priority }}</span>
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
            <button @click="editTaxRule(rule)" class="btn btn-secondary btn-small">Edit</button>
            <button @click="toggleRuleStatus(rule)" class="btn btn-secondary btn-small">
              {{ rule.active ? 'Disable' : 'Enable' }}
            </button>
            <button @click="deleteTaxRule(rule.id)" class="btn btn-danger btn-small">Delete</button>
          </div>
        </div>
      </div>

      <button @click="showNewRule = true" class="btn btn-primary">+ Add Tax Rule</button>
    </section>

    <!-- Tax Settings Section -->
    <section v-if="activeTab === 'Settings'" class="tax-settings-section">
      <h2>Tax Settings</h2>

      <div class="settings-form">
        <div class="settings-group">
          <h3>Display Settings</h3>
          
          <label class="checkbox-option">
            <input v-model="settings.displayTaxInPrice" type="checkbox" />
            <span>Display tax included in product prices</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.showTaxBreakdown" type="checkbox" />
            <span>Show tax breakdown at checkout</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.calculateTaxOnShipping" type="checkbox" />
            <span>Calculate tax on shipping charges</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.enableTaxRounding" type="checkbox" />
            <span>Round tax amounts</span>
          </label>
        </div>

        <div class="settings-group">
          <h3>Tax Exemptions</h3>

          <label class="checkbox-option">
            <input v-model="settings.exemptDigitalProducts" type="checkbox" />
            <span>Exempt digital/downloadable products</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.exemptGiftCards" type="checkbox" />
            <span>Exempt gift cards</span>
          </label>

          <div class="form-group">
            <label>Tax Exempt Organizations (comma-separated)</label>
            <textarea 
              v-model="settings.exemptOrganizations"
              class="form-input"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="settings-group">
          <h3>Reporting</h3>

          <label class="checkbox-option">
            <input v-model="settings.trackTaxByCountry" type="checkbox" />
            <span>Track tax collection by country</span>
          </label>

          <label class="checkbox-option">
            <input v-model="settings.trackTaxByState" type="checkbox" />
            <span>Track tax collection by state/province</span>
          </label>

          <div class="form-group">
            <label>Default Tax Calculation Method</label>
            <select v-model="settings.calculationMethod" class="form-input">
              <option value="inclusive">Tax Inclusive (included in price)</option>
              <option value="exclusive">Tax Exclusive (added to price)</option>
              <option value="hybrid">Hybrid (varies by region)</option>
            </select>
          </div>
        </div>

        <button @click="saveTaxSettings" class="btn btn-primary">Save Settings</button>
      </div>
    </section>

    <!-- Tax Group Editor Modal -->
    <div v-if="showTaxEditor" class="modal-overlay" @click.self="showTaxEditor = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingTaxGroup ? 'Edit Tax Group' : 'New Tax Group' }}</h2>
          <button @click="showTaxEditor = false" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveTaxGroup" class="tax-form">
          <div class="form-group">
            <label>Group Name</label>
            <input 
              v-model="editingTaxGroup.name"
              type="text"
              placeholder="e.g., US Sales Tax"
              class="form-input"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Country/Region</label>
              <select v-model="editingTaxGroup.region" class="form-input" required>
                <option value="">Select Region</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="EU">European Union</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <div class="form-group">
              <label>Tax Rate (%)</label>
              <input 
                v-model.number="editingTaxGroup.rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>Tax Type</label>
            <select v-model="editingTaxGroup.type" class="form-input" required>
              <option value="sales-tax">Sales Tax</option>
              <option value="vat">VAT (Value Added Tax)</option>
              <option value="gst">GST (Goods & Services Tax)</option>
              <option value="hst">HST (Harmonized Sales Tax)</option>
              <option value="pst">PST (Provincial Sales Tax)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="editingTaxGroup.description"
              class="form-input"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Apply To (select products/categories):</label>
            <div class="checkbox-list">
              <label v-for="option in applyToOptions" :key="option" class="checkbox-option">
                <input 
                  v-model="editingTaxGroup.appliedTo"
                  type="checkbox"
                  :value="option"
                />
                <span>{{ option }}</span>
              </label>
            </div>
          </div>

          <label class="checkbox-option">
            <input v-model="editingTaxGroup.active" type="checkbox" />
            <span>Active</span>
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingTaxGroup?.id ? 'Update Tax Group' : 'Create Tax Group' }}
            </button>
            <button type="button" @click="showTaxEditor = false" class="btn btn-secondary">
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
  name: 'TaxManagement',
  setup() {
    const activeTab = ref('Tax Groups')
    const searchQuery = ref('')
    const countryFilter = ref('')
    const showTaxEditor = ref(false)
    const showNewRule = ref(false)
    const editingTaxGroup = ref(null)

    const tabs = ['Tax Groups', 'Tax Rates', 'Tax Rules', 'Settings']

    const applyToOptions = [
      'All Products',
      'Physical Products Only',
      'Digital Products Only',
      'Specific Categories',
      'Specific Regions',
    ]

    const taxGroups = ref([
      {
        id: 1,
        name: 'US Sales Tax',
        type: 'sales-tax',
        region: 'United States',
        rate: 7.5,
        description: 'Standard sales tax applied to most products',
        appliedTo: ['All Products', 'Specific Regions'],
        productsCount: 145,
        revenue: 25430.50,
        active: true,
      },
      {
        id: 2,
        name: 'Canada GST',
        type: 'gst',
        region: 'Canada',
        rate: 5,
        description: 'Goods and Services Tax',
        appliedTo: ['All Products'],
        productsCount: 42,
        revenue: 8920.75,
        active: true,
      },
      {
        id: 3,
        name: 'EU VAT',
        type: 'vat',
        region: 'European Union',
        rate: 20,
        description: 'VAT for EU countries',
        appliedTo: ['All Products', 'Physical Products Only'],
        productsCount: 98,
        revenue: 15670.25,
        active: true,
      },
      {
        id: 4,
        name: 'UK VAT',
        type: 'vat',
        region: 'United Kingdom',
        rate: 20,
        description: 'UK Value Added Tax',
        appliedTo: ['All Products'],
        productsCount: 67,
        revenue: 12340.00,
        active: true,
      },
    ])

    const allTaxRates = ref([
      { id: 1, region: 'California', country: 'US', rate: 8.625, type: 'State', active: true },
      { id: 2, region: 'New York', country: 'US', rate: 8.875, type: 'State', active: true },
      { id: 3, region: 'Texas', country: 'US', rate: 8.25, type: 'State', active: true },
      { id: 4, region: 'Ontario', country: 'CA', rate: 13, type: 'Provincial', active: true },
      { id: 5, region: 'Quebec', country: 'CA', rate: 14.975, type: 'Provincial', active: true },
    ])

    const taxRules = ref([
      {
        id: 1,
        name: 'Digital Products Exemption',
        description: 'No tax applied to digital/downloadable products',
        priority: 1,
        conditions: [
          'Product type is Digital',
          'Not subject to sales tax',
        ],
        active: true,
      },
      {
        id: 2,
        name: 'Wholesale Tax Exemption',
        description: 'Tax exemption for wholesale/bulk orders',
        priority: 2,
        conditions: [
          'Order quantity > 100 units',
          'Customer type is Wholesale',
        ],
        active: true,
      },
      {
        id: 3,
        name: 'Regional Tax Override',
        description: 'Apply different tax rate based on customer address',
        priority: 3,
        conditions: [
          'Shipping address is in tax zone',
          'Override standard rates',
        ],
        active: false,
      },
    ])

    const settings = ref({
      displayTaxInPrice: false,
      showTaxBreakdown: true,
      calculateTaxOnShipping: true,
      enableTaxRounding: true,
      exemptDigitalProducts: true,
      exemptGiftCards: true,
      exemptOrganizations: 'American Red Cross\nSalvation Army',
      trackTaxByCountry: true,
      trackTaxByState: true,
      calculationMethod: 'exclusive',
    })

    const filteredTaxGroups = computed(() => {
      return taxGroups.value.filter(group => {
        const matchesSearch = !searchQuery.value ||
          group.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          group.region.toLowerCase().includes(searchQuery.value.toLowerCase())

        const matchesCountry = !countryFilter.value ||
          group.region.toLowerCase().includes(countryFilter.value.toLowerCase())

        return matchesSearch && matchesCountry
      })
    })

    const editTaxGroup = (group) => {
      editingTaxGroup.value = { ...group, appliedTo: [...group.appliedTo] }
      showTaxEditor.value = true
    }

    const saveTaxGroup = () => {
      if (editingTaxGroup.value.id) {
        const index = taxGroups.value.findIndex(g => g.id === editingTaxGroup.value.id)
        taxGroups.value[index] = editingTaxGroup.value
      } else {
        editingTaxGroup.value.id = Math.max(...taxGroups.value.map(g => g.id)) + 1
        editingTaxGroup.value.productsCount = 0
        editingTaxGroup.value.revenue = 0
        taxGroups.value.push(editingTaxGroup.value)
      }
      showTaxEditor.value = false
      editingTaxGroup.value = null
      alert('Tax group saved successfully!')
    }

    const toggleTaxStatus = (group) => {
      group.active = !group.active
    }

    const deleteTaxGroup = (id) => {
      if (confirm('Are you sure you want to delete this tax group?')) {
        taxGroups.value = taxGroups.value.filter(g => g.id !== id)
      }
    }

    const updateTaxRate = (rate) => {
      console.log('Tax rate updated:', rate)
    }

    const editTaxRate = (rate) => {
      console.log('Edit tax rate:', rate)
    }

    const deleteTaxRate = (id) => {
      if (confirm('Are you sure you want to delete this tax rate?')) {
        allTaxRates.value = allTaxRates.value.filter(r => r.id !== id)
      }
    }

    const editTaxRule = (rule) => {
      console.log('Edit tax rule:', rule)
    }

    const toggleRuleStatus = (rule) => {
      rule.active = !rule.active
    }

    const deleteTaxRule = (id) => {
      if (confirm('Are you sure you want to delete this tax rule?')) {
        taxRules.value = taxRules.value.filter(r => r.id !== id)
      }
    }

    const saveTaxSettings = () => {
      console.log('Tax settings saved:', settings.value)
      alert('Tax settings saved successfully!')
    }

    return {
      activeTab,
      searchQuery,
      countryFilter,
      showTaxEditor,
      showNewRule,
      editingTaxGroup,
      tabs,
      applyToOptions,
      taxGroups,
      allTaxRates,
      taxRules,
      settings,
      filteredTaxGroups,
      editTaxGroup,
      saveTaxGroup,
      toggleTaxStatus,
      deleteTaxGroup,
      updateTaxRate,
      editTaxRate,
      deleteTaxRate,
      editTaxRule,
      toggleRuleStatus,
      deleteTaxRule,
      saveTaxSettings,
    }
  },
}
</script>

<style scoped>
.tax-management {
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

/* Tax Groups Section */
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

.header-controls {
  display: flex;
  gap: 1rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  min-width: 200px;
}

.tax-groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.tax-group-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.tax-group-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tax-group-card h3 {
  margin: 0;
  color: #333;
}

.group-type-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.type-sales-tax {
  background-color: #667eea;
}

.type-vat {
  background-color: #27ae60;
}

.type-gst {
  background-color: #f39c12;
}

.type-hst {
  background-color: #e74c3c;
}

.type-pst {
  background-color: #9b59b6;
}

.group-details {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.group-details p {
  margin: 0.5rem 0;
  color: #555;
  font-size: 0.95rem;
}

.description {
  color: #666;
  font-style: italic;
}

.group-rules {
  margin-bottom: 1rem;
}

.group-rules h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
}

.rule-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rule-badge {
  background-color: #e8f0ff;
  color: #667eea;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
}

.group-stats {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #999;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

/* Tax Rates Section */
.tax-rates-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tax-rates-table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f5f5f5;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #555;
}

tr:hover {
  background-color: #f9f9f9;
}

.rate-value {
  width: 120px;
}

.rate-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-edit:hover {
  background-color: #e8f0ff;
  color: #667eea;
}

.btn-delete:hover {
  background-color: #f8d7da;
  color: #842029;
}

/* Tax Rules Section */
.rules-list {
  margin-bottom: 2rem;
}

.rule-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s;
}

.rule-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rule-card h3 {
  margin: 0;
  color: #333;
}

.rule-priority {
  background-color: #f5f5f5;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #999;
}

.rule-description {
  color: #666;
  margin: 0 0 1rem 0;
}

.rule-conditions {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.rule-conditions h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.rule-conditions ul {
  margin: 0;
  padding-left: 1.5rem;
}

.rule-conditions li {
  color: #555;
  font-size: 0.95rem;
  margin: 0.25rem 0;
}

.rule-actions {
  display: flex;
  gap: 0.5rem;
}

/* Settings Section */
.tax-settings-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-form {
  max-width: 800px;
}

.settings-group {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.settings-group:last-child {
  border-bottom: none;
}

.settings-group h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 0.75rem;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.tax-form {
  padding: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
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

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .tax-groups-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-controls {
    width: 100%;
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .checkbox-list {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem;
  }
}
</style>