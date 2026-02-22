<template>
  <div class="product-management">
    <!-- Header -->
    <div class="management-header">
      <h1>Product Management</h1>
      <button @click="showProductEditor = true" class="btn btn-primary">
        + Add Product
      </button>
    </div>

    <!-- Filters -->
    <div class="product-filters">
      <input 
        v-model="searchQuery"
        type="text"
        placeholder="Search products..."
        class="search-input"
      />

      <select v-model="categoryFilter" class="filter-select">
        <option value="">All Categories</option>
        <option value="tents">Tents</option>
        <option value="sleeping">Sleeping Bags</option>
        <option value="backpacks">Backpacks</option>
        <option value="cooking">Cooking Gear</option>
      </select>

      <select v-model="taxGroupFilter" class="filter-select">
        <option value="">All Tax Groups</option>
        <option v-for="group in taxGroups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>

      <select v-model="shippingGroupFilter" class="filter-select">
        <option value="">All Shipping Groups</option>
        <option v-for="group in shippingGroups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
    </div>

    <!-- Products Table -->
    <div class="products-table-container">
      <table class="products-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Tax Group</th>
            <th>Tax Rate</th>
            <th>Shipping Group</th>
            <th>Base Shipping</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id" class="product-row">
            <td class="product-name">
              <img :src="product.image" :alt="product.name" class="product-thumb" />
              {{ product.name }}
            </td>
            <td>{{ product.category }}</td>
            <td class="price">${{ product.price.toFixed(2) }}</td>
            <td class="tax-group">
              <select 
                :value="product.taxGroupId"
                @change="updateProductTaxGroup(product, $event)"
                class="group-select"
              >
                <option value="">None</option>
                <option v-for="group in taxGroups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </td>
            <td class="tax-rate">
              <span v-if="getTaxGroup(product.taxGroupId)" class="rate-badge">
                {{ getTaxGroup(product.taxGroupId).rate }}%
              </span>
              <span v-else class="rate-badge disabled">N/A</span>
            </td>
            <td class="shipping-group">
              <select 
                :value="product.shippingGroupId"
                @change="updateProductShippingGroup(product, $event)"
                class="group-select"
              >
                <option value="">None</option>
                <option v-for="group in shippingGroups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </td>
            <td class="shipping-cost">
              <span v-if="getShippingGroup(product.shippingGroupId)" class="cost-badge">
                ${{ getShippingGroup(product.shippingGroupId).baseRate.toFixed(2) }}
              </span>
              <span v-else class="cost-badge disabled">N/A</span>
            </td>
            <td class="stock">
              <span :class="{ 'stock-low': product.stock < 10 }">
                {{ product.stock }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="product.active ? 'active' : 'inactive'">
                {{ product.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="action-buttons">
              <button @click="editProduct(product)" class="btn-action edit">✎</button>
              <button @click="toggleProductStatus(product)" class="btn-action">⊙</button>
              <button @click="deleteProduct(product.id)" class="btn-action delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Product Editor Modal -->
    <div v-if="showProductEditor" class="modal-overlay" @click.self="closeProductEditor">
      <div class="modal-content product-editor-modal">
        <div class="modal-header">
          <h2>{{ editingProduct?.id ? 'Edit Product' : 'New Product' }}</h2>
          <button @click="closeProductEditor" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveProduct" class="product-form">
          <!-- Basic Information Tab -->
          <div class="form-tabs">
            <button 
              v-for="tab in productTabs"
              :key="tab"
              type="button"
              @click="activeProductTab = tab"
              class="form-tab"
              :class="{ active: activeProductTab === tab }"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Basic Info -->
          <div v-if="activeProductTab === 'Basic Info'" class="tab-content">
            <div class="form-row">
              <div class="form-group">
                <label>Product Name</label>
                <input 
                  v-model="editingProduct.name"
                  type="text"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label>SKU</label>
                <input 
                  v-model="editingProduct.sku"
                  type="text"
                  class="form-input"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category</label>
                <select v-model="editingProduct.category" class="form-input" required>
                  <option value="">Select Category</option>
                  <option value="tents">Tents</option>
                  <option value="sleeping">Sleeping Bags</option>
                  <option value="backpacks">Backpacks</option>
                  <option value="cooking">Cooking Gear</option>
                </select>
              </div>

              <div class="form-group">
                <label>Price ($)</label>
                <input 
                  v-model.number="editingProduct.price"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-input"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea 
                v-model="editingProduct.description"
                class="form-input"
                rows="3"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Stock</label>
                <input 
                  v-model.number="editingProduct.stock"
                  type="number"
                  min="0"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label>Weight (lbs)</label>
                <input 
                  v-model.number="editingProduct.weight"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-input"
                />
              </div>
            </div>

            <label class="checkbox-option">
              <input v-model="editingProduct.active" type="checkbox" />
              <span>Active</span>
            </label>
          </div>

          <!-- Tax Settings Tab -->
          <div v-if="activeProductTab === 'Tax & Pricing'" class="tab-content">
            <div class="settings-info">
              <h3>Tax Group Assignment</h3>
              <p class="info-text">Select a tax group to automatically apply the appropriate tax rate when this product is purchased.</p>
            </div>

            <div class="form-group">
              <label>Tax Group</label>
              <select v-model="editingProduct.taxGroupId" class="form-input">
                <option value="">No Tax Group</option>
                <option v-for="group in taxGroups" :key="group.id" :value="group.id">
                  {{ group.name }} ({{ group.rate }}%)
                </option>
              </select>
              <small v-if="editingProduct.taxGroupId" class="help-text">
                Tax Rate: {{ getTaxGroup(editingProduct.taxGroupId)?.rate }}%
              </small>
            </div>

            <div class="tax-preview" v-if="editingProduct.taxGroupId">
              <h4>Tax Preview:</h4>
              <div class="preview-item">
                <span>Product Price:</span>
                <span>${{ editingProduct.price.toFixed(2) }}</span>
              </div>
              <div class="preview-item">
                <span>Tax ({${ getTaxGroup(editingProduct.taxGroupId)?.rate }}%):</span>
                <span>${{ calculateTax(editingProduct.price, editingProduct.taxGroupId).toFixed(2) }}</span>
              </div>
              <div class="preview-item total">
                <span>Total:</span>
                <span>${{ (editingProduct.price + calculateTax(editingProduct.price, editingProduct.taxGroupId)).toFixed(2) }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-option">
                <input v-model="editingProduct.taxExempt" type="checkbox" />
                <span>Tax Exempt (overrides tax group)</span>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-option">
                <input v-model="editingProduct.applyTaxToShipping" type="checkbox" />
                <span>Apply tax to shipping charges for this product</span>
              </label>
            </div>
          </div>

          <!-- Shipping Settings Tab -->
          <div v-if="activeProductTab === 'Shipping'" class="tab-content">
            <div class="settings-info">
              <h3>Shipping Group Assignment</h3>
              <p class="info-text">Select a shipping group to automatically apply shipping rates based on the customer's location.</p>
            </div>

            <div class="form-group">
              <label>Shipping Group</label>
              <select v-model="editingProduct.shippingGroupId" class="form-input">
                <option value="">No Shipping Group</option>
                <option v-for="group in shippingGroups" :key="group.id" :value="group.id">
                  {{ group.name }} - Base: ${{ group.baseRate.toFixed(2) }}
                </option>
              </select>
              <small v-if="editingProduct.shippingGroupId" class="help-text">
                Regions: {{ getShippingGroup(editingProduct.shippingGroupId)?.regions.join(', ') }}
              </small>
            </div>

            <div class="shipping-preview" v-if="editingProduct.shippingGroupId">
              <h4>Shipping Methods Available:</h4>
              <div class="method-list">
                <div v-for="method in getShippingGroup(editingProduct.shippingGroupId)?.methods || []" :key="method" class="method-item">
                  {{ method }}
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-option">
                <input v-model="editingProduct.freeShippingEligible" type="checkbox" />
                <span>Eligible for free shipping promotions</span>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-option">
                <input v-model="editingProduct.restrictShipping" type="checkbox" />
                <span>Restrict shipping to specific regions only</span>
              </label>

              <div v-if="editingProduct.restrictShipping" class="restricted-regions">
                <label v-for="region in regions" :key="region" class="checkbox-option">
                  <input 
                    v-model="editingProduct.allowedRegions"
                    type="checkbox"
                    :value="region"
                  />
                  <span>{{ region }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Dimensional Weight (lbs)</label>
              <input 
                v-model.number="editingProduct.dimensionalWeight"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
                placeholder="If greater than actual weight, this will be used for shipping cost"
              />
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingProduct?.id ? 'Update Product' : 'Create Product' }}
            </button>
            <button type="button" @click="closeProductEditor" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-section">
      <div class="summary-card">
        <h3>Tax Group Distribution</h3>
        <div class="distribution">
          <div v-for="group in taxGroupDistribution" :key="group.id" class="distribution-item">
            <span>{{ group.name }}:</span>
            <span class="count">{{ group.count }} products</span>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <h3>Shipping Group Distribution</h3>
        <div class="distribution">
          <div v-for="group in shippingGroupDistribution" :key="group.id" class="distribution-item">
            <span>{{ group.name }}:</span>
            <span class="count">{{ group.count }} products</span>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <h3>Unassigned Products</h3>
        <div class="unassigned-stats">
          <p>No Tax Group: <strong>{{ unassignedTaxCount }}</strong></p>
          <p>No Shipping Group: <strong>{{ unassignedShippingCount }}</strong></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ProductManagementWithTaxShipping',
  setup() {
    const searchQuery = ref('')
    const categoryFilter = ref('')
    const taxGroupFilter = ref('')
    const shippingGroupFilter = ref('')
    const showProductEditor = ref(false)
    const activeProductTab = ref('Basic Info')
    const editingProduct = ref(null)

    const productTabs = ['Basic Info', 'Tax & Pricing', 'Shipping']

    const regions = [
      'Domestic (US)',
      'Canada',
      'Mexico',
      'Europe',
      'Asia',
      'Australia',
      'International',
    ]

    const taxGroups = ref([
      {
        id: 1,
        name: 'US Sales Tax',
        rate: 7.5,
        type: 'sales-tax',
        region: 'United States',
      },
      {
        id: 2,
        name: 'Canada GST',
        rate: 5,
        type: 'gst',
        region: 'Canada',
      },
      {
        id: 3,
        name: 'EU VAT',
        rate: 20,
        type: 'vat',
        region: 'European Union',
      },
    ])

    const shippingGroups = ref([
      {
        id: 1,
        name: 'Domestic Shipping',
        baseRate: 9.99,
        regions: ['Domestic (US)'],
        methods: ['Standard Shipping', 'Express Shipping', 'Overnight Shipping'],
        freeShippingThreshold: 50,
      },
      {
        id: 2,
        name: 'International Shipping',
        baseRate: 24.99,
        regions: ['Canada', 'Mexico', 'Europe', 'Asia', 'Australia'],
        methods: ['Standard Shipping', 'Express Shipping'],
        freeShippingThreshold: 150,
      },
      {
        id: 3,
        name: 'Canada Only',
        baseRate: 14.99,
        regions: ['Canada'],
        methods: ['Standard Shipping', 'Express Shipping'],
        freeShippingThreshold: 75,
      },
    ])

    const products = ref([
      {
        id: 1,
        name: 'Mountain Tent Pro',
        sku: 'TENT001',
        category: 'tents',
        price: 199.99,
        description: 'Professional 4-season tent',
        stock: 15,
        weight: 8.5,
        dimensionalWeight: null,
        image: '/images/tent.jpg',
        taxGroupId: 1,
        taxExempt: false,
        applyTaxToShipping: true,
        shippingGroupId: 1,
        freeShippingEligible: true,
        restrictShipping: false,
        allowedRegions: [],
        active: true,
      },
      {
        id: 2,
        name: 'Sleeping Bag Deluxe',
        sku: 'BAG001',
        category: 'sleeping',
        price: 89.99,
        description: 'Comfortable 3-season sleeping bag',
        stock: 32,
        weight: 2.5,
        dimensionalWeight: null,
        image: '/images/sleeping-bag.jpg',
        taxGroupId: 1,
        taxExempt: false,
        applyTaxToShipping: true,
        shippingGroupId: 1,
        freeShippingEligible: true,
        restrictShipping: false,
        allowedRegions: [],
        active: true,
      },
      {
        id: 3,
        name: 'Hiking Backpack 65L',
        sku: 'PACK001',
        category: 'backpacks',
        price: 129.99,
        description: 'Premium hiking backpack',
        stock: 8,
        weight: 3.2,
        dimensionalWeight: null,
        image: '/images/backpack.jpg',
        taxGroupId: 1,
        taxExempt: false,
        applyTaxToShipping: false,
        shippingGroupId: 1,
        freeShippingEligible: true,
        restrictShipping: false,
        allowedRegions: [],
        active: true,
      },
      {
        id: 4,
        name: 'Camping Stove',
        sku: 'STOVE001',
        category: 'cooking',
        price: 45.99,
        description: 'Portable camping stove',
        stock: 42,
        weight: 1.8,
        dimensionalWeight: null,
        image: '/images/stove.jpg',
        taxGroupId: null,
        taxExempt: false,
        applyTaxToShipping: false,
        shippingGroupId: 2,
        freeShippingEligible: false,
        restrictShipping: true,
        allowedRegions: ['Domestic (US)', 'Canada'],
        active: true,
      },
      {
        id: 5,
        name: 'Sleeping Pad',
        sku: 'PAD001',
        category: 'sleeping',
        price: 59.99,
        description: 'Self-inflating sleeping pad',
        stock: 5,
        weight: 4.0,
        dimensionalWeight: null,
        image: '/images/pad.jpg',
        taxGroupId: null,
        taxExempt: false,
        applyTaxToShipping: true,
        shippingGroupId: null,
        freeShippingEligible: false,
        restrictShipping: false,
        allowedRegions: [],
        active: true,
      },
    ])

    const filteredProducts = computed(() => {
      return products.value.filter(product => {
        const matchesSearch = !searchQuery.value ||
          product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.value.toLowerCase())

        const matchesCategory = !categoryFilter.value || product.category === categoryFilter.value

        const matchesTaxGroup = !taxGroupFilter.value || 
          product.taxGroupId === parseInt(taxGroupFilter.value)

        const matchesShippingGroup = !shippingGroupFilter.value || 
          product.shippingGroupId === parseInt(shippingGroupFilter.value)

        return matchesSearch && matchesCategory && matchesTaxGroup && matchesShippingGroup
      })
    })

    const taxGroupDistribution = computed(() => {
      return taxGroups.value.map(group => ({
        id: group.id,
        name: group.name,
        count: products.value.filter(p => p.taxGroupId === group.id).length,
      }))
    })

    const shippingGroupDistribution = computed(() => {
      return shippingGroups.value.map(group => ({
        id: group.id,
        name: group.name,
        count: products.value.filter(p => p.shippingGroupId === group.id).length,
      }))
    })

    const unassignedTaxCount = computed(() => {
      return products.value.filter(p => !p.taxGroupId && !p.taxExempt).length
    })

    const unassignedShippingCount = computed(() => {
      return products.value.filter(p => !p.shippingGroupId).length
    })

    const getTaxGroup = (taxGroupId) => {
      return taxGroups.value.find(g => g.id === taxGroupId)
    }

    const getShippingGroup = (shippingGroupId) => {
      return shippingGroups.value.find(g => g.id === shippingGroupId)
    }

    const calculateTax = (price, taxGroupId) => {
      const group = getTaxGroup(taxGroupId)
      return group ? (price * group.rate) / 100 : 0
    }

    const editProduct = (product) => {
      editingProduct.value = { ...product, allowedRegions: [...(product.allowedRegions || [])] }
      showProductEditor.value = true
      activeProductTab.value = 'Basic Info'
    }

    const saveProduct = () => {
      if (editingProduct.value.id) {
        const index = products.value.findIndex(p => p.id === editingProduct.value.id)
        products.value[index] = editingProduct.value
      } else {
        editingProduct.value.id = Math.max(...products.value.map(p => p.id)) + 1
        products.value.push(editingProduct.value)
      }
      closeProductEditor()
      alert('Product saved successfully!')
    }

    const closeProductEditor = () => {
      showProductEditor.value = false
      editingProduct.value = null
    }

    const updateProductTaxGroup = (product, event) => {
      product.taxGroupId = event.target.value ? parseInt(event.target.value) : null
    }

    const updateProductShippingGroup = (product, event) => {
      product.shippingGroupId = event.target.value ? parseInt(event.target.value) : null
    }

    const toggleProductStatus = (product) => {
      product.active = !product.active
    }

    const deleteProduct = (productId) => {
      if (confirm('Are you sure you want to delete this product?')) {
        products.value = products.value.filter(p => p.id !== productId)
      }
    }

    const createNewProduct = () => {
      editingProduct.value = {
        id: null,
        name: '',
        sku: '',
        category: '',
        price: 0,
        description: '',
        stock: 0,
        weight: 0,
        dimensionalWeight: null,
        image: '',
        taxGroupId: null,
        taxExempt: false,
        applyTaxToShipping: true,
        shippingGroupId: null,
        freeShippingEligible: true,
        restrictShipping: false,
        allowedRegions: [],
        active: true,
      }
      showProductEditor.value = true
    }

    return {
      searchQuery,
      categoryFilter,
      taxGroupFilter,
      shippingGroupFilter,
      showProductEditor,
      activeProductTab,
      editingProduct,
      productTabs,
      regions,
      taxGroups,
      shippingGroups,
      products,
      filteredProducts,
      taxGroupDistribution,
      shippingGroupDistribution,
      unassignedTaxCount,
      unassignedShippingCount,
      getTaxGroup,
      getShippingGroup,
      calculateTax,
      editProduct,
      saveProduct,
      closeProductEditor,
      updateProductTaxGroup,
      updateProductShippingGroup,
      toggleProductStatus,
      deleteProduct,
    }
  },
}
</script>

<style scoped>
.product-management {
  max-width: 1600px;
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

.product-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.products-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
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
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #555;
}

tr:hover {
  background-color: #f9f9f9;
}

.product-thumb {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.product-name {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.price {
  color: #667eea;
  font-weight: 600;
}

.group-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.rate-badge,
.cost-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background-color: #e8f0ff;
  color: #667eea;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.rate-badge.disabled,
.cost-badge.disabled {
  background-color: #f5f5f5;
  color: #999;
}

.stock {
  font-weight: 600;
  color: #27ae60;
}

.stock.stock-low {
  color: #e74c3c;
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

.btn-action {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-action:hover {
  background-color: #f0f0f0;
}

.btn-action.edit:hover {
  color: #667eea;
}

.btn-action.delete:hover {
  color: #e74c3c;
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
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90vw;
}

.product-editor-modal {
  max-height: 95vh;
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

.product-form {
  padding: 1.5rem;
}

.form-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.form-tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.form-tab:hover {
  color: #667eea;
}

.form-tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
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
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.settings-info {
  background-color: #e8f0ff;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.settings-info h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #667eea;
}

.info-text {
  margin: 0;
  color: #084298;
  font-size: 0.95rem;
}

.help-text {
  display: block;
  color: #999;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.tax-preview,
.shipping-preview {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.tax-preview h4,
.shipping-preview h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #333;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
}

.preview-item.total {
  border-bottom: none;
  font-weight: 600;
  color: #333;
  padding-top: 0.75rem;
  padding-bottom: 0;
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.method-item {
  padding: 0.5rem;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #666;
}

.restricted-regions {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
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

/* Summary Section */
.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.distribution {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.count {
  font-weight: 600;
  color: #667eea;
}

.unassigned-stats p {
  margin: 0.5rem 0;
  color: #666;
}

.unassigned-stats strong {
  color: #e74c3c;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .product-filters {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .products-table {
    font-size: 0.8rem;
  }

  th, td {
    padding: 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .summary-section {
    grid-template-columns: 1fr;
  }
}
</style>