<template>
  <div class="product-search">
    <div class="search-container">
      <!-- Search Header -->
      <div class="search-header">
        <h1>Find Your Perfect Gear</h1>
        <p>Browse our collection of quality camping equipment</p>
      </div>

      <!-- Main Search Bar -->
      <div class="main-search-bar">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search products, brands, categories..."
          class="search-input"
          @keyup.enter="performSearch"
        />
        <button @click="performSearch" class="search-btn">🔍 Search</button>
      </div>

      <!-- Filters and Results Layout -->
      <div class="search-layout">
        <!-- Sidebar Filters -->
        <aside class="filters-sidebar">
          <div class="filters-header">
            <h2>Filters</h2>
            <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-filters">
              Clear All
            </button>
          </div>

          <!-- Search within results -->
          <div class="filter-section">
            <h3>Search in Results</h3>
            <input 
              v-model="filterSearch"
              type="text"
              placeholder="Type to filter..."
              class="filter-input"
            />
          </div>

          <!-- Category Filter -->
          <div class="filter-section">
            <h3>
              <button @click="toggleFilter('category')" class="filter-toggle">
                {{ expandedFilters.category ? '−' : '+' }} Category
              </button>
            </h3>
            <div v-if="expandedFilters.category" class="filter-options">
              <label v-for="cat in categories" :key="cat" class="checkbox-option">
                <input 
                  v-model="activeFilters.categories"
                  type="checkbox"
                  :value="cat"
                />
                <span>{{ cat }}</span>
                <span class="count">({{ getCategoryCount(cat) }})</span>
              </label>
            </div>
          </div>

          <!-- Price Filter -->
          <div class="filter-section">
            <h3>
              <button @click="toggleFilter('price')" class="filter-toggle">
                {{ expandedFilters.price ? '−' : '+' }} Price Range
              </button>
            </h3>
            <div v-if="expandedFilters.price" class="filter-options">
              <div class="price-range">
                <input 
                  v-model.number="activeFilters.priceMin"
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  class="range-input"
                />
                <input 
                  v-model.number="activeFilters.priceMax"
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  class="range-input"
                />
              </div>
              <div class="price-display">
                <span>${{ activeFilters.priceMin }}</span>
                <span>-</span>
                <span>${{ activeFilters.priceMax }}</span>
              </div>
            </div>
          </div>

          <!-- Rating Filter -->
          <div class="filter-section">
            <h3>
              <button @click="toggleFilter('rating')" class="filter-toggle">
                {{ expandedFilters.rating ? '−' : '+' }} Rating
              </button>
            </h3>
            <div v-if="expandedFilters.rating" class="filter-options">
              <label v-for="rating in [5, 4, 3, 2, 1]" :key="rating" class="checkbox-option">
                <input 
                  v-model="activeFilters.ratings"
                  type="checkbox"
                  :value="rating"
                />
                <span class="stars">
                  <span v-for="i in 5" :key="i" :class="{ filled: i <= rating }">★</span>
                </span>
                <span>&amp; up</span>
              </label>
            </div>
          </div>

          <!-- Brand Filter -->
          <div class="filter-section">
            <h3>
              <button @click="toggleFilter('brand')" class="filter-toggle">
                {{ expandedFilters.brand ? '−' : '+' }} Brand
              </button>
            </h3>
            <div v-if="expandedFilters.brand" class="filter-options">
              <input 
                v-model="brandSearch"
                type="text"
                placeholder="Search brands..."
                class="filter-input"
              />
              <label v-for="brand in filteredBrands" :key="brand" class="checkbox-option">
                <input 
                  v-model="activeFilters.brands"
                  type="checkbox"
                  :value="brand"
                />
                <span>{{ brand }}</span>
              </label>
            </div>
          </div>

          <!-- Availability Filter -->
          <div class="filter-section">
            <h3>
              <button @click="toggleFilter('availability')" class="filter-toggle">
                {{ expandedFilters.availability ? '−' : '+' }} Availability
              </button>
            </h3>
            <div v-if="expandedFilters.availability" class="filter-options">
              <label class="checkbox-option">
                <input 
                  v-model="activeFilters.inStock"
                  type="checkbox"
                />
                <span>In Stock Only</span>
              </label>
              <label class="checkbox-option">
                <input 
                  v-model="activeFilters.onSale"
                  type="checkbox"
                />
                <span>On Sale</span>
              </label>
            </div>
          </div>

          <!-- Size/Capacity Filter -->
          <div class="filter-section">
            <h3>
              <button @click="toggleFilter('size')" class="filter-toggle">
                {{ expandedFilters.size ? '−' : '+' }} Size/Capacity
              </button>
            </h3>
            <div v-if="expandedFilters.size" class="filter-options">
              <label v-for="size in sizes" :key="size" class="checkbox-option">
                <input 
                  v-model="activeFilters.sizes"
                  type="checkbox"
                  :value="size"
                />
                <span>{{ size }}</span>
              </label>
            </div>
          </div>
        </aside>

        <!-- Results Section -->
        <main class="search-results">
          <!-- Results Header -->
          <div class="results-header">
            <div class="results-info">
              <p class="result-count">
                Showing {{ filteredProducts.length }} of {{ allProducts.length }} products
              </p>
            </div>
            <div class="sort-controls">
              <label for="sortBy">Sort by:</label>
              <select v-model="sortBy" id="sortBy" class="sort-select">
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <!-- View Toggle -->
          <div class="view-toggle">
            <button 
              @click="viewMode = 'grid'"
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              title="Grid view"
            >
              ≣≣ Grid
            </button>
            <button 
              @click="viewMode = 'list'"
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              title="List view"
            >
              ≡ List
            </button>
          </div>

          <!-- Products Grid/List -->
          <div v-if="filteredProducts.length > 0" :class="viewMode === 'grid' ? 'products-grid' : 'products-list'">
            <div 
              v-for="product in paginatedProducts"
              :key="product.id"
              class="product-card"
              :class="{ 'list-view': viewMode === 'list' }"
            >
              <div class="product-image">
                <img :src="product.image" :alt="product.name" />
                <div v-if="product.onSale" class="badge sale">SALE</div>
                <div v-if="!product.inStock" class="badge out-of-stock">Out of Stock</div>
                <div v-if="product.isNew" class="badge new">NEW</div>
              </div>

              <div class="product-details">
                <h3>{{ product.name }}</h3>
                <p class="brand">{{ product.brand }}</p>
                
                <div class="rating">
                  <span class="stars">
                    <span v-for="i in 5" :key="i" :class="{ filled: i <= product.rating }">★</span>
                  </span>
                  <span class="review-count">({{ product.reviews }} reviews)</span>
                </div>

                <div v-if="viewMode === 'list'" class="product-description">
                  {{ product.brief_description || product.description }}
                </div>

                <div class="price-section">
                  <p v-if="product.onSale" class="original-price">
                    ${{ product.originalPrice.toFixed(2) }}
                  </p>
                  <p class="price">${{ product.price.toFixed(2) }}</p>
                  <p v-if="product.onSale" class="discount">
                    Save {{ Math.round((1 - product.price / product.originalPrice) * 100) }}%
                  </p>
                </div>

                <div class="product-meta">
                  <span v-if="product.inStock" class="in-stock">In Stock</span>
                  <span v-else class="out-of-stock-text">Out of Stock</span>
                </div>

                <div class="product-actions">
                  <router-link :to="`/products/${product.id}`" class="btn btn-secondary btn-small">
                    View Details
                  </router-link>
                  <button 
                    @click="addToCart(product)"
                    :disabled="!product.inStock"
                    class="btn btn-primary btn-small"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else class="no-results">
            <p>No products found matching your criteria.</p>
            <button @click="clearAllFilters" class="btn btn-secondary">Clear Filters</button>
          </div>

          <!-- Pagination -->
          <div v-if="filteredProducts.length > itemsPerPage" class="pagination">
            <button 
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="pagination-btn"
            >
              ← Previous
            </button>
            
            <div class="page-numbers">
              <button 
                v-for="page in totalPages"
                :key="page"
                @click="currentPage = page"
                class="page-number"
                :class="{ active: currentPage === page }"
              >
                {{ page }}
              </button>
            </div>

            <button 
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ProductSearch',
  setup() {
    const searchQuery = ref('')
    const filterSearch = ref('')
    const brandSearch = ref('')
    const sortBy = ref('relevance')
    const viewMode = ref('grid')
    const currentPage = ref(1)
    const itemsPerPage = ref(12)

    const expandedFilters = ref({
      category: true,
      price: true,
      rating: false,
      brand: false,
      availability: false,
      size: false,
    })

    const activeFilters = ref({
      categories: [],
      priceMin: 0,
      priceMax: 500,
      ratings: [],
      brands: [],
      inStock: false,
      onSale: false,
      sizes: [],
    })

    // Mock product data
    const allProducts = ref([
      {
        id: 1,
        name: 'Mountain Tent Pro',
        brand: 'CampGear',
        category: 'Tents',
        price: 199.99,
        originalPrice: 249.99,
        image: '/images/tent.jpg',
        rating: 5,
        reviews: 145,
        inStock: true,
        onSale: true,
        isNew: false,
        description: 'Professional grade 4-season mountain tent with excellent ventilation',
        size: 'Large',
      },
      {
        id: 2,
        name: 'Compact Sleeping Bag',
        brand: 'NatureRest',
        category: 'Sleeping Bags',
        price: 79.99,
        originalPrice: 79.99,
        image: '/images/sleeping-bag.jpg',
        rating: 4,
        reviews: 98,
        inStock: true,
        onSale: false,
        isNew: true,
        description: 'Lightweight and compact sleeping bag perfect for backpacking',
        size: 'Small',
      },
      {
        id: 3,
        name: 'Hiking Backpack 65L',
        brand: 'TrailBlaze',
        category: 'Backpacks',
        price: 129.99,
        originalPrice: 159.99,
        image: '/images/backpack.jpg',
        rating: 4,
        reviews: 76,
        inStock: false,
        onSale: true,
        isNew: false,
        description: 'Premium 65-liter hiking backpack with ergonomic design',
        size: 'Large',
      },
      {
        id: 4,
        name: 'Portable Camping Stove',
        brand: 'CookWild',
        category: 'Cooking Gear',
        price: 45.99,
        originalPrice: 45.99,
        image: '/images/stove.jpg',
        rating: 5,
        reviews: 52,
        inStock: true,
        onSale: false,
        isNew: false,
        description: 'Lightweight portable stove for outdoor cooking',
        size: 'Small',
      },
      {
        id: 5,
        name: 'Sleeping Pad Deluxe',
        brand: 'ComfortCamp',
        category: 'Sleeping Gear',
        price: 89.99,
        originalPrice: 119.99,
        image: '/images/pad.jpg',
        rating: 5,
        reviews: 203,
        inStock: true,
        onSale: true,
        isNew: false,
        description: 'Self-inflating sleeping pad with premium cushioning',
        size: 'Large',
      },
      {
        id: 6,
        name: 'Camping Lantern LED',
        brand: 'LightPath',
        category: 'Lighting',
        price: 34.99,
        originalPrice: 34.99,
        image: '/images/lantern.jpg',
        rating: 4,
        reviews: 87,
        inStock: true,
        onSale: false,
        isNew: true,
        description: 'Bright LED lantern with adjustable brightness levels',
        size: 'Small',
      },
      {
        id: 7,
        name: 'Water Bottle Pro',
        brand: 'HydroGear',
        category: 'Accessories',
        price: 24.99,
        originalPrice: 24.99,
        image: '/images/bottle.jpg',
        rating: 4,
        reviews: 156,
        inStock: true,
        onSale: false,
        isNew: false,
        description: 'Insulated water bottle keeps drinks hot or cold for hours',
        size: 'Medium',
      },
      {
        id: 8,
        name: 'Tent Footprint',
        brand: 'CampGear',
        category: 'Tents',
        price: 34.99,
        originalPrice: 39.99,
        image: '/images/footprint.jpg',
        rating: 5,
        reviews: 64,
        inStock: true,
        onSale: true,
        isNew: false,
        description: 'Protective ground sheet for tent base',
        size: 'Medium',
      },
    ])

    const categories = ['Tents', 'Sleeping Bags', 'Backpacks', 'Cooking Gear', 'Sleeping Gear', 'Lighting', 'Accessories']
    const brands = ['CampGear', 'NatureRest', 'TrailBlaze', 'CookWild', 'ComfortCamp', 'LightPath', 'HydroGear']
    const sizes = ['Small', 'Medium', 'Large', 'Extra Large']

    const filteredBrands = computed(() => {
      return brands.filter(b => b.toLowerCase().includes(brandSearch.value.toLowerCase()))
    })

    const filteredProducts = computed(() => {
      return allProducts.value.filter(product => {
        // Search query
        const matchesSearch = !searchQuery.value || 
          product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          (product.brief_description || product.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())

        // Filter search
        const matchesFilterSearch = !filterSearch.value ||
          product.name.toLowerCase().includes(filterSearch.value.toLowerCase())

        // Category filter
        const matchesCategory = activeFilters.value.categories.length === 0 ||
          activeFilters.value.categories.includes(product.category)

        // Price filter
        const matchesPrice = product.price >= activeFilters.value.priceMin &&
          product.price <= activeFilters.value.priceMax

        // Rating filter
        const matchesRating = activeFilters.value.ratings.length === 0 ||
          activeFilters.value.ratings.some(r => product.rating >= r)

        // Brand filter
        const matchesBrand = activeFilters.value.brands.length === 0 ||
          activeFilters.value.brands.includes(product.brand)

        // Stock filter
        const matchesStock = !activeFilters.value.inStock || product.inStock

        // Sale filter
        const matchesSale = !activeFilters.value.onSale || product.onSale

        // Size filter
        const matchesSize = activeFilters.value.sizes.length === 0 ||
          activeFilters.value.sizes.includes(product.size)

        return matchesSearch && matchesFilterSearch && matchesCategory && 
               matchesPrice && matchesRating && matchesBrand && matchesStock && 
               matchesSale && matchesSize
      }).sort((a, b) => {
        switch (sortBy.value) {
          case 'price-low':
            return a.price - b.price
          case 'price-high':
            return b.price - a.price
          case 'rating':
            return b.rating - a.rating
          case 'newest':
            return b.isNew ? 1 : a.isNew ? -1 : 0
          case 'popular':
            return b.reviews - a.reviews
          case 'relevance':
          default:
            return 0
        }
      })
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
    })

    const paginatedProducts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredProducts.value.slice(start, end)
    })

    const hasActiveFilters = computed(() => {
      return activeFilters.value.categories.length > 0 ||
             activeFilters.value.priceMin > 0 ||
             activeFilters.value.priceMax < 500 ||
             activeFilters.value.ratings.length > 0 ||
             activeFilters.value.brands.length > 0 ||
             activeFilters.value.inStock ||
             activeFilters.value.onSale ||
             activeFilters.value.sizes.length > 0 ||
             searchQuery.value !== ''
    })

    const getCategoryCount = (category) => {
      return allProducts.value.filter(p => p.category === category).length
    }

    const toggleFilter = (filter) => {
      expandedFilters.value[filter] = !expandedFilters.value[filter]
    }

    const clearAllFilters = () => {
      searchQuery.value = ''
      filterSearch.value = ''
      brandSearch.value = ''
      activeFilters.value = {
        categories: [],
        priceMin: 0,
        priceMax: 500,
        ratings: [],
        brands: [],
        inStock: false,
        onSale: false,
        sizes: [],
      }
      currentPage.value = 1
    }

    const performSearch = () => {
      currentPage.value = 1
    }

    const addToCart = (product) => {
      console.log('Added to cart:', product)
      alert(`${product.name} added to cart!`)
    }

    return {
      searchQuery,
      filterSearch,
      brandSearch,
      sortBy,
      viewMode,
      currentPage,
      itemsPerPage,
      expandedFilters,
      activeFilters,
      allProducts,
      categories,
      brands,
      sizes,
      filteredBrands,
      filteredProducts,
      totalPages,
      paginatedProducts,
      hasActiveFilters,
      getCategoryCount,
      toggleFilter,
      clearAllFilters,
      performSearch,
      addToCart,
    }
  },
}
</script>

