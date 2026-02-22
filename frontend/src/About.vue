<template>
  <div class="about-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1>About Camptime</h1>
        <p>Your trusted companion for outdoor adventures</p>
      </div>
    </div>

    <!-- Mission Section -->
    <section class="mission-section">
      <div class="container">
        <div class="mission-grid">
          <div class="mission-item">
            <div class="icon">🎯</div>
            <h3>Our Mission</h3>
            <p>To empower outdoor enthusiasts with high-quality camping gear and expert knowledge, making wilderness adventures accessible and enjoyable for everyone.</p>
          </div>
          <div class="mission-item">
            <div class="icon">👁️</div>
            <h3>Our Vision</h3>
            <p>To be the leading provider of premium camping equipment and outdoor experiences, inspiring people to disconnect from the digital world and reconnect with nature.</p>
          </div>
          <div class="mission-item">
            <div class="icon">💚</div>
            <h3>Our Values</h3>
            <p>We believe in quality, sustainability, customer satisfaction, and environmental responsibility. Every product reflects our commitment to excellence.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Story Section -->
    <section class="story-section">
      <div class="container">
        <div class="story-grid">
          <div class="story-text">
            <h2>Our Story</h2>
            <p>
              Camptime was founded in 2015 by a group of passionate outdoor enthusiasts who grew frustrated with the lack of quality camping gear options. What started as a small project to curate the best camping equipment has grown into a thriving business serving thousands of customers worldwide.
            </p>
            <p>
              We began with a simple belief: everyone deserves access to reliable, high-quality camping gear at fair prices. Whether you're a seasoned backcountry explorer or just starting your outdoor journey, we're here to support you every step of the way.
            </p>
            <p>
              Today, Camptime is proud to be a leading destination for camping enthusiasts, offering carefully selected products from trusted brands and expert guides to help you make the most of your outdoor adventures.
            </p>
          </div>
          <div class="story-image">
            <img src="/images/about-hero.jpg" alt="Camptime founders" />
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">50K+</div>
            <div class="stat-label">Happy Customers</div>
            <p>Trusted by outdoor enthusiasts worldwide</p>
          </div>
          <div class="stat-card">
            <div class="stat-number">200+</div>
            <div class="stat-label">Quality Products</div>
            <p>Carefully curated selection</p>
          </div>
          <div class="stat-card">
            <div class="stat-number">50+</div>
            <div class="stat-label">Premium Brands</div>
            <p>Partners we trust and recommend</p>
          </div>
          <div class="stat-card">
            <div class="stat-number">8+</div>
            <div class="stat-label">Years in Business</div>
            <p>Proven track record of excellence</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="team-section">
      <div class="container">
        <h2>Meet Our Team</h2>
        <p class="section-subtitle">Passionate outdoor enthusiasts dedicated to your adventure</p>
        
        <div class="team-grid">
          <div v-for="member in teamMembers" :key="member.id" class="team-member">
            <div class="member-image">
              <img :src="member.image" :alt="member.name" />
            </div>
            <h3>{{ member.name }}</h3>
            <p class="member-role">{{ member.role }}</p>
            <p class="member-bio">{{ member.bio }}</p>
            <div class="member-social">
              <a v-for="social in member.socials" :key="social.name" 
                 :href="social.link" 
                 :title="social.name"
                 class="social-link">
                {{ social.icon }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="values-section">
      <div class="container">
        <h2>Our Core Values</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">🏆</div>
            <h3>Quality First</h3>
            <p>We never compromise on quality. Every product is rigorously tested and meets our high standards before reaching our customers.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🌱</div>
            <h3>Sustainability</h3>
            <p>We're committed to protecting the environment. We partner with eco-friendly brands and minimize our carbon footprint.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">💪</div>
            <h3>Customer Focus</h3>
            <p>Your satisfaction is our priority. We provide exceptional customer service and support you throughout your journey.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🤝</div>
            <h3>Community</h3>
            <p>We believe in building a strong community of outdoor enthusiasts where everyone can share experiences and learn together.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">💡</div>
            <h3>Innovation</h3>
            <p>We continuously seek new ways to improve our products and services to enhance your outdoor experience.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">✨</div>
            <h3>Excellence</h3>
            <p>We strive for excellence in everything we do, from product selection to customer service.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Sustainability Section -->
    <section class="sustainability-section">
      <div class="container">
        <h2>Our Commitment to Sustainability</h2>
        <div class="sustainability-content">
          <div class="sustainability-text">
            <h3>Making a Positive Impact</h3>
            <p>
              At Camptime, we believe that outdoor enthusiasts have a responsibility to protect the environments we love to explore. That's why sustainability is at the heart of everything we do.
            </p>
            <ul class="sustainability-list">
              <li>Partner exclusively with eco-conscious brands</li>
              <li>Use 100% recyclable packaging materials</li>
              <li>Plant one tree for every order placed</li>
              <li>Support conservation organizations</li>
              <li>Minimize waste through efficient operations</li>
              <li>Carbon-neutral shipping options available</li>
            </ul>
          </div>
          <div class="sustainability-stats">
            <div class="eco-stat">
              <div class="eco-number">10K+</div>
              <div class="eco-label">Trees Planted</div>
            </div>
            <div class="eco-stat">
              <div class="eco-number">500T</div>
              <div class="eco-label">Waste Diverted</div>
            </div>
            <div class="eco-stat">
              <div class="eco-number">100%</div>
              <div class="eco-label">Recyclable Packaging</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Partners Section -->
    <section class="partners-section">
      <div class="container">
        <h2>Our Brand Partners</h2>
        <p class="section-subtitle">We work with the best brands in the industry</p>
        
        <div class="partners-grid">
          <div v-for="brand in partners" :key="brand.id" class="partner-card">
            <img :src="brand.logo" :alt="brand.name" />
            <p>{{ brand.name }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline Section -->
    <section class="timeline-section">
      <div class="container">
        <h2>Our Journey</h2>
        <div class="timeline">
          <div v-for="(event, index) in timeline" :key="index" class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>{{ event.year }}</h3>
              <p><strong>{{ event.title }}</strong></p>
              <p>{{ event.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact CTA Section -->
    <section class="contact-cta">
      <div class="container">
        <h2>Get in Touch</h2>
        <p>Have questions? We'd love to hear from you!</p>
        <router-link to="/contact" class="btn btn-primary btn-large">
          Contact Us
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'About',
  setup() {
    const teamMembers = [
      {
        id: 1,
        name: 'John Martinez',
        role: 'Founder & CEO',
        bio: 'Passionate mountaineer with 15+ years of outdoor experience. John founded Camptime with a vision to make quality gear accessible to everyone.',
        image: 'https://i.pravatar.cc/150?img=1',
        socials: [
          { name: 'LinkedIn', icon: '🔗', link: '#' },
          { name: 'Twitter', icon: '𝕏', link: '#' },
        ],
      },
      {
        id: 2,
        name: 'Sarah Chen',
        role: 'Head of Product',
        bio: 'Experienced product designer with a keen eye for quality and innovation. Sarah ensures every product meets our high standards.',
        image: 'https://i.pravatar.cc/150?img=2',
        socials: [
          { name: 'LinkedIn', icon: '🔗', link: '#' },
          { name: 'Instagram', icon: '📷', link: '#' },
        ],
      },
      {
        id: 3,
        name: 'Michael Johnson',
        role: 'Customer Experience Manager',
        bio: 'Dedicated to ensuring every customer has an exceptional experience. Michael leads our support team with passion and expertise.',
        image: 'https://i.pravatar.cc/150?img=3',
        socials: [
          { name: 'LinkedIn', icon: '🔗', link: '#' },
          { name: 'Twitter', icon: '𝕏', link: '#' },
        ],
      },
      {
        id: 4,
        name: 'Emily Rodriguez',
        role: 'Content & Community Manager',
        bio: 'Emily creates inspiring content and builds our thriving community of outdoor enthusiasts. She loves sharing adventure stories.',
        image: 'https://i.pravatar.cc/150?img=4',
        socials: [
          { name: 'Instagram', icon: '📷', link: '#' },
          { name: 'Twitter', icon: '𝕏', link: '#' },
        ],
      },
      {
        id: 5,
        name: 'David Kim',
        role: 'Supply Chain Manager',
        bio: 'Expert in logistics and sustainability. David ensures our products reach customers efficiently while minimizing environmental impact.',
        image: 'https://i.pravatar.cc/150?img=5',
        socials: [
          { name: 'LinkedIn', icon: '🔗', link: '#' },
        ],
      },
      {
        id: 6,
        name: 'Lisa Anderson',
        role: 'Head of Marketing',
        bio: 'Creative marketing professional passionate about storytelling. Lisa helps connect with outdoor enthusiasts worldwide.',
        image: 'https://i.pravatar.cc/150?img=6',
        socials: [
          { name: 'LinkedIn', icon: '🔗', link: '#' },
          { name: 'Instagram', icon: '📷', link: '#' },
        ],
      },
    ]

    const partners = [
      { id: 1, name: 'CampGear', logo: '/images/brands/campgear.png' },
      { id: 2, name: 'NatureRest', logo: '/images/brands/naturerest.png' },
      { id: 3, name: 'TrailBlaze', logo: '/images/brands/trailblaze.png' },
      { id: 4, name: 'CookWild', logo: '/images/brands/cookwild.png' },
      { id: 5, name: 'ComfortCamp', logo: '/images/brands/comfortcamp.png' },
      { id: 6, name: 'LightPath', logo: '/images/brands/lightpath.png' },
    ]

    const timeline = [
      {
        year: '2015',
        title: 'Founded',
        description: 'Camptime is founded by a group of passionate outdoor enthusiasts with a vision to provide quality camping gear.',
      },
      {
        year: '2016',
        title: 'First 1,000 Customers',
        description: 'Reached our first major milestone with 1,000 satisfied customers across North America.',
      },
      {
        year: '2017',
        title: 'Expanded Product Line',
        description: 'Launched new categories including sleeping gear, lighting, and accessories.',
      },
      {
        year: '2018',
        title: 'International Expansion',
        description: 'Began shipping to Europe and Asia, growing our global customer base.',
      },
      {
        year: '2019',
        title: 'Sustainability Initiative',
        description: 'Committed to planting one tree for every order and using 100% recyclable packaging.',
      },
      {
        year: '2020',
        title: 'Community Growth',
        description: 'Launched our online community platform, connecting thousands of outdoor enthusiasts.',
      },
      {
        year: '2021',
        title: '50,000+ Customers',
        description: 'Celebrated reaching 50,000 happy customers worldwide.',
      },
      {
        year: '2023',
        title: 'New Headquarters',
        description: 'Opened a state-of-the-art headquarters in Denver, Colorado.',
      },
    ]

    return {
      teamMembers,
      partners,
      timeline,
    }
  },
}
</script>

<style scoped>
.about-page {
  background-color: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6rem 2rem;
  text-align: center;
}

.hero-content h1 {
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.hero-content p {
  font-size: 1.3rem;
  margin: 0;
  opacity: 0.95;
}

/* Mission Section */
.mission-section {
  padding: 4rem 0;
  background-color: #f9f9f9;
}

.mission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.mission-item {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.mission-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.mission-item .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.mission-item h3 {
  margin: 1rem 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.mission-item p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* Story Section */
.story-section {
  padding: 4rem 0;
}

.story-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.story-text h2 {
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.story-text p {
  color: #666;
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

.story-image img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Stats Section */
.stats-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.stat-card {
  text-align: center;
  padding: 2rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.stat-card p {
  opacity: 0.9;
  margin: 0;
}

/* Team Section */
.team-section {
  padding: 4rem 0;
  background-color: #f9f9f9;
}

.team-section h2 {
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
}

.section-subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.team-member {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  text-align: center;
}

.team-member:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.member-image {
  width: 100%;
  height: 250px;
  overflow: hidden;
  background-color: #e0e0e0;
}

.member-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.team-member h3 {
  margin: 1.5rem 1rem 0.5rem 1rem;
  color: #333;
}

.member-role {
  color: #667eea;
  font-weight: 600;
  margin: 0 1rem 0.5rem 1rem;
}

.member-bio {
  padding: 0 1rem;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.member-social {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 0 1rem 1rem 1rem;
}

.social-link {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.3s;
}

.social-link:hover {
  background-color: #5568d3;
  transform: translateY(-3px);
}

/* Values Section */
.values-section {
  padding: 4rem 0;
}

.values-section h2 {
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.value-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.value-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

.value-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.value-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.value-card p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* Sustainability Section */
.sustainability-section {
  padding: 4rem 0;
  background-color: #f0f8f4;
}

.sustainability-section h2 {
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.sustainability-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.sustainability-text h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1rem;
}

.sustainability-text p {
  color: #666;
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

.sustainability-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sustainability-list li {
  padding: 0.75rem 0;
  padding-left: 1.75rem;
  position: relative;
  color: #666;
}

.sustainability-list li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #00b894;
  font-weight: bold;
  font-size: 1.2rem;
}

.sustainability-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.eco-stat {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.eco-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #00b894;
  margin-bottom: 0.5rem;
}

.eco-label {
  display: block;
  color: #333;
  font-weight: 600;
}

/* Partners Section */
.partners-section {
  padding: 4rem 0;
  background-color: #f9f9f9;
}

.partners-section h2 {
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
}

.partners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  align-items: center;
  justify-items: center;
}

.partner-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  text-align: center;
}

.partner-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.partner-card img {
  max-width: 100%;
  height: auto;
  margin-bottom: 0.75rem;
}

.partner-card p {
  color: #666;
  margin: 0;
  font-weight: 600;
}

/* Timeline Section */
.timeline-section {
  padding: 4rem 0;
}

.timeline-section h2 {
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.timeline {
  position: relative;
  padding: 2rem 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background-color: #667eea;
}

.timeline-item {
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
}

.timeline-item:nth-child(even) {
  direction: rtl;
}

.timeline-item:nth-child(even) .timeline-content {
  direction: ltr;
}

.timeline-marker {
  position: relative;
  width: 16px;
  height: 16px;
  background-color: #667eea;
  border: 4px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #667eea;
  justify-self: end;
}

.timeline-item:nth-child(even) .timeline-marker {
  justify-self: start;
}

.timeline-content {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-item:nth-child(even) .timeline-content {
  border-left: none;
  border-right: 4px solid #667eea;
}

.timeline-content h3 {
  margin: 0 0 0.5rem 0;
  color: #667eea;
  font-size: 1.3rem;
}

.timeline-content p {
  margin: 0.25rem 0;
  color: #666;
  line-height: 1.6;
}

/* Contact CTA Section */
.contact-cta {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.contact-cta h2 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.contact-cta p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
}

.btn-primary {
  background-color: white;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-large {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2rem;
  }

  .story-grid {
    grid-template-columns: 1fr;
  }

  .team-grid {
    grid-template-columns: 1fr;
  }

  .sustainability-content {
    grid-template-columns: 1fr;
  }

  .sustainability-stats {
    grid-template-columns: 1fr;
  }

  .timeline::before {
    left: 10px;
  }

  .timeline-item {
    grid-template-columns: 1fr;
    direction: ltr;
  }

  .timeline-item:nth-child(even) {
    direction: ltr;
  }

  .timeline-marker {
    justify-self: start;
    margin-left: 0;
  }

  .timeline-content {
    border-left: 4px solid #667eea;
    border-right: none;
  }

  .timeline-item:nth-child(even) .timeline-content {
    border-left: 4px solid #667eea;
    border-right: none;
  }

  .partners-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>