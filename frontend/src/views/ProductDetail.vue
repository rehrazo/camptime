<template>
  <div class="product-detail">
    <router-link to="/products" class="back-link">← Back to Products</router-link>
    
    <div v-if="product" class="product-container">
      <div class="product-image">
        <img :src="selectedImage || product.image" :alt="product.name" />
        <div v-if="product.images.length > 1" class="image-thumbnails">
          <button
            v-for="(image, index) in product.images"
            :key="`${image}-${index}`"
            type="button"
            class="thumbnail-btn"
            :class="{ active: (selectedImage || product.image) === image }"
            @click="selectedImage = image"
          >
            <img :src="image" :alt="`${product.name} thumbnail ${index + 1}`" />
          </button>
        </div>
      </div>

      <div class="product-info">
        <h1>{{ product.name }}</h1>
        
        <div v-if="showReviews" class="rating">
          <span class="stars">★★★★★</span>
          <span class="reviews">({{ product.reviews || 0 }} reviews)</span>
        </div>

        <p class="price">${{ product.price.toFixed(2) }}</p>

        <p v-if="product.briefDescription" class="brief-description">{{ product.briefDescription }}</p>
        <p class="description">{{ product.description }}</p>

        <div v-if="product.sections.highlights.length" class="features">
          <h3>Highlights</h3>
          <ul>
            <li v-for="item in product.sections.highlights" :key="`highlight-${item}`">{{ item }}</li>
          </ul>
        </div>

        <div v-if="product.sections.options.length" class="features">
          <h3>Options</h3>
          <ul>
            <li v-for="item in product.sections.options" :key="`option-${item}`">{{ item }}</li>
          </ul>
        </div>

        <div v-if="product.sections.specifications.length" class="features">
          <h3>Specifications</h3>
          <ul>
            <li v-for="item in product.sections.specifications" :key="`spec-${item}`">{{ item }}</li>
          </ul>
        </div>

        <div v-if="product.sections.packaging.length" class="features">
          <h3>Packaging</h3>
          <ul>
            <li v-for="item in product.sections.packaging" :key="`packaging-${item}`">{{ item }}</li>
          </ul>
        </div>

        <div v-if="product.sections.shipping.length" class="features">
          <h3>Shipping</h3>
          <ul>
            <li v-for="item in product.sections.shipping" :key="`shipping-${item}`">{{ item }}</li>
          </ul>
        </div>

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

        <div v-if="product.variantGroups.length" class="variant-selector">
          <h3>Choose Variant</h3>
          <div v-for="group in product.variantGroups" :key="group.theme" class="variant-group">
            <label :for="`variant-${group.theme}`">{{ group.theme }}:</label>
            <select
              :id="`variant-${group.theme}`"
              v-model="selectedVariants[group.theme]"
              class="variant-select"
            >
              <option value="">Select {{ group.theme }}</option>
              <option v-for="option in group.options" :key="`${group.theme}-${option.value}`" :value="option.value">
                {{ option.value }}{{ option.sku ? ` (SKU: ${option.sku})` : '' }}
              </option>
            </select>
          </div>
          <p v-if="selectedVariantSku" class="variant-sku">Selected variant SKU: {{ selectedVariantSku }}</p>
          <p v-if="variantError" class="variant-error">{{ variantError }}</p>
        </div>

        <div class="actions">
          <button @click="addToCart" class="btn btn-primary btn-large">Add to Cart</button>
          <button @click="addToWishlist" class="btn btn-secondary btn-large">♥ Add to Wishlist</button>
        </div>

        <div class="product-meta">
          <p><strong>SKU:</strong> {{ displaySku }}</p>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'

