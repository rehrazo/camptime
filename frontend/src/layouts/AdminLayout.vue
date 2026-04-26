<template>
  <div class="admin-layout">
    <header class="admin-global-header">
      <div class="admin-global-inner">
        <router-link class="admin-brand" to="/admin">
          <img src="/src/assets/images/site/razoWildLogo.svg" alt="Razo Wild" style="height:28px;border-radius:6px;" />
          <span>Razo Wild Admin</span>
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
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/tax' }"
            to="/admin/tax"
          >
            Tax
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/shipping' }"
            to="/admin/shipping"
          >
            Shipping
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/drop-shippers' }"
            to="/admin/drop-shippers"
          >
            Drop Shippers
          </router-link>
          <router-link
            class="admin-nav-link"
            :class="{ active: route.path === '/admin/dolba-sync' }"
            to="/admin/dolba-sync"
          >
            Dolba Sync
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

function decodeJwtPayload(token) {
  try {
    const payloadPart = String(token || '').split('.')[1] || ''
    if (!payloadPart) {
      return null
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payloadJson = atob(padded)
    return JSON.parse(payloadJson)
  } catch (_error) {
    return null
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token)
  const exp = Number(payload?.exp || 0)
  if (!exp) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  return exp <= now
}

function clearStoredAuth() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authRole')
  localStorage.removeItem('adminApiToken')
}

export default {
  name: 'AdminLayout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const notificationCount = ref(5)
    const isRedirecting = ref(false)
    let sessionCheckIntervalId = null
    let originalFetch = null

    const redirectToLogin = () => {
      if (isRedirecting.value) {
        return
      }
      isRedirecting.value = true

      const redirectPath = route.fullPath || '/admin'
      clearStoredAuth()
      authStore.logout()
      router.replace({
        name: 'AdminLogin',
        query: {
          redirect: redirectPath,
        },
      })
    }

    const checkAdminSession = () => {
      const authToken = String(localStorage.getItem('authToken') || '').trim()
      const adminApiToken = String(localStorage.getItem('adminApiToken') || '').trim()

      if (!authToken || !adminApiToken) {
        redirectToLogin()
        return
      }

      if (isTokenExpired(authToken) || isTokenExpired(adminApiToken)) {
        redirectToLogin()
      }
    }

    const hasValidAdminSession = () => {
      const authToken = String(localStorage.getItem('authToken') || '').trim()
      const adminApiToken = String(localStorage.getItem('adminApiToken') || '').trim()

      if (!authToken || !adminApiToken) {
        return false
      }

      return !isTokenExpired(authToken) && !isTokenExpired(adminApiToken)
    }

    const isApiRequest = (requestInput) => {
      if (!requestInput) {
        return false
      }

      if (typeof requestInput === 'string') {
        return requestInput.startsWith('/api/')
      }

      const requestUrl = String(requestInput.url || '')
      return requestUrl.includes('/api/')
    }

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

    onMounted(() => {
      checkAdminSession()
      sessionCheckIntervalId = window.setInterval(checkAdminSession, 15000)

      originalFetch = window.fetch.bind(window)
      window.fetch = async (...args) => {
        const response = await originalFetch(...args)
        const requestInput = args[0]
        const isUnauthorized = response && (response.status === 401 || response.status === 403)
        if (isUnauthorized && isApiRequest(requestInput) && !hasValidAdminSession()) {
          redirectToLogin()
        }
        return response
      }
    })

    onBeforeUnmount(() => {
      if (sessionCheckIntervalId) {
        window.clearInterval(sessionCheckIntervalId)
      }

      if (originalFetch) {
        window.fetch = originalFetch
      }
    })

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
