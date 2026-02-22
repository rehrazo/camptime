import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)
  const token = ref(localStorage.getItem('authToken') || null)

  // Actions
  const login = (userData, authToken) => {
    user.value = userData
    token.value = authToken
    localStorage.setItem('authToken', authToken)
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('authToken')
  }

  const setUser = (userData) => {
    user.value = userData
  }

  // Initialize user from token if available
  if (token.value) {
    // In a real app, you'd validate the token here
    user.value = { id: 'temp', email: 'user@example.com' }
  }

  return {
    user,
    isLoggedIn,
    token,
    login,
    logout,
    setUser,
  }
})
