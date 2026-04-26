<template>
  <div class="products">
    <h1>{{ productsHeading }}</h1>

    <div class="products-layout">
      <aside class="category-sidebar">
        <h2>Categories</h2>
        <template v-if="selectedParentCategory">
          <button
            class="category-menu-link all"
            :class="{ active: !selectedChildCategoryId }"
            @click="selectParentOnly"
          >
            All in {{ selectedParentCategory.name }}
          </button>

          <button
            v-for="child in visibleChildCategories"
            :key="child.category_id"
            class="category-menu-link child"
            :class="{ active: selectedChildCategoryId === child.category_id }"
            @click="selectChildCategory(selectedParentCategory.category_id, child.category_id)"
          >
            {{ child.name }}
          </button>

          <p v-if="visibleChildCategories.length === 0" class="empty-categories">
            No child categories under this parent.
          </p>
        </template>

        <p v-else class="empty-categories">Select a parent category from the top category bar to browse its children.</p>
      </aside>

      <div class="products-content">
        <div class="products-grid">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card"
            role="button"
            tabindex="0"
            @click="openProduct(product.id)"
            @keydown.enter.prevent="openProduct(product.id)"
            @keydown.space.prevent="openProduct(product.id)"
          >
            <img :src="product.image" :alt="product.name" />
            <h3>{{ product.name }}</h3>
            <p class="description">{{ product.description }}</p>
            <p class="price">${{ product.price.toFixed(2) }}</p>
            <div class="actions">
              <router-link :to="`/products/${product.id}`" class="btn btn-secondary" @click.stop>View Details</router-link>
              <button @click.stop="addToCart(product)" class="btn btn-primary">Add to Cart</button>
            </div>
          </div>
        </div>

        <div v-if="filteredProducts.length === 0" class="no-products">
          <p>No products found matching your criteria.</p>
        </div>

        <div v-if="totalItems > 0" class="pagination-summary-wrap">
          <p class="pagination-summary">Showing {{ displayStartItem }}-{{ displayEndItem }} of {{ totalItems }} items</p>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <div class="pagination-nav">
            <button
              class="pagination-btn"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              Previous
            </button>

            <button
              v-for="item in pageItems"
              :key="item.key"
              class="pagination-btn"
              :class="{ active: item.type === 'page' && item.value === currentPage, ellipsis: item.type === 'ellipsis' }"
              :disabled="item.type === 'ellipsis'"
              @click="item.type === 'page' ? goToPage(item.value) : null"
            >
              {{ item.label }}
            </button>

            <button
              class="pagination-btn"
              :disabled="currentPage >= totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </button>
          </div>

          <button
            v-if="currentPage < totalPages"
            class="pagination-load-more"
            @click="loadMore"
          >
            Load More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'

