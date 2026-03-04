<template>
  <div class="policy-page">
    <div class="policy-container">
      <h1>Shipping &amp; Returns</h1>
      <p class="intro">This page explains our shipping windows, return eligibility, and how refund or reship requests are handled.</p>

      <section>
        <h2>General Terms</h2>
        <ul>
          <li>Policy updates may be posted at any time and apply once published.</li>
          <li>Return or refund requests should be submitted within 20 days of delivery unless a product listing states otherwise.</li>
          <li>Cancellation requests are accepted before shipment, but supplier restrictions may apply.</li>
          <li>For damaged or incorrect items, clear photo/video evidence is required.</li>
        </ul>
      </section>

      <section>
        <h2>Refund Request Timing</h2>
        <ul>
          <li><strong>Unshipped orders:</strong> if processing time is exceeded, full refund is available.</li>
          <li><strong>Shipped orders:</strong> supplier review is typically required before approval.</li>
          <li>If a partner fails to respond within the review window, we may issue a refund per marketplace policy.</li>
        </ul>
      </section>

      <section>
        <h2>Transit &amp; Delivery Issues</h2>
        <ul>
          <li>If a package is returned in transit, refund or redelivery can be requested once status is verified.</li>
          <li>If a shipment is destroyed or significantly delayed, tracking evidence may qualify for refund or reship.</li>
          <li>If delivery details were entered incorrectly, correction is best-effort and may not be guaranteed.</li>
        </ul>
      </section>

      <section>
        <h2>Defective or Incorrect Products</h2>
        <ul>
          <li>Submit evidence showing breakage, missing parts, wrong item, or quality issues.</li>
          <li>When return is required, prepaid labels may be provided for approved defect cases.</li>
          <li>For approved claims, refunds or redelivery are processed within the stated resolution window.</li>
        </ul>
      </section>

      <section>
        <h2>Non-Defective Returns</h2>
        <p>Remorse returns are subject to supplier acceptance. If accepted, a restocking fee may apply according to listing terms.</p>
      </section>

      <section>
        <h2>Need Help?</h2>
        <p>If your order issue is unresolved, please contact support and include your order number and supporting screenshots.</p>
        <router-link to="/contact" class="policy-link">Contact Support</router-link>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShippingReturns',
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
  color: #2F4F3E;
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
