<template>
  <div id="app" class="app">
    <nav v-if="showTopNavbar" class="navbar">
      <div class="navbar-brand">
        <router-link to="/">It's Camp Time</router-link>
      </div>
      <ul class="nav-links">
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/products">Products</router-link></li>
        <li><router-link to="/cart">Cart ({{ cartItemCount }})</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/account">Account</router-link></li>
      </ul>
    </nav>
    <nav v-if="showCategoryNavbar" class="category-navbar" aria-label="Product categories">
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
      <p>&copy; 2026 It's Camp Time. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const cartStore = useCartStore()
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const cartItemCount = computed(() => cartStore.itemCount)
    const categoryMenuItems = ref([])

    const showTopNavbar = computed(() => !String(route.path || '').startsWith('/admin'))
    const showCategoryNavbar = computed(() => !String(route.path || '').startsWith('/admin'))

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
    })

    return {
      isLoggedIn,
      cartItemCount,
      categoryMenuItems,
      showTopNavbar,
      showCategoryNavbar,
      isCategoryActive,
      isAllCategoriesActive,
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

.navbar {
  background-color: #2F4F3E;
  color: #D9C7A3;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand a {
  font-size: 1.5rem;
  font-weight: bold;
  color: #D9C7A3;
  text-decoration: none;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 2rem;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: #D9C7A3;
  text-decoration: none;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #2B2B2B;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background-color: #D9C7A3;
  color: #2B2B2B;
}

.category-navbar {
  background-color: #2F4F3E;
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
  color: #D9C7A3;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  padding-bottom: 0.15rem;
  transition: color 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

.category-link:hover {
  color: #fff;
}

.category-link.active {
  color: #fff;
  border-color: #D9C7A3;
}

@media (max-width: 768px) {
  .category-nav-inner {
    padding: 0.6rem 1rem;
    gap: 1rem;
  }
}

.footer {
  background-color: #2F4F3E;
  color: #D9C7A3;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
}
</style>
