<template>
  <div class="dolba-variant-sync-manager">
    <div v-if="panelError" class="runtime-error-card">
      <h2>Dolba Sync UI Error</h2>
      <p>{{ panelError }}</p>
      <div class="error-actions">
        <button class="tab-btn" @click="recoverToSyncControl">Go To Sync Control</button>
      </div>
    </div>

    <!-- Header with navigation tabs -->
    <div class="sync-header">
      <h1>🔄 Dolba Variant Sync Manager</h1>
      <div class="tab-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab"
          @click="activeTab = tab"
          :class="['tab-btn', { active: activeTab === tab }]"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- TAB 1: Sync Control & Upload -->
    <div v-show="activeTab === 'Sync Control'" class="tab-content">
      <SyncControlPanel 
        @sync-triggered="onSyncTriggered"
        @file-uploaded="onFileUploaded"
      />
    </div>

    <!-- TAB 2: Sync Status & History -->
    <div v-show="activeTab === 'Status & History'" class="tab-content">
      <SyncStatusPanel 
        :lastSync="lastSync"
        :syncHistory="syncHistory"
      />
    </div>

    <!-- TAB 3: Variant Pricing View -->
    <div v-show="activeTab === 'Variant Pricing'" class="tab-content">
      <VariantPricingView @edit-product="openVariantEditorForProduct" />
    </div>

    <!-- TAB 4: Price Comparison -->
    <div v-show="activeTab === 'Price Comparison'" class="tab-content">
      <PriceComparisonView />
    </div>

    <!-- TAB 5: Variant Editor -->
    <div v-show="activeTab === 'Variant Editor'" class="tab-content">
      <VariantEditorPanel :product="selectedProduct" @close="closeVariantEditor" @save="handleVariantEditorSave" />
    </div>

    <!-- Toast notifications -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import SyncControlPanel from './DolbaSync/SyncControlPanel.vue'
import SyncStatusPanel from './DolbaSync/SyncStatusPanel.vue'
import VariantPricingView from './DolbaSync/VariantPricingView.vue'
import PriceComparisonView from './DolbaSync/PriceComparisonView.vue'
import VariantEditorPanel from './DolbaSync/VariantEditorPanel.vue'

export default {
  name: 'DolbaVariantSyncManager',
  components: {
    SyncControlPanel,
    SyncStatusPanel,
    VariantPricingView,
    PriceComparisonView,
    VariantEditorPanel,
  },
  setup() {
    const route = useRoute()
    const activeTab = ref('Sync Control')
    const tabs = ['Sync Control', 'Status & History', 'Variant Pricing', 'Price Comparison', 'Variant Editor']
    const notification = ref(null)
    const lastSync = ref(null)
    const syncHistory = ref([])
    const selectedProduct = ref(null)
    const panelError = ref('')

    const onSyncTriggered = (result) => {
      lastSync.value = result
      showNotification(`Sync completed: ${result.updated} products updated`, 'success')
      loadSyncHistory()
    }

    const onFileUploaded = (fileName) => {
      showNotification(`File uploaded: ${fileName}`, 'success')
    }

    const showNotification = (message, type = 'info') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = null
      }, 5000)
    }

    const loadSyncHistory = async () => {
      try {
        const response = await fetch('/api/admin/dolba-sync/history')
        const data = await response.json()
        syncHistory.value = data.history || []
      } catch (error) {
        console.error('Failed to load sync history:', error)
      }
    }

    const loadLastSync = async () => {
      try {
        const response = await fetch('/api/admin/dolba-sync/last')
        const data = await response.json()
        lastSync.value = data.lastSync
      } catch (error) {
        console.error('Failed to load last sync:', error)
      }
    }

    const openVariantEditorForProduct = (product) => {
      if (!product) {
        return
      }

      selectedProduct.value = product
      activeTab.value = 'Variant Editor'
    }

    const closeVariantEditor = () => {
      activeTab.value = 'Variant Pricing'
      selectedProduct.value = null
    }

    const handleVariantEditorSave = async (payload) => {
      try {
        const response = await fetch('/api/admin/dolba-sync/update-variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        showNotification('Variant changes saved successfully', 'success')
      } catch (error) {
        showNotification(`Failed to save variant changes: ${error.message}`, 'error')
      }
    }

    const recoverToSyncControl = () => {
      panelError.value = ''
      activeTab.value = 'Sync Control'
    }

    const openVariantEditorFromQuery = async () => {
      const requestedTab = String(route.query.tab || '').trim().toLowerCase()
      const requestedProductId = Number(route.query.product_id || 0)

      if (requestedTab !== 'variant-editor') {
        return
      }

      activeTab.value = 'Variant Editor'

      if (!requestedProductId) {
        return
      }

      try {
        const response = await fetch(`/api/products/${requestedProductId}?include_inactive=true`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load product for variant editor')
        }

        selectedProduct.value = {
          product_id: data.product_id,
          name: data.name || '',
          sku: data.sku_code || '',
          variations: Array.isArray(data.variations)
            ? data.variations.map((item, index) => ({
                variation_id: item.variation_id || index + 1,
                option_type: item.theme_name || '',
                variation_value: item.variation_value || '',
                variation_sku: item.variation_sku || '',
                dropshipping_price: item.dropshipping_price || 0,
                actual_price: item.actual_price || data.price || 0,
              }))
            : [],
        }
      } catch (error) {
        showNotification(`Could not open variant editor for selected product: ${error.message}`, 'error')
      }
    }

    onMounted(() => {
      loadLastSync()
      loadSyncHistory()
      openVariantEditorFromQuery()
    })

    onErrorCaptured((error) => {
      panelError.value = error?.message || 'Unknown runtime error while rendering Dolba Sync.'
      activeTab.value = 'Sync Control'
      return false
    })

    return {
      activeTab,
      tabs,
      notification,
      panelError,
      lastSync,
      syncHistory,
      selectedProduct,
      onSyncTriggered,
      onFileUploaded,
      openVariantEditorForProduct,
      closeVariantEditor,
      handleVariantEditorSave,
      recoverToSyncControl,
    }
  },
}
</script>

<style scoped>
.dolba-variant-sync-manager {
  padding: 2rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.runtime-error-card {
  background: #fff4f4;
  border: 1px solid #e4b4b4;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.runtime-error-card h2 {
  margin: 0 0 0.5rem;
  color: #7e1f1f;
  font-size: 1.1rem;
}

.runtime-error-card p {
  margin: 0;
  color: #7e1f1f;
}

.error-actions {
  margin-top: 0.75rem;
}

.sync-header {
  margin-bottom: 2rem;
}

.sync-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
}

.tab-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #ddd;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #666;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.02);
}

.tab-btn.active {
  color: #2c5f3d;
  border-bottom-color: #2c5f3d;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
  }
  to {
    transform: translateX(0);
  }
}

.notification.success {
  background: #28a745;
  color: white;
}

.notification.error {
  background: #dc3545;
  color: white;
}

.notification.info {
  background: #17a2b8;
  color: white;
}
</style>
