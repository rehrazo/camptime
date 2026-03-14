<template>
  <div class="app">
    <div class="top-header">
      <div class="top-header-inner">
        <span class="top-header-label">Follow Us</span>
        <div class="social-links">
          <a href="https://x.com/razowild" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://www.facebook.com/razowild" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://www.pinterest.com/razowild/" target="_blank" rel="noopener noreferrer">Pinterest</a>
          <a href="https://www.instagram.com/razowild" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.youtube.com/@razowild" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>
      </div>
    </div>

    <nav class="navbar">
      <div class="navbar-brand">
        <router-link to="/">Razo Wild</router-link>
      </div>

      <form class="navbar-search" @submit.prevent="submitHeaderSearch">
        <input
          v-model="headerSearch"
          type="text"
          placeholder="Search products..."
          aria-label="Search products"
        />
        <button type="submit">Search</button>
      </form>

      <ul class="nav-links">
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/cart">Cart ({{ cartItemCount }})</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/account">Account</router-link></li>
        <li class="theme-control">
          <label for="theme-select">Theme</label>
          <select id="theme-select" v-model="selectedTheme" @change="onThemeChange">
            <option v-for="theme in themeOptions" :key="theme.value" :value="theme.value">
              {{ theme.label }}
            </option>
          </select>
        </li>
      </ul>
    </nav>

    <nav class="category-navbar" aria-label="Product categories">
      <div class="category-nav-inner">
        <router-link
          class="category-link"
          :class="{ active: isAllCategoriesActive }"
          to="/products"
        >
          All Categories
        </router-link>
        <router-link
          v-for="category in categoryMenuItems"
          :key="category.category_id"
          class="category-link"
          :class="{ active: isCategoryActive(category.category_id) }"
          :to="{ path: '/products', query: { category_id: String(category.category_id) } }"
        >
          {{ category.name }}
        </router-link>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-column">
          <h4>Secure Payments</h4>
          <p>Protected checkout for safe and reliable transactions.</p>
          <div class="payment-tags">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Amex</span>
            <span>Stripe</span>
          </div>
        </div>

        <div class="footer-column">
          <h4>Information</h4>
          <router-link to="/about">About Us</router-link>
          <router-link to="/contact">Contact Us</router-link>
          <router-link to="/shipping-returns">Shipping &amp; Returns</router-link>
          <router-link to="/privacy-policy">Privacy Policy</router-link>
          <router-link to="/terms-conditions">Terms &amp; Conditions</router-link>
        </div>

        <div class="footer-column">
          <h4>My Account</h4>
          <router-link v-if="isLoggedIn" to="/account">My Account</router-link>
          <router-link v-else to="/login">My Account</router-link>
          <router-link to="/cart">Cart</router-link>
          <router-link to="/checkout">Checkout</router-link>
          <router-link to="/track-order">Track Orders</router-link>
        </div>

        <div class="footer-column">
          <h4>Connect With Us</h4>
          <a href="https://x.com/razowild" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://www.facebook.com/razowild" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://www.pinterest.com/razowild/" target="_blank" rel="noopener noreferrer">Pinterest</a>
          <a href="https://www.instagram.com/razowild" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.youtube.com/@razowild" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Razo Wild. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { applyTheme, getTheme } from '../utils/theme'

export default {
  name: 'StorefrontLayout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const cartStore = useCartStore()
    const currentYear = new Date().getFullYear()
    const headerSearch = ref('')
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const cartItemCount = computed(() => cartStore.itemCount)
    const categoryMenuItems = ref([])
    const selectedTheme = ref(getTheme())
    const themeOptions = [
      { label: 'Lake & Stone', value: 'lake-stone' },
      { label: 'Forest Trail', value: 'forest-trail' },
      { label: 'Campfire Dusk', value: 'campfire-dusk' },
      { label: 'Violet Dew', value: 'violet-dew' },
      { label: 'Forest Harmony', value: 'forest-harmony' },
    ]

    const isAllCategoriesActive = computed(() => {
      return route.path === '/products' && !route.query.category_id
    })

    const isCategoryActive = (categoryId) => {
      return route.path === '/products' && String(route.query.category_id || '') === String(categoryId)
    }

    const fetchCategoryMenu = async () => {
      try {
        const response = await fetch('/api/categories/tree')
        const payload = await response.json()
        categoryMenuItems.value = Array.isArray(payload?.data) ? payload.data : []
      } catch (error) {
        console.error('Error loading categories for menu:', error)
        categoryMenuItems.value = []
      }
    }

    onMounted(() => {
      fetchCategoryMenu()
      selectedTheme.value = getTheme()
    })

    const onThemeChange = () => {
      selectedTheme.value = applyTheme(selectedTheme.value)
    }

    const submitHeaderSearch = () => {
      const query = String(headerSearch.value || '').trim()
      router.push({
        path: '/products',
        query: query ? { search: query } : {},
      })
    }

    return {
      currentYear,
      headerSearch,
      isLoggedIn,
      cartItemCount,
      categoryMenuItems,
      selectedTheme,
      themeOptions,
      isCategoryActive,
      isAllCategoriesActive,
      submitHeaderSearch,
      onThemeChange,
    }
  },
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-header {
  background-color: var(--color-complement);
  color: var(--color-sand);
  border-bottom: 1px solid rgba(217, 199, 163, 0.25);
}

