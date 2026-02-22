<template>
  <div class="contact-page">
    <div class="contact-container">
      <!-- Header -->
      <div class="contact-header">
        <h1>Get in Touch</h1>
        <p>Have a question or feedback? We'd love to hear from you!</p>
      </div>

      <!-- Content Grid -->
      <div class="contact-content">
        <!-- Contact Form -->
        <div class="contact-form-section">
          <h2>Send us a Message</h2>
          
          <form @submit.prevent="submitForm" class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Name</label>
                <input 
                  id="name"
                  v-model="form.name"
                  type="text"
                  placeholder="Your name"
                  required
                  class="form-input"
                />
                <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input 
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  class="form-input"
                />
                <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="phone">Phone Number (Optional)</label>
              <input 
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="subject">Subject</label>
              <select v-model="form.subject" id="subject" required class="form-input">
                <option value="">Select a subject</option>
                <option value="order">Order Issues</option>
                <option value="product">Product Questions</option>
                <option value="shipping">Shipping & Delivery</option>
                <option value="return">Returns & Refunds</option>
                <option value="feedback">General Feedback</option>
                <option value="partnership">Partnership Inquiry</option>
                <option value="other">Other</option>
              </select>
              <span v-if="errors.subject" class="error-message">{{ errors.subject }}</span>
            </div>

            <div class="form-group">
              <label for="priority">Priority</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input v-model="form.priority" type="radio" value="low" />
                  <span>Low - General inquiry</span>
                </label>
                <label class="radio-option">
                  <input v-model="form.priority" type="radio" value="medium" />
                  <span>Medium - Need response soon</span>
                </label>
                <label class="radio-option">
                  <input v-model="form.priority" type="radio" value="high" />
                  <span>High - Urgent matter</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label for="message">Message</label>
              <textarea 
                id="message"
                v-model="form.message"
                placeholder="Tell us what's on your mind..."
                rows="6"
                required
                class="form-input"
              ></textarea>
              <div class="character-count">
                {{ form.message.length }} / 5000 characters
              </div>
              <span v-if="errors.message" class="error-message">{{ errors.message }}</span>
            </div>

            <div class="form-group">
              <label class="checkbox-option">
                <input v-model="form.subscribe" type="checkbox" />
                <span>Subscribe to our newsletter for updates and offers</span>
              </label>
            </div>

            <button type="submit" :disabled="isLoading" class="btn btn-primary btn-large">
              {{ isLoading ? 'Sending...' : 'Send Message' }}
            </button>

            <div v-if="successMessage" class="success-message">
              ✓ {{ successMessage }}
            </div>
          </form>
        </div>

        <!-- Contact Information -->
        <div class="contact-info-section">
          <!-- Quick Contact -->
          <div class="info-card">
            <h3>Quick Contact</h3>
            
            <div class="contact-item">
              <span class="contact-icon">📧</span>
              <div>
                <h4>Email</h4>
                <p><a href="mailto:support@camptime.com">support@camptime.com</a></p>
                <small>Response time: 24-48 hours</small>
              </div>
            </div>

            <div class="contact-item">
              <span class="contact-icon">📞</span>
              <div>
                <h4>Phone</h4>
                <p><a href="tel:1-800-CAMPTIME">1-800-CAMPTIME</a></p>
                <small>Mon-Fri: 9 AM - 6 PM EST</small>
              </div>
            </div>

            <div class="contact-item">
              <span class="contact-icon">💬</span>
              <div>
                <h4>Live Chat</h4>
                <p><a href="#" @click.prevent="openChat">Start a conversation</a></p>
                <small>Available during business hours</small>
              </div>
            </div>

            <div class="contact-item">
              <span class="contact-icon">📍</span>
              <div>
                <h4>Office Location</h4>
                <p>123 Adventure Lane<br>Denver, CO 80202<br>USA</p>
              </div>
            </div>
          </div>

          <!-- Business Hours -->
          <div class="info-card">
            <h3>Business Hours</h3>
            <div class="hours-list">
              <div class="hour-item">
                <span class="day">Monday - Friday</span>
                <span class="time">9:00 AM - 6:00 PM EST</span>
              </div>
              <div class="hour-item">
                <span class="day">Saturday</span>
                <span class="time">10:00 AM - 4:00 PM EST</span>
              </div>
              <div class="hour-item">
                <span class="day">Sunday</span>
                <span class="time">Closed</span>
              </div>
            </div>
          </div>

          <!-- FAQ Link -->
          <div class="info-card">
            <h3>Still have questions?</h3>
            <p>Check our FAQ for quick answers to common questions.</p>
            <router-link to="/faq" class="btn btn-secondary btn-small">
              View FAQ
            </router-link>
          </div>

          <!-- Social Media -->
          <div class="info-card">
            <h3>Follow Us</h3>
            <div class="social-links">
              <a href="#" class="social-link" title="Facebook">f</a>
              <a href="#" class="social-link" title="Twitter">𝕏</a>
              <a href="#" class="social-link" title="Instagram">📷</a>
              <a href="#" class="social-link" title="YouTube">▶</a>
              <a href="#" class="social-link" title="Pinterest">P</a>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div class="faq-list">
          <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
            <button 
              @click="toggleFaq(index)"
              class="faq-question"
              :class="{ active: expandedFaq === index }"
            >
              <span class="faq-icon">{{ expandedFaq === index ? '−' : '+' }}</span>
              {{ faq.question }}
            </button>
            <div v-if="expandedFaq === index" class="faq-answer">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Contact',
  setup() {
    const isLoading = ref(false)
    const successMessage = ref('')
    const expandedFaq = ref(null)

    const form = ref({
      name: '',
      email: '',
      phone: '',
      subject: '',
      priority: 'medium',
      message: '',
      subscribe: false,
    })

    const errors = ref({
      name: '',
      email: '',
      subject: '',
      message: '',
    })

    const faqs = [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day money-back guarantee on all products. If you\'re not satisfied with your purchase, simply return it within 30 days of delivery for a full refund or exchange.',
      },
      {
        question: 'How long does shipping take?',
        answer: 'Standard shipping typically takes 5-7 business days. Express shipping takes 2-3 business days, and overnight shipping is available for urgent orders. Free shipping is available on orders over $50.',
      },
      {
        question: 'Do you offer international shipping?',
        answer: 'Yes, we ship to most countries worldwide. International shipping rates vary by location. Please add your address at checkout to see the shipping cost for your location.',
      },
      {
        question: 'How can I track my order?',
        answer: 'Once your order ships, you\'ll receive an email with a tracking number. You can use this number to track your package on our website or the carrier\'s website.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers for wholesale orders.',
      },
      {
        question: 'Are your products environmentally friendly?',
        answer: 'We\'re committed to sustainability. Many of our products are made from eco-friendly materials, and we use recyclable packaging. Check individual product pages for sustainability information.',
      },
    ]

    const validateForm = () => {
      errors.value = { name: '', email: '', subject: '', message: '' }
      let isValid = true

      if (!form.value.name.trim()) {
        errors.value.name = 'Name is required'
        isValid = false
      }

      if (!form.value.email) {
        errors.value.email = 'Email is required'
        isValid = false
      } else if (!isValidEmail(form.value.email)) {
        errors.value.email = 'Please enter a valid email'
        isValid = false
      }

      if (!form.value.subject) {
        errors.value.subject = 'Please select a subject'
        isValid = false
      }

      if (!form.value.message.trim()) {
        errors.value.message = 'Message is required'
        isValid = false
      } else if (form.value.message.length > 5000) {
        errors.value.message = 'Message must be less than 5000 characters'
        isValid = false
      }

      return isValid
    }

    const isValidEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(email)
    }

    const submitForm = async () => {
      if (!validateForm()) {
        return
      }

      isLoading.value = true
      successMessage.value = ''

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log('Contact form submitted:', form.value)

        successMessage.value = 'Thank you for your message! We\'ll get back to you within 24-48 hours.'
        
        // Reset form
        form.value = {
          name: '',
          email: '',
          phone: '',
          subject: '',
          priority: 'medium',
          message: '',
          subscribe: false,
        }

        // Hide message after 5 seconds
        setTimeout(() => {
          successMessage.value = ''
        }, 5000)
      } catch (error) {
        console.error('Error submitting form:', error)
        successMessage.value = 'Error sending message. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const toggleFaq = (index) => {
      expandedFaq.value = expandedFaq.value === index ? null : index
    }

    const openChat = () => {
      alert('Live chat feature coming soon!')
    }

    return {
      form,
      errors,
      isLoading,
      successMessage,
      expandedFaq,
      faqs,
      submitForm,
      toggleFaq,
      openChat,
    }
  },
}
</script>