<style scoped>
.product-search {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.search-header {
  text-align: center;
  margin-bottom: 2rem;
}

.search-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.search-header p {
  font-size: 1.1rem;
  color: #666;
}

.main-search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 1rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-btn {
  padding: 1rem 2rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.search-btn:hover {
  background-color: #5568d3;
}

.search-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.filters-sidebar {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  height: fit-content;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.clear-filters {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: underline;
  font-weight: 600;
}

.clear-filters:hover {
  color: #5568d3;
}

.filter-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.filter-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.filter-section h3 {
  margin: 0 0 1rem 0;
}

.filter-toggle {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  padding: 0;
}

.filter-toggle:hover {
  color: #667eea;
}

.filter-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: slideDown 0.3s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
  flex-shrink: 0;
}

.count {
  color: #999;
  font-size: 0.85rem;
  margin-left: auto;
}

.price-range {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.range-input {
  width: 100%;
  cursor: pointer;
  accent-color: #667eea;
}

.price-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-weight: 600;
  color: #667eea;
}

.stars {
  display: inline-flex;
  gap: 0.125rem;
  font-size: 0.85rem;
}

.stars span {
  color: #ddd;
}

.stars span.filled {
  color: #ffc107;
}

.search-results {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.result-count {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sort-controls label {
  font-weight: 600;
  color: #333;
}

.sort-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.view-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.view-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.view-btn.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.product-card {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.product-card.list-view {
  display: flex;
  gap: 1rem;
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  background-color: white;
  overflow: hidden;
}

.product-card.list-view .product-image {
  width: 200px;
  height: 150px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.badge.sale {
  background-color: #ff6b6b;
}

.badge.new {
  background-color: #00b894;
}

.badge.out-of-stock {
  background-color: #999;
}

.product-details {
  padding: 1rem;
  flex: 1;
}

.product-card.list-view .product-details {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.product-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.brand {
  margin: 0 0 0.5rem 0;
  color: #999;
  font-size: 0.85rem;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.review-count {
  color: #999;
  font-size: 0.8rem;
}

.product-description {
  display: none;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.product-card.list-view .product-description {
  display: block;
}

.price-section {
  margin: 0.75rem 0;
}

.original-price {
  margin: 0;
  color: #999;
  text-decoration: line-through;
  font-size: 0.9rem;
}

.price {
  margin: 0;
  font-size: 1.3rem;
  color: #667eea;
  font-weight: 700;
}

.discount {
  margin: 0.25rem 0 0 0;
  color: #ff6b6b;
  font-size: 0.85rem;
  font-weight: 600;
}

.product-meta {
  margin: 0.75rem 0;
  font-size: 0.85rem;
}

.in-stock {
  color: #00b894;
  font-weight: 600;
}

.out-of-stock-text {
  color: #ff6b6b;
  font-weight: 600;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  width: 40px;
  height: 40px;
  padding: 0;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.page-number:hover {
  border-color: #667eea;
}

.page-number.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

@media (max-width: 768px) {
  .search-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
  }

  .search-header h1 {
    font-size: 1.8rem;
  }

  .main-search-bar {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .product-card.list-view {
    flex-direction: column;
  }

  .product-card.list-view .product-image {
    width: 100%;
    height: 150px;
  }

  .page-numbers {
    max-width: 200px;
    flex-wrap: wrap;
  }
}
</style>