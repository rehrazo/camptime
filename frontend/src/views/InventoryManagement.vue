<template>
  <div class="inventory-management">
    <!-- Header -->
    <div class="inventory-header">
      <h1>Inventory Management</h1>
      <button @click="showImport = true" class="btn btn-primary">
        📥 Import Inventory
      </button>
    </div>

    <!-- Filters -->
    <div class="inventory-filters">
      <input 
        v-model="searchQuery"
        type="text"
        placeholder="Search products..."
        class="search-input"
      />

      <select v-model="statusFilter" class="filter-select">
        <option value="">All Stock Status</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>

      <select v-model="categoryFilter" class="filter-select">
        <option value="">All Categories</option>
        <option value="tents">Tents</option>
        <option value="sleeping">Sleeping Bags</option>
        <option value="backpacks">Backpacks</option>
        <option value="cooking">Cooking Gear</option>
      </select>
    </div>

    <!-- Inventory Table -->
    <div class="inventory-table-container">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Reorder Level</th>
            <th>Status</th>
            <th>Last Restock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredInventory" :key="product.id">
            <td class="product-name">
              <img :src="product.image" :alt="product.name" class="product-thumb" />
              {{ product.name }}
            </td>
            <td class="sku">{{ product.sku }}</td>
            <td>{{ product.category }}</td>
            <td class="stock-quantity">
              <input 
                v-model.number="product.quantity"
                type="number"
                min="0"
                class="quantity-input"
                @change="updateStock(product)"
              />
            </td>
            <td class="reorder-level">{{ product.reorderLevel }}</td>
            <td>
              <span class="stock-badge" :class="getStockStatus(product).class">
                {{ getStockStatus(product).label }}
              </span>
            </td>
            <td class="restock-date">{{ product.lastRestock }}</td>
            <td class="action-buttons">
              <button @click="openAdjustmentModal(product)" class="btn-adjust" title="Adjust Stock">
                ⚙️
              </button>
              <button @click="openHistoryModal(product)" class="btn-history" title="View History">
                📊
              </button>
              <button @click="editProduct(product)" class="btn-edit" title="Edit">
                ✎
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stock Adjustment Modal -->
    <div v-if="showAdjustment" class="modal-overlay" @click.self="showAdjustment = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Adjust Stock: {{ selectedProduct?.name }}</h2>
          <button @click="showAdjustment = false" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveAdjustment" class="adjustment-form">
          <div class="form-row">
            <div class="form-group">
              <label>Current Stock</label>
              <p class="current-value">{{ selectedProduct?.quantity }} units</p>
            </div>

            <div class="form-group">
              <label>Adjustment Type</label>
              <select v-model="adjustment.type" class="form-input">
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
                <option value="set">Set to Exact Amount</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Quantity</label>
            <input 
              v-model.number="adjustment.quantity"
              type="number"
              min="1"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Reason</label>
            <select v-model="adjustment.reason" class="form-input">
              <option value="">Select a reason</option>
              <option value="restock">Restock</option>
              <option value="damage">Damaged Stock</option>
              <option value="return">Customer Return</option>
              <option value="correction">Inventory Correction</option>
              <option value="loss">Loss/Theft</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea 
              v-model="adjustment.notes"
              class="form-input"
              placeholder="Add any additional notes..."
              rows="3"
            ></textarea>
          </div>

          <div class="adjustment-preview">
            <p v-if="adjustment.type === 'add'">
              New Stock: {{ selectedProduct?.quantity }} + {{ adjustment.quantity }} = 
              <strong>{{ selectedProduct?.quantity + adjustment.quantity }}</strong> units
            </p>
            <p v-else-if="adjustment.type === 'remove'">
              New Stock: {{ selectedProduct?.quantity }} - {{ adjustment.quantity }} = 
              <strong>{{ Math.max(0, selectedProduct?.quantity - adjustment.quantity) }}</strong> units
            </p>
            <p v-else>
              New Stock: <strong>{{ adjustment.quantity }}</strong> units
            </p>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Apply Adjustment</button>
            <button type="button" @click="showAdjustment = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Stock History Modal -->
    <div v-if="showHistory" class="modal-overlay" @click.self="showHistory = false">
      <div class="modal-content history-modal">
        <div class="modal-header">
          <h2>Stock History: {{ selectedProduct?.name }}</h2>
          <button @click="showHistory = false" class="close-btn">✕</button>
        </div>

        <div class="history-list">
          <div v-for="entry in selectedProduct?.history || []" :key="entry.id" class="history-entry">
            <div class="entry-header">
              <span class="entry-type" :class="entry.type.toLowerCase()">{{ entry.type }}</span>
              <span class="entry-date">{{ entry.date }}</span>
            </div>
            <div class="entry-details">
              <p><strong>Quantity Changed:</strong> {{ entry.quantityChange }}</p>
              <p><strong>From:</strong> {{ entry.fromQuantity }} → <strong>To:</strong> {{ entry.toQuantity }}</p>
              <p v-if="entry.reason"><strong>Reason:</strong> {{ entry.reason }}</p>
              <p v-if="entry.notes"><strong>Notes:</strong> {{ entry.notes }}</p>
              <p class="entry-user"><strong>By:</strong> {{ entry.user }} on {{ entry.timestamp }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImport" class="modal-overlay" @click.self="showImport = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Import Inventory</h2>
          <button @click="showImport = false" class="close-btn">✕</button>
        </div>

        <div class="import-form">
          <div class="form-group">
            <label>Upload CSV File</label>
            <div class="file-upload">
              <input type="file" accept=".csv" class="file-input" />
              <p>Drag and drop your CSV file here or click to select</p>
            </div>
          </div>

          <div class="form-group">
            <h3>CSV Format</h3>
            <pre class="csv-format">SKU,Product Name,Quantity,Category
TENT001,Mountain Tent Pro,15,Tents
BAG001,Sleeping Bag,32,Sleeping Bags
PACK001,Hiking Backpack,8,Backpacks</pre>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary">Import File</button>
            <button @click="showImport = false" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock Alert -->
    <div v-if="lowStockItems.length > 0" class="alert-box low-stock-alert">
      <h3>⚠️ Low Stock Alert</h3>
      <p>{{ lowStockItems.length }} products are running low on stock</p>
      <ul>
        <li v-for="item in lowStockItems" :key="item.id">
          {{ item.name }}: {{ item.quantity }} units (Reorder: {{ item.reorderLevel }})
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'InventoryManagement',
  setup() {
    const searchQuery = ref('')
    const statusFilter = ref('')
    const categoryFilter = ref('')
    const showAdjustment = ref(false)
    const showHistory = ref(false)
    const showImport = ref(false)
    const selectedProduct = ref(null)

    const adjustment = ref({
      type: 'add',
      quantity: 0,
      reason: '',
      notes: '',
    })

    const inventory = ref([
      {
        id: 1,
        name: 'Mountain Tent Pro',
        sku: 'TENT001',
        category: 'Tents',
        quantity: 15,
        reorderLevel: 10,
        image: '/images/tent.jpg',
        lastRestock: '2026-02-15',
        history: [
          { id: 1, type: 'Restock', date: '2026-02-15', quantityChange: '+20', fromQuantity: '5', toQuantity: '25', reason: 'Restock', user: 'Admin', timestamp: '2026-02-15 10:30 AM', notes: 'Supplier delivery' },
          { id: 2, type: 'Sale', date: '2026-02-14', quantityChange: '-10', fromQuantity: '15', toQuantity: '5', reason: 'Orders', user: 'System', timestamp: '2026-02-14 2:45 PM', notes: '' },
        ],
      },
      {
        id: 2,
        name: 'Sleeping Bag Deluxe',
        sku: 'BAG001',
        category: 'Sleeping Bags',
        quantity: 32,
        reorderLevel: 15,
        image: '/images/sleeping-bag.jpg',
        lastRestock: '2026-02-10',
        history: [
          { id: 3, type: 'Sale', date: '2026-02-18', quantityChange: '-5', fromQuantity: '37', toQuantity: '32', reason: 'Orders', user: 'System', timestamp: '2026-02-18 3:20 PM', notes: '' },
        ],
      },
      {
        id: 3,
        name: 'Hiking Backpack 65L',
        sku: 'PACK001',
        category: 'Backpacks',
        quantity: 8,
        reorderLevel: 20,
        image: '/images/backpack.jpg',
        lastRestock: '2026-01-25',
        history: [
          { id: 4, type: 'Damage', date: '2026-02-16', quantityChange: '-2', fromQuantity: '10', toQuantity: '8', reason: 'Damaged Stock', user: 'John', timestamp: '2026-02-16 11:00 AM', notes: 'Packaging damage during inspection' },
        ],
      },
      {
        id: 4,
        name: 'Camping Stove',
        sku: 'STOVE001',
        category: 'Cooking Gear',
        quantity: 42,
        reorderLevel: 20,
        image: '/images/stove.jpg',
        lastRestock: '2026-02-12',
        history: [],
      },
      {
        id: 5,
        name: 'Sleeping Pad',
        sku: 'PAD001',
        category: 'Sleeping Gear',
        quantity: 5,
        reorderLevel: 15,
        image: '/images/pad.jpg',
        lastRestock: '2026-02-01',
        history: [
          { id: 5, type: 'Sale', date: '2026-02-17', quantityChange: '-15', fromQuantity: '20', toQuantity: '5', reason: 'Orders', user: 'System', timestamp: '2026-02-17 1:15 PM', notes: '' },
        ],
      },
    ])

    const filteredInventory = computed(() => {
      return inventory.value.filter(product => {
        const matchesSearch = !searchQuery.value || 
          product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.value.toLowerCase())

        const matchesCategory = !categoryFilter.value || product.category === categoryFilter.value

        let matchesStatus = true
        if (statusFilter.value) {
          const status = getStockStatus(product).class
          matchesStatus = status.replace('status-', '') === statusFilter.value.replace('-', '')
        }

        return matchesSearch && matchesCategory && matchesStatus
      })
    })

    const lowStockItems = computed(() => {
      return inventory.value.filter(p => p.quantity <= p.reorderLevel && p.quantity > 0)
    })

    const getStockStatus = (product) => {
      if (product.quantity === 0) {
        return { label: 'Out of Stock', class: 'status-out-of-stock' }
      } else if (product.quantity <= product.reorderLevel) {
        return { label: 'Low Stock', class: 'status-low-stock' }
      } else {
        return { label: 'In Stock', class: 'status-in-stock' }
      }
    }

    const openAdjustmentModal = (product) => {
      selectedProduct.value = product
      adjustment.value = { type: 'add', quantity: 0, reason: '', notes: '' }
      showAdjustment.value = true
    }

    const saveAdjustment = () => {
      if (!selectedProduct.value) return

      let newQuantity = selectedProduct.value.quantity
      if (adjustment.value.type === 'add') {
        newQuantity += adjustment.value.quantity
      } else if (adjustment.value.type === 'remove') {
        newQuantity = Math.max(0, newQuantity - adjustment.value.quantity)
      } else {
        newQuantity = adjustment.value.quantity
      }

      const historyEntry = {
        id: Math.random(),
        type: adjustment.value.type === 'add' ? 'Addition' : 'Removal',
        date: new Date().toLocaleDateString(),
        quantityChange: adjustment.value.type === 'set' ? 
          `Set to ${adjustment.value.quantity}` :
          `${adjustment.value.type === 'add' ? '+' : '-'}${adjustment.value.quantity}`,
        fromQuantity: selectedProduct.value.quantity,
        toQuantity: newQuantity,
        reason: adjustment.value.reason,
        user: 'Current Admin',
        timestamp: new Date().toLocaleString(),
        notes: adjustment.value.notes,
      }

      selectedProduct.value.quantity = newQuantity
      selectedProduct.value.lastRestock = new Date().toLocaleDateString()
      if (!selectedProduct.value.history) {
        selectedProduct.value.history = []
      }
      selectedProduct.value.history.unshift(historyEntry)

      showAdjustment.value = false
      alert('Stock adjusted successfully!')
    }

    const openHistoryModal = (product) => {
      selectedProduct.value = product
      showHistory.value = true
    }

    const updateStock = (product) => {
      console.log(`Stock updated for ${product.name}: ${product.quantity} units`)
    }

    const editProduct = (product) => {
      console.log('Edit product:', product)
    }

    return {
      searchQuery,
      statusFilter,
      categoryFilter,
      showAdjustment,
      showHistory,
      showImport,
      selectedProduct,
      adjustment,
      inventory,
      filteredInventory,
      lowStockItems,
      getStockStatus,
      openAdjustmentModal,
      saveAdjustment,
      openHistoryModal,
      updateStock,
      editProduct,
    }
  },
}
</script>

