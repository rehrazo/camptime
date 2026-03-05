<template>
  <div class="admin-order-export-manager">
    <div class="page-header">
      <div>
        <h1>Order Export Manager</h1>
        <p class="subtitle">Export orders to Doba template and track lifecycle statuses.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">Back to Admin</button>
        <button class="btn btn-secondary" @click="loadOrders" :disabled="loading">Refresh</button>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

    <div class="toolbar">
      <div class="form-group">
        <label for="orderSearch">Filter Orders</label>
        <input id="orderSearch" v-model="search" type="text" class="form-input" placeholder="Order ID, name, email" />
      </div>
      <div class="actions">
        <button class="btn btn-primary" @click="exportSelected" :disabled="isBusy || !selectedOrderIds.length">Export Selected (Doba)</button>
        <button class="btn btn-secondary" @click="markProcessed" :disabled="isBusy || !selectedOrderIds.length">Mark Processed</button>
        <button class="btn btn-secondary" @click="markShipped" :disabled="isBusy || !selectedOrderIds.length">Mark Shipped</button>
      </div>
    </div>

    <div class="table-card">
      <div v-if="loading" class="loading">Loading orders...</div>
      <div v-else-if="filteredOrders.length === 0" class="empty-state">No orders found.</div>

      <table v-else class="orders-table">
        <thead>
          <tr>
            <th><input type="checkbox" :checked="allVisibleSelected" @change="toggleSelectAll($event)" /></th>
            <th>Order</th>
            <th>Customer</th>
            <th>Created</th>
            <th>Exported</th>
            <th>Processed</th>
            <th>Shipped</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.orderId">
            <td>
              <input type="checkbox" :checked="selectedOrderIds.includes(order.orderId)" @change="toggleSelect(order.orderId, $event)" />
            </td>
            <td class="mono">{{ order.orderId }}</td>
            <td>
              <div>{{ order.customer?.firstName }} {{ order.customer?.lastName }}</div>
              <div class="muted">{{ order.customer?.email }}</div>
            </td>
            <td>
              <span class="status-chip created">{{ getStatus(order, 'created') }}</span>
              <div class="date">{{ formatDate(getDate(order, 'created')) }}</div>
            </td>
            <td>
              <span class="status-chip exported">{{ getStatus(order, 'exported') }}</span>
              <div class="date">{{ formatDate(getDate(order, 'exported')) }}</div>
            </td>
            <td>
              <span class="status-chip processed">{{ getStatus(order, 'processed') }}</span>
              <div class="date">{{ formatDate(getDate(order, 'processed')) }}</div>
            </td>
            <td>
              <span class="status-chip shipped">{{ getStatus(order, 'shipped') }}</span>
              <div class="date">{{ formatDate(getDate(order, 'shipped')) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AdminOrderExportManager',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const isBusy = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const search = ref('')
    const orders = ref([])
    const selectedOrderIds = ref([])

    const filteredOrders = computed(() => {
      const query = String(search.value || '').trim().toLowerCase()
      if (!query) {
        return orders.value
      }

      return orders.value.filter((order) => {
        const orderId = String(order?.orderId || '').toLowerCase()
        const fullName = `${order?.customer?.firstName || ''} ${order?.customer?.lastName || ''}`.toLowerCase()
        const email = String(order?.customer?.email || '').toLowerCase()
        return orderId.includes(query) || fullName.includes(query) || email.includes(query)
      })
    })

    const allVisibleSelected = computed(() => {
      if (!filteredOrders.value.length) {
        return false
      }
      return filteredOrders.value.every((order) => selectedOrderIds.value.includes(order.orderId))
    })

    const goBack = () => {
      router.push({ path: '/admin', query: { tab: 'orders' } })
    }

    const loadOrders = async () => {
      loading.value = true
      error.value = ''

      try {
        const response = await fetch('/api/orders')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load orders')
        }

        const rows = Array.isArray(data.data) ? data.data : []
        orders.value = rows

        const validIds = new Set(rows.map((order) => order.orderId))
        selectedOrderIds.value = selectedOrderIds.value.filter((id) => validIds.has(id))
      } catch (loadError) {
        error.value = loadError.message || 'Failed to load orders'
        orders.value = []
      } finally {
        loading.value = false
      }
    }

    const toggleSelect = (orderId, event) => {
      const checked = Boolean(event?.target?.checked)
      const current = new Set(selectedOrderIds.value)

      if (checked) {
        current.add(orderId)
      } else {
        current.delete(orderId)
      }

      selectedOrderIds.value = [...current]
    }

    const toggleSelectAll = (event) => {
      const checked = Boolean(event?.target?.checked)
      if (!checked) {
        const visible = new Set(filteredOrders.value.map((order) => order.orderId))
        selectedOrderIds.value = selectedOrderIds.value.filter((id) => !visible.has(id))
        return
      }

      const current = new Set(selectedOrderIds.value)
      filteredOrders.value.forEach((order) => current.add(order.orderId))
      selectedOrderIds.value = [...current]
    }

    const downloadBlob = (blob, fileName) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    }

    const exportSelected = async () => {
      if (!selectedOrderIds.value.length) {
        return
      }

      isBusy.value = true
      error.value = ''
      successMessage.value = ''

      try {
        const response = await fetch('/api/orders/export/doba', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds: selectedOrderIds.value }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to export Doba file')
        }

        const disposition = response.headers.get('Content-Disposition') || ''
        const fileNameMatch = disposition.match(/filename="?([^\"]+)"?/i)
        const fileName = fileNameMatch?.[1] || 'doba_orders.xls'
        const blob = await response.blob()
        downloadBlob(blob, fileName)

        successMessage.value = 'Doba export downloaded and order export status updated.'
        await loadOrders()
      } catch (exportError) {
        error.value = exportError.message || 'Failed to export Doba file'
      } finally {
        isBusy.value = false
      }
    }

    const updateLifecycle = async (stage) => {
      if (!selectedOrderIds.value.length) {
        return
      }

      isBusy.value = true
      error.value = ''
      successMessage.value = ''

      try {
        const response = await fetch('/api/orders/lifecycle/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds: selectedOrderIds.value, stage }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || `Failed to update ${stage} status`)
        }

        successMessage.value = data.message || `Updated ${stage} status.`
        await loadOrders()
      } catch (stageError) {
        error.value = stageError.message || `Failed to update ${stage} status`
      } finally {
        isBusy.value = false
      }
    }

    const markProcessed = async () => {
      await updateLifecycle('processed')
    }

    const markShipped = async () => {
      await updateLifecycle('shipped')
    }

    const getStatus = (order, stage) => {
      return String(order?.lifecycle?.[stage]?.status || '-').replace(/_/g, ' ')
    }

    const getDate = (order, stage) => {
      return order?.lifecycle?.[stage]?.date || null
    }

    const formatDate = (value) => {
      if (!value) {
        return '-'
      }

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return '-'
      }

      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    onMounted(async () => {
      await loadOrders()
    })

    return {
      loading,
      isBusy,
      error,
      successMessage,
      search,
      filteredOrders,
      selectedOrderIds,
      allVisibleSelected,
      goBack,
      loadOrders,
      toggleSelect,
      toggleSelectAll,
      exportSelected,
      markProcessed,
      markShipped,
      getStatus,
      getDate,
      formatDate,
    }
  },
}
</script>

<style scoped>
.admin-order-export-manager {
  max-width: 1300px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  margin-top: 0.35rem;
  color: #555;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 320px;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.table-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #eee;
  text-align: left;
  vertical-align: top;
}

.orders-table th {
  background: #f5f5f5;
  color: #333;
}

.mono {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 0.85rem;
}

.muted {
  color: #666;
  font-size: 0.82rem;
}

.status-chip {
  display: inline-block;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: capitalize;
}

.status-chip.created {
  background: #e3f2fd;
  color: #0d47a1;
}

.status-chip.exported {
  background: #ede7f6;
  color: #4527a0;
}

.status-chip.processed {
  background: #e8f5e9;
  color: #1b5e20;
}

.status-chip.shipped {
  background: #fff8e1;
  color: #8a5100;
}

.date {
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.78rem;
}

.loading,
.empty-state {
  padding: 1rem;
  color: #666;
}

.error-message {
  margin: 0 0 0.75rem;
  color: #b3261e;
  font-weight: 600;
}

.success-message {
  margin: 0 0 0.75rem;
  color: #1b5e20;
  font-weight: 600;
}

.btn {
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background-color: #2F4F3E;
  color: var(--color-sand);
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 960px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group {
    min-width: 0;
  }
}
</style>
