<template>
  <div class="policy-page">
    <div class="policy-container">
      <h1>Privacy Policy</h1>
      <p class="intro">This policy describes what data we collect, how we use it, and your options for managing your information.</p>

      <section>
        <h2>Information We Collect</h2>
        <ul>
          <li>Account and checkout details such as name, email, address, and phone number.</li>
          <li>Order and payment metadata needed to process purchases securely.</li>
          <li>Technical data such as IP address, browser type, and device information.</li>
        </ul>
      </section>

      <section>
        <h2>How We Use Information</h2>
        <ul>
          <li>To process transactions, deliver orders, and provide customer support.</li>
          <li>To improve site performance and shopping experience.</li>
          <li>To send service updates and optional marketing communications.</li>
        </ul>
      </section>

      <section>
        <h2>Consent &amp; Your Choices</h2>
        <p>By providing information required for a transaction, you consent to its use for that transaction. You may unsubscribe from marketing emails at any time.</p>
      </section>

      <section>
        <h2>Third-Party Services</h2>
        <p>We use trusted providers for payments, analytics, and operational services. These providers only receive data needed for their functions and are governed by their own privacy policies.</p>
      </section>

      <section>
        <h2>Security</h2>
        <p>We apply industry-standard safeguards for data protection, including encrypted payment handling and secure transport where available.</p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>Cookies help maintain sessions, preferences, and cart behavior. You can adjust cookie settings in your browser, but some features may be limited.</p>
      </section>

      <section>
        <h2>Policy Updates &amp; Contact</h2>
        <p>We may update this policy from time to time. For access, correction, or deletion requests, contact our support team.</p>
        <router-link to="/contact" class="policy-link">Contact Support</router-link>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrivacyPolicy',
}
</script>

<style scoped>
.policy-page {
  background: var(--color-sand);
  min-height: 100%;
}

.policy-container {
  max-width: 980px;
  margin: 0 auto;
  padding: 2.5rem 1rem;
}

h1 {
  margin: 0 0 0.75rem;
  color: #2B2B2B;
}

.intro {
  margin-bottom: 1.5rem;
  color: #2B2B2B;
}

section {
  background: #fff;
  border-radius: 8px;
  padding: 1.1rem 1.2rem;
  margin-bottom: 1rem;
}

h2 {
  margin: 0 0 0.6rem;
  color: var(--color-forest);
  font-size: 1.15rem;
}

ul {
  margin: 0;
  padding-left: 1.1rem;
}

li {
  margin: 0.35rem 0;
}

.policy-link {
  font-weight: 700;
}
</style>
