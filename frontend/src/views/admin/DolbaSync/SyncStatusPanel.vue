<template>
  <div class="sync-status-panel">
    <!-- Last Sync Info -->
    <div class="card">
      <h2>📈 Last Sync Summary</h2>
      <div v-if="lastSync" class="sync-summary">
        <div class="summary-row">
          <span>Date/Time:</span>
          <strong>{{ formatDate(lastSync.createdAt) }}</strong>
        </div>
        <div class="summary-row">
          <span>Mode:</span>
          <strong>{{ lastSync.mode === 'dry-run' ? '🔍 Dry Run' : '✅ Live Sync' }}</strong>
        </div>
        <div class="summary-row">
          <span>CSV File:</span>
          <strong>{{ lastSync.csv }}</strong>
        </div>
        <div class="summary-row">
          <span>Rows Processed:</span>
          <strong>{{ lastSync.processed }}</strong>
        </div>
        <div class="summary-row">
          <span>Rows Matched:</span>
          <strong class="success">{{ lastSync.matched }}</strong>
        </div>
        <div class="summary-row">
          <span>Products Updated:</span>
          <strong class="success">{{ lastSync.updated }}</strong>
        </div>
        <div class="summary-row">
          <span>Variations Updated:</span>
          <strong class="success">{{ lastSync.variant_stats?.variantUpdated || 0 }}</strong>
        </div>
        <div class="summary-row">
          <span>Unmatched:</span>
          <strong class="alert">{{ lastSync.noMatch }}</strong>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No sync has been performed yet</p>
      </div>
    </div>

    <!-- Sync History -->
    <div class="card">
      <h2>📋 Sync History</h2>
      <div v-if="syncHistory.length > 0" class="history-table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Mode</th>
              <th>File</th>
              <th>Processed</th>
              <th>Updated</th>
              <th>Variants Updated</th>
              <th>Unmatched</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sync in syncHistory" :key="sync.id">
              <td>{{ formatDate(sync.createdAt) }}</td>
              <td>
                <span v-if="sync.mode === 'dry-run'" class="badge badge-info">Dry Run</span>
                <span v-else class="badge badge-success">Live</span>
              </td>
              <td class="filename">{{ sync.csv }}</td>
              <td>{{ sync.processed }}</td>
              <td class="success">{{ sync.updated }}</td>
              <td class="success">{{ sync.variant_stats?.variantUpdated || 0 }}</td>
              <td :class="{ alert: sync.noMatch > 0 }">{{ sync.noMatch }}</td>
              <td>
                <span v-if="sync.noMatch === 0" class="status-badge success">✓ Clean</span>
                <span v-else class="status-badge warning">⚠ Has Unmatched</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <p>No sync history available</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'SyncStatusPanel',
  props: {
    lastSync: {
      type: Object,
      default: null,
    },
    syncHistory: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    }

    return {
      formatDate,
    }
  },
}
</script>

<style scoped>
.sync-status-panel {
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

.sync-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #2c5f3d;
}

.summary-row span {
  color: #666;
  font-weight: 500;
}

.summary-row strong {
  color: #333;
  font-size: 1.1rem;
}

.summary-row strong.success {
  color: #22c55e;
}

.summary-row strong.alert {
  color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.history-table-container {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table thead {
  background: #f9f9f9;
}

.history-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #666;
  border-bottom: 2px solid #ddd;
}

.history-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #efefef;
  color: #555;
}

.history-table tbody tr:hover {
  background: #fafafa;
}

.filename {
  font-family: monospace;
  font-size: 0.9rem;
  color: #2c5f3d;
}

.success {
  color: #22c55e;
  font-weight: 600;
}

.alert {
  color: #dc3545;
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-info {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
}

.status-badge.warning {
  background: #fff3cd;
  color: #856404;
}
</style>
