<template>
  <div class="faq-page">
    <!-- Header -->
    <div class="faq-header">
      <h1>Frequently Asked Questions</h1>
      <p>Find answers to common questions about our products and services</p>
    </div>

    <!-- Search Bar -->
    <div class="faq-search-section">
      <div class="search-container">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search FAQs..."
          class="faq-search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- Categories -->
    <div class="faq-container">
      <div class="categories-sidebar">
        <h3>Categories</h3>
        <button 
          v-for="category in categories"
          :key="category"
          @click="selectedCategory = category"
          class="category-btn"
          :class="{ active: selectedCategory === category }"
        >
          {{ category }}
        </button>
      </div>

      <!-- FAQs Content -->
      <div class="faq-content">
        <div v-if="filteredFaqs.length > 0" class="faq-list">
          <div 
            v-for="(faq, index) in filteredFaqs"
            :key="index"
            class="faq-item"
          >
            <button 
              @click="toggleFaq(index)"
              class="faq-question"
              :class="{ active: expandedFaqs.includes(index) }"
            >
              <span class="faq-icon">{{ expandedFaqs.includes(index) ? '−' : '+' }}</span>
              <span class="question-text">{{ faq.question }}</span>
            </button>
            
            <div v-if="expandedFaqs.includes(index)" class="faq-answer">
              <p>{{ faq.answer }}</p>
              <div v-if="faq.subPoints" class="sub-points">
                <ul>
                  <li v-for="point in faq.subPoints" :key="point">
                    {{ point }}
                  </li>
                </ul>
              </div>
              <div v-if="faq.relatedLinks" class="related-links">
                <p><strong>Related:</strong></p>
                <ul>
                  <li v-for="link in faq.relatedLinks" :key="link.text">
                    <a :href="link.url">{{ link.text }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-results">
          <p>No FAQs match your search. Try different keywords or browse by category.</p>
        </div>
      </div>
    </div>

    <!-- Still Need Help Section -->
    <section class="help-section">
      <h2>Still Need Help?</h2>
      <p>Can't find the answer you're looking for? We're here to help!</p>
      
      <div class="help-options">
        <div class="help-card">
          <span class="help-icon">💬</span>
          <h3>Live Chat</h3>
          <p>Chat with our support team in real-time</p>
          <button @click="openChat" class="btn btn-secondary">Start Chat</button>
        </div>

        <div class="help-card">
          <span class="help-icon">📧</span>
          <h3>Email Support</h3>
          <p>Send us an email and we'll respond within 24 hours</p>
          <a href="mailto:support@camptime.com" class="btn btn-secondary">Send Email</a>
        </div>

        <div class="help-card">
          <span class="help-icon">📞</span>
          <h3>Phone Support</h3>
          <p>Call us during business hours (Mon-Fri, 9AM-6PM EST)</p>
          <a href="tel:1-800-CAMPTIME" class="btn btn-secondary">Call Us</a>
        </div>

        <div class="help-card">
          <span class="help-icon">📝</span>
          <h3>Contact Form</h3>
          <p>Fill out our contact form and we'll get back to you</p>
          <router-link to="/contact" class="btn btn-secondary">Contact Us</router-link>
        </div>
      </div>
    </section>

    <!-- Feedback Section -->
    <section class="feedback-section">
      <div class="feedback-container">
        <h2>Was this helpful?</h2>
        <p>Help us improve our FAQ section</p>
        
        <div class="feedback-buttons">
          <button @click="submitFeedback(true)" class="feedback-btn yes">
            👍 Yes, it was helpful
          </button>
          <button @click="submitFeedback(false)" class="feedback-btn no">
            👎 No, I need more help
          </button>
        </div>

        <div v-if="feedbackSubmitted" class="feedback-message">
          ✓ Thank you for your feedback!
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'FAQ',
  setup() {
    const searchQuery = ref('')
    const selectedCategory = ref('All')
    const expandedFaqs = ref([])
    const feedbackSubmitted = ref(false)

    const categories = [
      'All',
      'Orders & Shipping',
      'Returns & Refunds',
      'Products',
      'Account',
      'Payment',
      'Promotions',
    ]

    const faqs = [
      {
        category: 'Orders & Shipping',
        question: 'How long does shipping take?',
        answer: 'We offer three shipping options: Standard (5-7 business days), Express (2-3 business days), and Overnight. Free standard shipping is available on orders over $50. Once your order ships, you\'ll receive an email with a tracking number.',
        subPoints: [
          'Standard Shipping: 5-7 business days ($9.99)',
          'Express Shipping: 2-3 business days ($24.99)',
          'Overnight Shipping: Next business day ($49.99)',
          'Free Shipping on orders over $50',
        ],
      },
      {
        category: 'Orders & Shipping',
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship to most countries worldwide! International shipping rates vary based on destination. To see shipping costs and estimated delivery times, add items to your cart and enter your address at checkout.',
      },
      {
        category: 'Orders & Shipping',
        question: 'Can I track my order?',
        answer: 'Absolutely! Once your order ships, you\'ll receive an email with a tracking number. You can use this number to track your package on our website or the carrier\'s tracking page.',
      },
      {
        category: 'Orders & Shipping',
        question: 'What if my package arrives damaged?',
        answer: 'If your package arrives damaged, please contact us immediately with photos of the damage. We\'ll either send a replacement or issue a full refund. Most replacements are shipped within 24 hours.',
      },
      {
        category: 'Returns & Refunds',
        question: 'What is your return policy?',
        answer: 'We offer a 30-day money-back guarantee on all products. If you\'re not satisfied, simply initiate a return through your account or contact our customer service team. Items must be unused and in original packaging for a full refund.',
        subPoints: [
          '30-day return window from delivery date',
          'Free return shipping on most items',
          'Full refund if item is unused and in original condition',
          'Refunds processed within 5-7 business days after receipt',
        ],
      },
      {
        category: 'Returns & Refunds',
        question: 'How do I start a return?',
        answer: 'Log into your account and go to "My Orders". Select the item you want to return and click "Return Item". Follow the prompts to generate a prepaid return shipping label. Drop off your package at any carrier location.',
      },
      {
        category: 'Returns & Refunds',
        question: 'When will I get my refund?',
        answer: 'Refunds are processed within 5-7 business days after we receive your returned item. You\'ll receive a confirmation email when your refund is processed. The money will appear in your original payment method within 3-5 additional business days.',
      },
      {
        category: 'Returns & Refunds',
        question: 'Can I exchange an item instead of returning it?',
        answer: 'Yes! We offer exchanges for items of equal or greater value. If you want to exchange for a lower-priced item, we\'ll issue the difference as a refund. Contact customer service to arrange an exchange.',
      },
      {
        category: 'Products',
        question: 'Are all products tested for quality?',
        answer: 'Yes, every product is rigorously tested and inspected before shipping. We partner exclusively with trusted brands and quality manufacturers. If you\'re not satisfied with the quality of any product, you have 30 days to return it.',
      },
      {
        category: 'Products',
        question: 'What does "verified purchase" mean?',
        answer: 'Verified purchases indicate that a reviewer actually bought the product from Camptime. These reviews are marked with a special badge, helping other customers identify authentic customer experiences.',
      },
      {
        category: 'Products',
        question: 'How do I choose the right tent size?',
        answer: 'Tent sizes are typically rated by capacity (2-person, 4-person, etc.). For comfort, choose a size that accommodates the number of people plus additional space for gear. A 2-person tent fits 2 sleeping bags snugly; a 3-person tent offers more comfort.',
        subPoints: [
          '2-person tents: Best for backpacking, lightweight',
          '4-person tents: Good for families or extra comfort',
          '6+ person tents: Ideal for group camping',
          'Consider headroom and vestibule space for gear storage',
        ],
      },
      {
        category: 'Products',
        question: 'What sleeping bag temperature rating means?',
        answer: 'The temperature rating indicates the lowest temperature at which the sleeping bag provides adequate warmth for a comfortable night\'s sleep. For three-season camping, a 20°F rating is standard. For winter camping, choose a -10°F to -20°F rating.',
      },
      {
        category: 'Account',
        question: 'How do I create an account?',
        answer: 'Click "Sign Up" in the top navigation, then enter your email and create a password. You\'ll receive a verification email. Click the link to confirm your account. You can also sign up using Google or Facebook.',
      },
      {
        category: 'Account',
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page. Enter your email address, and we\'ll send you a reset link. Click the link in the email and create a new password. You\'ll be able to log in immediately.',
      },
      {
        category: 'Account',
        question: 'Can I change my email address?',
        answer: 'Yes, you can update your email in your account settings. Click your profile icon, select "Settings", and go to "Account Information". Enter your new email and verify it with the confirmation email we send.',
      },
      {
        category: 'Account',
        question: 'How do I delete my account?',
        answer: 'Go to Account Settings and scroll to "Danger Zone". Click "Delete Account". You\'ll be asked to confirm. Please note that this action is permanent and cannot be undone.',
      },
      {
        category: 'Payment',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely.',
      },
      {
        category: 'Payment',
        question: 'Is my payment information secure?',
        answer: 'Absolutely. Our website uses SSL encryption and PCI-DSS compliance to protect your payment information. We never store complete credit card numbers on our servers.',
      },
      {
        category: 'Payment',
        question: 'Why was my payment declined?',
        answer: 'Payment declines can happen for several reasons: insufficient funds, incorrect billing information, or fraud detection. Try using a different card or payment method. If the issue persists, contact your bank or payment provider.',
      },
      {
        category: 'Payment',
        question: 'Do you offer payment plans?',
        answer: 'We currently don\'t offer payment plans, but we accept PayPal which offers financing options on certain purchases. Check PayPal\'s website for current offers.',
      },
      {
        category: 'Promotions',
        question: 'How do I use a coupon code?',
        answer: 'Enter your coupon code in the "Promo Code" field during checkout. The discount will be applied to your order total. Some codes may have minimum order amounts or restrictions.',
      },
      {
        category: 'Promotions',
        question: 'Where can I find current promotions?',
        answer: 'Subscribe to our newsletter for exclusive deals and early access to sales. You can also follow us on social media for flash promotions and limited-time offers.',
      },
      {
        category: 'Promotions',
        question: 'Do you offer student or military discounts?',
        answer: 'Yes! We offer 15% off for verified students and 10% off for active and retired military members. Visit our Student/Military Discounts page to verify your status.',
      },
      {
        category: 'Promotions',
        question: 'Can I combine multiple coupon codes?',
        answer: 'No, only one coupon code can be applied per order. If you have multiple codes, use the one that gives you the best discount.',
      },
    ]

    const filteredFaqs = computed(() => {
      let filtered = faqs

      // Filter by category
      if (selectedCategory.value !== 'All') {
        filtered = filtered.filter(faq => faq.category === selectedCategory.value)
      }

      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
        )
      }

      return filtered
    })

    const toggleFaq = (index) => {
      const faqIndex = expandedFaqs.value.indexOf(index)
      if (faqIndex > -1) {
        expandedFaqs.value.splice(faqIndex, 1)
      } else {
        expandedFaqs.value.push(index)
      }
    }

    const openChat = () => {
      alert('Live chat feature coming soon!')
    }

    const submitFeedback = (helpful) => {
      console.log('Feedback submitted:', helpful ? 'Helpful' : 'Not helpful')
      feedbackSubmitted.value = true
      setTimeout(() => {
        feedbackSubmitted.value = false
      }, 3000)
    }

    return {
      searchQuery,
      selectedCategory,
      expandedFaqs,
      feedbackSubmitted,
      categories,
      faqs,
      filteredFaqs,
      toggleFaq,
      openChat,
      submitFeedback,
    }
  },
}
</script>

