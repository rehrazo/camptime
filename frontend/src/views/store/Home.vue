<template>
  <div class="home">
    <section class="hero" :style="heroStyle">
      <div class="hero-overlay"></div>
      <div class="hero-text-bg"></div>
      <div class="hero-content container">
        <p class="hero-brand">RAZO WILD</p>
        <h1>CREATE UNFORGETTABLE MOMENTS</h1>
        <p>Premium camping, hiking, and outdoor essentials built for every adventure.</p>
        <router-link to="/products" class="btn btn-primary">Shop Now</router-link>
      </div>
    </section>

    <section class="category-section featured-section">
      <div class="container featured-container">
        <h2>Featured Categories</h2>
        <div class="category-grid featured-grid">
          <article v-for="category in featuredCategories" :key="category.title" class="category-card">
            <div class="category-card-media" :style="categoryCardStyle(category.image)">
              <div class="card-overlay"></div>
              <div class="card-content">
                <h3>
                  <router-link :to="category.to" class="card-link">{{ category.title }}</router-link>
                </h3>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="welcome-section">
      <div class="container welcome-layout">
        <figure class="welcome-side-image">
          <img :src="welcomeLeftImage" alt="Camping tent near the water at sunset" />
        </figure>

        <div class="welcome-content">
          <h2>Welcome to Razo Wild</h2>
          <p>
            Here at Razo Wild,  our mission is to provide a fast, user-friendly, 
            and customer service-oriented online shopping experience. Through our years of industry experience, 
            we have gone to great lengths to offer the best quality camping gear supplies to our customers at affordable prices,
             as we know our customers will always be the key to our success!
          </p>
          <p class="promise">We promise the highest quality camping products.</p>
        </div>

        <figure class="welcome-side-image">
          <img :src="welcomeRightImage" alt="Campfire in an outdoor camping setup" />
        </figure>
      </div>
    </section>

    <!-- TEMPORARILY HIDDEN: Recommended / Popular & top-rated collections
    <section class="category-section recommended">
      <div class="container">
        <h2>Recommended</h2>
        <p class="section-subtitle">Popular &amp; top-rated collections</p>
        <div class="category-grid">
          <article v-for="category in recommendedCategories" :key="category.title" class="category-card">
            <div class="category-card-media" :style="categoryCardStyle(category.image)">
              <div class="card-overlay"></div>
              <div class="card-content">
                <h3>{{ category.title }}</h3>
                <router-link :to="category.to" class="card-link">Shop Now</router-link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
    -->

    <section class="featured-products-section">
      <div class="container">
        <div class="section-head">
          <h2>Featured Products</h2>
          <router-link to="/products" class="view-all-link">View all products</router-link>
        </div>
        <div class="featured-products-grid">
          <article v-for="product in featuredProducts" :key="product.id" class="featured-product-card">
            <router-link :to="`/products/${product.id}`" class="featured-product-image-wrap">
              <img :src="product.image" :alt="product.name" class="featured-product-image" />
            </router-link>
            <div class="featured-product-body">
              <h3>
                <router-link :to="`/products/${product.id}`" class="featured-product-link">{{ product.name }}</router-link>
              </h3>
              <p class="featured-product-description">{{ product.description }}</p>
              <div class="featured-product-footer">
                <span class="featured-product-price">${{ product.price.toFixed(2) }}</span>
                <router-link :to="`/products/${product.id}`" class="btn btn-secondary">View</router-link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="cta">
      <div class="container">
        <h2>Get In Touch</h2>
        <p>What can we do to help?</p>
        <router-link to="/contact" class="btn btn-secondary">Contact Us</router-link>
      </div>
    </section>

    <section class="trust-section">
      <div class="container trust-grid">
        <div class="trust-card">
          <h3>Secure Payments</h3>
          <p>Shop confidently with protected checkout and reliable order support.</p>
        </div>
        <div class="trust-card">
          <h3>Fast Shipping</h3>
          <p>Quick processing and dependable delivery on camping essentials.</p>
        </div>
        <div class="trust-card">
          <h3>Customer First</h3>
          <p>Friendly service from a team that understands outdoor gear.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import homeBanner from '../../assets/images/site/home_page_banner_cropped3.jpg'
import welcomeLeftImage from '../../assets/images/site/CampByRiver.jpg'
import welcomeRightImage from '../../assets/images/site/CampFire.jpg'

