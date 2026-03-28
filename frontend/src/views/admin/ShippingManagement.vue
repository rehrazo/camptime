<template>
  <div class="shipping-management">
    <div class="management-header">
      <h1>Shipping Management</h1>
    </div>

    <div class="add-group-card">
      <h2>Add Shipping Group</h2>
      <div class="add-group-row">
        <div class="form-group inline-group">
          <label>Name</label>
          <input v-model="addName" type="text" placeholder="e.g. Standard Shipping (5-7 days)" class="form-input" />
        </div>
        <div class="form-group inline-group">
          <label>Cost ($)</label>
          <input v-model="addCost" type="number" min="0" step="0.01" placeholder="e.g. 9.99" class="form-input input-narrow" />
        </div>
        <button @click="addShippingGroup" class="btn btn-primary" :disabled="addSaving">
          {{ addSaving ? 'Adding...' : '+ Add' }}
        </button>
      </div>
      <p v-if="addError" class="error-msg">{{ addError }}</p>
    </div>

    <p v-if="loadError" class="error-msg">{{ loadError }}</p>
    <p v-if="loading" class="loading-msg">Loading shipping groups...</p>

    <div v-if="!loading" class="groups-table-container">
      <table class="groups-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in shippingGroups" :key="group.id">
            <td>
              <input v-if="editingId === group.id" v-model="editName" type="text" class="form-input input-inline" />
              <span v-else>{{ group.name }}</span>
            </td>
            <td class="cost-value">
              <input
                v-if="editingId === group.id"
                v-model="editCost"
                type="number"
                min="0"
                step="0.01"
                class="form-input input-inline input-narrow"
              />
              <span v-else>${{ Number(group.cost || 0).toFixed(2) }}</span>
            </td>
            <td class="action-buttons">
              <template v-if="editingId === group.id">
                <button class="btn btn-primary btn-small" @click="saveEdit(group)" :disabled="editSaving">
                  {{ editSaving ? 'Saving...' : 'Save' }}
                </button>
                <button class="btn btn-secondary btn-small" @click="cancelEdit">Cancel</button>
                <span v-if="editError" class="inline-error">{{ editError }}</span>
              </template>
              <template v-else>
                <button class="btn-edit" @click="startEdit(group)" title="Edit">Edit</button>
                <button class="btn-delete" @click="deleteShippingGroup(group)" title="Delete">Delete</button>
              </template>
            </td>
          </tr>
          <tr v-if="shippingGroups.length === 0">
            <td colspan="3" class="empty-row">No shipping groups configured yet. Add one above.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'ShippingManagement',
  setup() {
    const loading = ref(false)
    const loadError = ref('')
    const shippingGroups = ref([])

    const addName = ref('')
    const addCost = ref('')
    const addError = ref('')
    const addSaving = ref(false)

    const editingId = ref(null)
    const editName = ref('')
    const editCost = ref('')
    const editError = ref('')
    const editSaving = ref(false)

    const getAuthHeaders = () => {
      const authToken = String(localStorage.getItem('authToken') || '').trim()
      const adminToken = String(localStorage.getItem('adminApiToken') || '').trim()

      return {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(adminToken ? { 'x-admin-token': adminToken } : {}),
      }
    }

    const loadShippingGroups = async () => {
      loading.value = true
      loadError.value = ''

      try {
        const response = await fetch('/api/shipping-groups')
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shipping groups')
        }

        shippingGroups.value = Array.isArray(data.data) ? data.data : []
      } catch (error) {
        loadError.value = error.message || 'Failed to load shipping groups'
      } finally {
        loading.value = false
      }
    }

    const addShippingGroup = async () => {
      const name = String(addName.value || '').trim()
      const cost = Number(addCost.value)
      addError.value = ''

      if (!name) {
        addError.value = 'Name is required.'
        return
      }

      if (!Number.isFinite(cost) || cost < 0) {
        addError.value = 'Cost must be a non-negative number.'
        return
      }

      addSaving.value = true
      try {
        const response = await fetch('/api/shipping-groups', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, cost }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to add shipping group')
        }

        shippingGroups.value.push(data)
        addName.value = ''
        addCost.value = ''
      } catch (error) {
        addError.value = error.message || 'Failed to add shipping group'
      } finally {
        addSaving.value = false
      }
    }

    const startEdit = (group) => {
      editingId.value = group.id
      editName.value = group.name
      editCost.value = String(Number(group.cost || 0))
      editError.value = ''
    }

    const cancelEdit = () => {
      editingId.value = null
      editName.value = ''
      editCost.value = ''
      editError.value = ''
    }

    const saveEdit = async (group) => {
      const name = String(editName.value || '').trim()
      const cost = Number(editCost.value)
      editError.value = ''

      if (!name) {
        editError.value = 'Name is required.'
        return
      }

      if (!Number.isFinite(cost) || cost < 0) {
        editError.value = 'Cost must be a non-negative number.'
        return
      }

      editSaving.value = true
      try {
        const response = await fetch(`/api/shipping-groups/${group.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, cost }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update shipping group')
        }

        const index = shippingGroups.value.findIndex((entry) => entry.id === group.id)
        if (index !== -1) {
          shippingGroups.value[index] = data
        }

        cancelEdit()
      } catch (error) {
        editError.value = error.message || 'Failed to update shipping group'
      } finally {
        editSaving.value = false
      }
    }

    const deleteShippingGroup = async (group) => {
      if (!window.confirm(`Delete "${group.name}"?`)) {
        return
      }

      try {
        const response = await fetch(`/api/shipping-groups/${group.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to delete shipping group')
        }

        shippingGroups.value = shippingGroups.value.filter((entry) => entry.id !== group.id)
      } catch (error) {
        loadError.value = error.message || 'Failed to delete shipping group'
      }
    }

    onMounted(loadShippingGroups)

    return {
      loading,
      loadError,
      shippingGroups,
      addName,
      addCost,
      addError,
      addSaving,
      addShippingGroup,
      editingId,
      editName,
      editCost,
      editError,
      editSaving,
      startEdit,
      cancelEdit,
      saveEdit,
      deleteShippingGroup,
    }
  },
}
</script>