.top-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.45rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.top-header-label {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.social-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.social-links a {
  color: var(--color-sand);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
}

.social-links a:hover {
  color: #fff;
  text-decoration: underline;
}

.navbar {
  background-color: var(--color-forest);
  color: var(--color-sand);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.navbar-brand a {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-sand);
  text-decoration: none;
}

.nav-links {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.theme-control {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.theme-control label {
  color: var(--color-sand);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.theme-control select {
  border: 1px solid rgba(244, 235, 216, 0.6);
  background: transparent;
  color: var(--color-sand);
  border-radius: 4px;
  padding: 0.28rem 0.45rem;
  font-size: 0.78rem;
}

.theme-control select option {
  color: var(--color-charcoal);
  background: #fff;
}

.navbar-search {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 460px;
  border: 1px solid rgba(244, 235, 216, 0.6);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 1rem;
}

.navbar-search input {
  flex: 1;
  border: none;
  padding: 0.6rem 0.7rem;
  background: #fff;
  color: #2B2B2B;
  font-size: 0.9rem;
}

.navbar-search input:focus {
  outline: none;
}

.navbar-search button {
  border: none;
  background: var(--color-complement);
  color: var(--color-sand);
  padding: 0.6rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.nav-links a {
  color: var(--color-sand);
  text-decoration: none;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #2B2B2B;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background-color: var(--color-sand);
  color: #2B2B2B;
}

.category-navbar {
  background-color: var(--color-forest);
  border-top: 1px solid rgba(217, 199, 163, 0.25);
  border-bottom: 1px solid rgba(217, 199, 163, 0.25);
  overflow-x: auto;
}

.category-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.65rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: max-content;
}

.category-link {
  color: var(--color-sand);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  padding-bottom: 0.15rem;
  transition: color 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

.category-link:hover {
  color: var(--color-sand);
}

.category-link.active {
  color: var(--color-sand);
  border-color: var(--color-sand);
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 0.2rem 0.45rem 0.25rem;
}

@media (max-width: 768px) {
  .navbar {
    flex-wrap: wrap;
    padding: 1rem;
  }

  .navbar-search {
    order: 3;
    flex-basis: 100%;
    max-width: none;
    margin: 0;
  }

  .nav-links {
    gap: 1rem;
    flex-wrap: wrap;
  }

  .top-header-inner {
    padding: 0.5rem 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .social-links {
    gap: 0.75rem;
  }

  .category-nav-inner {
    padding: 0.6rem 1rem;
    gap: 1rem;
  }
}

.footer {
  background-color: var(--color-complement);
  color: var(--color-sand);
  margin-top: 2rem;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.25rem 2rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.5rem;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-column h4 {
  margin: 0 0 0.4rem;
  color: #fff;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.footer-column p,
.footer-column a {
  margin: 0;
  font-size: 0.87rem;
  color: var(--color-sand);
  text-decoration: none;
}

.footer-column a:hover {
  color: #fff;
  text-decoration: underline;
}

.payment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.payment-tags span {
  border: 1px solid rgba(217, 199, 163, 0.4);
  border-radius: 3px;
  padding: 0.2rem 0.45rem;
  font-size: 0.75rem;
  color: #fff;
}

.footer-bottom {
  border-top: 1px solid rgba(217, 199, 163, 0.2);
  text-align: center;
  padding: 0.9rem 1rem 1.1rem;
}

.footer-bottom p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-sand);
}

@media (max-width: 980px) {
  .footer-inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 2rem 1rem;
  }
}

@media (max-width: 620px) {
  .footer-inner {
    grid-template-columns: 1fr;
  }
}
</style>