const defaultRoute = '/products'
const defaultFeaturedCategories = [
  { title: 'Tents / Shelter', image: homeBanner, to: defaultRoute },
  { title: 'Sleeping Gear', image: homeBanner, to: defaultRoute },
  { title: 'Camping Cookware', image: homeBanner, to: defaultRoute },
  { title: 'Hiking Gear', image: homeBanner, to: defaultRoute },
]

const defaultRecommendedCategories = [
  { title: 'Power & Lighting', image: homeBanner, to: defaultRoute },
  { title: 'Survival Tools', image: homeBanner, to: defaultRoute },
  { title: 'Camping Clothing', image: homeBanner, to: defaultRoute },
  { title: 'Camping Furniture', image: homeBanner, to: defaultRoute },
]

export default {
  name: 'Home',
  setup() {
    const featuredCategories = ref([...defaultFeaturedCategories])
    const recommendedCategories = ref([...defaultRecommendedCategories])
    const featuredProducts = ref([])

    const heroStyle = {
      backgroundImage: `url(${homeBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
    }

    const mapCategoryToCard = (category) => {
      const categoryId = Number(category?.category_id)
      const categoryImage = String(
        category?.home_feature_image_url || category?.image_url || category?.image || ''
      ).trim()

      return {
        title: String(category?.name || '').trim() || 'Category',
        image: categoryImage || homeBanner,
        to: Number.isInteger(categoryId) && categoryId > 0 ? `/products?category_id=${categoryId}` : defaultRoute,
      }
    }

    const flattenTree = (nodes = []) => {
      return nodes.flatMap((node) => [node, ...flattenTree(node.children || [])])
    }

    const mapFeaturedProduct = (product = {}) => {
      const id = Number(product?.product_id)
      const image = String(product?.primary_image_url || product?.image_url || product?.image || '').trim()
      const description = String(product?.brief_description || product?.description || '').trim()

      return {
        id,
        name: String(product?.name || 'Product').trim() || 'Product',
        image: image || homeBanner,
        description: description || 'No description available.',
        price: Number(product?.price || 0),
      }
    }

    const loadFeaturedProducts = async () => {
      try {
        const params = new URLSearchParams({
          is_featured: 'true',
          limit: '4',
          page: '1',
        })
        const response = await fetch(`/api/products?${params.toString()}`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          return
        }

        const items = Array.isArray(data?.data) ? data.data.map(mapFeaturedProduct) : []
        featuredProducts.value = items.filter((item) => Number.isInteger(item.id) && item.id > 0)
      } catch (_error) {
        featuredProducts.value = []
      }
    }

    const loadHomeCategories = async () => {
      try {
        const response = await fetch('/api/categories/tree')
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          return
        }

        const tree = Array.isArray(data?.data) ? data.data : []
        const categories = flattenTree(tree)

        const byHomeOrder = (a, b) => {
          const orderA = Number(a?.home_feature_order || 0)
          const orderB = Number(b?.home_feature_order || 0)
          if (orderA !== orderB) {
            return orderA - orderB
          }

          return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' })
        }

        const featured = categories
          .filter((category) => String(category?.home_feature_group || 'none').toLowerCase() === 'featured')
          .sort(byHomeOrder)
          .slice(0, 4)
          .map(mapCategoryToCard)

        const recommended = categories
          .filter((category) => String(category?.home_feature_group || 'none').toLowerCase() === 'recommended')
          .sort(byHomeOrder)
          .slice(0, 4)
          .map(mapCategoryToCard)

        if (featured.length > 0) {
          featuredCategories.value = featured
        }

        if (recommended.length > 0) {
          recommendedCategories.value = recommended
        }
      } catch (_error) {
        // Keep defaults when categories request fails.
      }
    }

    const categoryCardStyle = (image) => {
      return {
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }

    onMounted(async () => {
      await loadHomeCategories()
      await loadFeaturedProducts()
    })

    return {
      heroStyle,
      featuredCategories,
      recommendedCategories,
      featuredProducts,
      welcomeLeftImage,
      welcomeRightImage,
      categoryCardStyle,
    }
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Paytone+One&display=swap');

.home {
  width: 100%;
  background: var(--apricot-cream);
}

.hero {
  min-height: 45vh;
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(27, 81, 45, 0.08) 0%,
    rgba(27, 81, 45, 0.22) 58%,
    rgba(27, 81, 45, 0.36) 100%
  );
}


.hero-content {
  position: relative;
  z-index: 2;
  color: var(--color-white);
  text-align: center;
  padding: 5rem 1rem;
  text-shadow: 0 2px 12px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.25);
}

.hero-text-bg {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(30,30,30,0.38) 0%, rgba(30,30,30,0.62) 100%);
  pointer-events: none;
}

.hero-brand {
  letter-spacing: 0.12em;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero-content h1 {
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  margin-bottom: 1rem;
}

.hero-content p {
  max-width: 720px;
  margin: 0 auto 2rem;
  font-size: 1.1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--dark-spruce);
  color: var(--apricot-cream);
}

.btn-primary:hover {
  background-color: var(--dark-coffee);
  text-decoration: none;
}

.btn-secondary {
  background-color: var(--apricot-cream);
  color: var(--dark-coffee);
}

.btn-secondary:hover {
  background-color: var(--color-white);
  text-decoration: none;
}

.category-section,
.welcome-section,
.cta,
.trust-section {
  padding: 4rem 0;
  margin-top: 2.5rem;
  margin-bottom: 2.5rem;
}

.category-section h2,
.welcome-section h2,
.cta h2 {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  margin-bottom: 1rem;
  text-align: center;
  color: var(--dark-coffee);
}

.section-subtitle {
  text-align: center;
  color: var(--dark-coffee);
  opacity: 0.8;
  margin-bottom: 2rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--dark-coffee);
  box-shadow: 0 10px 24px rgba(65, 39, 34, 0.16);
}

.featured-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 25px;
  background-color: transparent;
  box-shadow: none;
  padding: 0;
}

.featured-section {
  background-color: var(--deep-wine);
}

.featured-section h2 {
  color: var(--cream-white);
}

.featured-grid .category-card {
  min-height: 340px;
}

.category-card {
  position: relative;
  min-height: 200px;
  border-radius: 8px;
  overflow: hidden;
}

.category-card-media {
  position: relative;
  min-height: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: end;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(65, 39, 34, 0) 0%,
    rgba(65, 39, 34, 0.12) 48%,
    rgba(65, 39, 34, 0.68) 100%
  );
}

.card-content {
  position: relative;
  z-index: 1;
  color: var(--color-white);
  padding: 1rem;
}

.card-content h3 {
  margin-bottom: 0.5rem;
}

.card-link {
  color: var(--cream-white);
  font-weight: 600;
}

.welcome-section {
  background: var(--color-white);
}

.welcome-layout {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(320px, 1.5fr) minmax(220px, 1fr);
  gap: 25px;
  align-items: stretch;
}

.welcome-side-image {
  margin: 0;
  border-radius: 10px;
  overflow: hidden;
  min-height: 340px;
}

.welcome-side-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.welcome-content {
  text-align: center;
  max-width: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.welcome-content h2 {
  font-family: 'Paytone One', sans-serif;
}

.welcome-content p {
  color: var(--dark-coffee);
  opacity: 0.9;
  margin: 0 auto 1rem;
}

.promise {
  font-weight: 700;
}

.recommended {
  background: rgba(12, 124, 89, 0.1);
}

.featured-products-section {
  background: #f7f0e3;
  padding: 3rem 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.view-all-link {
  color: var(--dark-spruce);
  font-weight: 700;
  text-decoration: none;
}

.view-all-link:hover {
  text-decoration: underline;
}

.featured-products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.featured-product-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #eadcc6;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.featured-product-image-wrap {
  display: block;
  background: #f4ede0;
}

.featured-product-image {
  width: 100%;
  height: 190px;
  object-fit: cover;
  display: block;
}

.featured-product-body {
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.featured-product-link {
  color: var(--dark-spruce);
  text-decoration: none;
}

.featured-product-link:hover {
  text-decoration: underline;
}

.featured-product-description {
  margin: 0;
  color: #4f4a41;
  font-size: 0.92rem;
  line-height: 1.4;
  flex: 1;
}

.featured-product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.featured-product-price {
  color: #1f5f31;
  font-size: 1.05rem;
  font-weight: 700;
}



.cta {
  background: var(--color-white);
  color: var(--dark-coffee);
  text-align: center;
}


.cta h2,
.cta p {
  color: var(--dark-coffee);
}

.cta p {
  margin-bottom: 1.5rem;
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.trust-card {
  background: var(--color-white);
  border-radius: 8px;
  padding: 1.5rem;
}

.trust-card h3 {
  color: var(--dark-spruce);
  margin-bottom: 0.5rem;
}

.trust-card p {
  color: var(--dark-coffee);
}

@media (max-width: 768px) {
  .hero {
    min-height: 35vh;
  }

  .welcome-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .welcome-side-image {
    min-height: 240px;
  }

  .featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .featured-products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 540px) {
  .featured-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .featured-products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
