<template>
  <div class="home">
    <section class="hero" :style="heroStyle">
      <div class="hero-overlay"></div>
      <div class="hero-content container">
        <p class="hero-brand">IT'S CAMP TIME</p>
        <h1>PACK UP. HEAD OUT. CAMP ON.</h1>
        <p>Premium camping, hiking, and outdoor essentials built for every adventure.</p>
        <router-link to="/products" class="btn btn-primary">Shop Now</router-link>
      </div>
    </section>

    <section class="category-section">
      <div class="container">
        <h2>Featured Categories</h2>
        <div class="category-grid">
          <article v-for="category in featuredCategories" :key="category.title" class="category-card" :style="categoryCardStyle(category.image)">
            <div class="card-overlay"></div>
            <div class="card-content">
              <h3>{{ category.title }}</h3>
              <router-link :to="category.to" class="card-link">Shop Now</router-link>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="welcome-section">
      <div class="container welcome-content">
        <h2>Welcome to It's Camp Time</h2>
        <p>
          Here at It's Camp Time, our mission is to deliver a fast, user-friendly shopping experience
          with high-quality camping products at fair prices.
        </p>
        <p class="promise">We promise the highest quality camping products.</p>
      </div>
    </section>

    <section class="category-section recommended">
      <div class="container">
        <h2>Recommended</h2>
        <p class="section-subtitle">Popular &amp; top-rated collections</p>
        <div class="category-grid">
          <article v-for="category in recommendedCategories" :key="category.title" class="category-card" :style="categoryCardStyle(category.image)">
            <div class="card-overlay"></div>
            <div class="card-content">
              <h3>{{ category.title }}</h3>
              <router-link :to="category.to" class="card-link">Shop Now</router-link>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="cta">
      <div class="container">
        <h2>Get In Touch</h2>
        <p>What can we do to help?</p>
        <router-link to="/contact" class="btn btn-secondary">Contact Us</router-link>
      </div>
    </section>

    <section class="trust-section">
      <div class="container trust-grid">
        <div class="trust-card">
          <h3>Secure Payments</h3>
          <p>Shop confidently with protected checkout and reliable order support.</p>
        </div>
        <div class="trust-card">
          <h3>Fast Shipping</h3>
          <p>Quick processing and dependable delivery on camping essentials.</p>
        </div>
        <div class="trust-card">
          <h3>Customer First</h3>
          <p>Friendly service from a team that understands outdoor gear.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import homeBanner from '../../assets/images/site/home_page_banner_cropped.jpg'

const defaultRoute = '/products'

export default {
  name: 'Home',
  setup() {
    const heroStyle = {
      backgroundImage: `url(${homeBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }

    const featuredCategories = [
      { title: 'Tents / Shelter', image: homeBanner, to: defaultRoute },
      { title: 'Sleeping Gear', image: homeBanner, to: defaultRoute },
      { title: 'Camping Cookware', image: homeBanner, to: defaultRoute },
      { title: 'Hiking Gear', image: homeBanner, to: defaultRoute },
    ]

    const recommendedCategories = [
      { title: 'Power & Lighting', image: homeBanner, to: defaultRoute },
      { title: 'Survival Tools', image: homeBanner, to: defaultRoute },
      { title: 'Camping Clothing', image: homeBanner, to: defaultRoute },
      { title: 'Camping Furniture', image: homeBanner, to: defaultRoute },
    ]

    const categoryCardStyle = (image) => {
      return {
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }

    return {
      heroStyle,
      featuredCategories,
      recommendedCategories,
      categoryCardStyle,
    }
  },
}
</script>

<style scoped>
.home {
  width: 100%;
  background: var(--color-sand);
}

.hero {
  min-height: 78vh;
  position: relative;
  display: flex;
  align-items: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(43, 43, 43, 0.45);
}

.hero-content {
  position: relative;
  z-index: 1;
  color: #fff;
  text-align: center;
  padding: 5rem 1rem;
}

.hero-brand {
  letter-spacing: 0.12em;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero-content h1 {
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  margin-bottom: 1rem;
}

.hero-content p {
  max-width: 720px;
  margin: 0 auto 2rem;
  font-size: 1.1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-forest);
  color: var(--color-sand);
}

.btn-primary:hover {
  background-color: var(--color-charcoal);
  text-decoration: none;
}

.btn-secondary {
  background-color: var(--color-sand);
  color: var(--color-charcoal);
}

.btn-secondary:hover {
  background-color: #fff;
  text-decoration: none;
}

.category-section,
.welcome-section,
.cta,
.trust-section {
  padding: 4rem 0;
}

.category-section h2,
.welcome-section h2,
.cta h2 {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  margin-bottom: 1rem;
  text-align: center;
  color: var(--color-charcoal);
}

.section-subtitle {
  text-align: center;
  color: var(--color-charcoal);
  opacity: 0.8;
  margin-bottom: 2rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.category-card {
  position: relative;
  min-height: 200px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: end;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(43, 43, 43, 0.45);
}

.card-content {
  position: relative;
  z-index: 1;
  color: #fff;
  padding: 1rem;
}

.card-content h3 {
  margin-bottom: 0.5rem;
}

.card-link {
  color: var(--color-sand);
  font-weight: 600;
}

.welcome-section {
  background: #fff;
}

.welcome-content {
  text-align: center;
  max-width: 860px;
}

.welcome-content p {
  color: var(--color-charcoal);
  opacity: 0.9;
  margin: 0 auto 1rem;
}

.promise {
  font-weight: 700;
}

.recommended {
  background: rgba(99, 172, 77, 0.07);
}

.cta {
  background: var(--color-forest);
  color: var(--color-sand);
  text-align: center;
}

.cta h2,
.cta p {
  color: var(--color-sand);
}

.cta p {
  margin-bottom: 1.5rem;
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.trust-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
}

.trust-card h3 {
  color: var(--color-forest);
  margin-bottom: 0.5rem;
}

.trust-card p {
  color: var(--color-charcoal);
}

@media (max-width: 768px) {
  .hero {
    min-height: 66vh;
  }
}
</style>
