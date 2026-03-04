<template>
  <div class="product-category-mover">
    <div class="page-header">
      <div>
        <h1>Product Category Mover</h1>
        <p class="subtitle">Pick a source category, then drag products onto a destination category in the tree.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">Back to Admin</button>
        <button class="btn btn-primary" @click="loadInitialData" :disabled="loading">Refresh</button>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

    <div class="controls">
      <div class="form-group">
        <label for="sourceCategory">Source Category</label>
        <select id="sourceCategory" v-model="selectedSourceCategoryId" class="form-input" @change="loadProductsForSource">
          <option :value="null">Select category</option>
          <option v-for="category in flatCategoryOptions" :key="category.category_id" :value="category.category_id">
            {{ category.label }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="productSearch">Filter Products</label>
        <input id="productSearch" v-model="productSearch" type="text" class="form-input" placeholder="Search name or SKU" />
      </div>
    </div>

    <div class="layout">
      <section class="panel category-tree-panel">
        <h2>Destination Categories</h2>
        <p class="hint">Drop a product on a category below to move it.</p>

        <div v-if="loading" class="loading">Loading categories...</div>
        <div v-else-if="flatCategoryRows.length === 0" class="empty-state">No categories found.</div>

        <div v-else class="tree-list">
          <div
            v-for="category in flatCategoryRows"
            :key="category.category_id"
            class="tree-row"
            :class="{ active: dropTargetCategoryId === category.category_id }"
            :style="{ paddingLeft: `${0.8 + category.depth * 1.2}rem` }"
            @dragover.prevent="onCategoryDragOver(category)"
            @dragleave="onCategoryDragLeave(category)"
            @drop.prevent="onCategoryDrop(category)"
          >
            <span class="tree-name">{{ category.name }}</span>
            <span class="tree-path">{{ category.path }}</span>
          </div>
        </div>
      </section>

      <section class="panel product-panel">
        <h2>Products in Source Category</h2>
        <p class="hint">Drag a product and drop it onto a destination category on the left.</p>

        <div v-if="productsLoading" class="loading">Loading products...</div>
        <div v-else-if="selectedSourceCategoryId === null" class="empty-state">Select a source category to load products.</div>
        <div v-else-if="filteredProducts.length === 0" class="empty-state">No matching products found.</div>

        <div v-else ref="productListRef" class="product-list">
          <div
            v-for="product in filteredProducts"
            :key="product.product_id"
            class="product-row"
            draggable="true"
            @dragstart="onProductDragStart(product)"
            @dragend="onProductDragEnd"
          >
            <img :src="getProductImage(product)" :alt="product.name" class="product-thumb" />
            <div class="product-main">
              <p class="product-name">{{ product.name }}</p>
              <p class="product-meta">SKU: {{ product.sku_code || '-' }} · {{ product.category_path || product.category || 'Uncategorized' }}</p>
            </div>
            <span class="drag-handle">⋮⋮</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ProductCategoryMover',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const productsLoading = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const selectedSourceCategoryId = ref(null)
    const productSearch = ref('')

    const categoryTree = ref([])
    const flatCategoryRows = ref([])
    const draggedProduct = ref(null)
    const dropTargetCategoryId = ref(null)
    const products = ref([])
    const productListRef = ref(null)
    const preservedProductListScrollTop = ref(0)
    const placeholderImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="100%" height="100%" fill="%23e8ecf5"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="18">%F0%9F%93%A6</text></svg>'

    const flatCategoryOptions = computed(() => {
      return flatCategoryRows.value.map((category) => ({
        ...category,
        label: `${'— '.repeat(category.depth)}${category.name}`,
      }))
    })

    const filteredProducts = computed(() => {
      const query = String(productSearch.value || '').trim().toLowerCase()
      if (!query) {
        return products.value
      }

      return products.value.filter((product) => {
        const name = String(product?.name || '').toLowerCase()
        const sku = String(product?.sku_code || '').toLowerCase()
        return name.includes(query) || sku.includes(query)
      })
    })

    const flattenTree = (nodes = [], depth = 0) => {
      return nodes.flatMap((node) => {
        const current = {
          category_id: node.category_id,
          name: node.name,
          path: node.path,
          parent_id: node.parent_id,
          depth,
        }

        return [current, ...flattenTree(node.children || [], depth + 1)]
      })
    }

    const goBack = () => {
      router.push({ path: '/admin', query: { tab: 'products' } })
    }

    const loadCategories = async () => {
      const response = await fetch('/api/categories/tree')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load categories')
      }

      categoryTree.value = Array.isArray(data.data) ? data.data : []
      flatCategoryRows.value = flattenTree(categoryTree.value)

      if (selectedSourceCategoryId.value === null && flatCategoryRows.value.length > 0) {
        selectedSourceCategoryId.value = flatCategoryRows.value[0].category_id
      }
    }

    const loadProductsForSource = async () => {
      if (!selectedSourceCategoryId.value) {
        products.value = []
        return
      }

      productsLoading.value = true
      error.value = ''

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '500',
          category_id: String(selectedSourceCategoryId.value),
          include_descendants: 'false',
        })

        const response = await fetch(`/api/products?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load products')
        }

        products.value = Array.isArray(data.data) ? data.data : []
      } catch (loadError) {
        error.value = loadError.message || 'Failed to load products'
        products.value = []
      } finally {
        productsLoading.value = false
      }
    }

    const captureProductListScroll = () => {
      preservedProductListScrollTop.value = productListRef.value?.scrollTop || 0
    }

    const restoreProductListScroll = async () => {
      await nextTick()

      if (!productListRef.value) {
        return
      }

      const maxScrollTop = Math.max(0, productListRef.value.scrollHeight - productListRef.value.clientHeight)
      productListRef.value.scrollTop = Math.min(preservedProductListScrollTop.value, maxScrollTop)
    }

    const loadInitialData = async () => {
      loading.value = true
      error.value = ''
      successMessage.value = ''

      try {
        await loadCategories()
        await loadProductsForSource()
      } catch (loadError) {
        error.value = loadError.message || 'Failed to initialize product category mover'
      } finally {
        loading.value = false
      }
    }

    const onProductDragStart = (product) => {
      draggedProduct.value = product
      error.value = ''
      successMessage.value = ''
    }

    const onProductDragEnd = () => {
      draggedProduct.value = null
      dropTargetCategoryId.value = null
    }

    const onCategoryDragOver = (category) => {
      if (!draggedProduct.value) {
        return
      }

      dropTargetCategoryId.value = category.category_id
    }

    const onCategoryDragLeave = (category) => {
      if (dropTargetCategoryId.value === category.category_id) {
        dropTargetCategoryId.value = null
      }
    }

    const onCategoryDrop = async (targetCategory) => {
      const product = draggedProduct.value
      if (!product) {
        return
      }

      if (Number(product.category_id || 0) === Number(targetCategory.category_id)) {
        successMessage.value = 'Product is already assigned to this category.'
        onProductDragEnd()
        return
      }

      try {
        error.value = ''
        successMessage.value = ''

        const response = await fetch(`/api/products/${product.product_id}/category`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: targetCategory.category_id }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to move product category')
        }

        successMessage.value = `Moved "${product.name}" to "${targetCategory.name}".`
        captureProductListScroll()
        await loadProductsForSource()
        await restoreProductListScroll()
      } catch (moveError) {
        error.value = moveError.message || 'Failed to move product category'
      } finally {
        onProductDragEnd()
      }
    }

    const getProductImage = (product = {}) => {
      const candidates = [
        product.primary_image_url,
        product.image,
        product.image_url,
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)

      return candidates[0] || placeholderImage
    }

    onMounted(async () => {
      await loadInitialData()
    })

    return {
      loading,
      productsLoading,
      error,
      successMessage,
      selectedSourceCategoryId,
      productSearch,
      flatCategoryRows,
      flatCategoryOptions,
      dropTargetCategoryId,
      filteredProducts,
      productListRef,
      goBack,
      loadInitialData,
      loadProductsForSource,
      onProductDragStart,
      onProductDragEnd,
      onCategoryDragOver,
      onCategoryDragLeave,
      onCategoryDrop,
      getProductImage,
    }
  },
}
</script>

<style scoped>
.product-category-mover {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  margin-top: 0.35rem;
  color: #555;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-input {
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1rem;
  align-items: start;
}

.panel {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  min-height: 520px;
}

.panel h2 {
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
}

.hint {
  margin: 0 0 0.8rem;
  color: #666;
  font-size: 0.9rem;
}

.tree-list,
.product-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 470px;
  overflow: auto;
}

.tree-row {
  border: 1px solid #e7e7e7;
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tree-row.active {
  border-color: #2F4F3E;
  background: rgba(47, 79, 62, 0.08);
}

.tree-name {
  font-weight: 600;
  color: #1f1f1f;
}

.tree-path {
  font-size: 0.8rem;
  color: #666;
}

.product-row {
  border: 1px solid #e7e7e7;
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  background: #fff;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.7rem;
  cursor: grab;
}

.product-row:active {
  cursor: grabbing;
}

.product-main {
  min-width: 0;
  flex: 1;
}

.product-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  background: #f3f3f3;
  border: 1px solid #e4e4e4;
  flex-shrink: 0;
}

.product-name {
  margin: 0;
  font-weight: 600;
  color: #222;
}

.product-meta {
  margin: 0.15rem 0 0;
  font-size: 0.82rem;
  color: #666;
}

.drag-handle {
  color: #777;
  letter-spacing: -1px;
  margin-left: 0.6rem;
}

.loading,
.empty-state {
  color: #666;
  padding: 0.5rem 0;
}

.error-message {
  margin: 0 0 0.75rem;
  color: #b3261e;
  font-weight: 600;
}

.success-message {
  margin: 0 0 0.75rem;
  color: #1b5e20;
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
  background-color: #2F4F3E;
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

@media (max-width: 980px) {
  .controls {
    grid-template-columns: 1fr;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: 360px;
  }
}
</style>
