<template>
  <div class="price-comparison-view">
    <div class="card">
      <h2>📊 Price Comparison Analysis</h2>
      
      <div class="filter-section">
        <div class="filters">
          <select v-model="sortBy" class="filter-select">
            <option value="markup-asc">Lowest Markup ↑</option>
            <option value="markup-desc">Highest Markup ↓</option>
            <option value="name">Product Name A→Z</option>
            <option value="recent">Recently Updated</option>
          </select>
          <input 
            v-model="minMarkup"
            type="number"
            placeholder="Min Markup %"
            class="number-input"
          />
          <input 
            v-model="maxMarkup"
            type="number"
            placeholder="Max Markup %"
            class="number-input"
          />
        </div>
      </div>

      <div v-if="loading" class="loading">
        Analyzing price comparisons...
      </div>

      <div v-else class="comparison-container">
        <div class="summary-stats">
          <div class="stat">
            <span class="label">Average Markup</span>
            <span class="value">{{ averageMarkup }}%</span>
          </div>
          <div class="stat">
            <span class="label">Median Markup</span>
            <span class="value">{{ medianMarkup }}%</span>
          </div>
          <div class="stat">
            <span class="label">Lowest Markup</span>
            <span class="value">{{ lowestMarkup }}%</span>
          </div>
          <div class="stat">
            <span class="label">Highest Markup</span>
            <span class="value">{{ highestMarkup }}%</span>
          </div>
        </div>

        <div class="comparisons-list">
          <div v-for="item in filteredAndSorted" :key="item.product_id" class="comparison-card">
            <div class="product-info">
              <h3>{{ item.name }}</h3>
              <span class="category">{{ item.category }}</span>
            </div>

            <div class="pricing-section">
              <div class="price-pair">
                <div class="price-item supplier">
                  <span class="label">Supplier</span>
                  <span class="price">${{ formatPrice(item.supplier_price) }}</span>
                </div>
                <div class="arrow">→</div>
                <div class="price-item store">
                  <span class="label">Store</span>
                  <span class="price">${{ formatPrice(item.store_price) }}</span>
                </div>
              </div>

              <div class="metrics">
                <div class="metric">
                  <span class="label">Profit Margin</span>
                  <span class="value">{{ calculateProfit(item.supplier_price, item.store_price) }}</span>
                </div>
                <div class="metric markup-metric">
                  <span class="label">Markup</span>
                  <span class="value markup">{{ calculateMarkup(item.supplier_price, item.store_price) }}%</span>
                </div>
              </div>
            </div>

            <div class="status-badge" :class="getMarkupStatus(calculateMarkup(item.supplier_price, item.store_price))">
              {{ getMarkupLabel(calculateMarkup(item.supplier_price, item.store_price)) }}
            </div>
          </div>
        </div>

        <div v-if="filteredAndSorted.length === 0" class="empty-state">
          <p>No products match the selected filters</p>
        </div>
      </div>
    </div>

    <!-- Distribution Chart -->
    <div class="card">
      <h3>📈 Markup Distribution</h3>
      <div class="distribution-chart">
        <div v-for="bucket in markupBuckets" :key="bucket.range" class="bucket">
          <div class="bucket-label">{{ bucket.range }}</div>
          <div class="bucket-bar-container">
            <div 
              class="bucket-bar" 
              :style="{ width: bucket.percentage + '%' }"
            >
              {{ bucket.count }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'PriceComparisonView',
  setup() {
    const comparisons = ref([])
    const loading = ref(false)
    const sortBy = ref('markup-desc')
    const minMarkup = ref('')
    const maxMarkup = ref('')

    const formatPrice = (price) => {
      return parseFloat(price).toFixed(2)
    }

    const calculateMarkup = (supplier, store) => {
      if (!supplier || supplier === 0) return 0
      return Math.round(((store - supplier) / supplier) * 100)
    }

    const calculateProfit = (supplier, store) => {
      const profit = store - supplier
      return profit > 0 ? `+$${formatPrice(profit)}` : `-$${formatPrice(Math.abs(profit))}`
    }

    const getMarkupStatus = (markup) => {
      if (markup >= 50) return 'high-markup'
      if (markup >= 30) return 'good-markup'
      if (markup >= 15) return 'fair-markup'
      return 'low-markup'
    }

    const getMarkupLabel = (markup) => {
      if (markup >= 50) return '🟢 High Margin'
      if (markup >= 30) return '🟡 Fair Margin'
      if (markup >= 15) return '🔵 Low Margin'
      return '🔴 Critical'
    }

    const filteredAndSorted = computed(() => {
      let result = comparisons.value.filter(item => {
        const markup = calculateMarkup(item.supplier_price, item.store_price)
        const passMin = minMarkup.value === '' || markup >= parseInt(minMarkup.value)
        const passMax = maxMarkup.value === '' || markup <= parseInt(maxMarkup.value)
        return passMin && passMax
      })

      // Sort
      result.sort((a, b) => {
        const markupA = calculateMarkup(a.supplier_price, a.store_price)
        const markupB = calculateMarkup(b.supplier_price, b.store_price)

        switch (sortBy.value) {
          case 'markup-desc':
            return markupB - markupA
          case 'markup-asc':
            return markupA - markupB
          case 'name':
            return a.name.localeCompare(b.name)
          case 'recent':
            return new Date(b.updated_at) - new Date(a.updated_at)
          default:
            return 0
        }
      })

      return result
    })

    const averageMarkup = computed(() => {
      if (comparisons.value.length === 0) return 0
      const sum = comparisons.value.reduce((acc, item) => {
        return acc + calculateMarkup(item.supplier_price, item.store_price)
      }, 0)
      return Math.round(sum / comparisons.value.length)
    })

    const medianMarkup = computed(() => {
      if (comparisons.value.length === 0) return 0
      const markups = comparisons.value
        .map(item => calculateMarkup(item.supplier_price, item.store_price))
        .sort((a, b) => a - b)
      const mid = Math.floor(markups.length / 2)
      return markups.length % 2 !== 0 ? markups[mid] : (markups[mid - 1] + markups[mid]) / 2
    })

    const lowestMarkup = computed(() => {
      if (comparisons.value.length === 0) return 0
      return Math.min(...comparisons.value.map(item => 
        calculateMarkup(item.supplier_price, item.store_price)
      ))
    })

    const highestMarkup = computed(() => {
      if (comparisons.value.length === 0) return 0
      return Math.max(...comparisons.value.map(item => 
        calculateMarkup(item.supplier_price, item.store_price)
      ))
    })

    const markupBuckets = computed(() => {
      const buckets = [
        { range: '0-10%', min: 0, max: 10 },
        { range: '11-20%', min: 11, max: 20 },
        { range: '21-30%', min: 21, max: 30 },
        { range: '31-50%', min: 31, max: 50 },
        { range: '51%+', min: 51, max: Infinity },
      ]

      const total = comparisons.value.length || 1

      return buckets.map(bucket => {
        const count = comparisons.value.filter(item => {
          const markup = calculateMarkup(item.supplier_price, item.store_price)
          return markup >= bucket.min && markup <= bucket.max
        }).length

        return {
          ...bucket,
          count,
          percentage: Math.round((count / total) * 100),
        }
      })
    })

    const loadComparisons = async () => {
      loading.value = true
      try {
        const response = await fetch('/api/admin/dolba-sync/price-comparisons')
        const data = await response.json()
        comparisons.value = data.comparisons || []
      } catch (error) {
        console.error('Failed to load price comparisons:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadComparisons()
    })

    return {
      comparisons,
      loading,
      sortBy,
      minMarkup,
      maxMarkup,
      filteredAndSorted,
      averageMarkup,
      medianMarkup,
      lowestMarkup,
      highestMarkup,
      markupBuckets,
      formatPrice,
      calculateMarkup,
      calculateProfit,
      getMarkupStatus,
      getMarkupLabel,
    }
  },
}
</script>

<style scoped>
.price-comparison-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card h2 {
  margin: 0 0 1.5rem;
  color: #333;
  font-size: 1.5rem;
}

.card h3 {
  margin: 0 0 1.5rem;
  color: #333;
  font-size: 1.2rem;
}

.filter-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select,
.number-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.number-input {
  width: 150px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.stat .label {
  display: block;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat .value {
  display: block;
  color: #333;
  font-size: 1.8rem;
  font-weight: 700;
}

.comparisons-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comparison-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  transition: all 0.3s ease;
}

.comparison-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #d0d0d0;
}

.product-info h3 {
  margin: 0 0 0.5rem;
  color: #333;
  font-size: 1.1rem;
}

.category {
  display: inline-block;
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.pricing-section {
  flex: 1;
}

.price-pair {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.price-item {
  flex: 1;
  text-align: center;
  padding: 0.75rem;
  border-radius: 6px;
  background: #f9f9f9;
}

.price-item.supplier {
  border-left: 4px solid #ff9800;
}

.price-item.store {
  border-left: 4px solid #2c5f3d;
}

.price-item .label {
  display: block;
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.price-item .price {
  display: block;
  color: #333;
  font-size: 1.3rem;
  font-weight: 700;
}

.arrow {
  color: #ccc;
  font-size: 1.5rem;
}

.metrics {
  display: flex;
  gap: 1rem;
}

.metric {
  flex: 1;
  background: #f5f5f5;
  padding: 0.75rem;
  border-radius: 4px;
  text-align: center;
}

.metric .label {
  display: block;
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.metric .value {
  display: block;
  color: #333;
  font-weight: 600;
  font-size: 1rem;
}

.metric .markup {
  color: #0066cc;
  font-size: 1.1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.status-badge.high-markup {
  background: #d4edda;
  color: #155724;
}

.status-badge.good-markup {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.fair-markup {
  background: #fff3cd;
  color: #856404;
}

.status-badge.low-markup {
  background: #f8d7da;
  color: #721c24;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bucket {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bucket-label {
  width: 80px;
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.bucket-bar-container {
  flex: 1;
  background: #f0f0f0;
  border-radius: 4px;
  height: 30px;
  overflow: hidden;
}

.bucket-bar {
  background: linear-gradient(to right, #2c5f3d, #4a9d6f);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.bucket-bar-container:hover .bucket-bar {
  background: linear-gradient(to right, #1f4429, #2c5f3d);
}
</style>
