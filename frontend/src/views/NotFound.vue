<template>
  <div class="not-found">
    <div class="not-found-container">
      <div class="error-code">404</div>
      
      <h1>Page Not Found</h1>
      <p class="error-message">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>

      <div class="illustration">
        <span class="tent-icon">⛺</span>
        <span class="lost-text">Lost in the woods?</span>
      </div>

      <div class="suggestions">
        <h2>Here are some helpful links:</h2>
        <div class="link-grid">
          <router-link to="/" class="link-card">
            <span class="link-icon">🏠</span>
            <span class="link-text">Home</span>
          </router-link>
          <router-link to="/products" class="link-card">
            <span class="link-icon">🛍️</span>
            <span class="link-text">Products</span>
          </router-link>
          <router-link to="/cart" class="link-card">
            <span class="link-icon">🛒</span>
            <span class="link-text">Cart</span>
          </router-link>
          <router-link to="/account" class="link-card">
            <span class="link-icon">👤</span>
            <span class="link-text">Account</span>
          </router-link>
        </div>
      </div>

      <div class="search-section">
        <h3>Search for products:</h3>
        <form @submit.prevent="search" class="search-form">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="What are you looking for?"
            class="search-input"
          />
          <button type="submit" class="btn btn-primary">Search</button>
        </form>
      </div>

      <div class="support-section">
        <h3>Need Help?</h3>
        <p>Contact our support team at <a href="mailto:support@camptime.com">support@camptime.com</a></p>
        <p>Or call us at <a href="tel:1-800-CAMP-TIME">1-800-CAMP-TIME</a></p>
      </div>

      <router-link to="/" class="btn btn-primary btn-large">
        ← Back to Home
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter()
    const searchQuery = ref('')

    const search = () => {
      if (searchQuery.value.trim()) {
        router.push({
          path: '/products',
          query: { search: searchQuery.value },
        })
      }
    }

    return {
      searchQuery,
      search,
    }
  },
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.not-found-container {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.error-code {
  font-size: 6rem;
  font-weight: 900;
  color: #667eea;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.not-found-container h1 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 1rem 0;
}

.error-message {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.illustration {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.tent-icon {
  font-size: 5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.lost-text {
  color: #999;
  font-style: italic;
  font-size: 0.95rem;
}

.suggestions {
  margin: 2rem 0;
}

.suggestions h2 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s;
}

.link-card:hover {
  background-color: #667eea;
  color: white;
  transform: translateY(-4px);
}

.link-icon {
  font-size: 2rem;
}

.link-text {
  font-weight: 600;
  font-size: 0.95rem;
}

.search-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.search-section h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 1rem;
}

.search-form {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.support-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #e8f0ff;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.support-section h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 0.75rem;
}

.support-section p {
  margin: 0.5rem 0;
  color: #555;
}

.support-section a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.support-section a:hover {
  text-decoration: underline;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  margin-top: 1rem;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
  transform: translateY(-2px);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .not-found-container {
    padding: 2rem 1rem;
  }

  .error-code {
    font-size: 4rem;
  }

  .not-found-container h1 {
    font-size: 1.5rem;
  }

  .tent-icon {
    font-size: 3rem;
  }

  .link-grid {
    grid-template-columns: 1fr;
  }

  .search-form {
    flex-direction: column;
  }
}
</style>