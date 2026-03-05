<template>
  <div class="policy-page">
    <div class="policy-container">
      <h1>Terms &amp; Conditions</h1>
      <p class="intro">These terms govern use of the Camptime website, account features, and purchases made through our storefront.</p>

      <section>
        <h2>Overview</h2>
        <p>By accessing this site or placing an order, you agree to these terms and any related policies linked throughout the storefront.</p>
      </section>

      <section>
        <h2>Store Use</h2>
        <ul>
          <li>You must use the site only for lawful purposes.</li>
          <li>You may not misuse the service, interfere with operations, or distribute harmful code.</li>
          <li>We may suspend service access for violations of these terms.</li>
        </ul>
      </section>

      <section>
        <h2>Products, Pricing &amp; Availability</h2>
        <ul>
          <li>Product availability, pricing, and descriptions can change without notice.</li>
          <li>We aim for accurate listing content but do not guarantee error-free information at all times.</li>
          <li>We may limit or cancel orders where fraud, abuse, or policy conflicts are detected.</li>
        </ul>
      </section>

      <section>
        <h2>Billing &amp; Account Information</h2>
        <p>You are responsible for providing current, complete, and accurate billing and account details for all transactions.</p>
      </section>

      <section>
        <h2>Third-Party Services</h2>
        <p>Certain functionality may involve third-party tools or links. Their services are governed by their own terms and privacy practices.</p>
      </section>

      <section>
        <h2>Liability &amp; Warranties</h2>
        <p>Services are provided on an "as available" basis. To the extent permitted by law, Camptime disclaims implied warranties and limits liability for indirect or consequential damages.</p>
      </section>

      <section>
        <h2>Changes &amp; Contact</h2>
        <p>We may update these terms periodically. Continued use after updates indicates acceptance of revised terms.</p>
        <router-link to="/contact" class="policy-link">Contact Support</router-link>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TermsConditions',
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
