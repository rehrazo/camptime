<template>
  <div class="drop-shippers-management">
    <div class="management-header">
      <h1>Drop Shippers</h1>
    </div>

    <div class="editor-card">
      <h2>{{ editingId ? 'Edit Drop Shipper' : 'Add Drop Shipper' }}</h2>
      <div class="form-grid">
        <div class="form-group full">
          <label>Name</label>
          <input v-model="form.name" type="text" class="form-input" placeholder="Supplier name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="supplier@email.com" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input v-model="form.phone" type="text" class="form-input" placeholder="+1 555..." />
        </div>
        <div class="form-group full">
          <label>Address Line 1</label>
          <input v-model="form.address_line1" type="text" class="form-input" placeholder="Street address" />
        </div>
        <div class="form-group full">
          <label>Address Line 2</label>
          <input v-model="form.address_line2" type="text" class="form-input" placeholder="Suite, unit, etc. (optional)" />
        </div>
        <div class="form-group">
          <label>City</label>
          <input v-model="form.city" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label>State/Region</label>
          <input v-model="form.state" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label>Postal Code</label>
          <input v-model="form.postal_code" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label>Country</label>
          <input v-model="form.country" type="text" class="form-input" />
        </div>
        <div class="form-group full">
          <label>Notes</label>
          <textarea v-model="form.notes" class="form-input" rows="3" placeholder="Internal notes"></textarea>
        </div>
      </div>

      <div class="actions-row">
        <button class="btn btn-primary" @click="save" :disabled="saving">
          {{ saving ? 'Saving...' : editingId ? 'Update' : 'Create' }}
        </button>
        <button v-if="editingId" class="btn btn-secondary" @click="resetForm">Cancel Edit</button>
      </div>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>

    <div class="table-card">
      <h2>Saved Drop Shippers</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="shipper in dropShippers" :key="shipper.id">
            <td>{{ shipper.name }}</td>
            <td>
              <div>{{ shipper.email || '-' }}</div>
              <div>{{ shipper.phone || '-' }}</div>
            </td>
            <td>{{ formatAddress(shipper) }}</td>
            <td>
              <button class="btn btn-secondary btn-small" @click="startEdit(shipper)">Edit</button>
              <button class="btn btn-danger btn-small" @click="remove(shipper)">Delete</button>
            </td>
          </tr>
          <tr v-if="dropShippers.length === 0">
            <td colspan="4" class="empty-row">No drop shippers added yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

function makeEmptyForm() {
  return {
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    notes: '',
  }
}

export default {
  name: 'DropShippersManagement',
  setup() {
    const dropShippers = ref([])
    const form = ref(makeEmptyForm())
    const editingId = ref(null)
    const saving = ref(false)
    const error = ref('')

    const getAuthHeaders = () => {
      const authToken = String(localStorage.getItem('authToken') || '').trim()
      const adminToken = String(localStorage.getItem('adminApiToken') || '').trim()
      return {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(adminToken ? { 'x-admin-token': adminToken } : {}),
      }
    }

    const load = async () => {
      const response = await fetch('/api/drop-shippers')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load drop shippers')
      }

      dropShippers.value = Array.isArray(data.data) ? data.data : []
    }

    const resetForm = () => {
      form.value = makeEmptyForm()
      editingId.value = null
      error.value = ''
    }

    const save = async () => {
      error.value = ''
      const payload = {
        name: String(form.value.name || '').trim(),
        email: String(form.value.email || '').trim() || null,
        phone: String(form.value.phone || '').trim() || null,
        address_line1: String(form.value.address_line1 || '').trim() || null,
        address_line2: String(form.value.address_line2 || '').trim() || null,
        city: String(form.value.city || '').trim() || null,
        state: String(form.value.state || '').trim() || null,
        postal_code: String(form.value.postal_code || '').trim() || null,
        country: String(form.value.country || '').trim() || null,
        notes: String(form.value.notes || '').trim() || null,
      }

      if (!payload.name) {
        error.value = 'Name is required.'
        return
      }

      saving.value = true
      try {
        const isEdit = Boolean(editingId.value)
        const endpoint = isEdit ? `/api/drop-shippers/${editingId.value}` : '/api/drop-shippers'
        const method = isEdit ? 'PUT' : 'POST'
        const response = await fetch(endpoint, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save drop shipper')
        }

        await load()
        resetForm()
      } catch (saveError) {
        error.value = saveError.message || 'Failed to save drop shipper'
      } finally {
        saving.value = false
      }
    }

    const startEdit = (shipper) => {
      editingId.value = shipper.id
      form.value = {
        name: shipper.name || '',
        email: shipper.email || '',
        phone: shipper.phone || '',
        address_line1: shipper.address_line1 || '',
        address_line2: shipper.address_line2 || '',
        city: shipper.city || '',
        state: shipper.state || '',
        postal_code: shipper.postal_code || '',
        country: shipper.country || '',
        notes: shipper.notes || '',
      }
      error.value = ''
    }

    const remove = async (shipper) => {
      if (!window.confirm(`Delete "${shipper.name}"?`)) {
        return
      }

      error.value = ''
      try {
        const response = await fetch(`/api/drop-shippers/${shipper.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to delete drop shipper')
        }

        await load()
        if (editingId.value === shipper.id) {
          resetForm()
        }
      } catch (removeError) {
        error.value = removeError.message || 'Failed to delete drop shipper'
      }
    }

    const formatAddress = (shipper) => {
      return [
        shipper.address_line1,
        shipper.address_line2,
        shipper.city,
        shipper.state,
        shipper.postal_code,
        shipper.country,
      ]
        .filter((part) => String(part || '').trim())
        .join(', ') || '-'
    }

    onMounted(async () => {
      try {
        await load()
      } catch (loadError) {
        error.value = loadError.message || 'Failed to load drop shippers'
      }
    })

    return {
      dropShippers,
      form,
      editingId,
      saving,
      error,
      save,
      startEdit,
      remove,
      resetForm,
      formatAddress,
    }
  },
}
</script>

<style scoped>
.drop-shippers-management {
  max-width: 1240px;
  margin: 0 auto;
  padding: 2rem;
}

.management-header h1 {
  margin: 0 0 1rem;
}

.editor-card,
.table-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.form-input {
  width: 100%;
  border: 1px solid #d9deea;
  border-radius: 6px;
  padding: 0.65rem;
}

.actions-row {
  margin-top: 0.85rem;
  display: flex;
  gap: 0.6rem;
}

.btn {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: var(--color-accent);
  color: #fff;
  padding: 0.6rem 1rem;
}

.btn-secondary {
  background: #eef1f8;
  color: #2f3f5a;
  padding: 0.6rem 1rem;
}

.btn-danger {
  background: #fce8e8;
  color: #9e2626;
  padding: 0.6rem 1rem;
}

.btn-small {
  padding: 0.35rem 0.65rem;
  margin-right: 0.4rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  text-align: left;
  border-bottom: 1px solid #eceff6;
  padding: 0.7rem;
}

.empty-row {
  color: #777;
  font-style: italic;
  text-align: center;
}

.error-msg {
  color: #c0392b;
  margin-top: 0.7rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
