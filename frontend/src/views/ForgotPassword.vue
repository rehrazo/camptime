<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="form-wrapper">
        <div class="header">
          <router-link to="/login" class="back-link">← Back to Login</router-link>
          <h1>Reset Password</h1>
          <p class="subtitle">
            {{ currentStep === 'email' ? 'Enter your email to receive reset instructions' : 'Create a new password for your account' }}
          </p>
        </div>

        <!-- Step 1: Email Verification -->
        <div v-if="currentStep === 'email'" class="step-content">
          <form @submit.prevent="sendResetEmail" class="form">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                id="email"
                v-model="email"
                type="email"
                placeholder="you@example.com"
                required
                class="form-input"
              />
              <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </div>

            <button type="submit" :disabled="isLoading" class="btn btn-primary btn-large">
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>

          <div v-if="successMessage" class="success-message">
            ✓ {{ successMessage }}
          </div>

          <div class="help-section">
            <p>Don't receive an email?</p>
            <ul>
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Try a different email address</li>
            </ul>
          </div>
        </div>

        <!-- Step 2: Reset Code Verification -->
        <div v-if="currentStep === 'code'" class="step-content">
          <form @submit.prevent="verifyResetCode" class="form">
            <div class="form-group">
              <label for="resetCode">Verification Code</label>
              <p class="code-info">
                We sent a verification code to {{ maskedEmail }}
              </p>
              <input 
                id="resetCode"
                v-model="resetCode"
                type="text"
                placeholder="000000"
                maxlength="6"
                required
                class="form-input code-input"
              />
              <span v-if="errors.code" class="error-message">{{ errors.code }}</span>
            </div>

            <button type="submit" :disabled="isLoading" class="btn btn-primary btn-large">
              {{ isLoading ? 'Verifying...' : 'Verify Code' }}
            </button>

            <button type="button" @click="resendCode" class="btn btn-secondary btn-large">
              Resend Code
            </button>
          </form>

          <div class="timer" v-if="resendTimer > 0">
            Resend code in {{ resendTimer }}s
          </div>

          <p class="change-email">
            <button type="button" @click="currentStep = 'email'" class="text-btn">
              Use a different email
            </button>
          </p>
        </div>

        <!-- Step 3: New Password -->
        <div v-if="currentStep === 'password'" class="step-content">
          <form @submit.prevent="resetPassword" class="form">
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <div class="password-input-wrapper">
                <input 
                  id="newPassword"
                  v-model="newPassword.password"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  class="form-input"
                  @input="updatePasswordStrength"
                />
                <button 
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="password-toggle"
                >
                  {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              
              <div v-if="passwordStrength" class="password-strength">
                <div class="strength-bar">
                  <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: strengthPercentage + '%' }"></div>
                </div>
                <span class="strength-text" :class="passwordStrengthClass">
                  {{ passwordStrength }}
                </span>
              </div>

              <div class="password-requirements">
                <p>Password must contain:</p>
                <ul>
                  <li :class="{ met: /^.{8,}$/.test(newPassword.password) }">
                    <span class="check">✓</span> At least 8 characters
                  </li>
                  <li :class="{ met: /[a-z]/.test(newPassword.password) && /[A-Z]/.test(newPassword.password) }">
                    <span class="check">✓</span> Mix of uppercase and lowercase
                  </li>
                  <li :class="{ met: /\d/.test(newPassword.password) }">
                    <span class="check">✓</span> At least one number
                  </li>
                  <li :class="{ met: /[^a-zA-Z\d]/.test(newPassword.password) }">
                    <span class="check">✓</span> At least one special character
                  </li>
                </ul>
              </div>

              <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                id="confirmPassword"
                v-model="newPassword.confirm"
                type="password"
                placeholder="••••••••"
                required
                class="form-input"
              />
              <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
            </div>

            <button type="submit" :disabled="isLoading || !isPasswordValid" class="btn btn-primary btn-large">
              {{ isLoading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        </div>

        <!-- Step 4: Success -->
        <div v-if="currentStep === 'success'" class="step-content success-content">
          <div class="success-icon">✓</div>
          <h2>Password Reset Successful!</h2>
          <p>Your password has been successfully reset.</p>
          <router-link to="/login" class="btn btn-primary btn-large">
            Back to Login
          </router-link>
        </div>
      </div>

      <!-- Side Panel - Security Tips -->
      <div class="security-tips">
        <h3>Security Tips</h3>
        <div class="tips-list">
          <div class="tip">
            <span class="tip-icon">🔐</span>
            <div>
              <h4>Use a Strong Password</h4>
              <p>Mix letters, numbers, and symbols for better security</p>
            </div>
          </div>
          <div class="tip">
            <span class="tip-icon">🔔</span>
            <div>
              <h4>Never Share Your Password</h4>
              <p>We will never ask for your password via email</p>
            </div>
          </div>
          <div class="tip">
            <span class="tip-icon">⚠️</span>
            <div>
              <h4>Check for Phishing</h4>
              <p>Always verify you're on camptime.com before entering credentials</p>
            </div>
          </div>
          <div class="tip">
            <span class="tip-icon">📱</span>
            <div>
              <h4>Keep Device Secure</h4>
              <p>Use trusted devices and keep your system updated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ForgotPassword',
  setup() {
    const currentStep = ref('email')
    const email = ref('')
    const resetCode = ref('')
    const showNewPassword = ref(false)
    const isLoading = ref(false)
    const successMessage = ref('')
    const resendTimer = ref(0)

    const newPassword = ref({
      password: '',
      confirm: '',
    })

    const errors = ref({
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
    })

    const passwordStrength = ref('')

    const passwordStrengthClass = computed(() => {
      switch (passwordStrength.value) {
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

    const strengthPercentage = computed(() => {
      const levels = { Weak: 20, Fair: 40, Good: 60, Strong: 80, 'Very Strong': 100 }
      return levels[passwordStrength.value] || 0
    })

    const maskedEmail = computed(() => {
      const parts = email.value.split('@')
      if (parts.length === 2) {
        const [local, domain] = parts
        return `${local.charAt(0)}***@${domain}`
      }
      return email.value
    })

    const isPasswordValid = computed(() => {
      const password = newPassword.value.password
      return (
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^a-zA-Z\d]/.test(password) &&
        newPassword.value.password === newPassword.value.confirm
      )
    })

    const updatePasswordStrength = () => {
      const password = newPassword.value.password
      if (!password) {
        passwordStrength.value = ''
        return
      }

      let strength = 0
      if (password.length >= 8) strength++
      if (password.length >= 12) strength++
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
      if (/\d/.test(password)) strength++
      if (/[^a-zA-Z\d]/.test(password)) strength++

      const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
      passwordStrength.value = levels[Math.min(strength - 1, 4)]
    }

    const sendResetEmail = async () => {
      errors.value.email = ''

      if (!email.value) {
        errors.value.email = 'Email is required'
        return
      }

      if (!isValidEmail(email.value)) {
        errors.value.email = 'Please enter a valid email'
        return
      }

      isLoading.value = true
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        successMessage.value = `Reset link sent to ${email.value}`
        currentStep.value = 'code'
        startResendTimer()
      } catch (error) {
        errors.value.email = 'Error sending reset email'
      } finally {
        isLoading.value = false
      }
    }

    const verifyResetCode = async () => {
      errors.value.code = ''

      if (!resetCode.value) {
        errors.value.code = 'Verification code is required'
        return
      }

      if (resetCode.value.length !== 6) {
        errors.value.code = 'Code must be 6 digits'
        return
      }

      isLoading.value = true
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        currentStep.value = 'password'
      } catch (error) {
        errors.value.code = 'Invalid verification code'
      } finally {
        isLoading.value = false
      }
    }

    const resetPassword = async () => {
      errors.value.password = ''
      errors.value.confirmPassword = ''

      if (!isPasswordValid.value) {
        if (newPassword.value.password !== newPassword.value.confirm) {
          errors.value.confirmPassword = 'Passwords do not match'
        }
        return
      }

      isLoading.value = true
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        currentStep.value = 'success'
      } catch (error) {
        errors.value.password = 'Error resetting password'
      } finally {
        isLoading.value = false
      }
    }

    const resendCode = async () => {
      isLoading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        successMessage.value = 'Verification code resent'
        startResendTimer()
      } finally {
        isLoading.value = false
      }
    }

    const startResendTimer = () => {
      resendTimer.value = 60
      const interval = setInterval(() => {
        resendTimer.value--
        if (resendTimer.value === 0) {
          clearInterval(interval)
        }
      }, 1000)
    }

    const isValidEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    }

    return {
      currentStep,
      email,
      resetCode,
      showNewPassword,
      isLoading,
      successMessage,
      resendTimer,
      newPassword,
      errors,
      passwordStrength,
      passwordStrengthClass,
      strengthPercentage,
      maskedEmail,
      isPasswordValid,
      updatePasswordStrength,
      sendResetEmail,
      verifyResetCode,
      resetPassword,
      resendCode,
    }
  },
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.forgot-password-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  width: 100%;
  max-width: 1000px;
}

