<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <h1>Admin Login</h1>
      <p class="admin-login-subtitle">Sign in with your admin account credentials.</p>

      <form class="admin-login-form" @submit.prevent="handleAdminLogin">
        <label for="admin-email">Email</label>
        <input
          id="admin-email"
          v-model="form.email"
          type="email"
          class="form-input"
          placeholder="admin@example.com"
          required
        />

        <label for="admin-password">Password</label>
        <input
          id="admin-password"
          v-model="form.password"
          :type="showToken ? 'text' : 'password'"
          class="form-input"
          placeholder="Enter password"
          required
        />

        <button type="button" class="token-toggle" @click="showToken = !showToken">
          {{ showToken ? 'Hide password' : 'Show password' }}
        </button>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Signing in…' : 'Sign In to Admin' }}
        </button>
      </form>

      <router-link to="/login" class="store-login-link">Go to store login</router-link>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'AdminLogin',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    const isLoading = ref(false)
    const showToken = ref(false)
    const errorMessage = ref('')

    const form = ref({
      email: '',
      password: '',
    })

    const handleAdminLogin = async () => {
      errorMessage.value = ''

      if (!form.value.password.trim()) {
        errorMessage.value = 'Password is required'
        return
      }

      isLoading.value = true

      try {
        const response = await fetch('/api/auth/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: form.value.email,
            password: form.value.password,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'Invalid admin credentials')
        }

        authStore.login(
          data.user,
          data.token,
          data.user?.role || 'admin'
        )

        const redirectTarget = String(router.currentRoute.value.query.redirect || '/admin')
        router.push(redirectTarget)
      } catch (error) {
        console.error('Admin login failed:', error)
        errorMessage.value = error.message || 'Unable to sign in. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    return {
      form,
      isLoading,
      showToken,
      errorMessage,
      handleAdminLogin,
    }
  },
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 1rem;
}

.admin-login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e8ef;
  padding: 1.5rem;
  display: grid;
  gap: 0.75rem;
}

.admin-login-card h1 {
  margin: 0;
  font-size: 1.5rem;
}

.admin-login-subtitle {
  margin: 0;
  color: #606a7d;
  font-size: 0.92rem;
}

.admin-login-form {
  display: grid;
  gap: 0.6rem;
}

.form-input {
  border: 1px solid #d9deea;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
}

.token-toggle {
  justify-self: start;
  border: none;
  background: transparent;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
}

.error-message {
  margin: 0;
  color: #d63939;
  font-size: 0.85rem;
}

.store-login-link {
  font-size: 0.9rem;
  color: var(--color-accent);
}
</style>
