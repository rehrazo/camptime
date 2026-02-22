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
      <select v-model="selectedCategory" class="category-select">
        <option value="">All Categories</option>
        <option value="tents">Tents</option>
        <option value="sleeping-bags">Sleeping Bags</option>
        <option value="backpacks">Backpacks</option>
        <option value="cooking">Cooking Gear</option>
      </select>
    </div>

    <div class="products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <img :src="product.image" :alt="product.name" />
        <h3>{{ product.name }}</h3>
        <p class="category">{{ product.category }}</p>
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

export default {
  name: 'Products',
  setup() {
    const products = ref([])
    const searchQuery = ref('')
    const selectedCategory = ref('')

    onMounted(async () => {
      try {
        const response = await fetch('/api/products')
        const data = await response.json()
        products.value = data
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    })

    const filteredProducts = computed(() => {
      return products.value.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                             product.description.toLowerCase().includes(searchQuery.value.toLowerCase())
        const matchesCategory = !selectedCategory.value || product.category === selectedCategory.value
        return matchesSearch && matchesCategory
      })
    })

    const addToCart = (product) => {
      console.log('Added to cart:', product)
      // Emit event or call store action to add to cart
    }

    return {
      products,
      searchQuery,
      selectedCategory,
      filteredProducts,
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