<style scoped>
.inventory-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.inventory-header h1 {
  margin: 0;
  color: #333;
}

.inventory-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select:focus,
.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.inventory-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f5f5f5;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #555;
}

tr:hover {
  background-color: #f9f9f9;
}

.product-thumb {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.product-name {
  display: flex;
  align-items: center;
}

.sku {
  font-family: monospace;
  color: #667eea;
  font-weight: 600;
}

.quantity-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.stock-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-in-stock {
  background-color: #d4edda;
  color: #155724;
}

.status-low-stock {
  background-color: #fff3cd;
  color: #856404;
}

.status-out-of-stock {
  background-color: #f8d7da;
  color: #842029;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-adjust,
.btn-history,
.btn-edit {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-adjust:hover,
.btn-history:hover,
.btn-edit:hover {
  background-color: #f0f0f0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90vw;
}

.history-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

/* Forms */
.adjustment-form,
.import-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.current-value {
  margin: 0;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-weight: 600;
  color: #333;
}

.adjustment-preview {
  background-color: #e8f0ff;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  color: #084298;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
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

/* History */
.history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-entry {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.entry-type {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
  background-color: #667eea;
  color: white;
}

.entry-date {
  color: #999;
  font-size: 0.85rem;
}

.entry-details p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.entry-user {
  color: #999;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

/* File Upload */
.file-upload {
  border: 2px dashed #667eea;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.file-upload:hover {
  background-color: #f0f0f0;
}

.file-input {
  display: none;
}

.csv-format {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.85rem;
}

/* Alert */
.alert-box {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  color: #856404;
}

.alert-box h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.alert-box ul {
  margin: 0.75rem 0 0 0;
  padding-left: 1.5rem;
}

.alert-box li {
  margin: 0.5rem 0;
}

@media (max-width: 768px) {
  .inventory-filters {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem;
  }
}
</style>