<style scoped>
.faq-page {
  background-color: #f9f9f9;
  min-height: 100vh;
}

/* Header */
.faq-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.faq-header h1 {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
}

.faq-header p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.95;
}

/* Search Section */
.faq-search-section {
  padding: 2rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.search-container {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.faq-search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s;
}

.faq-search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

/* Main Container */
.faq-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
}

/* Categories Sidebar */
.categories-sidebar {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  height: fit-content;
  position: sticky;
  top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.categories-sidebar h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #333;
}

.category-btn {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  color: #666;
  font-weight: 500;
}

.category-btn:hover {
  background-color: #f0f0f0;
  color: #667eea;
}

.category-btn.active {
  background-color: #667eea;
  color: white;
}

/* FAQ Content */
.faq-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.faq-list {
  display: flex;
  flex-direction: column;
}

.faq-item {
  border-bottom: 1px solid #e0e0e0;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-question {
  width: 100%;
  padding: 1.5rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.faq-question:hover {
  background-color: #f9f9f9;
  color: #667eea;
}

.faq-question.active {
  background-color: #e8f0ff;
  color: #667eea;
}

.faq-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.question-text {
  flex: 1;
}

.faq-answer {
  padding: 0 1.5rem 1.5rem 3.5rem;
  color: #666;
  line-height: 1.8;
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

.faq-answer p {
  margin: 0 0 1rem 0;
}

.sub-points {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.sub-points ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sub-points li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.sub-points li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #667eea;
  font-weight: bold;
}

.related-links {
  background-color: #e8f0ff;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.related-links p {
  margin: 0 0 0.75rem 0;
}

.related-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.related-links li {
  margin-bottom: 0.5rem;
}

.related-links a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.related-links a:hover {
  text-decoration: underline;
}

.no-results {
  padding: 3rem;
  text-align: center;
  color: #666;
}

/* Help Section */
.help-section {
  max-width: 1200px;
  margin: 3rem auto 0 auto;
  padding: 3rem 2rem;
  text-align: center;
}

.help-section h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.help-section p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.help-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.help-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.help-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.help-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.help-card h3 {
  margin: 1rem 0 0.5rem 0;
  color: #333;
}

.help-card p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
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
}

.btn-secondary {
  background-color: #667eea;
  color: white;
}

.btn-secondary:hover {
  background-color: #5568d3;
}

/* Feedback Section */
.feedback-section {
  background-color: #f0f8f4;
  padding: 3rem 2rem;
  margin-top: 3rem;
}

.feedback-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.feedback-section h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.feedback-section p {
  color: #666;
  margin-bottom: 1.5rem;
}

.feedback-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.feedback-btn {
  padding: 0.75rem 2rem;
  border-radius: 4px;
  border: 2px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.feedback-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.feedback-btn.yes:hover {
  background-color: #d4edda;
  border-color: #00b894;
  color: #00b894;
}

.feedback-btn.no:hover {
  background-color: #f8d7da;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.feedback-message {
  background-color: #d4edda;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  animation: slideDown 0.3s ease-in;
}

@media (max-width: 768px) {
  .faq-container {
    grid-template-columns: 1fr;
  }

  .categories-sidebar {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .categories-sidebar h3 {
    width: 100%;
  }

  .category-btn {
    flex: 1;
    min-width: 100px;
    margin-bottom: 0;
  }

  .faq-header h1 {
    font-size: 1.8rem;
  }

  .faq-answer {
    padding-left: 1.5rem;
  }

  .feedback-buttons {
    flex-direction: column;
  }

  .help-options {
    grid-template-columns: 1fr;
  }
}
</style>