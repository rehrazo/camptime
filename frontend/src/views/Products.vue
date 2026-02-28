<template>
  <div class="products">
    <h1>Our Products</h1>
    
    <div class="filters">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search products..."
        class="search-input"
      />
      <select v-model="selectedParentCategoryId" class="category-select" @change="handleParentCategoryChange">
        <option :value="null">All Parent Categories</option>
        <option v-for="category in parentCategories" :key="category.category_id" :value="category.category_id">
          {{ category.name }}
        </option>
      </select>
      <select
        v-model="selectedChildCategoryId"
        class="category-select"
        :disabled="!childCategories.length"
        @change="handleChildCategoryChange"
      >
        <option :value="null">All Child Categories</option>
        <option v-for="category in childCategories" :key="category.category_id" :value="category.category_id">
          {{ category.name }}
        </option>
      </select>
    </div>

    <div class="products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <img :src="product.image" :alt="product.name" />
        <h3>{{ product.name }}</h3>
        <p class="category">{{ product.categoryPath || product.category }}</p>
        <p class="description">{{ product.description }}</p>
        <p class="price">${{ product.price.toFixed(2) }}</p>
        <div class="actions">
          <router-link :to="`/products/${product.id}`" class="btn btn-secondary">View Details</router-link>
          <button @click="addToCart(product)" class="btn btn-primary">Add to Cart</button>
        </div>
      </div>
    </div>

    <div v-if="filteredProducts.length === 0" class="no-products">
      <p>No products found matching your criteria.</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../stores/cart'

export default {
  name: 'Products',
  setup() {
    const products = ref([])
    const categoryTree = ref([])
    const searchQuery = ref('')
    const selectedParentCategoryId = ref(null)
    const selectedChildCategoryId = ref(null)
    const cartStore = useCartStore()

    const mapProduct = (product) => ({
      ...product,
      id: product.product_id,
      image: product.image || '/images/placeholder-product.jpg',
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
        await Promise.all([fetchCategoryTree(), fetchProducts()])
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    })

    const parentCategories = computed(() => categoryTree.value)

    const childCategories = computed(() => {
      const selectedParent = categoryTree.value.find(
        (category) => category.category_id === selectedParentCategoryId.value
      )

      return selectedParent?.children || []
    })

    const filteredProducts = computed(() => {
      return products.value.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                             (product.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
        return matchesSearch
      })
    })

    const handleParentCategoryChange = async () => {
      selectedChildCategoryId.value = null
      await fetchProducts()
    }

    const handleChildCategoryChange = async () => {
      await fetchProducts()
    }

    const addToCart = (product) => {
      cartStore.addItem(product, 1)
    }

    return {
      products,
      parentCategories,
      childCategories,
      searchQuery,
      selectedParentCategoryId,
      selectedChildCategoryId,
      filteredProducts,
      handleParentCategoryChange,
      handleChildCategoryChange,
      addToCart,
    }
  },
}
</script>

<style scoped>
.products {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.products h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-input,
.category-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.category-select {
  min-width: 150px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.product-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.3s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card img {
  width: 100%;
  height: 250px;
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
  color: #667eea;
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
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
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
</style>