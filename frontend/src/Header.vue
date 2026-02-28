<template>
  <header class="header">
    <div class="header-container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <span class="logo-icon">⛺</span>
        <span class="logo-text">Camptime</span>
      </router-link>

      <!-- Search Bar -->
      <div class="search-bar">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="search-input"
          @keyup.enter="performSearch"
        />
        <button @click="performSearch" class="search-btn">🔍</button>
      </div>

      <!-- Navigation Menu -->
      <nav class="nav-menu">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.name }}
        </router-link>
      </nav>

      <!-- Right Side Icons -->
      <div class="header-icons">
        <!-- Wishlist -->
        <router-link to="/wishlist" class="icon-link wishlist-link">
          <span class="icon">♥</span>
          <span v-if="wishlistCount > 0" class="badge">{{ wishlistCount }}</span>
        </router-link>

        <!-- Shopping Cart -->
        <router-link to="/cart" class="icon-link cart-link">
          <span class="icon">🛒</span>
          <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
        </router-link>

        <!-- User Account -->
        <div class="user-menu">
          <button @click="toggleUserMenu" class="icon-link">
            <span class="icon">👤</span>
          </button>
          <div v-if="showUserMenu" class="dropdown-menu">
            <router-link v-if="isLoggedIn" to="/account" class="dropdown-item">My Account</router-link>
            <router-link v-if="isLoggedIn" to="/orders" class="dropdown-item">My Orders</router-link>
            <router-link v-if="isLoggedIn" to="/settings" class="dropdown-item">Settings</router-link>
            <hr class="divider" />
            <button 
              v-if="isLoggedIn"
              @click="logout"
              class="dropdown-item logout-btn"
            >
              Logout
            </button>
            <router-link v-else to="/login" class="dropdown-item">Login</router-link>
            <router-link v-if="!isLoggedIn" to="/signup" class="dropdown-item">Sign Up</router-link>
          </div>
        </div>

        <!-- Mobile Menu Toggle -->
        <button @click="toggleMobileMenu" class="mobile-menu-btn">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div v-if="showMobileMenu" class="mobile-menu">
      <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="mobile-nav-link"
        @click="showMobileMenu = false"
      >
        {{ item.name }}
      </router-link>
    </div>
  </header>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'Header',
  setup() {
    const route = useRoute()
    const searchQuery = ref('')
    const showUserMenu = ref(false)
    const showMobileMenu = ref(false)
    
    // Mock data - would come from store in real app
    const isLoggedIn = ref(false)
    const cartCount = ref(2)
    const wishlistCount = ref(1)

    const navItems = [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
      { name: 'About', path: '/about' },
      { name: 'Contact', path: '/contact' },
    ]

    const isActive = (path) => {
      return route.path === path
    }

    const performSearch = () => {
      if (searchQuery.value.trim()) {
        // Navigate to products with search query
        // This would typically use router.push with query params
        console.log('Search for:', searchQuery.value)
        searchQuery.value = ''
      }
    }

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
    }

    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
    }

    const logout = () => {
      isLoggedIn.value = false
      showUserMenu.value = false
      // Call logout API
      console.log('User logged out')
    }

    return {
      searchQuery,
      showUserMenu,
      showMobileMenu,
      isLoggedIn,
      cartCount,
      wishlistCount,
      navItems,
      isActive,
      performSearch,
      toggleUserMenu,
      toggleMobileMenu,
      logout,
    }
  },
}
</script>

<style scoped>
.header {
  background-color: #D9C7A3;
  border-bottom: 1px solid #2F4F3E;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(43, 43, 43, 0.1);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #2F4F3E;
  font-weight: 700;
  font-size: 1.3rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  display: none;
}

@media (min-width: 480px) {
  .logo-text {
    display: inline;
  }
}

.search-bar {
  display: flex;
  flex: 1;
  max-width: 400px;
  border: 1px solid #2F4F3E;
  border-radius: 4px;
  overflow: hidden;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
}

.search-btn {
  padding: 0.75rem 1rem;
  background-color: #2F4F3E;
  color: #D9C7A3;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-btn:hover {
  background-color: #2B2B2B;
}

.nav-menu {
  display: none;
  gap: 2rem;
}

@media (min-width: 768px) {
  .nav-menu {
    display: flex;
  }
}

.nav-link {
  text-decoration: none;
  color: #2B2B2B;
  font-weight: 500;
  transition: color 0.3s;
  position: relative;
}

.nav-link:hover {
  color: #2F4F3E;
}

.nav-link.active {
  color: #2F4F3E;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #2F4F3E;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
}

.icon-link {
  position: relative;
  text-decoration: none;
  color: #2B2B2B;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 1.3rem;
  transition: color 0.3s;
}

.icon-link:hover {
  color: #2F4F3E;
}

.icon {
  display: inline-block;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #2F4F3E;
  color: #D9C7A3;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.user-menu {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #D9C7A3;
  border: 1px solid #2F4F3E;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  margin-top: 0.5rem;
  z-index: 1000;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  text-decoration: none;
  color: #2B2B2B;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 0.95rem;
}

.dropdown-item:hover {
  background-color: rgba(47, 79, 62, 0.12);
}

.divider {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px solid #2F4F3E;
}

.logout-btn {
  color: #2B2B2B;
}

.logout-btn:hover {
  background-color: rgba(47, 79, 62, 0.18);
}

.mobile-menu-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

@media (min-width: 768px) {
  .mobile-menu-btn {
    display: none;
  }
}

.mobile-menu-btn span {
  width: 25px;
  height: 2px;
  background-color: #2B2B2B;
  border-radius: 2px;
  transition: all 0.3s;
}

.mobile-menu {
  display: none;
  background-color: #D9C7A3;
  border-top: 1px solid #2F4F3E;
}

@media (max-width: 767px) {
  .mobile-menu {
    display: flex;
    flex-direction: column;
  }
}

.mobile-nav-link {
  padding: 1rem 2rem;
  text-decoration: none;
  color: #2B2B2B;
  border-bottom: 1px solid rgba(43, 43, 43, 0.15);
  transition: background-color 0.3s;
}

.mobile-nav-link:hover {
  background-color: rgba(47, 79, 62, 0.12);
  color: #2F4F3E;
}

@media (max-width: 767px) {
  .header-container {
    gap: 1rem;
    padding: 1rem;
  }

  .search-bar {
    max-width: none;
    order: 3;
    flex-basis: 100%;
  }

  .header-icons {
    gap: 1rem;
    margin-left: 0;
  }
}
</style>