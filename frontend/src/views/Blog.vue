<template>
  <div class="blog-page">
    <!-- Header -->
    <div class="blog-header">
      <h1>Camptime Blog</h1>
      <p>Tips, guides, and stories from the trail</p>
    </div>

    <!-- Search and Filter -->
    <div class="blog-controls">
      <div class="search-bar">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search blog posts..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="filter-controls">
        <select v-model="selectedCategory" class="filter-select">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
    </div>

    <!-- Blog Posts Grid -->
    <div v-if="filteredPosts.length > 0" class="posts-container">
      <div class="featured-post" v-if="featuredPost">
        <div class="featured-image">
          <img :src="featuredPost.image" :alt="featuredPost.title" />
          <span class="featured-badge">Featured</span>
        </div>
        <div class="featured-content">
          <span class="post-category">{{ featuredPost.category }}</span>
          <h2>{{ featuredPost.title }}</h2>
          <p class="post-excerpt">{{ featuredPost.excerpt }}</p>
          <div class="post-meta">
            <span class="author">By {{ featuredPost.author }}</span>
            <span class="date">{{ formatDate(featuredPost.date) }}</span>
            <span class="reading-time">{{ featuredPost.readingTime }} min read</span>
          </div>
          <router-link :to="`/blog/${featuredPost.id}`" class="btn btn-primary">
            Read More →
          </router-link>
        </div>
      </div>

      <div class="posts-grid">
        <div v-for="post in otherPosts" :key="post.id" class="post-card">
          <div class="post-image">
            <img :src="post.image" :alt="post.title" />
            <span class="post-category">{{ post.category }}</span>
          </div>
          
          <div class="post-content">
            <h3>{{ post.title }}</h3>
            <p class="post-excerpt">{{ post.excerpt }}</p>
            
            <div class="post-meta">
              <span class="author">{{ post.author }}</span>
              <span class="date">{{ formatDate(post.date) }}</span>
            </div>

            <div class="post-stats">
              <span class="views">👁️ {{ post.views }}</span>
              <span class="likes">❤️ {{ post.likes }}</span>
              <span class="reading-time">⏱️ {{ post.readingTime }} min</span>
            </div>

            <router-link :to="`/blog/${post.id}`" class="btn btn-secondary btn-small">
              Read Article
            </router-link>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ← Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in totalPages"
            :key="page"
            @click="currentPage = page"
            class="page-number"
            :class="{ active: currentPage === page }"
          >
            {{ page }}
          </button>
        </div>

        <button 
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <div v-else class="no-posts">
      <p>No blog posts found. Try different keywords or categories.</p>
    </div>

    <!-- Newsletter Signup -->
    <section class="newsletter-section">
      <h2>Get Camping Tips in Your Inbox</h2>
      <p>Subscribe to our newsletter for weekly tips, guides, and exclusive offers</p>
      
      <form @submit.prevent="subscribeNewsletter" class="newsletter-form">
        <input 
          v-model="newsletterEmail"
          type="email"
          placeholder="Enter your email"
          required
          class="newsletter-input"
        />
        <button type="submit" class="btn btn-primary">Subscribe</button>
      </form>

      <div v-if="newsletterMessage" class="newsletter-message" :class="newsletterStatus">
        {{ newsletterMessage }}
      </div>
    </section>

    <!-- Popular Tags -->
    <section class="tags-section">
      <h2>Popular Topics</h2>
      <div class="tags-cloud">
        <button 
          v-for="tag in popularTags"
          :key="tag"
          @click="selectedTag = tag"
          class="tag"
          :class="{ active: selectedTag === tag }"
        >
          {{ tag }}
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'Blog',
  setup() {
    const searchQuery = ref('')
    const selectedCategory = ref('')
    const selectedTag = ref('')
    const sortBy = ref('newest')
    const currentPage = ref(1)
    const postsPerPage = ref(6)
    const newsletterEmail = ref('')
    const newsletterMessage = ref('')
    const newsletterStatus = ref('')

    const categories = [
      'Beginner Tips',
      'Gear Reviews',
      'Destinations',
      'Camping Hacks',
      'Safety',
      'Sustainability',
    ]

    const popularTags = [
      'Tent',
      'Backpacking',
      'Hiking',
      'Desert',
      'Mountains',
      'Budget Camping',
      'Winter Camping',
      'Sustainable',
    ]

    const posts = ref([
      {
        id: 1,
        title: 'The Complete Guide to Choosing Your First Tent',
        excerpt: 'Learn how to select the perfect tent for your camping adventures. We break down tent sizes, materials, and features to help you make the right choice.',
        category: 'Beginner Tips',
        author: 'Sarah Johnson',
        date: new Date('2026-02-20'),
        image: '/images/blog/tent-guide.jpg',
        views: 1523,
        likes: 342,
        readingTime: 8,
        isFeatured: true,
        tags: ['Tent', 'Beginner', 'Gear'],
        content: 'Full article content here...',
      },
      {
        id: 2,
        title: 'Top 5 Camping Hacks That Will Change Your Life',
        excerpt: 'Discover clever tricks to make your camping experience more comfortable and enjoyable. From gear organization to meal prep, we\'ve got you covered.',
        category: 'Camping Hacks',
        author: 'Michael Chen',
        date: new Date('2026-02-18'),
        image: '/images/blog/camping-hacks.jpg',
        views: 2104,
        likes: 456,
        readingTime: 6,
        isFeatured: false,
        tags: ['Hacks', 'Tips', 'Camping'],
      },
      {
        id: 3,
        title: 'Best Destinations for Spring Camping',
        excerpt: 'Explore the top camping destinations across North America perfect for spring adventures. From desert canyons to mountain trails, find your next adventure.',
        category: 'Destinations',
        author: 'Emily Rodriguez',
        date: new Date('2026-02-15'),
        image: '/images/blog/spring-destinations.jpg',
        views: 1876,
        likes: 389,
        readingTime: 7,
        isFeatured: false,
        tags: ['Destinations', 'Spring', 'Adventure'],
      },
      {
        id: 4,
        title: 'Sustainable Camping: Leave No Trace',
        excerpt: 'Learn how to camp responsibly and minimize your environmental impact. Essential practices for every outdoor enthusiast who cares about nature.',
        category: 'Sustainability',
        author: 'David Kim',
        date: new Date('2026-02-12'),
        image: '/images/blog/sustainable-camping.jpg',
        views: 1432,
        likes: 278,
        readingTime: 9,
        isFeatured: false,
        tags: ['Sustainability', 'Environment', 'Tips'],
      },
      {
        id: 5,
        title: 'Winter Camping for Beginners',
        excerpt: 'Everything you need to know to safely and comfortably camp in winter conditions. Essential gear, safety tips, and inspiring stories from winter campers.',
        category: 'Beginner Tips',
        author: 'Amanda Lee',
        date: new Date('2026-02-10'),
        image: '/images/blog/winter-camping.jpg',
        views: 1654,
        likes: 312,
        readingTime: 10,
        isFeatured: false,
        tags: ['Winter', 'Safety', 'Beginner'],
      },
      {
        id: 6,
        title: 'Camping Stove Review: Top 5 Picks for 2026',
        excerpt: 'We tested the best camping stoves on the market. Read our detailed reviews to find the perfect stove for your cooking needs and camping style.',
        category: 'Gear Reviews',
        author: 'James Wilson',
        date: new Date('2026-02-08'),
        image: '/images/blog/stove-review.jpg',
        views: 2341,
        likes: 567,
        readingTime: 12,
        isFeatured: false,
        tags: ['Gear', 'Review', 'Cooking'],
      },
      {
        id: 7,
        title: 'Budget Camping: Amazing Adventures Without Breaking the Bank',
        excerpt: 'Prove that you don\'t need expensive gear to have incredible camping experiences. Strategies for camping on a budget without sacrificing fun.',
        category: 'Camping Hacks',
        author: 'Lisa Anderson',
        date: new Date('2026-02-05'),
        image: '/images/blog/budget-camping.jpg',
        views: 1923,
        likes: 401,
        readingTime: 8,
        isFeatured: false,
        tags: ['Budget', 'Money', 'Hacks'],
      },
      {
        id: 8,
        title: 'Desert Camping Safety: A Complete Guide',
        excerpt: 'Learn essential safety practices for camping in desert environments. Water management, heat protection, and emergency preparedness tips.',
        category: 'Safety',
        author: 'John Martinez',
        date: new Date('2026-02-01'),
        image: '/images/blog/desert-safety.jpg',
        views: 1567,
        likes: 298,
        readingTime: 11,
        isFeatured: false,
        tags: ['Desert', 'Safety', 'Tips'],
      },
      {
        id: 9,
        title: 'Mountain Hiking 101: Preparation and Training',
        excerpt: 'Get ready for your first mountain adventure. Everything from physical conditioning to altitude acclimatization for a successful hike.',
        category: 'Beginner Tips',
        author: 'Sarah Johnson',
        date: new Date('2026-01-28'),
        image: '/images/blog/mountain-hiking.jpg',
        views: 1432,
        likes: 267,
        readingTime: 9,
        isFeatured: false,
        tags: ['Mountains', 'Hiking', 'Training'],
      },
      {
        id: 10,
        title: 'Backpacking Meal Plans for 3 Days',
        excerpt: 'Delicious, lightweight meal ideas for your next backpacking trip. Recipes that are easy to prepare in the wilderness and taste amazing.',
        category: 'Camping Hacks',
        author: 'Michael Chen',
        date: new Date('2026-01-25'),
        image: '/images/blog/meal-plans.jpg',
        views: 1899,
        likes: 423,
        readingTime: 7,
        isFeatured: false,
        tags: ['Backpacking', 'Food', 'Meals'],
      },
      {
        id: 11,
        title: 'Photography Tips for Capturing Your Camping Adventures',
        excerpt: 'Learn how to take stunning photos of your camping trips. Camera settings, composition tips, and techniques for different lighting conditions.',
        category: 'Gear Reviews',
        author: 'Emily Rodriguez',
        date: new Date('2026-01-22'),
        image: '/images/blog/camping-photography.jpg',
        views: 1723,
        likes: 389,
        readingTime: 8,
        isFeatured: false,
        tags: ['Photography', 'Gear', 'Tips'],
      },
      {
        id: 12,
        title: 'The Best Sleeping Bags for Every Temperature',
        excerpt: 'Comprehensive guide to sleeping bag selection. Temperature ratings, materials, and recommendations for different camping conditions.',
        category: 'Gear Reviews',
        author: 'David Kim',
        date: new Date('2026-01-20'),
        image: '/images/blog/sleeping-bags.jpg',
        views: 2156,
        likes: 512,
        readingTime: 10,
        isFeatured: false,
        tags: ['Gear', 'Sleeping', 'Review'],
      },
    ])

    const filteredPosts = computed(() => {
      let filtered = [...posts.value]

      // Filter by search
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(post =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }

      // Filter by category
      if (selectedCategory.value) {
        filtered = filtered.filter(post => post.category === selectedCategory.value)
      }

      // Filter by tag
      if (selectedTag.value) {
        filtered = filtered.filter(post => post.tags.includes(selectedTag.value))
      }

      // Sort posts
      switch (sortBy.value) {
        case 'oldest':
          filtered.sort((a, b) => a.date - b.date)
          break
        case 'popular':
          filtered.sort((a, b) => b.views - a.views)
          break
        case 'newest':
        default:
          filtered.sort((a, b) => b.date - a.date)
      }

      return filtered
    })

    const featuredPost = computed(() => {
      return filteredPosts.value.find(post => post.isFeatured) || filteredPosts.value[0]
    })

    const otherPosts = computed(() => {
      const start = (currentPage.value - 1) * postsPerPage.value
      const end = start + postsPerPage.value
      const allOtherPosts = filteredPosts.value.filter(post => post.id !== featuredPost.value?.id)
      return allOtherPosts.slice(start, end)
    })

    const totalPages = computed(() => {
      const allOtherPosts = filteredPosts.value.filter(post => post.id !== featuredPost.value?.id)
      return Math.ceil(allOtherPosts.length / postsPerPage.value)
    })

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const subscribeNewsletter = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        newsletterStatus.value = 'success'
        newsletterMessage.value = '✓ Thank you for subscribing!'
        newsletterEmail.value = ''
        setTimeout(() => {
          newsletterMessage.value = ''
        }, 3000)
      } catch (error) {
        newsletterStatus.value = 'error'
        newsletterMessage.value = '✕ Error subscribing. Please try again.'
      }
    }

    return {
      searchQuery,
      selectedCategory,
      selectedTag,
      sortBy,
      currentPage,
      postsPerPage,
      newsletterEmail,
      newsletterMessage,
      newsletterStatus,
      categories,
      popularTags,
      posts,
      filteredPosts,
      featuredPost,
      otherPosts,
      totalPages,
      formatDate,
      subscribeNewsletter,
    }
  },
}
</script>

