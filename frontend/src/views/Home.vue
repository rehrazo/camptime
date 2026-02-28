<template>
  <div class="home">
    <section class="hero" :style="heroStyle">
      <div class="hero-content">
        <h1>Welcome to It's Camp Time</h1>
        <p>Your ultimate destination for premium camping gear and outdoor equipment</p>
        <router-link to="/products" class="btn btn-primary">Shop Now</router-link>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <h2>Why Choose Us?</h2>
        <div class="features-grid">
          <div class="feature">
            <h3>Quality Gear</h3>
            <p>We only stock the best camping equipment from trusted brands</p>
          </div>
          <div class="feature">
            <h3>Best Prices</h3>
            <p>Competitive pricing on all our products with frequent sales</p>
          </div>
          <div class="feature">
            <h3>Fast Shipping</h3>
            <p>Quick and reliable delivery to get you ready for your adventure</p>
          </div>
          <div class="feature">
            <h3>Expert Support</h3>
            <p>Our team is here to help you find the perfect gear</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta">
      <div class="container">
        <h2>Ready for Your Next Adventure?</h2>
        <p>Browse our collection of camping gear and start planning your trip</p>
        <router-link to="/products" class="btn btn-secondary">Explore Products</router-link>
      </div>
    </section>
  </div>
</template>

<script>
import homeBanner from '../assets/images/site/home_page_banner_cropped.jpg'

export default {
  name: 'Home',
  setup() {
    const heroStyle = {
      backgroundImage: `linear-gradient(rgba(43, 43, 43, 0.35), rgba(43, 43, 43, 0.35)), url(${homeBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }

    return { heroStyle }
  },
}
</script>

<style scoped>
.home {
  width: 100%;
}

.hero {
  color: #fff;
  min-height: 86vh;
  padding: 7rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero-content p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #2F4F3E;
  color: #D9C7A3;
}

.btn-primary:hover {
  background-color: #2B2B2B;
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: #2F4F3E;
  color: #D9C7A3;
  border: 2px solid #2F4F3E;
}

.btn-secondary:hover {
  background-color: transparent;
  transform: translateY(-2px);
}

.features {
  padding: 4rem 2rem;
  background-color: #D9C7A3;
}

.features h2 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.feature h3 {
  color: #2F4F3E;
  margin-bottom: 1rem;
}

.cta {
  background: #2F4F3E;
  color: #D9C7A3;
  padding: 4rem 2rem;
  text-align: center;
}

.cta h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.cta p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