<style scoped>
.shipping-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.management-header h1 {
  margin: 0;
  color: #333;
}

.add-group-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.add-group-card h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.add-group-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.inline-group {
  flex: 1;
  min-width: 180px;
}

.inline-group label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  color: #555;
}

.groups-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.groups-table {
  width: 100%;
  border-collapse: collapse;
}

.groups-table th,
.groups-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.groups-table thead {
  background-color: #f5f5f5;
}

.groups-table th {
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.input-inline {
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
}

.input-narrow {
  max-width: 120px;
}

.cost-value {
  width: 160px;
}

.action-buttons {
  width: 260px;
  white-space: nowrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-small {
  padding: 0.45rem 0.8rem;
  font-size: 0.85rem;
  margin-right: 0.4rem;
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-edit,
.btn-delete {
  border: 1px solid #d7dce8;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  margin-right: 0.4rem;
}

.btn-edit:hover {
  background: #f3f6ff;
}

.btn-delete:hover {
  background: #ffecec;
}

.error-msg {
  color: #c0392b;
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
}

.inline-error {
  color: #c0392b;
  font-size: 0.85rem;
  margin-left: 0.4rem;
}

.loading-msg {
  color: #888;
  padding: 1rem 0;
}

.empty-row {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .add-group-row {
    flex-direction: column;
    align-items: stretch;
  }

  .input-narrow {
    max-width: none;
  }

  .groups-table {
    font-size: 0.9rem;
  }

  .groups-table th,
  .groups-table td {
    padding: 0.75rem;
  }
}
</style>
