<template>
  <div class="product-reviews">
    <div class="reviews-container">
      <!-- Reviews Header -->
      <div class="reviews-header">
        <h2>Customer Reviews</h2>
        <button @click="showReviewForm = !showReviewForm" class="btn btn-primary">
          {{ showReviewForm ? '✕ Close' : '✎ Write a Review' }}
        </button>
      </div>

      <!-- Review Summary -->
      <div class="review-summary">
        <div class="summary-card">
          <div class="average-rating">
            <div class="rating-number">{{ averageRating.toFixed(1) }}</div>
            <div class="rating-stars">
              <span v-for="i in 5" :key="i" :class="{ filled: i <= Math.round(averageRating) }">★</span>
            </div>
            <div class="rating-text">Based on {{ totalReviews }} reviews</div>
          </div>

          <div class="rating-distribution">
            <div v-for="stars in [5, 4, 3, 2, 1]" :key="stars" class="distribution-item">
              <span class="star-label">
                <span v-for="i in 5" :key="i" :class="{ filled: i <= stars }">★</span>
              </span>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ width: getPercentage(stars) + '%' }"
                ></div>
              </div>
              <span class="count">{{ getStarCount(stars) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Write Review Form -->
      <div v-if="showReviewForm" class="write-review-section">
        <h3>Share Your Experience</h3>
        <form @submit.prevent="submitReview" class="review-form">
          <div class="form-group">
            <label>Rating</label>
            <div class="rating-input">
              <button 
                v-for="i in 5"
                :key="i"
                type="button"
                @click="newReview.rating = i"
                class="star-btn"
                :class="{ active: newReview.rating >= i }"
              >
                ★
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="reviewTitle">Review Title</label>
            <input 
              id="reviewTitle"
              v-model="newReview.title"
              type="text"
              placeholder="Summarize your experience"
              required
              class="form-input"
            />
            <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
          </div>

          <div class="form-group">
            <label for="reviewText">Your Review</label>
            <textarea 
              id="reviewText"
              v-model="newReview.text"
              placeholder="Share details about your experience..."
              rows="5"
              required
              class="form-input"
            ></textarea>
            <div class="character-count">
              {{ newReview.text.length }} / 5000 characters
            </div>
            <span v-if="errors.text" class="error-message">{{ errors.text }}</span>
          </div>

          <div class="form-group">
            <label>Aspects (select all that apply)</label>
            <div class="aspects-grid">
              <label v-for="aspect in aspects" :key="aspect" class="checkbox-option">
                <input 
                  v-model="newReview.aspects"
                  type="checkbox"
                  :value="aspect"
                />
                <span>{{ aspect }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="reviewerName">Your Name</label>
            <input 
              id="reviewerName"
              v-model="newReview.name"
              type="text"
              placeholder="Your name (optional)"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-option">
              <input v-model="newReview.verified" type="checkbox" disabled />
              <span>Verified Purchase (automatically detected)</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSubmittingReview">
              {{ isSubmittingReview ? 'Submitting...' : 'Submit Review' }}
            </button>
            <button type="button" @click="showReviewForm = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Filters and Sort -->
      <div class="reviews-controls">
        <div class="filter-group">
          <label for="ratingFilter">Filter by rating:</label>
          <select v-model.number="selectedRatingFilter" id="ratingFilter" class="select-input">
            <option value="">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="sortBy">Sort by:</label>
          <select v-model="reviewSortBy" id="sortBy" class="select-input">
            <option value="helpful">Most Helpful</option>
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="verifiedOnly">
            <input v-model="verifiedOnly" type="checkbox" id="verifiedOnly" />
            <span>Verified Purchases Only</span>
          </label>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        <div v-if="filteredReviews.length > 0">
          <div v-for="review in paginatedReviews" :key="review.id" class="review-item">
            <div class="review-header">
              <div class="reviewer-info">
                <img :src="review.avatar" :alt="review.name" class="reviewer-avatar" />
                <div>
                  <h4>{{ review.title }}</h4>
                  <p class="reviewer-name">{{ review.name }}</p>
                  <p class="review-date">
                    <span v-if="review.verified" class="verified-badge">✓ Verified Purchase</span>
                    <span>{{ formatDate(review.date) }}</span>
                  </p>
                </div>
              </div>
              <div class="review-rating">
                <div class="stars">
                  <span v-for="i in 5" :key="i" :class="{ filled: i <= review.rating }">★</span>
                </div>
                <span class="rating-text">{{ review.rating }} out of 5</span>
              </div>
            </div>

            <p class="review-text">{{ review.text }}</p>

            <div v-if="review.aspects.length > 0" class="review-aspects">
              <span v-for="aspect in review.aspects" :key="aspect" class="aspect-tag">
                {{ aspect }}
              </span>
            </div>

            <div class="review-footer">
              <div class="helpful-votes">
                <button 
                  @click="markHelpful(review.id)"
                  class="helpful-btn"
                  :class="{ active: review.userHelpful }"
                >
                  👍 Helpful {{ review.helpful > 0 ? `(${review.helpful})` : '' }}
                </button>
                <button 
                  @click="markUnhelpful(review.id)"
                  class="helpful-btn"
                  :class="{ active: review.userUnhelpful }"
                >
                  👎 Not Helpful {{ review.unhelpful > 0 ? `(${review.unhelpful})` : '' }}
                </button>
              </div>
              <button @click="reportReview(review.id)" class="report-btn">
                Report
              </button>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalReviewPages > 1" class="pagination">
            <button 
              @click="currentReviewPage--"
              :disabled="currentReviewPage === 1"
              class="pagination-btn"
            >
              ← Previous
            </button>
            
            <div class="page-numbers">
              <button 
                v-for="page in totalReviewPages"
                :key="page"
                @click="currentReviewPage = page"
                class="page-number"
                :class="{ active: currentReviewPage === page }"
              >
                {{ page }}
              </button>
            </div>

            <button 
              @click="currentReviewPage++"
              :disabled="currentReviewPage === totalReviewPages"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>

        <div v-else class="no-reviews">
          <p>No reviews match your filters.</p>
          <button @click="resetFilters" class="btn btn-secondary">Reset Filters</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ProductReviews',
  setup() {
    const showReviewForm = ref(false)
    const isSubmittingReview = ref(false)
    const selectedRatingFilter = ref('')
    const reviewSortBy = ref('helpful')
    const verifiedOnly = ref(false)
    const currentReviewPage = ref(1)
    const reviewsPerPage = ref(5)

    const aspects = ['Quality', 'Durability', 'Design', 'Value for Money', 'Comfort', 'Ease of Use']

    const newReview = ref({
      rating: 0,
      title: '',
      text: '',
      aspects: [],
      name: '',
      verified: true,
    })

    const errors = ref({
      title: '',
      text: '',
    })

    // Mock reviews data
    const reviews = ref([
      {
        id: 1,
        name: 'Sarah Johnson',
        avatar: 'https://i.pravatar.cc/150?img=1',
        rating: 5,
        title: 'Excellent quality and durability!',
        text: 'This tent is absolutely amazing! The construction is solid, the zippers work smoothly, and it\'s very spacious. I\'ve used it on multiple camping trips and it holds up perfectly in various weather conditions. Highly recommended!',
        aspects: ['Quality', 'Durability', 'Design'],
        date: new Date('2026-02-15'),
        verified: true,
        helpful: 42,
        unhelpful: 2,
        userHelpful: false,
        userUnhelpful: false,
      },
      {
        id: 2,
        name: 'Michael Chen',
        avatar: 'https://i.pravatar.cc/150?img=2',
        rating: 4,
        title: 'Great tent with minor setup issues',
        text: 'Overall a great tent for the price. It\'s well-made and keeps you dry. The only downside is that the setup instructions could be clearer, but once you figure it out, it\'s pretty quick to set up.',
        aspects: ['Quality', 'Value for Money'],
        date: new Date('2026-02-10'),
        verified: true,
        helpful: 28,
        unhelpful: 1,
        userHelpful: false,
        userUnhelpful: false,
      },
      {
        id: 3,
        name: 'Emily Rodriguez',
        avatar: 'https://i.pravatar.cc/150?img=3',
        rating: 5,
        title: 'Perfect for backpacking',
        text: 'I\'ve taken this tent on several backpacking adventures and it never disappoints. Lightweight, waterproof, and incredibly durable. The ventilation system works great to minimize condensation.',
        aspects: ['Design', 'Durability', 'Comfort'],
        date: new Date('2026-02-05'),
        verified: true,
        helpful: 35,
        unhelpful: 0,
        userHelpful: false,
        userUnhelpful: false,
      },
      {
        id: 4,
        name: 'James Wilson',
        avatar: 'https://i.pravatar.cc/150?img=4',
        rating: 3,
        title: 'Good tent, but a bit pricey',
        text: 'This tent is solid and works well, but I feel like there are cheaper alternatives out there that are almost as good. It\'s a good investment if budget isn\'t a concern.',
        aspects: ['Value for Money'],
        date: new Date('2026-01-28'),
        verified: true,
        helpful: 18,
        unhelpful: 5,
        userHelpful: false,
        userUnhelpful: false,
      },
      {
        id: 5,
        name: 'Amanda Lee',
        avatar: 'https://i.pravatar.cc/150?img=5',
        rating: 5,
        title: 'Best camping investment I\'ve made',
        text: 'After years of using cheap tents, I finally invested in this one and I don\'t regret it. The quality is unmatched. Sets up in minutes, stays dry, and looks brand new even after multiple trips.',
        aspects: ['Quality', 'Durability', 'Ease of Use'],
        date: new Date('2026-01-20'),
        verified: true,
        helpful: 52,
        unhelpful: 1,
        userHelpful: false,
        userUnhelpful: false,
      },
      {
        id: 6,
        name: 'David Thompson',
        avatar: 'https://i.pravatar.cc/150?img=6',
        rating: 4,
        title: 'Very satisfied with purchase',
        text: 'Great tent! Very spacious, good ventilation, and the material feels premium. Highly durable and definitely worth the investment for serious campers.',
        aspects: ['Quality', 'Comfort', 'Design'],
        date: new Date('2026-01-15'),
        verified: true,
        helpful: 24,
        unhelpful: 0,
        userHelpful: false,
        userUnhelpful: false,
      },
    ])

    const totalReviews = computed(() => reviews.value.length)

    const averageRating = computed(() => {
      const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
      return totalReviews.value > 0 ? sum / totalReviews.value : 0
    })

    const getStarCount = (stars) => {
      return reviews.value.filter(r => r.rating === stars).length
    }

    const getPercentage = (stars) => {
      const count = getStarCount(stars)
      return totalReviews.value > 0 ? (count / totalReviews.value) * 100 : 0
    }

    const filteredReviews = computed(() => {
      let filtered = [...reviews.value]

      // Filter by rating
      if (selectedRatingFilter.value) {
        filtered = filtered.filter(r => r.rating === selectedRatingFilter.value)
      }

      // Filter by verified purchases
      if (verifiedOnly.value) {
        filtered = filtered.filter(r => r.verified)
      }

      // Sort reviews
      switch (reviewSortBy.value) {
        case 'recent':
          filtered.sort((a, b) => b.date - a.date)
          break
        case 'highest':
          filtered.sort((a, b) => b.rating - a.rating)
          break
        case 'lowest':
          filtered.sort((a, b) => a.rating - b.rating)
          break
        case 'helpful':
        default:
          filtered.sort((a, b) => b.helpful - a.helpful)
      }

      return filtered
    })

    const totalReviewPages = computed(() => {
      return Math.ceil(filteredReviews.value.length / reviewsPerPage.value)
    })

    const paginatedReviews = computed(() => {
      const start = (currentReviewPage.value - 1) * reviewsPerPage.value
      const end = start + reviewsPerPage.value
      return filteredReviews.value.slice(start, end)
    })

    const formatDate = (date) => {
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const validateForm = () => {
      errors.value = { title: '', text: '' }
      let isValid = true

      if (!newReview.value.title.trim()) {
        errors.value.title = 'Review title is required'
        isValid = false
      } else if (newReview.value.title.length > 200) {
        errors.value.title = 'Title must be less than 200 characters'
        isValid = false
      }

      if (!newReview.value.text.trim()) {
        errors.value.text = 'Review text is required'
        isValid = false
      } else if (newReview.value.text.length < 50) {
        errors.value.text = 'Review must be at least 50 characters'
        isValid = false
      } else if (newReview.value.text.length > 5000) {
        errors.value.text = 'Review must be less than 5000 characters'
        isValid = false
      }

      return isValid
    }

    const submitReview = async () => {
      if (!validateForm() || newReview.value.rating === 0) {
        if (newReview.value.rating === 0) {
          alert('Please select a rating')
        }
        return
      }

      isSubmittingReview.value = true

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Add new review to list
        const review = {
          id: reviews.value.length + 1,
          name: newReview.value.name || 'Anonymous',
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          rating: newReview.value.rating,
          title: newReview.value.title,
          text: newReview.value.text,
          aspects: newReview.value.aspects,
          date: new Date(),
          verified: newReview.value.verified,
          helpful: 0,
          unhelpful: 0,
          userHelpful: false,
          userUnhelpful: false,
        }

        reviews.value.unshift(review)
        showReviewForm.value = false
        currentReviewPage.value = 1

        // Reset form
        newReview.value = {
          rating: 0,
          title: '',
          text: '',
          aspects: [],
          name: '',
          verified: true,
        }

        alert('Thank you for your review!')
      } catch (error) {
        console.error('Error submitting review:', error)
        alert('Error submitting review. Please try again.')
      } finally {
        isSubmittingReview.value = false
      }
    }

    const markHelpful = (reviewId) => {
      const review = reviews.value.find(r => r.id === reviewId)
      if (review) {
        if (review.userHelpful) {
          review.helpful--
          review.userHelpful = false
        } else {
          review.helpful++
          review.userHelpful = true
          if (review.userUnhelpful) {
            review.unhelpful--
            review.userUnhelpful = false
          }
        }
      }
    }

    const markUnhelpful = (reviewId) => {
      const review = reviews.value.find(r => r.id === reviewId)
      if (review) {
        if (review.userUnhelpful) {
          review.unhelpful--
          review.userUnhelpful = false
        } else {
          review.unhelpful++
          review.userUnhelpful = true
          if (review.userHelpful) {
            review.helpful--
            review.userHelpful = false
          }
        }
      }
    }

    const reportReview = (reviewId) => {
      alert('Thank you for reporting. Our team will review this shortly.')
    }

    const resetFilters = () => {
      selectedRatingFilter.value = ''
      verifiedOnly.value = false
      reviewSortBy.value = 'helpful'
      currentReviewPage.value = 1
    }

    return {
      showReviewForm,
      isSubmittingReview,
      selectedRatingFilter,
      reviewSortBy,
      verifiedOnly,
      currentReviewPage,
      newReview,
      errors,
      aspects,
      reviews,
      totalReviews,
      averageRating,
      getStarCount,
      getPercentage,
      filteredReviews,
      totalReviewPages,
      paginatedReviews,
      formatDate,
      submitReview,
      markHelpful,
      markUnhelpful,
      reportReview,
      resetFilters,
    }
  },
}
</script>

<style scoped>
.product-reviews {
  background-color: #f9f9f9;
  padding: 2rem;
}

.reviews-container {
  max-width: 900px;
  margin: 0 auto;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.reviews-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 600;
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

.review-summary {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-card {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.average-rating {
  text-align: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.rating-number {
  font-size: 3rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.rating-stars {
  font-size: 1.5rem;
  color: #ffc107;
  margin-bottom: 0.75rem;
}

.rating-stars span {
  color: #ddd;
}

.rating-stars span.filled {
  color: #ffc107;
}

.rating-text {
  color: #666;
  font-size: 0.9rem;
}

.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.distribution-item {
  display: grid;
  grid-template-columns: 60px 1fr 50px;
  gap: 1rem;
  align-items: center;
}

.star-label {
  display: flex;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #ffc107;
}

.star-label span {
  color: #ddd;
}

.star-label span.filled {
  color: #ffc107;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}

.count {
  text-align: right;
  color: #999;
  font-size: 0.9rem;
}

.write-review-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.write-review-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.rating-input {
  display: flex;
  gap: 0.5rem;
}

.star-btn {
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  background-color: #f0f0f0;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  color: #ddd;
}

.star-btn:hover {
  border-color: #667eea;
  color: #ffc107;
}

.star-btn.active {
  background-color: #667eea;
  border-color: #667eea;
  color: #ffc107;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.character-count {
  font-size: 0.8rem;
  color: #999;
  text-align: right;
}

.aspects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
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

.checkbox-option input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.reviews-controls {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-group label {
  font-weight: 600;
  white-space: nowrap;
}

.select-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.reviews-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-item {
  padding: 2rem;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.3s;
}

.review-item:hover {
  background-color: #f9f9f9;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.reviewer-info {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.reviewer-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.reviewer-info h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.reviewer-name {
  margin: 0 0 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
}

.review-date {
  margin: 0;
  color: #999;
  font-size: 0.85rem;
}

.verified-badge {
  display: inline-block;
  background-color: #d4edda;
  color: #155724;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.75rem;
}

.review-rating {
  text-align: right;
}

.review-rating .stars {
  display: flex;
  gap: 0.25rem;
  font-size: 1rem;
  color: #ffc107;
  margin-bottom: 0.5rem;
  justify-content: flex-end;
}

.review-rating .stars span {
  color: #ddd;
}

.review-rating .stars span.filled {
  color: #ffc107;
}

.rating-text {
  color: #666;
  font-size: 0.85rem;
}

.review-text {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.review-aspects {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.aspect-tag {
  display: inline-block;
  background-color: #e8f0ff;
  color: #667eea;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.helpful-votes {
  display: flex;
  gap: 0.5rem;
}

.helpful-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.helpful-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.helpful-btn.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.report-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.85rem;
  transition: color 0.3s;
}

.report-btn:hover {
  color: #667eea;
}

.no-reviews {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border-top: 1px solid #e0e0e0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
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
  background-color: #f5f5f5;
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

@media (max-width: 768px) {
  .reviews-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .summary-card {
    grid-template-columns: 1fr;
  }

  .review-header {
    flex-direction: column;
  }

  .review-rating {
    text-align: left;
  }

  .review-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .reviews-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>