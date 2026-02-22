<template>
  <div class="product-detail">
    <router-link to="/products" class="back-link">← Back to Products</router-link>
    
    <div v-if="product" class="product-container">
      <div class="product-image">
        <img :src="product.image" :alt="product.name" />
      </div>

      <div class="product-info">
        <h1>{{ product.name }}</h1>
        <p class="category">Category: {{ product.category }}</p>
        
        <div class="rating">
          <span class="stars">★★★★★</span>
          <span class="reviews">({{ product.reviews || 0 }} reviews)</span>
        </div>

        <p class="price">${{ product.price.toFixed(2) }}</p>

        <p class="description">{{ product.description }}</p>

        <div class="features" v-if="product.features">
          <h3>Features</h3>
          <ul>
            <li v-for="feature in product.features" :key="feature">{{ feature }}</li>
          </ul>
        </div>

        <div class="quantity-selector">
          <label for="quantity">Quantity:</label>
          <input 
            id="quantity"
            v-model.number="quantity" 
            type="number" 
            min="1" 
            max="99"
            class="quantity-input"
          />
        </div>

        <div class="actions">
          <button @click="addToCart" class="btn btn-primary btn-large">Add to Cart</button>
          <button @click="addToWishlist" class="btn btn-secondary btn-large">♥ Add to Wishlist</button>
        </div>

        <div class="product-meta">
          <p><strong>SKU:</strong> {{ product.sku }}</p>
          <p><strong>Stock:</strong> {{ product.stock > 0 ? `${product.stock} available` : 'Out of Stock' }}</p>
          <p><strong>Shipping:</strong> Free shipping on orders over $50</p>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <p>Loading product details...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'ProductDetail',
  setup() {
    const route = useRoute()
    const product = ref(null)
    const quantity = ref(1)

    onMounted(async () => {
      try {
        const response = await fetch(`/api/products/${route.params.id}`)
        const data = await response.json()
        product.value = data
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    })

    const addToCart = () => {
      if (product.value) {
        console.log(`Added ${quantity.value} of ${product.value.name} to cart`)
        // Call store action or emit event
        quantity.value = 1
      }
    }

    const addToWishlist = () => {
      if (product.value) {
        console.log(`Added ${product.value.name} to wishlist`)
        // Call store action or emit event
      }
    }

    return {
      product,
      quantity,
      addToCart,
      addToWishlist,
    }
  },
}
</script>

<style scoped>
.product-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 2rem;
  color: #667eea;
  text-decoration: none;
  font-size: 1rem;
}

.back-link:hover {
  text-decoration: underline;
}

.product-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.product-image img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-info h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.category {
  color: #666;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stars {
  color: #ffc107;
  font-size: 1.2rem;
}

.reviews {
  color: #777;
  font-size: 0.95rem;
}

.price {
  font-size: 2rem;
  color: #667eea;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.description {
  color: #555;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.features {
  margin-bottom: 2rem;
}

.features h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #555;
}

.features li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #667eea;
  font-weight: bold;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.quantity-selector label {
  font-weight: 600;
}

.quantity-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  flex: 1;
  padding: 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;
  font-weight: 600;
}

.btn-large {
  padding: 1.2rem;
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
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.product-meta {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 4px;
  border-left: 4px solid #667eea;
}

.product-meta p {
  margin: 0.5rem 0;
  color: #555;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .product-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .product-info h1 {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }
}
</style>