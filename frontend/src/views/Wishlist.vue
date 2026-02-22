<template>
  <div class="wishlist">
    <h1>My Wishlist</h1>

    <div v-if="wishlistItems.length > 0" class="wishlist-container">
      <!-- Wishlist Stats -->
      <div class="wishlist-stats">
        <div class="stat">
          <span class="stat-label">Total Items</span>
          <span class="stat-value">{{ wishlistItems.length }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Value</span>
          <span class="stat-value">${{ totalValue.toFixed(2) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Items on Sale</span>
          <span class="stat-value">{{ onSaleCount }}</span>
        </div>
      </div>

      <!-- Filter and Sort -->
      <div class="filters">
        <div class="filter-group">
          <label for="sortBy">Sort by:</label>
          <select v-model="sortBy" id="sortBy" class="select-input">
            <option value="recent">Recently Added</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="categoryFilter">Category:</label>
          <select v-model="categoryFilter" id="categoryFilter" class="select-input">
            <option value="">All Categories</option>
            <option value="tents">Tents</option>
            <option value="sleeping-bags">Sleeping Bags</option>
            <option value="backpacks">Backpacks</option>
            <option value="cooking">Cooking Gear</option>
          </select>
        </div>

        <button @click="shareWishlist" class="btn btn-secondary">📤 Share Wishlist</button>
      </div>

      <!-- Wishlist Items -->
      <div class="wishlist-grid">
        <div v-for="item in filteredItems" :key="item.id" class="wishlist-item">
          <div class="item-image">
            <img :src="item.image" :alt="item.name" />
            <div v-if="item.onSale" class="sale-badge">SALE</div>
            <button @click="removeFromWishlist(item.id)" class="remove-btn" title="Remove from wishlist">
              ✕
            </button>
          </div>

          <div class="item-details">
            <h3>{{ item.name }}</h3>
            <p class="item-category">{{ item.category }}</p>
            
            <div class="rating">
              <span class="stars">★★★★★</span>
              <span class="review-count">({{ item.reviews }})</span>
            </div>

            <div class="price-section">
              <p v-if="item.onSale" class="original-price">${{ item.originalPrice.toFixed(2) }}</p>
              <p class="price">${{ item.price.toFixed(2) }}</p>
              <p v-if="item.onSale" class="discount">Save ${{ (item.originalPrice - item.price).toFixed(2) }}</p>
            </div>

            <div class="stock-status" :class="item.stock > 0 ? 'in-stock' : 'out-of-stock'">
              {{ item.stock > 0 ? `${item.stock} in stock` : 'Out of stock' }}
            </div>

            <div class="item-actions">
              <router-link :to="`/products/${item.id}`" class="btn btn-secondary btn-small">
                View Details
              </router-link>
              <button 
                @click="addToCart(item)"
                :disabled="item.stock === 0"
                class="btn btn-primary btn-small"
              >
                Add to Cart
              </button>
            </div>

            <div class="item-meta">
              <p>Added {{ formatDate(item.addedDate) }}</p>
              <button @click="moveToCart(item)" class="text-btn">Move to cart</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div class="bulk-actions">
        <button @click="addAllToCart" class="btn btn-primary">
          Add All to Cart ({{ wishlistItems.length }})
        </button>
        <button @click="clearWishlist" class="btn btn-danger">Clear Wishlist</button>
      </div>
    </div>

    <!-- Empty Wishlist -->
    <div v-else class="empty-wishlist">
      <div class="empty-icon">♥</div>
      <h2>Your wishlist is empty</h2>
      <p>Start adding items to your wishlist to keep track of products you love!</p>
      <router-link to="/products" class="btn btn-primary">Continue Shopping</router-link>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'Wishlist',
  setup() {
    const sortBy = ref('recent')
    const categoryFilter = ref('')

    const wishlistItems = ref([
      {
        id: 1,
        name: 'Mountain Tent',
        category: 'Tents',
        price: 199.99,
        originalPrice: 249.99,
        image: '/images/tent.jpg',
        reviews: 145,
        stock: 12,
        onSale: true,
        addedDate: new Date('2026-02-20'),
      },
      {
        id: 2,
        name: 'Sleeping Bag Pro',
        category: 'Sleeping Bags',
        price: 89.99,
        originalPrice: 89.99,
        image: '/images/sleeping-bag.jpg',
        reviews: 98,
        stock: 25,
        onSale: false,
        addedDate: new Date('2026-02-18'),
      },
      {
        id: 3,
        name: 'Hiking Backpack',
        category: 'Backpacks',
        price: 129.99,
        originalPrice: 159.99,
        image: '/images/backpack.jpg',
        reviews: 76,
        stock: 0,
        onSale: true,
        addedDate: new Date('2026-02-15'),
      },
      {
        id: 4,
        name: 'Camping Stove',
        category: 'Cooking',
        price: 45.99,
        originalPrice: 45.99,
        image: '/images/stove.jpg',
        reviews: 52,
        stock: 18,
        onSale: false,
        addedDate: new Date('2026-02-10'),
      },
    ])

    const totalValue = computed(() => {
      return wishlistItems.value.reduce((sum, item) => sum + item.price, 0)
    })

    const onSaleCount = computed(() => {
      return wishlistItems.value.filter(item => item.onSale).length
    })

    const filteredItems = computed(() => {
      let items = [...wishlistItems.value]

      // Filter by category
      if (categoryFilter.value) {
        items = items.filter(item => item.category === categoryFilter.value)
      }

      // Sort items
      switch (sortBy.value) {
        case 'price-low':
          items.sort((a, b) => a.price - b.price)
          break
        case 'price-high':
          items.sort((a, b) => b.price - a.price)
          break
        case 'name':
          items.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'recent':
        default:
          items.sort((a, b) => b.addedDate - a.addedDate)
      }

      return items
    })

    const formatDate = (date) => {
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    }

    const removeFromWishlist = (itemId) => {
      wishlistItems.value = wishlistItems.value.filter(item => item.id !== itemId)
    }

    const addToCart = (item) => {
      console.log('Added to cart:', item)
      // In a real app, this would add to cart in the store
      alert(`${item.name} added to cart!`)
    }

    const moveToCart = (item) => {
      addToCart(item)
      removeFromWishlist(item.id)
    }

    const addAllToCart = () => {
      const availableItems = wishlistItems.value.filter(item => item.stock > 0)
      console.log('Added to cart:', availableItems)
      alert(`${availableItems.length} items added to cart!`)
    }

    const clearWishlist = () => {
      if (confirm('Are you sure you want to clear your entire wishlist?')) {
        wishlistItems.value = []
      }
    }

    const shareWishlist = () => {
      const url = `${window.location.origin}/wishlist/shared/${Math.random().toString(36).substr(2, 9)}`
      alert(`Wishlist shared! Share this link: ${url}`)
      // In a real app, copy to clipboard
    }

    return {
      sortBy,
      categoryFilter,
      wishlistItems,
      totalValue,
      onSaleCount,
      filteredItems,
      formatDate,
      removeFromWishlist,
      addToCart,
      moveToCart,
      addAllToCart,
      clearWishlist,
      shareWishlist,
    }
  },
}
</script>

<style scoped>
.wishlist {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.wishlist h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.wishlist-container {
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

.wishlist-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #333;
}

.select-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  min-width: 150px;
}

.select-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.wishlist-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s, transform 0.3s;
}

.wishlist-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.item-image {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.wishlist-item:hover .item-image img {
  transform: scale(1.05);
}

.sale-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff6b6b;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.8rem;
}

.remove-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.remove-btn:hover {
  background-color: #ff6b6b;
  color: white;
}

.item-details {
  padding: 1rem;
}

.item-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.item-category {
  color: #666;
  font-size: 0.85rem;
  margin: 0.25rem 0;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.stars {
  color: #ffc107;
  font-size: 0.95rem;
}

.review-count {
  color: #999;
  font-size: 0.8rem;
}

.price-section {
  margin: 1rem 0;
}

.original-price {
  margin: 0;
  color: #999;
  text-decoration: line-through;
  font-size: 0.9rem;
}

.price {
  margin: 0.25rem 0;
  font-size: 1.5rem;
  color: #667eea;
  font-weight: 700;
}

.discount {
  margin: 0.25rem 0 0 0;
  color: #ff6b6b;
  font-size: 0.85rem;
  font-weight: 600;
}

.stock-status {
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
}

.stock-status.in-stock {
  background-color: #d4edda;
  color: #155724;
}

.stock-status.out-of-stock {
  background-color: #f8d7da;
  color: #842029;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
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
  padding: 0.5rem;
  font-size: 0.8rem;
}

.btn-danger {
  background-color: #ff6b6b;
  color: white;
}

.btn-danger:hover {
  background-color: #ee5a52;
}

.item-meta {
  font-size: 0.8rem;
  color: #999;
  padding-top: 0.75rem;
  border-top: 1px solid #e0e0e0;
}

.item-meta p {
  margin: 0.25rem 0;
}

.text-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: inherit;
  font-weight: 600;
}

.text-btn:hover {
  color: #5568d3;
}

.bulk-actions {
  display: flex;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
}

.empty-wishlist {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-wishlist h2 {
  color: #333;
  margin-bottom: 1rem;
}

.empty-wishlist p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .wishlist {
    padding: 1rem;
  }

  .wishlist h1 {
    font-size: 1.5rem;
  }

  .wishlist-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .select-input {
    min-width: unset;
    width: 100%;
  }

  .bulk-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>