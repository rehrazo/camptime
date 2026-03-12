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
            <p class="category">{{ product.categoryPath || product.category }}</p>
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

    const fetchProducts = async () => {
      const params = new URLSearchParams()
      if (effectiveCategoryId.value) {
        params.set('category_id', String(effectiveCategoryId.value))
      }

      const endpoint = params.toString() ? `/api/products?${params.toString()}` : '/api/products'
      const response = await fetch(endpoint)
      const data = await response.json()
      products.value = Array.isArray(data?.data) ? data.data.map(mapProduct) : []
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
        await fetchProducts()
      }
    )

    watch(
      () => route.query.search,
      async () => {
        await fetchProducts()
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

    const filteredProducts = computed(() => {
      const query = syncSearchFromQuery()

      return products.value.filter(product => {
        const matchesSearch = !query ||
          product.name.toLowerCase().includes(query) ||
          (product.description || '').toLowerCase().includes(query)
        return matchesSearch
      })
    })

    const selectChildCategory = async (parentId, childId) => {
      selectedParentCategoryId.value = parentId
      selectedChildCategoryId.value = childId
      await fetchProducts()
    }

    const selectParentOnly = async () => {
      selectedChildCategoryId.value = null
      await fetchProducts()
    }

    const selectAllCategories = async () => {
      selectedParentCategoryId.value = null
      selectedChildCategoryId.value = null
      await fetchProducts()
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
      selectChildCategory,
      selectParentOnly,
      selectAllCategories,
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
  background: #fff;
  border: 1px solid #ddd;
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
  color: #2B2B2B;
  cursor: pointer;
}

.category-menu-link:hover {
  background: rgba(99, 172, 77, 0.08);
}

.category-menu-link.active {
  background: var(--color-forest);
  color: var(--color-sand);
}

.category-menu-link.child {
  font-size: 0.92rem;
  padding-left: 0.75rem;
}

.empty-categories {
  margin: 0.6rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.product-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  transition: box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card:focus-visible {
  outline: 2px solid var(--color-forest);
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
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.description {
  color: #777;
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
  background-color: #f0f0f0;
  color: #333;
  display: inline-block;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.no-products {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.no-products p {
  font-size: 1.1rem;
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