<template>
  <footer class="footer">
    <div class="footer-content">
      <!-- Newsletter Section -->
      <section class="newsletter-section">
        <h3>Subscribe to Our Newsletter</h3>
        <p>Get exclusive deals and camping tips delivered to your inbox</p>
        <form @submit.prevent="subscribeNewsletter" class="newsletter-form">
          <input 
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
            class="newsletter-input"
          />
          <button type="submit" class="newsletter-btn">Subscribe</button>
        </form>
      </section>

      <!-- Footer Links -->
      <div class="footer-links">
        <div class="footer-column">
          <h4>About Camptime</h4>
          <ul>
            <li><a href="#about">About Us</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#press">Press</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="#contact">Contact Us</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#shipping">Shipping Info</a></li>
            <li><a href="#returns">Returns & Exchanges</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Policies</h4>
          <ul>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#cookies">Cookie Policy</a></li>
            <li><a href="#accessibility">Accessibility</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Connect With Us</h4>
          <div class="social-links">
            <a href="#facebook" class="social-link" title="Facebook">f</a>
            <a href="#twitter" class="social-link" title="Twitter">𝕏</a>
            <a href="#instagram" class="social-link" title="Instagram">📷</a>
            <a href="#youtube" class="social-link" title="YouTube">▶</a>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="payment-methods">
        <h4>We Accept</h4>
        <div class="payment-icons">
          <span class="payment-icon">💳</span>
          <span class="payment-icon">🏦</span>
          <span class="payment-icon">₽</span>
          <span class="payment-icon">₿</span>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <p class="copyright">
          &copy; 2026 Camptime. All rights reserved.
        </p>
        <p class="footer-text">
          Made with ♥ for outdoor enthusiasts
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Footer',
  setup() {
    const email = ref('')

    const subscribeNewsletter = async () => {
      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.value }),
        })

        if (response.ok) {
          alert('Thank you for subscribing!')
          email.value = ''
        } else {
          alert('Error subscribing. Please try again.')
        }
      } catch (error) {
        console.error('Error subscribing to newsletter:', error)
      }
    }

    return {
      email,
      subscribeNewsletter,
    }
  },
}
</script>

<style scoped>
.footer {
  background-color: #2F4F3E;
  color: #D9C7A3;
  margin-top: 4rem;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.newsletter-section {
  background: #D9C7A3;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #2B2B2B;
}

.newsletter-section h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.newsletter-section p {
  margin-bottom: 1.5rem;
  opacity: 0.95;
}

.newsletter-form {
  display: flex;
  gap: 0.5rem;
  max-width: 400px;
  margin: 0 auto;
}

.newsletter-input {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
}

.newsletter-btn {
  padding: 0.75rem 1.5rem;
  background-color: #2F4F3E;
  color: #D9C7A3;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.newsletter-btn:hover {
  background-color: #2B2B2B;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-column h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #D9C7A3;
  font-size: 1rem;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column li {
  margin-bottom: 0.75rem;
}

.footer-column a {
  color: #D9C7A3;
  text-decoration: none;
  transition: color 0.3s;
  font-size: 0.95rem;
}

.footer-column a:hover {
  color: #2B2B2B;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(217, 199, 163, 0.2);
  border-radius: 4px;
  color: #D9C7A3;
  text-decoration: none;
  transition: background-color 0.3s;
  font-weight: 600;
}

.social-link:hover {
  background-color: #2B2B2B;
}

.payment-methods {
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(217, 199, 163, 0.3);
}

.payment-methods h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #D9C7A3;
}

.payment-icons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.payment-icon {
  font-size: 1.5rem;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.payment-icon:hover {
  opacity: 1;
}

.footer-bottom {
  margin-top: 2rem;
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(217, 199, 163, 0.3);
}

.copyright {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: #D9C7A3;
}

.footer-text {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(217, 199, 163, 0.9);
}

@media (max-width: 768px) {
  .footer-content {
    padding: 2rem 1rem;
  }

  .newsletter-form {
    flex-direction: column;
  }

  .newsletter-btn {
    width: 100%;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
</style>