export default {
  name: 'Products',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const products = ref([])
    const categoryTree = ref([])
    const selectedParentCategoryId = ref(null)
    const selectedChildCategoryId = ref(null)
    const currentPage = ref(1)
    const perPage = ref(21)
    const totalPages = ref(1)
    const totalItems = ref(0)
    const loadedFromPage = ref(1)
    const cartStore = useCartStore()

    const mapProduct = (product) => ({
      ...product,
      id: product.product_id,
      image: product.primary_image_url || product.image || '/images/placeholder-product.jpg',
      price: Number(product.price) || 0,
      description: product.brief_description || product.description || 'No description available.',
      categoryPath: product.category_path || product.category_name || product.category || '',
      categoryId: product.category_id ?? null,
    })

    const fetchCategoryTree = async () => {
      const response = await fetch('/api/categories/tree')
      const data = await response.json()
      categoryTree.value = Array.isArray(data?.data) ? data.data : []
    }

    const findParentForCategory = (targetCategoryId) => {
      for (const category of categoryTree.value) {
        if (category.category_id === targetCategoryId) {
          return { parentId: category.category_id, childId: null }
        }

        const child = (category.children || []).find((item) => item.category_id === targetCategoryId)
        if (child) {
          return { parentId: category.category_id, childId: child.category_id }
        }
      }

      return null
    }

    const syncCategoryFromQuery = () => {
      const queryCategoryId = Number(route.query.category_id)

      if (!Number.isFinite(queryCategoryId) || queryCategoryId <= 0) {
        selectedParentCategoryId.value = null
        selectedChildCategoryId.value = null
        return
      }

      const match = findParentForCategory(queryCategoryId)
      if (!match) {
        selectedParentCategoryId.value = null
        selectedChildCategoryId.value = null
        return
      }

      selectedParentCategoryId.value = match.parentId
      selectedChildCategoryId.value = match.childId
    }

    const syncSearchFromQuery = () => {
      return String(route.query.search || '').trim().toLowerCase()
    }

    const effectiveCategoryId = computed(() => {
      const selectedChild = Number(selectedChildCategoryId.value)
      if (Number.isFinite(selectedChild) && selectedChild > 0) {
        return selectedChild
      }

      const selectedParent = Number(selectedParentCategoryId.value)
      if (Number.isFinite(selectedParent) && selectedParent > 0) {
        return selectedParent
      }

      return null
    })

    const fetchProducts = async (page = currentPage.value, options = {}) => {
      const { append = false } = options
      const safePage = Math.max(1, Number(page) || 1)
      const params = new URLSearchParams()
      if (effectiveCategoryId.value) {
        params.set('category_id', String(effectiveCategoryId.value))
      }

      const searchTerm = syncSearchFromQuery()
      if (searchTerm) {
        params.set('search', searchTerm)
      }

      params.set('page', String(safePage))
      params.set('limit', String(perPage.value))

      const endpoint = params.toString() ? `/api/products?${params.toString()}` : '/api/products'
      const response = await fetch(endpoint)
      const data = await response.json()
      const mappedProducts = Array.isArray(data?.data) ? data.data.map(mapProduct) : []
      products.value = append ? [...products.value, ...mappedProducts] : mappedProducts

      const pagination = data?.pagination || {}
      currentPage.value = Math.max(1, Number(pagination.page) || safePage)
      totalPages.value = Math.max(1, Number(pagination.pages) || 1)
      totalItems.value = Math.max(0, Number(pagination.total) || 0)

      if (!append) {
        loadedFromPage.value = currentPage.value
      }
    }

    onMounted(async () => {
      try {
        await fetchCategoryTree()
        syncCategoryFromQuery()
        await fetchProducts()
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    })

    watch(
      () => route.query.category_id,
      async () => {
        syncCategoryFromQuery()
        currentPage.value = 1
        loadedFromPage.value = 1
        await fetchProducts(1)
      }
    )

    watch(
      () => route.query.search,
      async () => {
        currentPage.value = 1
        loadedFromPage.value = 1
        await fetchProducts(1)
      }
    )

    const parentCategories = computed(() => categoryTree.value)

    const childCategories = computed(() => {
      const selectedParent = categoryTree.value.find(
        (category) => category.category_id === selectedParentCategoryId.value
      )

      return selectedParent?.children || []
    })

    const selectedParentCategory = computed(() => {
      return categoryTree.value.find((category) => category.category_id === selectedParentCategoryId.value) || null
    })

    const selectedChildCategory = computed(() => {
      return visibleChildCategories.value.find((child) => child.category_id === selectedChildCategoryId.value) || null
    })

    const productsHeading = computed(() => {
      if (selectedChildCategory.value?.name) {
        return selectedChildCategory.value.name
      }

      if (selectedParentCategory.value?.name) {
        return selectedParentCategory.value.name
      }

      return 'Our Products'
    })

    const visibleChildCategories = computed(() => {
      return selectedParentCategory.value?.children || []
    })

    const filteredProducts = computed(() => products.value)

    const pageItems = computed(() => {
      const maxNumericButtons = 7
      const total = totalPages.value
      const current = currentPage.value

      if (total <= maxNumericButtons) {
        return Array.from({ length: total }, (_, index) => ({
          key: `page-${index + 1}`,
          type: 'page',
          value: index + 1,
          label: String(index + 1),
        }))
      }

      const items = []
      const interiorSlots = maxNumericButtons - 2
      let start = Math.max(2, current - Math.floor(interiorSlots / 2))
      let end = Math.min(total - 1, start + interiorSlots - 1)

      if (end - start + 1 < interiorSlots) {
        start = Math.max(2, end - interiorSlots + 1)
      }

      items.push({ key: 'page-1', type: 'page', value: 1, label: '1' })

      if (start > 2) {
        items.push({ key: 'ellipsis-left', type: 'ellipsis', value: null, label: '...' })
      }

      for (let page = start; page <= end; page += 1) {
        items.push({
          key: `page-${page}`,
          type: 'page',
          value: page,
          label: String(page),
        })
      }

      if (end < total - 1) {
        items.push({ key: 'ellipsis-right', type: 'ellipsis', value: null, label: '...' })
      }

      items.push({ key: `page-${total}`, type: 'page', value: total, label: String(total) })

      return items
    })

    const displayStartItem = computed(() => {
      if (totalItems.value <= 0 || filteredProducts.value.length === 0) {
        return 0
      }

      return (loadedFromPage.value - 1) * perPage.value + 1
    })

    const displayEndItem = computed(() => {
      if (displayStartItem.value <= 0 || filteredProducts.value.length === 0) {
        return 0
      }

      return Math.min(displayStartItem.value + filteredProducts.value.length - 1, totalItems.value)
    })

    const selectChildCategory = async (parentId, childId) => {
      selectedParentCategoryId.value = parentId
      selectedChildCategoryId.value = childId
      currentPage.value = 1
      loadedFromPage.value = 1
      await fetchProducts(1)
    }

    const selectParentOnly = async () => {
      selectedChildCategoryId.value = null
      currentPage.value = 1
      loadedFromPage.value = 1
      await fetchProducts(1)
    }

    const selectAllCategories = async () => {
      selectedParentCategoryId.value = null
      selectedChildCategoryId.value = null
      currentPage.value = 1
      loadedFromPage.value = 1
      await fetchProducts(1)
    }

    const goToPage = async (page) => {
      const safePage = Math.max(1, Math.min(Number(page) || 1, totalPages.value))
      if (safePage === currentPage.value) {
        return
      }

      currentPage.value = safePage
      loadedFromPage.value = safePage
      await fetchProducts(safePage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const loadMore = async () => {
      if (currentPage.value >= totalPages.value) {
        return
      }

      const nextPage = currentPage.value + 1
      await fetchProducts(nextPage, { append: true })
    }

    const addToCart = (product) => {
      cartStore.addItem(product, 1)
    }

    const openProduct = (productId) => {
      router.push(`/products/${productId}`)
    }

    return {
      products,
      parentCategories,
      selectedParentCategoryId,
      selectedChildCategoryId,
      selectedParentCategory,
      selectedChildCategory,
      visibleChildCategories,
      productsHeading,
      filteredProducts,
      currentPage,
      totalPages,
      totalItems,
      pageItems,
      displayStartItem,
      displayEndItem,
      selectChildCategory,
      selectParentOnly,
      selectAllCategories,
      goToPage,
      loadMore,
      addToCart,
      openProduct,
    }
  },
}
</script>

<style scoped>
.products {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.25rem;
}

.products h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.products-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.category-sidebar {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
}

.category-sidebar h2 {
  margin: 0 0 0.8rem;
  font-size: 1.1rem;
}

.category-group {
  margin-bottom: 0.6rem;
}

.category-menu-link {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  border-radius: 6px;
  padding: 0.5rem 0.55rem;
  margin-bottom: 0.2rem;
  color: var(--color-text);
  cursor: pointer;
}

.category-menu-link:hover {
  background: rgba(12, 124, 89, 0.1);
}

.category-menu-link.active {
  background: rgba(80, 135, 95, 0.2);
  color: var(--color-text);
}

.category-menu-link.child {
  font-size: 0.92rem;
  padding-left: 0.75rem;
}

.empty-categories {
  margin: 0.6rem 0 0;
  color: var(--color-text-subtle);
  font-size: 0.9rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.product-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(65, 39, 34, 0.12);
}

.product-card:focus-visible {
  outline: 2px solid var(--dark-spruce);
  outline-offset: 2px;
}

.product-card img {
  width: 100%;
  height: 210px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.product-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.category {
  color: var(--color-text-subtle);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.description {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.price {
  font-size: 1.6rem;
  color: var(--color-accent);
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 0.95rem;
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-accent-dark);
}

.btn-secondary {
  background-color: var(--apricot-cream-muted);
  color: var(--color-text);
  display: inline-block;
}

.btn-secondary:hover {
  background-color: rgba(65, 39, 34, 0.12);
}

.no-products {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-subtle);
}

.no-products p {
  font-size: 1.1rem;
}

.pagination-summary-wrap {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.pagination-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.pagination-summary {
  margin: 0;
  color: var(--color-text-muted);
  font-weight: 600;
}

.pagination-btn {
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-text);
  border-radius: 6px;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(12, 124, 89, 0.12);
}

.pagination-btn.active {
  background: #123526;
  border-color: #123526;
  color: var(--apricot-cream);
}

.pagination-btn.ellipsis {
  border-color: transparent;
  background: transparent;
  color: var(--color-text-subtle);
  cursor: default;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-load-more {
  border: none;
  background: var(--color-accent);
  color: var(--color-white);
  border-radius: 6px;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-weight: 600;
}

.pagination-load-more:hover {
  background: var(--color-accent-dark);
}

@media (max-width: 980px) {
  .products-layout {
    grid-template-columns: 1fr;
  }

  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>