.form-wrapper {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  transition: color 0.3s;
}

.back-link:hover {
  text-decoration: underline;
}

.form-wrapper h1 {
  font-size: 2rem;
  color: #333;
  margin: 0.5rem 0 0 0;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0.75rem 0 0 0;
}

.step-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.code-info {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0 0.75rem 0;
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

.code-input {
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 600;
  font-size: 1.5rem;
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
  margin-top: 0.75rem;
}

.strength-bar {
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
  border-radius: 2px;
}

.strength-fill.weak {
  background-color: #ff6b6b;
}

.strength-fill.fair {
  background-color: #ffa94d;
}

.strength-fill.good {
  background-color: #74b9ff;
}

.strength-fill.strong {
  background-color: #55efc4;
}

.strength-fill.very-strong {
  background-color: #00b894;
}

.strength-text {
  font-size: 0.8rem;
  font-weight: 600;
}

.strength-text.weak {
  color: #ff6b6b;
}

.strength-text.fair {
  color: #ffa94d;
}

.strength-text.good {
  color: #74b9ff;
}

.strength-text.strong {
  color: #55efc4;
}

.strength-text.very-strong {
  color: #00b894;
}

.password-requirements {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.password-requirements p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.85rem;
  color: #999;
}

.password-requirements li.met {
  color: #00b894;
}

.check {
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.3s;
}

.password-requirements li.met .check {
  opacity: 1;
}

.error-message {
  display: block;
  color: #ff6b6b;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
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
  margin-bottom: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-large {
  padding: 1rem;
}

.timer {
  text-align: center;
  color: #999;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.change-email {
  text-align: center;
  margin-top: 1rem;
}

.text-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.text-btn:hover {
  color: #5568d3;
}

.help-section {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1.5rem;
}

.help-section p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.help-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-section li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  font-size: 0.85rem;
  color: #666;
}

.help-section li:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #667eea;
  font-weight: bold;
}

.success-content {
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  background-color: #00b894;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1.5rem;
}

.success-content h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.success-content p {
  color: #666;
  margin-bottom: 2rem;
}

.security-tips {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  height: fit-content;
}

.security-tips h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip {
  display: flex;
  gap: 0.75rem;
}

.tip-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tip h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  color: #333;
}

.tip p {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .forgot-password-container {
    grid-template-columns: 1fr;
  }

  .form-wrapper {
    padding: 1.5rem;
  }

  .form-wrapper h1 {
    font-size: 1.5rem;
  }

  .security-tips {
    order: -1;
  }
}
</style>