export default {
  name: 'ProductDetail',
  setup() {
    const route = useRoute()
    const product = ref(null)
    const quantity = ref(1)
    const selectedVariants = ref({})
    const selectedImage = ref('')
    const variantError = ref('')
    const cartStore = useCartStore()

    const groupVariations = (variations = []) => {
      const groups = {}

      variations.forEach((variation) => {
        const theme = String(variation?.theme_name || 'Variant').trim() || 'Variant'
        const value = String(variation?.variation_value || '').trim()
        if (!value) {
          return
        }

        if (!groups[theme]) {
          groups[theme] = []
        }

        const sku = String(variation?.variation_sku || '').trim() || null
        const existingOption = groups[theme].find((option) => option.value === value)
        if (!existingOption) {
          groups[theme].push({ value, sku })
        } else if (!existingOption.sku && sku) {
          existingOption.sku = sku
        }
      })

      return Object.keys(groups).map((theme) => ({
        theme,
        options: groups[theme],
      }))
    }

    const getImageDedupKey = (imageUrl) => {
      const raw = String(imageUrl || '').trim()
      if (!raw) {
        return ''
      }

      const normalized = raw.replace(/[?#].*$/, '').toLowerCase()
      const parts = normalized.split('/').filter(Boolean)
      const filename = parts.length ? parts[parts.length - 1] : normalized
      return filename || normalized
    }

    const dedupeImages = (images = []) => {
      const seen = new Set()
      const result = []

      images.forEach((item) => {
        const url = String(item?.image_url || '').trim()
        if (!url) {
          return
        }

        const key = getImageDedupKey(url)
        if (!key || seen.has(key)) {
          return
        }

        seen.add(key)
        result.push(url)
      })

      return result
    }

    const selectedVariantSku = computed(() => {
      const currentProduct = product.value
      if (!currentProduct || !Array.isArray(currentProduct.variantGroups)) {
        return null
      }

      const selectedEntries = Object.entries(selectedVariants.value || {}).filter(([, value]) => String(value || '').trim())
      if (!selectedEntries.length) {
        return null
      }

      const skuCandidates = selectedEntries
        .map(([theme, value]) => {
          const group = currentProduct.variantGroups.find((item) => item.theme === theme)
          const option = group?.options?.find((item) => item.value === value)
          return option?.sku || null
        })
        .filter(Boolean)

      if (!skuCandidates.length) {
        return null
      }

      const uniqueSkus = [...new Set(skuCandidates)]
      return uniqueSkus.length === 1 ? uniqueSkus[0] : null
    })

    const displaySku = computed(() => selectedVariantSku.value || product.value?.sku || 'N/A')

    const showReviews = computed(() => Number(product.value?.reviews || 0) >= 5)

    const mapProduct = (data) => {
      const primaryImage = Array.isArray(data?.images) && data.images.length ? data.images[0].image_url : null
      return {
        ...data,
        id: data.product_id,
        sku: data.sku_code || data.sku || data.item_no || data.spu_no || 'N/A',
        image: primaryImage || data.image || '/images/placeholder-product.jpg',
        images: Array.isArray(data?.images) ? dedupeImages(data.images) : [],
        price: Number(data.price) || 0,
        stock: Number(data.stock_quantity) || 0,
        briefDescription: data.brief_description || null,
        description:
          data.description_sections?.description ||
          data.long_description ||
          data.description ||
          data.brief_description ||
          'No description available.',
        sections: {
          highlights: Array.isArray(data.description_sections?.highlights)
            ? data.description_sections.highlights
            : [],
          options: Array.isArray(data.description_sections?.options)
            ? data.description_sections.options
            : [],
          specifications: Array.isArray(data.description_sections?.specifications)
            ? data.description_sections.specifications
            : [],
          packaging: Array.isArray(data.description_sections?.packaging)
            ? data.description_sections.packaging
            : [],
          shipping: Array.isArray(data.description_sections?.shipping)
            ? data.description_sections.shipping
            : [],
        },
        variantGroups: groupVariations(data.variations),
      }
    }

    onMounted(async () => {
      try {
        const response = await fetch(`/api/products/${route.params.id}`)
        const data = await response.json()
        product.value = mapProduct(data)
        selectedImage.value = product.value.image
        selectedVariants.value = {}
        variantError.value = ''
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    })

    const addToCart = () => {
      if (product.value) {
        const requiredGroups = product.value.variantGroups || []
        const missingGroup = requiredGroups.find((group) => !selectedVariants.value[group.theme])

        if (missingGroup) {
          variantError.value = `Please select ${missingGroup.theme} before adding to cart.`
          return
        }

        variantError.value = ''
        const variantSelections = requiredGroups.reduce((result, group) => {
          result[group.theme] = selectedVariants.value[group.theme]
          return result
        }, {})

        cartStore.addItem(
          {
            ...product.value,
            variantSelections,
            variantSku: selectedVariantSku.value,
          },
          quantity.value
        )
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
      selectedVariants,
      selectedImage,
      selectedVariantSku,
      displaySku,
      showReviews,
      variantError,
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
  background-color: #ECE3D1;
  padding: 1.5rem;
  border-radius: 8px;
}

.product-image img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.image-thumbnails {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 0.6rem;
  margin-top: 0.9rem;
}

.thumbnail-btn {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
}

.thumbnail-btn img {
  width: 100%;
  height: 74px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
  box-shadow: none;
}

.thumbnail-btn.active {
  border-color: #2F4F3E;
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

.brief-description {
  color: #444;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
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

.variant-selector {
  margin-bottom: 2rem;
}

.variant-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
  gap: 0.4rem;
}

.variant-group label {
  font-weight: 600;
}

.variant-select {
  padding: 0.55rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.variant-error {
  color: #c62828;
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
}

.variant-sku {
  color: #2F4F3E;
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
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