<style scoped>
.contact-page {
  background-color: #f9f9f9;
  padding: 2rem;
}

.contact-container {
  max-width: 1200px;
  margin: 0 auto;
}

.contact-header {
  text-align: center;
  margin-bottom: 3rem;
}

.contact-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.contact-header p {
  font-size: 1.1rem;
  color: #666;
}

.contact-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.contact-form-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.contact-form-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

.character-count {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
  text-align: right;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
}

.btn:disabled {
  opacity: 0.7;
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

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.contact-info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.2rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.contact-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.contact-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.contact-item h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.contact-item p {
  margin: 0.25rem 0;
  color: #666;
}

.contact-item a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.contact-item a:hover {
  text-decoration: underline;
}

.contact-item small {
  display: block;
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hour-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.day {
  font-weight: 600;
  color: #333;
}

.time {
  color: #666;
  font-size: 0.9rem;
}

.social-links {
  display: flex;
  gap: 0.75rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #667eea;
  color: white;
  border-radius: 50%;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.social-link:hover {
  background-color: #5568d3;
  transform: translateY(-2px);
}

.faq-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.faq-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  color: #333;
  text-align: center;
  border-bottom: 2px solid #667eea;
  padding-bottom: 1rem;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.faq-question {
  width: 100%;
  padding: 1rem;
  background-color: #f9f9f9;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  transition: all 0.3s;
  text-align: left;
}

.faq-question:hover {
  background-color: #e8f0ff;
  color: #667eea;
}

.faq-question.active {
  background-color: #667eea;
  color: white;
}

.faq-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
  font-weight: 700;
}

.faq-answer {
  padding: 1rem;
  color: #666;
  line-height: 1.6;
  animation: slideDown 0.3s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .contact-content {
    grid-template-columns: 1fr;
  }

  .contact-header h1 {
    font-size: 1.8rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .faq-section {
    padding: 1rem;
  }

  .faq-question {
    padding: 0.75rem;
    font-size: 0.95rem;
  }
}
</style>