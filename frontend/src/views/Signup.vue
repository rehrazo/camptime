<template>
  <div class="signup-page">
    <div class="signup-container">
      <!-- Left Side - Branding -->
      <div class="signup-branding">
        <div class="brand-content">
          <div class="brand-icon">⛺</div>
          <h1>Camptime</h1>
          <p>Join thousands of outdoor enthusiasts</p>
          
          <div class="features">
            <div class="feature">
              <span class="feature-icon">✓</span>
              <span>Exclusive deals & discounts</span>
            </div>
            <div class="feature">
              <span class="feature-icon">✓</span>
              <span>Track your orders</span>
            </div>
            <div class="feature">
              <span class="feature-icon">✓</span>
              <span>Save favorites to wishlist</span>
            </div>
            <div class="feature">
              <span class="feature-icon">✓</span>
              <span>Early access to sales</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Signup Form -->
      <div class="signup-form-container">
        <div class="form-wrapper">
          <h2>Create Account</h2>
          <p class="form-subtitle">Join our community today</p>

          <!-- Social Signup -->
          <div class="social-signup">
            <button class="social-btn google-btn">
              <span class="social-icon">G</span>
              Sign up with Google
            </button>
            <button class="social-btn facebook-btn">
              <span class="social-icon">f</span>
              Sign up with Facebook
            </button>
          </div>

          <div class="divider">
            <span>or</span>
          </div>

          <!-- Signup Form -->
          <form @submit.prevent="handleSignup" class="form">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input 
                  id="firstName"
                  v-model="signupForm.firstName"
                  type="text"
                  placeholder="John"
                  required
                  class="form-input"
                />
                <span v-if="errors.firstName" class="error-message">{{ errors.firstName }}</span>
              </div>

              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input 
                  id="lastName"
                  v-model="signupForm.lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  class="form-input"
                />
                <span v-if="errors.lastName" class="error-message">{{ errors.lastName }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                id="email"
                v-model="signupForm.email"
                type="email"
                placeholder="you@example.com"
                required
                class="form-input"
              />
              <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="password-input-wrapper">
                <input 
                  id="password"
                  v-model="signupForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  class="form-input"
                />
                <button 
                  type="button"
                  @click="showPassword = !showPassword"
                  class="password-toggle"
                >
                  {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <div class="password-strength">
                <span v-if="passwordStrength" class="strength-indicator" :class="passwordStrengthClass">
                  {{ passwordStrength }}
                </span>
              </div>
              <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                id="confirmPassword"
                v-model="signupForm.confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                class="form-input"
              />
              <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
            </div>

            <label class="checkbox-option">
              <input v-model="signupForm.agreeTerms" type="checkbox" required />
              <span>
                I agree to the <a href="#" class="link">Terms of Service</a> and 
                <a href="#" class="link">Privacy Policy</a>
              </span>
            </label>
            <span v-if="errors.agreeTerms" class="error-message">{{ errors.agreeTerms }}</span>

            <label class="checkbox-option">
              <input v-model="signupForm.newsletter" type="checkbox" />
              <span>Send me exclusive deals and product updates</span>
            </label>

            <button type="submit" class="btn btn-primary btn-large">
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>

          <!-- Login Link -->
          <p class="login-prompt">
            Already have an account? 
            <router-link to="/login" class="login-link">Sign in</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Signup',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const showPassword = ref(false)

    const signupForm = ref({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
      newsletter: false,
    })

    const errors = ref({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: '',
    })

    const passwordStrength = computed(() => {
      const password = signupForm.value.password
      if (!password) return ''

      let strength = 0
      if (password.length >= 8) strength++
      if (password.length >= 12) strength++
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
      if (/\d/.test(password)) strength++
      if (/[^a-zA-Z\d]/.test(password)) strength++

      const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
      return levels[Math.min(strength - 1, 4)]
    })

    const passwordStrengthClass = computed(() => {
      const strength = passwordStrength.value
      switch (strength) {
        case 'Weak':
          return 'weak'
        case 'Fair':
          return 'fair'
        case 'Good':
          return 'good'
        case 'Strong':
          return 'strong'
        case 'Very Strong':
          return 'very-strong'
        default:
          return ''
      }
    })

    const validateForm = () => {
      errors.value = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: '',
      }
      let isValid = true

      if (!signupForm.value.firstName.trim()) {
        errors.value.firstName = 'First name is required'
        isValid = false
      }

      if (!signupForm.value.lastName.trim()) {
        errors.value.lastName = 'Last name is required'
        isValid = false
      }

      if (!signupForm.value.email) {
        errors.value.email = 'Email is required'
        isValid = false
      } else if (!isValidEmail(signupForm.value.email)) {
        errors.value.email = 'Please enter a valid email'
        isValid = false
      }

      if (!signupForm.value.password) {
        errors.value.password = 'Password is required'
        isValid = false
      } else if (signupForm.value.password.length < 8) {
        errors.value.password = 'Password must be at least 8 characters'
        isValid = false
      }

      if (signupForm.value.password !== signupForm.value.confirmPassword) {
        errors.value.confirmPassword = 'Passwords do not match'
        isValid = false
      }

      if (!signupForm.value.agreeTerms) {
        errors.value.agreeTerms = 'You must agree to the terms'
        isValid = false
      }

      return isValid
    }

    const isValidEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    }

    const handleSignup = async () => {
      if (!validateForm()) {
        return
      }

      isLoading.value = true

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        // In a real app, this would call an API endpoint
        console.log('Signup attempt:', {
          firstName: signupForm.value.firstName,
          lastName: signupForm.value.lastName,
          email: signupForm.value.email,
          newsletter: signupForm.value.newsletter,
        })

        // Mock successful signup
        alert('Account created successfully! Please check your email to verify.')
        router.push('/login')
      } catch (error) {
        console.error('Signup error:', error)
        errors.value.email = 'An error occurred. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    return {
      signupForm,
      errors,
      isLoading,
      showPassword,
      passwordStrength,
      passwordStrengthClass,
      handleSignup,
    }
  },
}
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 2rem;
}

