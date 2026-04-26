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
        <router-link to="/">
          <img src="/src/assets/images/site/razoWildLogoCream.png" alt="Razo Wild" style="height:100px;" />
        </router-link>
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

    <main class="main-content" :class="{ 'main-content-home': route.path === '/' }">
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
    <div v-if="showCookieBanner" class="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent banner">
      <p class="cookie-banner-text">
        We use cookies to improve site performance and your shopping experience. By clicking Accept, you agree to our cookie use.
      </p>
      <div class="cookie-banner-actions">
        <router-link class="cookie-link" to="/privacy-policy">Privacy Policy</router-link>
        <button type="button" class="cookie-btn cookie-btn-secondary" @click="setCookieConsent('rejected')">Reject</button>
        <button type="button" class="cookie-btn cookie-btn-primary" @click="setCookieConsent('accepted')">Accept</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

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
    const cookieConsent = ref(null)

    const showCookieBanner = computed(() => cookieConsent.value === null)

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
      refreshCookieDebugState()
    })

    const refreshCookieDebugState = () => {
      const savedConsent = String(localStorage.getItem('cookie_consent_choice') || '').trim().toLowerCase()

      if (savedConsent === 'accepted' || savedConsent === 'rejected') {
        cookieConsent.value = savedConsent
        return
      }

      cookieConsent.value = null
    }

    const setCookieConsent = (choice) => {
      const normalized = String(choice || '').trim().toLowerCase()
      if (normalized !== 'accepted' && normalized !== 'rejected') {
        return
      }

      cookieConsent.value = normalized
      localStorage.setItem('cookie_consent_choice', normalized)
      localStorage.setItem('cookie_consent_at', new Date().toISOString())
      refreshCookieDebugState()
    }

    const submitHeaderSearch = () => {
      const query = String(headerSearch.value || '').trim()
      router.push({
        path: '/products',
        query: query ? { search: query } : {},
      })
    }

    return {
      route,
      currentYear,
      headerSearch,
      isLoggedIn,
      cartItemCount,
      categoryMenuItems,
      showCookieBanner,
      isCategoryActive,
      isAllCategoriesActive,
      submitHeaderSearch,
      setCookieConsent,
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
  background: var(--forest-green);
  color: var(--cream-white);
  border-bottom: 1px solid rgba(217, 199, 163, 0.25);
}

.top-header-inner {
  margin: 0 auto;
  padding: 0.45rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 0 0 6px 6px;
  width: 100%;
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
  color: var(--cream-white);
  font-size: 0.92em;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.social-links a:hover {
  color: var(--sage-green);
  text-decoration: underline;
}

.social-links a {
  color: var(--apricot-cream);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
}

.social-links a:hover {
  color: var(--color-white);
  text-decoration: underline;
}

.navbar {
  background-color: var(--apricot-cream-muted);
  color: var(--color-text);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.navbar-brand a {
  display: block;
  margin: 0;
  padding: 0;
  line-height: 0;
}

.navbar-brand img {
  display: block;
}

.nav-links {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.navbar-search {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 460px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 1rem;
}

.navbar-search input {
  flex: 1;
  border: none;
  padding: 0.6rem 0.7rem;
  background: var(--color-white);
  color: var(--color-text);
  font-size: 0.9rem;
}

.navbar-search input:focus {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--focus-ring);
}

.navbar-search button {
  border: none;
  background: var(--color-complement);
  color: var(--apricot-cream);
  padding: 0.6rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.nav-links a {
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: var(--color-accent);
}

.nav-links a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background-color: var(--apricot-cream);
  color: var(--color-text);
}

.main-content-home {
  padding: 0;
}

.category-navbar {
  background-color: var(--sage-green);
  color: var(--apricot-cream);
  border-bottom: 1px solid rgba(65, 39, 34, 0.2);
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
  color: var(--apricot-cream);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  padding-bottom: 0.15rem;
  transition: color 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

.category-navbar a,
.category-navbar a:link,
.category-navbar a:visited,
.category-navbar a:hover,
.category-navbar a:active,
.category-navbar a:focus {
  color: var(--apricot-cream);
}

.category-link.router-link-active,
.category-link.router-link-exact-active {
  color: var(--cream-white);
}

.category-link:hover {
  color: var(--apricot-cream);
}

.category-link.active {
  color: var(--cream-white);
  border-color: var(--apricot-cream);
  background-color: rgba(245, 231, 203, 0.18);
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

  .top-header {
    padding: 0;
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
  background-color: var(--forest-green);
  color: var(--cream-white);
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
  color: var(--cream-white);
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.footer-column p,
.footer-column a {
  margin: 0;
  font-size: 0.87rem;
  color: var(--cream-white);
  text-decoration: none;
}

.footer-column a:hover {
  color: var(--apricot-cream);
  text-decoration: underline;
}

.payment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.payment-tags span {
  border: 1px solid rgba(217, 199, 163, 0.26);
  border-radius: 3px;
  padding: 0.2rem 0.45rem;
  font-size: 0.75rem;
  color: var(--cream-white);
}

.footer-bottom {
  border-top: 1px solid rgba(217, 199, 163, 0.2);
  text-align: center;
  padding: 0.9rem 1rem 1.1rem;
}

.footer-bottom p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--cream-white);
}

@media (max-width: 980px) {
  .footer-inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 2rem 1rem;
  }
}

.cookie-banner {
  position: fixed;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  z-index: 1200;
  background: rgba(17, 51, 34, 0.96);
  color: var(--cream-white);
  border: 1px solid rgba(217, 199, 163, 0.35);
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cookie-banner-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  flex: 1;
}

.cookie-banner-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cookie-link {
  color: var(--apricot-cream);
  text-decoration: underline;
  font-size: 0.85rem;
  font-weight: 700;
}

.cookie-btn {
  border: 0;
  border-radius: 8px;
  padding: 0.55rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.cookie-btn-primary {
  background: var(--sage-green);
  color: var(--cream-white);
}

.cookie-btn-secondary {
  background: transparent;
  color: var(--cream-white);
  border: 1px solid rgba(245, 231, 203, 0.5);
}

@media (max-width: 900px) {
  .cookie-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .cookie-banner-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}

@media (max-width: 620px) {
  .footer-inner {
    grid-template-columns: 1fr;
  }
}
</style>
