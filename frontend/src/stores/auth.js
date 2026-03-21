import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)
  const token = ref(localStorage.getItem('authToken') || null)
  const role = ref(localStorage.getItem('authRole') || null)
  const isAdmin = computed(() => role.value === 'admin')

  // Actions
  const login = (userData, authToken, userRole = 'customer') => {
    const resolvedRole = userData?.role || userRole
    user.value = userData
    token.value = authToken
    role.value = resolvedRole
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('authRole', resolvedRole)

    if (resolvedRole === 'admin') {
      localStorage.setItem('adminApiToken', authToken)
    } else {
      localStorage.removeItem('adminApiToken')
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    role.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('authRole')
    localStorage.removeItem('adminApiToken')
  }

  const setUser = (userData) => {
    user.value = userData
    if (userData?.role) {
      role.value = userData.role
      localStorage.setItem('authRole', userData.role)
    }
  }

  // Initialize user from token if available
  if (token.value && !isTokenExpired(token.value)) {
    // In a real app, you'd validate the token here
    const initialRole = role.value || 'customer'
    role.value = initialRole
    localStorage.setItem('authRole', initialRole)
    user.value = { id: 'temp', email: 'user@example.com', role: initialRole }
  } else if (token.value && isTokenExpired(token.value)) {
    token.value = null
    role.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('authRole')
    localStorage.removeItem('adminApiToken')
  }

  return {
    user,
    isLoggedIn,
    role,
    isAdmin,
    token,
    login,
    logout,
    setUser,
  }
})
