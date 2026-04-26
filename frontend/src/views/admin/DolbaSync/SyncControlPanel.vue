<template>
  <div class="sync-control-panel">
    <div class="card">
      <h2>📤 Upload & Execute Sync</h2>
      
      <div class="control-section">
        <div class="upload-area" @dragover="dragover = true" @dragleave="dragover = false" @drop="handleDrop" :class="{ active: dragover }">
          <input 
            ref="fileInput"
            type="file" 
            accept=".csv" 
            @change="handleFileSelect"
            style="display: none"
          />
          
          <div class="upload-content">
            <div class="upload-icon">📁</div>
            <p class="upload-text">Drop CSV file here or <button @click="$refs.fileInput.click()" class="link-btn">click to browse</button></p>
            <p class="upload-hint">Supports Dolba price/inventory CSV format</p>
          </div>
        </div>

        <div v-if="selectedFile" class="file-info">
          <div class="file-name">✓ {{ selectedFile.name }}</div>
          <div class="file-size">{{ (selectedFile.size / 1024).toFixed(2) }} KB</div>
        </div>
      </div>

      <div class="sync-options">
        <label class="checkbox-option">
          <input v-model="dryRun" type="checkbox" />
          <span>Dry Run Only (preview changes without updating database)</span>
        </label>

        <label class="checkbox-option">
          <input v-model="useOriginalCrosswalk" type="checkbox" />
          <span>Use Original Crosswalk (for identifier drift recovery)</span>
        </label>
      </div>

      <div class="sync-stats" v-if="syncSummary">
        <h3>📊 Sync Results</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Processed</div>
            <div class="stat-value">{{ syncSummary.processed }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Matched</div>
            <div class="stat-value">{{ syncSummary.matched }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Updated</div>
            <div class="stat-value">{{ syncSummary.updated }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Variant Updates</div>
            <div class="stat-value">{{ syncSummary.variant_stats?.variantUpdated || 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Unmatched</div>
            <div class="stat-value alert">{{ syncSummary.noMatch }}</div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button 
          @click="executeSync" 
          :disabled="!selectedFile || syncing"
          class="btn btn-primary"
        >
          <span v-if="syncing">⏳ Syncing...</span>
          <span v-else>▶️ {{ dryRun ? 'Preview Sync' : 'Execute Sync' }}</span>
        </button>
        <button 
          @click="resetForm" 
          class="btn btn-secondary"
          :disabled="syncing"
        >
          Reset
        </button>
      </div>

      <div v-if="syncError" class="error-message">
        ❌ {{ syncError }}
      </div>
    </div>

    <!-- Unmatched Products -->
    <div v-if="syncSummary?.unmatchedSample?.length > 0" class="card mt-4">
      <h3>⚠️ Unmatched Products Sample</h3>
      <div class="unmatched-list">
        <div v-for="(item, idx) in syncSummary.unmatchedSample" :key="idx" class="unmatched-item">
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SyncControlPanel',
  emits: ['sync-triggered', 'file-uploaded'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const dragover = ref(false)
    const dryRun = ref(false)
    const useOriginalCrosswalk = ref(true)
    const syncing = ref(false)
    const syncSummary = ref(null)
    const syncError = ref(null)

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && file.name.endsWith('.csv')) {
        selectedFile.value = file
        syncError.value = null
        emit('file-uploaded', file.name)
      } else {
        syncError.value = 'Please select a valid CSV file'
      }
    }

    const handleDrop = (event) => {
      event.preventDefault()
      dragover.value = false
      const file = event.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        selectedFile.value = file
        syncError.value = null
        emit('file-uploaded', file.name)
      }
    }

    const executeSync = async () => {
      if (!selectedFile.value) {
        syncError.value = 'Please select a CSV file'
        return
      }

      syncing.value = true
      syncError.value = null
      syncSummary.value = null

      try {
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        formData.append('dryRun', dryRun.value)
        formData.append('useOriginalCrosswalk', useOriginalCrosswalk.value)

        const response = await fetch('/api/admin/dolba-sync/execute', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        syncSummary.value = data.summary
        emit('sync-triggered', data.summary)
      } catch (error) {
        syncError.value = `Sync failed: ${error.message}`
      } finally {
        syncing.value = false
      }
    }

    const resetForm = () => {
      selectedFile.value = null
      syncSummary.value = null
      syncError.value = null
      dryRun.value = false
      fileInput.value.value = ''
    }

    return {
      fileInput,
      selectedFile,
      dragover,
      dryRun,
      useOriginalCrosswalk,
      syncing,
      syncSummary,
      syncError,
      handleFileSelect,
      handleDrop,
      executeSync,
      resetForm,
    }
  },
}
</script>

<style scoped>
.sync-control-panel {
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
  margin: 1.5rem 0 1rem;
  color: #555;
}

.mt-4 {
  margin-top: 2rem;
}

.control-section {
  margin-bottom: 2rem;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background: #f9f9f9;
}

.upload-area.active {
  border-color: #2c5f3d;
  background: #f0f7f4;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  margin: 0.5rem 0;
  color: #666;
  font-size: 1rem;
}

.link-btn {
  background: none;
  border: none;
  color: #2c5f3d;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.link-btn:hover {
  color: #1f4429;
}

.upload-hint {
  margin: 0.5rem 0 0;
  color: #999;
  font-size: 0.9rem;
}

.file-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
  border-radius: 4px;
}

.file-name {
  font-weight: 600;
  color: #22c55e;
  margin-bottom: 0.25rem;
}

.file-size {
  color: #666;
  font-size: 0.9rem;
}

.sync-options {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 2rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0;
  cursor: pointer;
  color: #555;
}

.checkbox-option input {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.sync-stats {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 6px;
  margin: 1.5rem 0;
}

.sync-stats h3 {
  margin-top: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  text-align: center;
}

.stat-label {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c5f3d;
}

.stat-value.alert {
  color: #dc3545;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #2c5f3d;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1f4429;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e9ecef;
  color: #555;
}

.btn-secondary:hover:not(:disabled) {
  background: #dee2e6;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8d7da;
  border-left: 4px solid #dc3545;
  color: #721c24;
  border-radius: 4px;
}

.unmatched-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.unmatched-item {
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 3px solid #ffc107;
  font-family: monospace;
  font-size: 0.9rem;
  border-radius: 4px;
}
</style>