.signup-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  width: 100%;
}

.signup-branding {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-content {
  text-align: center;
}

.brand-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.signup-branding h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
}

.signup-branding p {
  font-size: 1.1rem;
  opacity: 0.95;
  margin-bottom: 2rem;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
  margin-top: 2rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.feature-icon {
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.signup-form-container {
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  max-height: 100vh;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-wrapper h2 {
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.form-subtitle {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.social-signup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
}

.social-btn:hover {
  border-color: #667eea;
  background-color: #f9f9f9;
}

.social-icon {
  font-weight: 700;
  font-size: 1.1rem;
}

.google-btn:hover {
  border-color: #db4437;
}

.facebook-btn:hover {
  border-color: #4267b2;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #ddd;
}

.divider span {
  background-color: white;
  padding: 0 0.75rem;
  color: #999;
  position: relative;
  font-size: 0.9rem;
}

.form {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.password-toggle:hover {
  color: #667eea;
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-indicator {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.strength-indicator.weak {
  background-color: #ffe0e0;
  color: #842029;
}

.strength-indicator.fair {
  background-color: #fff3cd;
  color: #664d03;
}

.strength-indicator.good {
  background-color: #cfe2ff;
  color: #084298;
}

.strength-indicator.strong {
  background-color: #d1e7dd;
  color: #0f5132;
}

.strength-indicator.very-strong {
  background-color: #d1e7dd;
  color: #0f5132;
}

.error-message {
  display: block;
  color: #ff6b6b;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.checkbox-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #333;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
  margin-top: 2px;
  flex-shrink: 0;
}

.link {
  color: #667eea;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-large {
  padding: 1rem;
}

.login-prompt {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
}

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.login-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .signup-container {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .signup-branding {
    padding: 2rem;
    border-radius: 12px 12px 0 0;
  }

  .signup-branding h1 {
    font-size: 1.8rem;
  }

  .signup-branding p {
    font-size: 0.95rem;
  }

  .features {
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .feature {
    font-size: 0.85rem;
  }

  .signup-form-container {
    padding: 2rem 1rem;
    border-radius: 0 0 12px 12px;
  }

  .form-wrapper h2 {
    font-size: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>