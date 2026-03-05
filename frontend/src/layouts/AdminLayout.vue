<template>
  <div class="admin-layout">
    <header class="admin-global-header">
      <div class="admin-global-inner">
        <router-link class="admin-brand" to="/admin">
          <span class="admin-brand-icon">⛺</span>
          <span>Camptime Admin</span>
        </router-link>
        <nav class="admin-global-nav" aria-label="Admin menu">
          <router-link
            class="admin-nav-link"
            :class="{ active: isTabActive('overview') }"
            :to="{ path: '/admin', query: { tab: 'overview' } }"
          >
            Dashboard
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: isProductsMenuActive() }"
            :to="{ path: '/admin', query: { tab: 'products' } }"
          >
            Products
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/products/category-mover' }"
            to="/admin/products/category-mover"
          >
            Product Mover
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/products/uncategorized' }"
            to="/admin/products/uncategorized"
          >
            Uncategorized
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: isTabActive('categories') }"
            :to="{ path: '/admin', query: { tab: 'categories' } }"
          >
            Categories
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/categories/manager' }"
            to="/admin/categories/manager"
          >
            Category Manager
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/orders/export-manager' }"
            to="/admin/orders/export-manager"
          >
            Order Export
          </router-link>
        </nav>

        <div class="header-actions">
          <div class="notification-bell">
            <button class="bell-btn" type="button">🔔</button>
            <span v-if="notificationCount > 0" class="badge">{{ notificationCount }}</span>
          </div>
          <div class="user-profile">
            <img src="https://i.pravatar.cc/150?img=1" alt="Admin" class="profile-pic" />
            <div class="user-info">
              <p class="user-name">John Martinez</p>
              <p class="user-role">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
    <router-view />
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'AdminLayout',
  setup() {
    const route = useRoute()
    const notificationCount = ref(5)

    const isTabActive = (tab) => {
      return route.path === '/admin' && String(route.query.tab || 'overview') === tab
    }

    const isProductsMenuActive = () => {
      if (isTabActive('products')) {
        return true
      }

      if (!route.path.startsWith('/admin/products/')) {
        return false
      }

      return route.path !== '/admin/products/category-mover' && route.path !== '/admin/products/uncategorized'
    }

    return {
      route,
      notificationCount,
      isTabActive,
      isProductsMenuActive,
    }
  },
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-global-header {
  position: sticky;
  top: 0;
  z-index: 110;
  background: #fff;
  border-bottom: 1px solid #e5e8ef;
}

.admin-global-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #2f3f5a;
  text-decoration: none;
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
}

.admin-brand-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.admin-global-nav {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  flex: 1;
}

.admin-nav-link {
  text-decoration: none;
  color: #2f3f5a;
  border: 1px solid #d9deea;
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  background: #fff;
  transition: all 0.2s ease;
}

.admin-nav-link:hover {
  background: #f3f6ff;
}

.admin-nav-link.active {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-bell {
  position: relative;
}

.bell-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  color: #2f3f5a;
}

.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background-color: #e74c3c;
  color: #fff;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0 4px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.profile-pic {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 0.85rem;
  line-height: 1.1;
}

.user-role {
  margin: 0;
  font-size: 0.72rem;
  color: #777;
  line-height: 1.1;
}

@media (max-width: 900px) {
  .admin-global-inner {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-global-nav {
    flex: unset;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
