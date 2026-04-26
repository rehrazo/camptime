<template>
  <div class="variant-pricing-view">
    <div class="card">
      <h2>🎨 Variant-Level Pricing</h2>
      
      <div class="filters">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="search-input"
        />
        <select v-model="filterOption" class="filter-select">
          <option value="all">All Products</option>
          <option value="with-variants">With Variants Only</option>
          <option value="priced">With Variant Pricing</option>
        </select>
      </div>

      <div v-if="loading" class="loading">
        Loading variant pricing data...
      </div>

      <div v-else-if="filteredProducts.length > 0" class="products-list">
        <div v-for="product in filteredProducts" :key="product.product_id" class="product-card">
          <div class="product-header">
            <h3>{{ product.name }}</h3>
            <span class="variant-count">{{ product.variations.length }} variants</span>
          </div>

          <div class="variants-table">
            <table>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Supplier Price</th>
                  <th>Store Price</th>
                  <th>Markup</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="variant in product.variations" :key="variant.variation_id">
                  <td class="variant-name">{{ variant.variation_value }}</td>
                  <td class="sku">{{ variant.variation_sku }}</td>
                  <td class="price">
                    <span v-if="variant.dropshipping_price">
                      ${{ formatPrice(variant.dropshipping_price) }}
                    </span>
                    <span v-else class="no-price">—</span>
                  </td>
                  <td class="price">
                    <span v-if="variant.actual_price">
                      ${{ formatPrice(variant.actual_price) }}
                    </span>
                    <span v-else class="no-price">—</span>
                  </td>
                  <td class="markup">
                    <span v-if="variant.dropshipping_price && variant.actual_price">
                      {{ calculateMarkup(variant.dropshipping_price, variant.actual_price) }}%
                    </span>
                    <span v-else class="no-price">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="product-footer">
            <span class="range-info">
              Price Range: ${{ formatPrice(getMinPrice(product.variations)) }} - ${{ formatPrice(getMaxPrice(product.variations)) }}
            </span>
            <button @click="showProductDetails(product)" class="btn-detail">Edit Variants →</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No products found with variant pricing</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'VariantPricingView',
  emits: ['edit-product'],
  setup(props, { emit }) {
    const products = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const filterOption = ref('priced')

    const filteredProducts = computed(() => {
      return products.value.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        
        let matchesFilter = true
        if (filterOption.value === 'with-variants') {
          matchesFilter = product.variations.length > 0
        } else if (filterOption.value === 'priced') {
          matchesFilter = product.variations.some(v => v.dropshipping_price)
        }

        return matchesSearch && matchesFilter
      })
    })

    const formatPrice = (price) => {
      return parseFloat(price).toFixed(2)
    }

    const calculateMarkup = (supplier, store) => {
      const markup = ((store - supplier) / supplier * 100).toFixed(0)
      return markup
    }

    const getMinPrice = (variations) => {
      const prices = variations
        .filter(v => v.dropshipping_price)
        .map(v => v.dropshipping_price)
      return prices.length > 0 ? Math.min(...prices) : 0
    }

    const getMaxPrice = (variations) => {
      const prices = variations
        .filter(v => v.dropshipping_price)
        .map(v => v.dropshipping_price)
      return prices.length > 0 ? Math.max(...prices) : 0
    }

    const loadProducts = async () => {
      loading.value = true
      try {
        const response = await fetch('/api/admin/dolba-sync/variant-pricing')
        const data = await response.json()
        products.value = data.products || []
      } catch (error) {
        console.error('Failed to load variant pricing:', error)
      } finally {
        loading.value = false
      }
    }

    const showProductDetails = (product) => {
      emit('edit-product', product)
    }

    onMounted(() => {
      loadProducts()
    })

    return {
      products,
      loading,
      searchQuery,
      filterOption,
      filteredProducts,
      formatPrice,
      calculateMarkup,
      getMinPrice,
      getMaxPrice,
      showProductDetails,
    }
  },
}
</script>

<style scoped>
.variant-pricing-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card h2 {
  margin: 0 0 1.5rem;
  color: #333;
  font-size: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  min-width: 200px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.product-header {
  background: #f9f9f9;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.product-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.variant-count {
  background: #2c5f3d;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.variants-table {
  overflow-x: auto;
}

.variants-table table {
  width: 100%;
  border-collapse: collapse;
}

.variants-table th {
  background: #f5f5f5;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #ddd;
  font-size: 0.9rem;
}

.variants-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  color: #555;
}

.variants-table tbody tr:hover {
  background: #fafafa;
}

.variant-name {
  font-weight: 500;
  color: #333;
}

.sku {
  font-family: monospace;
  font-size: 0.9rem;
  color: #999;
}

.price {
  font-weight: 600;
  text-align: right;
  color: #2c5f3d;
}

.markup {
  text-align: right;
  font-weight: 600;
  color: #0066cc;
}

.no-price {
  color: #999;
}

.product-footer {
  padding: 1rem;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e0e0e0;
}

.range-info {
  color: #666;
  font-weight: 500;
}

.btn-detail {
  background: #2c5f3d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-detail:hover {
  background: #1f4429;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}
</style>
