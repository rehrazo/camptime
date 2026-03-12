<template>
  <div class="admin-uncategorized-products">
    <div class="admin-page-top">
      <div class="admin-page-heading">
        <h1>Uncategorized Products</h1>
        <p class="admin-page-subtitle">Products missing a category assignment (`category_id` is null).</p>
      </div>
      <div class="admin-page-actions">
        <button class="btn btn-primary" @click="loadProducts" :disabled="loading">Refresh</button>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>

    <div class="controls">
      <div class="form-group">
        <label for="productFilter">Filter Products</label>
        <input
          id="productFilter"
          v-model="search"
          type="text"
          class="form-input"
          placeholder="Search by name or SKU"
        />
      </div>
      <p class="count">Showing {{ filteredProducts.length }} uncategorized products</p>
    </div>

    <div class="table-card">
      <div v-if="loading" class="loading">Loading products...</div>
      <div v-else-if="filteredProducts.length === 0" class="empty-state">No uncategorized products found.</div>

      <table v-else class="products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.product_id">
            <td class="product-name">{{ product.name }}</td>
            <td>{{ product.sku_code || '-' }}</td>
            <td>${{ Number(product.price || 0).toFixed(2) }}</td>
            <td>{{ Number(product.stock_quantity || 0) }}</td>
            <td>
              <button class="edit-btn" @click="openEdit(product)">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AdminUncategorizedProducts',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref('')
    const products = ref([])
    const search = ref('')

    const filteredProducts = computed(() => {
      const query = String(search.value || '').trim().toLowerCase()
      if (!query) {
        return products.value
      }

      return products.value.filter((product) => {
        const name = String(product?.name || '').toLowerCase()
        const sku = String(product?.sku_code || '').toLowerCase()
        return name.includes(query) || sku.includes(query)
      })
    })

    const loadProducts = async () => {
      loading.value = true
      error.value = ''

      try {
        const allProducts = []
        let currentPage = 1
        let totalPages = 1

        while (currentPage <= totalPages) {
          const params = new URLSearchParams({
            page: String(currentPage),
            limit: '100',
          })

          const response = await fetch(`/api/products?${params.toString()}`)
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to load products')
          }

          const pageRows = Array.isArray(data.data) ? data.data : []
          allProducts.push(...pageRows)

          const pagesFromApi = Number(data?.pagination?.pages || 1)
          totalPages = Number.isFinite(pagesFromApi) && pagesFromApi > 0 ? pagesFromApi : 1
          currentPage += 1
        }

        products.value = allProducts.filter((product) => {
          return product?.category_id === null || product?.category_id === undefined || product?.category_id === ''
        })
      } catch (loadError) {
        error.value = loadError.message || 'Failed to load uncategorized products'
        products.value = []
      } finally {
        loading.value = false
      }
    }

    const openEdit = async (product) => {
      await router.push(`/admin/products/${product.product_id}/edit`)
    }

    onMounted(async () => {
      await loadProducts()
    })

    return {
      loading,
      error,
      products,
      search,
      filteredProducts,
      loadProducts,
      openEdit,
    }
  },
}
</script>

<style scoped>
.admin-uncategorized-products {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 320px;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.count {
  margin: 0;
  color: #555;
  font-weight: 600;
}

.table-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.products-table th {
  background: #f5f5f5;
  color: #333;
}

.product-name {
  font-weight: 600;
  color: #222;
}

.edit-btn {
  border: none;
  border-radius: 4px;
  background: var(--color-accent);
  color: #fff;
  padding: 0.45rem 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.loading,
.empty-state {
  padding: 1rem;
  color: #666;
}

.error-message {
  margin: 0 0 0.75rem;
  color: #b3261e;
  font-weight: 600;
}

.btn {
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background-color: var(--color-forest);
  color: var(--color-sand);
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group {
    min-width: 0;
    width: 100%;
  }
}
</style>