<style scoped>
.blog-page {
  background-color: #f9f9f9;
  min-height: 100vh;
}

/* Header */
.blog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.blog-header h1 {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
}

.blog-header p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.95;
}

/* Controls */
.blog-controls {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.search-bar {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-input:focus {
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

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-select {
  flex: 1;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  background-color: white;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Posts Container */
.posts-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem 2rem;
}

/* Featured Post */
.featured-post {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
}

.featured-image {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.featured-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.post-category {
  display: inline-block;
  background-color: #e8f0ff;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
  width: fit-content;
}

.featured-content h2 {
  font-size: 2rem;
  margin: 0 0 1rem 0;
  color: #333;
  line-height: 1.4;
}

.post-excerpt {
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.post-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 1.5rem;
}

.author {
  font-weight: 600;
  color: #333;
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

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* Posts Grid */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.post-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.post-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.post-card:hover .post-image img {
  transform: scale(1.05);
}

.post-image .post-category {
  position: absolute;
  top: 1rem;
  left: 1rem;
  margin: 0;
}

.post-content {
  padding: 1.5rem;
}

.post-content h3 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1.2rem;
  line-height: 1.4;
}

.post-excerpt {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.post-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.reading-time {
  display: block;
  text-align: right;
}

/* No Posts */
.no-posts {
  text-align: center;
  padding: 3rem;
  color: #666;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  width: 36px;
  height: 36px;
  padding: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.page-number:hover {
  border-color: #667eea;
}

.page-number.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

/* Newsletter Section */
.newsletter-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
  margin: 3rem 0;
}

.newsletter-section h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.newsletter-section p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.newsletter-form {
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  gap: 0.5rem;
}

.newsletter-input {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
}

.newsletter-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  font-weight: 600;
}

.newsletter-message.success {
  background-color: #d4edda;
  color: #155724;
}

.newsletter-message.error {
  background-color: #f8d7da;
  color: #721c24;
}

/* Tags Section */
.tags-section {
  max-width: 1200px;
  margin: 3rem auto 0 auto;
  padding: 2rem;
  text-align: center;
}

.tags-section h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.tags-cloud {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag {
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  color: #333;
}

.tag:hover {
  border-color: #667eea;
  color: #667eea;
}

.tag.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

@media (max-width: 768px) {
  .blog-header h1 {
    font-size: 1.8rem;
  }

  .blog-controls {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .featured-post {
    grid-template-columns: 1fr;
  }

  .featured-image {
    height: 250px;
  }

  .featured-content h2 {
    font-size: 1.5rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }

  .newsletter-form {
    flex-direction: column;
  }

  .post-meta {
    flex-wrap: wrap;
  }
}
</style>