<template>
  <div class="dolba-sync-manager">
    <!-- Navigation -->
    <nav class="manager-nav">
      <h1>🔄 Dolba Sync Manager</h1>
      <div class="nav-buttons">
        <button 
          v-for="view in views"
          :key="view.id"
          :class="['nav-btn', { active: currentView === view.id }]"
          @click="currentView = view.id"
        >
          {{ view.label }}
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="manager-content">
      <!-- Dashboard View -->
      <DolbaSyncDashboard 
        v-if="currentView === 'dashboard'"
        @view-change="currentView = $event"
      />

      <!-- Sync Status View -->
      <DolbaSyncStatus 
        v-if="currentView === 'sync-status'"
      />

      <!-- Import History View -->
      <ImportHistoryView 
        v-if="currentView === 'imports'"
      />

      <!-- Variant Pricing View -->
      <VariantPricingView 
        v-if="currentView === 'variant-pricing'"
      />

      <!-- Price Comparison View -->
      <PriceComparisonView 
        v-if="currentView === 'price-comparison'"
      />
    </div>

    <!-- Variant Editor Panel (Modal Overlay) -->
    <div v-if="showVariantEditor" class="editor-overlay">
      <VariantEditorPanel 
        :product="selectedProduct"
        @close="showVariantEditor = false"
        @save="handleVariantEditorSave"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import DolbaSyncDashboard from './DolbaSync/DolbaSyncDashboard.vue'
import DolbaSyncStatus from './DolbaSync/DolbaSyncStatus.vue'
import ImportHistoryView from './DolbaSync/ImportHistoryView.vue'
import VariantPricingView from './DolbaSync/VariantPricingView.vue'
import PriceComparisonView from './DolbaSync/PriceComparisonView.vue'
import VariantEditorPanel from './DolbaSync/VariantEditorPanel.vue'

export default {
  name: 'DolbaSyncManager',
  components: {
    DolbaSyncDashboard,
    DolbaSyncStatus,
    ImportHistoryView,
    VariantPricingView,
    PriceComparisonView,
    VariantEditorPanel,
  },
  setup() {
    const currentView = ref('dashboard')
    const showVariantEditor = ref(false)
    const selectedProduct = ref(null)

    const views = [
      { id: 'dashboard', label: '📊 Dashboard' },
      { id: 'sync-status', label: '🔄 Sync Status' },
      { id: 'imports', label: '📥 Import History' },
      { id: 'variant-pricing', label: '💰 Variant Pricing' },
      { id: 'price-comparison', label: '📈 Price Analysis' },
    ]

    const handleVariantEditorSave = async (payload) => {
      try {
        const response = await fetch('/api/admin/dolba-sync/update-variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        
        if (response.ok) {
          showVariantEditor.value = false
          selectedProduct.value = null
          // Optionally refresh the current view
        }
      } catch (error) {
        console.error('Error saving variant changes:', error)
      }
    }

    return {
      currentView,
      views,
      showVariantEditor,
      selectedProduct,
      handleVariantEditorSave,
    }
  },
}
</script>

<style scoped>
.dolba-sync-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
}

.manager-nav {
  background: linear-gradient(135deg, #2c5f3d 0%, #1f4429 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.manager-nav h1 {
  margin: 0;
  font-size: 1.8rem;
}

.nav-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.nav-btn.active {
  background: white;
  color: #2c5f3d;
  border-color: white;
}

.manager-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.editor-overlay > * {
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
