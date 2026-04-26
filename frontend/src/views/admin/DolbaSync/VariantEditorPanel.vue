<template>
  <div class="variant-editor-panel">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-content">
        <button class="btn-back" @click="$emit('close')">← Back</button>
        <div class="product-identity">
          <h2>{{ product.name }}</h2>
          <span class="product-sku">SKU: {{ product.sku }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-save" @click="saveChanges" :disabled="!hasChanges">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
        <button class="btn-cancel" @click="$emit('close')">Cancel</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs"
        :key="tab"
        class="tab"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab ===  'pricing' ? '💰 Pricing' : '📦 Variants' }}
      </button>
    </div>

    <!-- Content -->
    <div class="editor-content">
      <!-- Variants Tab -->
      <div v-show="activeTab === 'variants'" class="tab-content">
        <div class="variants-manager">
          <div class="manager-header">
            <h3>Manage Variants</h3>
            <button class="btn-add-variant" @click="showAddVariantForm = true">+ Add Variant</button>
          </div>

          <div v-if="showAddVariantForm" class="add-variant-form">
            <div class="form-group">
              <label>Option Type</label>
              <select v-model="newVariant.option_type">
                <option value="">Select type</option>
                <option value="size">Size</option>
                <option value="color">Color</option>
                <option value="material">Material</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div class="form-group">
              <label>Variant Value</label>
              <input v-model="newVariant.variation_value" type="text" placeholder="e.g., Large, Red">
            </div>
            <div class="form-group">
              <label>SKU</label>
              <input v-model="newVariant.variation_sku" type="text" placeholder="Unique SKU">
            </div>
            <div class="form-actions">
              <button class="btn-save" @click="addVariant">Add</button>
              <button class="btn-cancel" @click="showAddVariantForm = false">Cancel</button>
            </div>
          </div>

          <table class="variants-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>SKU</th>
                <th>Supplier Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="variant in product.variations" :key="variant.variation_id">
                <td>{{ variant.option_type }}</td>
                <td>{{ variant.variation_value }}</td>
                <td class="sku-cell">{{ variant.variation_sku }}</td>
                <td>${{ formatPrice(variant.dropshipping_price || 0) }}</td>
                <td class="actions-cell">
                  <button class="btn-icon edit" @click="editVariant(variant)" title="Edit">✎</button>
                  <button class="btn-icon delete" @click="deleteVariant(variant.variation_id)" title="Delete">🗑</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pricing Tab -->
      <div v-show="activeTab === 'pricing'" class="tab-content">
        <div class="pricing-manager">
          <div class="manager-header">
            <h3>Variant Pricing</h3>
          </div>

          <div class="pricing-grid">
            <div v-for="variant in product.variations" :key="variant.variation_id" class="pricing-card">
              <div class="card-header">
                <h4>{{ variant.variation_value }}</h4>
                <span class="sku">{{ variant.variation_sku }}</span>
              </div>

              <div class="card-body">
                <div class="price-field">
                  <label>Supplier Price (Cost)</label>
                  <div class="input-group">
                    <span class="currency">$</span>
                    <input 
                      v-model.number="getPricingData(variant.variation_id).supplierPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      @change="markChanged"
                    >
                  </div>
                </div>

                <div class="price-field">
                  <label>Store Price (Retail)</label>
                  <div class="input-group">
                    <span class="currency">$</span>
                    <input 
                      v-model.number="getPricingData(variant.variation_id).storePrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      @change="markChanged"
                    >
                  </div>
                </div>

                <div class="price-field readonly">
                  <label>Profit Margin</label>
                  <div class="value">
                    {{ calculateMargin(getPricingData(variant.variation_id).supplierPrice, getPricingData(variant.variation_id).storePrice) }}
                  </div>
                </div>

                <div class="price-field readonly">
                  <label>Markup %</label>
                  <div class="value">
                    {{ calculateMarkup(getPricingData(variant.variation_id).supplierPrice, getPricingData(variant.variation_id).storePrice) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Changes Summary -->
    <div v-if="hasChanges" class="changes-summary">
      <h4>Pending Changes:</h4>
      <ul>
        <li v-for="(changes, variantId) in changedVariants" :key="variantId">
          Variant ID {{ variantId }}: {{ Object.keys(changes).join(', ') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'VariantEditorPanel',
  props: {
    product: {
      type: Object,
      required: false,
      default: () => ({
        product_id: null,
        name: 'No product selected',
        sku: '',
        variations: [],
      }),
    },
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const activeTab = ref('variants')
    const tabs = ['variants', 'pricing']
    const saving = ref(false)
    const showAddVariantForm = ref(false)
    const pricingData = ref({})
    const changedVariants = ref({})

    // Initialize pricing data from product
    const initializePricingData = () => {
      pricingData.value = {}
      const variants = Array.isArray(props.product?.variations) ? props.product.variations : []
      variants.forEach(variant => {
        pricingData.value[variant.variation_id] = {
          supplierPrice: variant.dropshipping_price || 0,
          storePrice: variant.actual_price || 0,
        }
      })
    }

    // New variant form
    const newVariant = ref({
      option_type: '',
      variation_value: '',
      variation_sku: '',
    })

    const formatPrice = (price) => {
      return parseFloat(price || 0).toFixed(2)
    }

    const calculateMargin = (supplier, store) => {
      const margin = store - supplier
      return `$${formatPrice(margin)}`
    }

    const calculateMarkup = (supplier, store) => {
      if (!supplier || supplier === 0) return '0'
      return Math.round(((store - supplier) / supplier) * 100)
    }

    const getPricingData = (variantId) => {
      if (!pricingData.value[variantId]) {
        pricingData.value[variantId] = { supplierPrice: 0, storePrice: 0 }
      }
      return pricingData.value[variantId]
    }

    const markChanged = () => {
      // Track which variants have been modified
      // This will be enhanced in production
    }

    const hasChanges = computed(() => {
      return Object.keys(changedVariants.value).length > 0 || showAddVariantForm.value
    })

    const addVariant = () => {
      if (!newVariant.value.option_type || !newVariant.value.variation_value) {
        alert('Please fill in all fields')
        return
      }
      // Emit event to parent to add variant
      emit('save', {
        action: 'add_variant',
        data: newVariant.value,
      })
      newVariant.value = { option_type: '', variation_value: '', variation_sku: '' }
      showAddVariantForm.value = false
    }

    const editVariant = (variant) => {
      // Open edit form for variant
      console.log('Edit variant:', variant)
    }

    const deleteVariant = (variantId) => {
      if (confirm('Are you sure you want to delete this variant?')) {
        emit('save', {
          action: 'delete_variant',
          variant_id: variantId,
        })
      }
    }

    const saveChanges = async () => {
      if (!props.product?.product_id) {
        return
      }

      saving.value = true
      try {
        const payload = {
          product_id: props.product.product_id,
          pricing: pricingData.value,
        }
        
        emit('save', {
          action: 'update_pricing',
          data: payload,
        })

        // Reset changes
        changedVariants.value = {}
        initializePricingData()
      } catch (error) {
        console.error('Error saving changes:', error)
      } finally {
        saving.value = false
      }
    }

    watch(
      () => props.product,
      () => {
        initializePricingData()
      },
      { immediate: true }
    )

    return {
      activeTab,
      tabs,
      saving,
      showAddVariantForm,
      newVariant,
      pricingData,
      changedVariants,
      hasChanges,
      formatPrice,
      calculateMargin,
      calculateMarkup,
      getPricingData,
      markChanged,
      addVariant,
      editVariant,
      deleteVariant,
      saveChanges,
    }
  },
}
</script>

<style scoped>
.variant-editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.editor-header {
  background: linear-gradient(135deg, #2c5f3d 0%, #1f4429 100%);
  padding: 1.5rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.product-identity h2 {
  margin: 0;
  font-size: 1.4rem;
}

.product-sku {
  display: block;
  font-size: 0.9rem;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-save {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-save:hover:not(:disabled) {
  background: #45a049;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.tab {
  flex: 1;
  padding: 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab.active {
  color: #2c5f3d;
  border-bottom-color: #2c5f3d;
  background: white;
}

.tab:hover:not(.active) {
  background: #fafafa;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.variants-manager,
.pricing-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manager-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.btn-add-variant {
  background: #2c5f3d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-add-variant:hover {
  background: #1f4429;
}

.add-variant-form {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.variants-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.variants-table th {
  background: #f5f5f5;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #ddd;
}

.variants-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
}

.variants-table tbody tr:hover {
  background: #fafafa;
}

.sku-cell {
  font-family: monospace;
  font-size: 0.9rem;
  color: #999;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem 0.5rem;
  transition: all 0.3s ease;
}

.btn-icon.edit:hover {
  transform: scale(1.2);
}

.btn-icon.delete:hover {
  transform: scale(1.2);
  color: #d32f2f;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.pricing-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.card-header {
  background: #f5f5f5;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.card-header h4 {
  margin: 0 0 0.5rem;
  color: #333;
  font-size: 1rem;
}

.sku {
  display: block;
  font-family: monospace;
  font-size: 0.85rem;
  color: #999;
}

.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.price-field {
  display: flex;
  flex-direction: column;
}

.price-field label {
  color: #666;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.currency {
  background: #f5f5f5;
  padding: 0.75rem 0.5rem;
  color: #666;
  font-weight: 600;
}

.input-group input {
  flex: 1;
  border: none;
  padding: 0.75rem;
  font-size: 1rem;
}

.price-field.readonly .value {
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
  color: #333;
  font-weight: 600;
}

.changes-summary {
  background: #fff3cd;
  border-top: 1px solid #ffc107;
  padding: 1.5rem;
  margin-top: auto;
}

.changes-summary h4 {
  margin: 0 0 0.75rem;
  color: #856404;
}

.changes-summary ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #856404;
}

.changes-summary li {
  margin-bottom: 0.5rem;
}
</style>
