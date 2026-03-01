<template>
  <div class="admin-dashboard">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">⛺</span>
        <span class="logo-text">Camptime Admin</span>
      </div>

      <nav class="sidebar-nav">
        <button 
          v-for="item in navItems"
          :key="item.id"
          @click="activeTab = item.id"
          class="nav-item"
          :class="{ active: activeTab === item.id }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn">🚪 Logout</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-title">
          <h1>{{ getCurrentTabName() }}</h1>
          <p class="subtitle">Manage your Camptime business</p>
        </div>

        <div class="header-actions">
          <div class="notification-bell">
            <button class="bell-btn">🔔</button>
            <span v-if="notificationCount > 0" class="badge">{{ notificationCount }}</span>
          </div>
          <div class="user-profile">
            <img src="https://i.pravatar.cc/150?img=1" alt="Admin" class="profile-pic" />
            <div class="user-info">
              <p class="user-name">John Martinez</p>
              <p class="user-role">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Dashboard Overview -->
        <section v-if="activeTab === 'overview'" class="overview-tab">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📦</div>
              <h3>Total Orders</h3>
              <p class="stat-value">{{ stats.totalOrders }}</p>
              <p class="stat-change positive">↑ 12% this month</p>
            </div>

            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <h3>Total Revenue</h3>
              <p class="stat-value">${{ stats.totalRevenue.toLocaleString() }}</p>
              <p class="stat-change positive">↑ 8% from last month</p>
            </div>

            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <h3>Total Customers</h3>
              <p class="stat-value">{{ stats.totalCustomers }}</p>
              <p class="stat-change positive">↑ 5% new this month</p>
            </div>

            <div class="stat-card">
              <div class="stat-icon">📈</div>
              <h3>Conversion Rate</h3>
              <p class="stat-value">{{ stats.conversionRate }}%</p>
              <p class="stat-change negative">↓ 2% from last month</p>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <h3>Sales This Month</h3>
              <div class="chart-placeholder">
                <p>📊 Sales chart would display here</p>
              </div>
            </div>

            <div class="chart-card">
              <h3>Top Products</h3>
              <div class="top-products">
                <div v-for="product in topProducts" :key="product.id" class="product-row">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-sales">{{ product.sales }} sales</span>
                </div>
              </div>
            </div>
          </div>

          <div class="recent-orders">
            <h3>Recent Orders</h3>
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.id">
                  <td class="order-id">#{{ order.id }}</td>
                  <td>{{ order.customer }}</td>
                  <td>${{ order.amount }}</td>
                  <td>
                    <span class="status-badge" :class="order.status.toLowerCase()">
                      {{ order.status }}
                    </span>
                  </td>
                  <td>{{ order.date }}</td>
                  <td>
                    <button class="action-btn">View</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Products Management -->
        <section v-if="activeTab === 'products'" class="products-tab">
          <div class="section-header">
            <h2>Products Management</h2>
            <div class="action-buttons">
              <button class="btn btn-secondary" @click="loadProducts" :disabled="productsLoading">Refresh</button>
              <button class="btn btn-primary" @click="openCreateProductForm">+ Add Product</button>
            </div>
          </div>

          <div class="products-controls">
            <input 
              v-model="productSearch"
              @input="loadProducts"
              type="text"
              placeholder="Search products..."
              class="search-input"
            />
            <select class="filter-select" v-model="productCategory" @change="loadProducts">
              <option :value="null">All Categories</option>
              <option v-for="category in categoryOptions" :key="category.category_id" :value="category.category_id">
                {{ category.label }}
              </option>
            </select>
          </div>

          <div v-if="productFormVisible" class="import-card mb-2">
            <div class="section-header">
              <h3>{{ productFormMode === 'create' ? 'Create Product' : 'Edit Product' }}</h3>
              <div class="action-buttons">
                <button class="btn btn-secondary" @click="closeProductForm">Cancel</button>
                <button class="btn btn-primary" @click="saveProduct" :disabled="productsLoading">
                  {{ productFormMode === 'create' ? 'Create' : 'Update' }}
                </button>
              </div>
            </div>

            <div class="settings-grid">
              <div class="form-group">
                <label for="productName">Name</label>
                <input id="productName" v-model="productForm.name" type="text" class="form-input" placeholder="Product name" />
              </div>
              <div class="form-group">
                <label for="productBrand">Brand</label>
                <input id="productBrand" v-model="productForm.brand" type="text" class="form-input" placeholder="Brand" />
              </div>
              <div class="form-group">
                <label for="productSku">SKU</label>
                <input id="productSku" v-model="productForm.sku_code" type="text" class="form-input" placeholder="SKU code" />
              </div>
              <div class="form-group">
                <label for="productSpu">SPU</label>
                <input id="productSpu" v-model="productForm.spu_no" type="text" class="form-input" placeholder="SPU number" />
              </div>
              <div class="form-group">
                <label for="productCategoryId">Category</label>
                <select id="productCategoryId" v-model="productForm.category_id" class="form-input">
                  <option :value="null">Uncategorized</option>
                  <option v-for="category in categoryOptions" :key="category.category_id" :value="category.category_id">
                    {{ category.label }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="productPrice">Price</label>
                <input id="productPrice" v-model.number="productForm.price" type="number" min="0" step="0.01" class="form-input" />
              </div>
              <div class="form-group">
                <label for="productStock">Stock</label>
                <input id="productStock" v-model.number="productForm.stock_quantity" type="number" min="0" step="1" class="form-input" />
              </div>
              <div class="form-group">
                <label for="productShippingMethod">Shipping Method</label>
                <input id="productShippingMethod" v-model="productForm.shipping_method" type="text" class="form-input" placeholder="e.g. Standard, Air" />
              </div>
              <div class="form-group">
                <label for="productProcessingTime">Processing Time</label>
                <input id="productProcessingTime" v-model="productForm.processing_time" type="text" class="form-input" placeholder="e.g. 1-3 business days" />
              </div>
              <div class="form-group form-group-full">
                <label for="productBriefDescription">Brief Description</label>
                <textarea
                  id="productBriefDescription"
                  v-model="productForm.brief_description"
                  class="form-input form-textarea"
                  rows="3"
                  placeholder="Short summary shown in listing/detail contexts"
                ></textarea>
              </div>
              <div class="form-group form-group-full">
                <label for="productDescription">Description</label>
                <textarea
                  id="productDescription"
                  v-model="productForm.description"
                  class="form-input form-textarea"
                  rows="5"
                  placeholder="Primary product description"
                ></textarea>
              </div>
              <div class="form-group form-group-full">
                <label for="productLongDescription">Long Description</label>
                <textarea
                  id="productLongDescription"
                  v-model="productForm.long_description"
                  class="form-input form-textarea"
                  rows="8"
                  placeholder="Extended content used to derive sections/highlights/specifications"
                ></textarea>
              </div>
              <div class="form-group form-group-full">
                <label for="productShippingLimitations">Shipping Limitations</label>
                <textarea
                  id="productShippingLimitations"
                  v-model="productForm.shipping_limitations"
                  class="form-input form-textarea"
                  rows="3"
                  placeholder="Shipping restrictions or notes"
                ></textarea>
              </div>
              <div class="form-group form-group-full">
                <label for="productImageUrls">Image URLs (one per line)</label>
                <textarea
                  id="productImageUrls"
                  v-model="productForm.image_urls_text"
                  class="form-input form-textarea"
                  rows="6"
                  placeholder="https://.../image-1.jpg\nhttps://.../image-2.jpg"
                ></textarea>
              </div>
              <div class="form-group form-group-full">
                <label for="productVariations">Variations (one per line: Theme|Value|SKU)</label>
                <textarea
                  id="productVariations"
                  v-model="productForm.variations_text"
                  class="form-input form-textarea"
                  rows="6"
                  placeholder="Color|Red|SKU-RED\nColor|Blue|SKU-BLUE"
                ></textarea>
              </div>
            </div>
          </div>

          <p v-if="productsError" class="import-status">{{ productsError }}</p>
          <p v-else-if="productsLoading" class="import-status">Loading products...</p>

          <table class="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.product_id">
                <td class="product-name">
                  <img :src="getProductImage(product)" :alt="product.name" class="product-thumb" />
                  {{ product.name }}
                </td>
                <td>{{ product.sku_code || '-' }}</td>
                <td>{{ product.category_path || product.category }}</td>
                <td>${{ Number(product.price || 0).toFixed(2) }}</td>
                <td>
                  <span class="stock" :class="{ low: Number(product.stock_quantity || 0) < 10 }">
                    {{ product.stock_quantity }}
                  </span>
                </td>
                <td class="action-buttons">
                  <button class="edit-btn" title="Edit" @click="openEditProductForm(product)">✎</button>
                  <button class="delete-btn" title="Delete" @click="deleteProduct(product)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!productsLoading && products.length === 0">
                <td colspan="6" class="center">No products found.</td>
              </tr>
            </tbody>
          </table>

          <p class="subtitle mt-2" v-if="productPagination.total !== null">
            Showing {{ products.length }} of {{ productPagination.total }} products
          </p>
        </section>

        <!-- Categories Management -->
        <section v-if="activeTab === 'categories'" class="categories-tab">
          <div class="section-header">
            <h2>Categories Management</h2>
            <div class="action-buttons">
              <button class="btn btn-secondary" @click="loadCategories" :disabled="categoriesLoading">Refresh</button>
            </div>
          </div>

          <div class="products-controls">
            <div class="form-group">
              <label for="newCategoryName">Category Name</label>
              <input id="newCategoryName" v-model="newCategoryName" type="text" class="form-input" placeholder="e.g. Tents" />
            </div>
            <div class="form-group">
              <label for="newCategoryParent">Parent Category</label>
              <select id="newCategoryParent" v-model="newCategoryParentId" class="filter-select">
                <option :value="null">None (root category)</option>
                <option v-for="category in categoryOptions" :key="category.category_id" :value="category.category_id">
                  {{ category.label }}
                </option>
              </select>
            </div>
            <button class="btn btn-primary" @click="createCategory" :disabled="categoriesLoading">+ Add Category</button>
          </div>

          <p v-if="categoriesError" class="import-status">{{ categoriesError }}</p>
          <p v-else-if="categoriesLoading" class="import-status">Loading categories...</p>

          <table class="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Path</th>
                <th>Parent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categoryOptions" :key="category.category_id">
                <td>{{ category.category_id }}</td>
                <td>{{ category.label }}</td>
                <td>{{ category.path }}</td>
                <td>{{ getCategoryParentPath(category) }}</td>
                <td class="action-buttons">
                  <button class="edit-btn" title="Rename" @click="renameCategory(category)">✎</button>
                  <button class="view-btn" title="Move" @click="moveCategory(category)">⇄</button>
                  <button class="delete-btn" title="Delete" @click="deleteCategory(category)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!categoriesLoading && categoryOptions.length === 0">
                <td colspan="5" class="center">No categories found.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Orders Management -->
        <section v-if="activeTab === 'orders'" class="orders-tab">
          <div class="section-header">
            <h2>Orders Management</h2>
            <select class="filter-select">
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <table class="orders-table full-width">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Items</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in allOrders" :key="order.id">
                <td class="order-id">#{{ order.id }}</td>
                <td>{{ order.customer }}</td>
                <td>{{ order.email }}</td>
                <td>${{ order.amount }}</td>
                <td>{{ order.items }}</td>
                <td>
                  <select class="status-select" :value="order.status">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{{ order.date }}</td>
                <td class="action-buttons">
                  <button class="view-btn">View</button>
                  <button class="delete-btn">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Customers Management -->
        <section v-if="activeTab === 'customers'" class="customers-tab">
          <div class="section-header">
            <h2>Customers Management</h2>
            <input 
              v-model="customerSearch"
              type="text"
              placeholder="Search customers..."
              class="search-input"
            />
          </div>

          <table class="customers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in customers" :key="customer.id">
                <td class="customer-name">
                  <img :src="customer.avatar" :alt="customer.name" class="avatar" />
                  {{ customer.name }}
                </td>
                <td>{{ customer.email }}</td>
                <td>{{ customer.phone }}</td>
                <td class="center">{{ customer.orders }}</td>
                <td class="center">${{ customer.totalSpent }}</td>
                <td>{{ customer.joinDate }}</td>
                <td class="action-buttons">
                  <button class="view-btn">View</button>
                  <button class="delete-btn">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Reports -->
        <section v-if="activeTab === 'reports'" class="reports-tab">
          <div class="section-header">
            <h2>Reports & Analytics</h2>
            <select class="filter-select">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div class="reports-grid">
            <div class="report-card">
              <h3>Sales Report</h3>
              <div class="chart-placeholder">
                <p>📊 Sales trends chart</p>
              </div>
              <button class="btn btn-secondary btn-small">Download PDF</button>
            </div>

            <div class="report-card">
              <h3>Customer Analytics</h3>
              <div class="chart-placeholder">
                <p>👥 Customer demographics chart</p>
              </div>
              <button class="btn btn-secondary btn-small">Download PDF</button>
            </div>

            <div class="report-card">
              <h3>Product Performance</h3>
              <div class="chart-placeholder">
                <p>📦 Product sales chart</p>
              </div>
              <button class="btn btn-secondary btn-small">Download PDF</button>
            </div>

            <div class="report-card">
              <h3>Inventory Report</h3>
              <div class="chart-placeholder">
                <p>📈 Inventory levels chart</p>
              </div>
              <button class="btn btn-secondary btn-small">Download PDF</button>
            </div>
          </div>
        </section>

        <!-- Product Import -->
        <section v-if="activeTab === 'import'" class="import-tab">
          <div class="section-header">
            <h2>Product Import</h2>
          </div>

          <div class="import-card">
            <div class="form-group">
              <label for="csvFile">CSV File</label>
              <input id="csvFile" type="file" accept=".csv" @change="onFileSelected" class="form-input" />
            </div>

            <div class="import-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="importDryRun" />
                <span>Dry run (no database writes)</span>
              </label>

              <div class="form-group import-limit">
                <label for="importLimit">Limit rows (optional)</label>
                <input
                  id="importLimit"
                  v-model.number="importLimit"
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  class="form-input"
                />
              </div>
            </div>

            <button class="btn btn-primary" :disabled="importing" @click="runImport">
              {{ importing ? 'Running Import...' : 'Run Import' }}
            </button>

            <p v-if="importStatus" class="import-status">{{ importStatus }}</p>

            <pre v-if="importResult" class="import-result">{{ JSON.stringify(importResult, null, 2) }}</pre>
          </div>
        </section>

        <!-- Settings -->
        <section v-if="activeTab === 'settings'" class="settings-tab">
          <div class="section-header">
            <h2>Admin Settings</h2>
          </div>

          <div class="settings-grid">
            <div class="settings-section">
              <h3>Store Settings</h3>
              <form class="settings-form">
                <div class="form-group">
                  <label>Store Name</label>
                  <input type="text" value="Camptime" class="form-input" />
                </div>

                <div class="form-group">
                  <label>Store Email</label>
                  <input type="email" value="support@camptime.com" class="form-input" />
                </div>

                <div class="form-group">
                  <label>Currency</label>
                  <select class="form-input">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>

                <button type="submit" class="btn btn-primary">Save Settings</button>
              </form>
            </div>

            <div class="settings-section">
              <h3>Notification Settings</h3>
              <form class="settings-form">
                <label class="checkbox-option">
                  <input type="checkbox" checked />
                  <span>Email new orders</span>
                </label>

                <label class="checkbox-option">
                  <input type="checkbox" checked />
                  <span>Email low stock alerts</span>
                </label>

                <label class="checkbox-option">
                  <input type="checkbox" />
                  <span>Email customer reviews</span>
                </label>

                <button type="submit" class="btn btn-primary">Save Preferences</button>
              </form>
            </div>

            <div class="settings-section">
              <h3>Security</h3>
              <form class="settings-form">
                <button type="button" class="btn btn-secondary">Change Password</button>
                <button type="button" class="btn btn-secondary">Enable 2FA</button>
                <button type="button" class="btn btn-danger">Logout All Sessions</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'AdminDashboard',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const activeTab = ref('overview')
    const productSearch = ref('')
    const productCategory = ref(null)
    const products = ref([])
    const productsLoading = ref(false)
    const productsError = ref('')
    const productPagination = ref({ page: 1, limit: 20, total: null, pages: 0 })
    const productFormVisible = ref(false)
    const productFormMode = ref('create')
    const productForm = ref({
      product_id: null,
      name: '',
      brand: '',
      sku_code: '',
      spu_no: '',
      category_id: null,
      price: 0,
      stock_quantity: 0,
      brief_description: '',
      description: '',
      long_description: '',
      shipping_method: '',
      shipping_limitations: '',
      processing_time: '',
      image_urls_text: '',
      variations_text: '',
    })
    const categoryTree = ref([])
    const categoryOptions = ref([])
    const categoriesLoading = ref(false)
    const categoriesError = ref('')
    const newCategoryName = ref('')
    const newCategoryParentId = ref(null)
    const customerSearch = ref('')
    const notificationCount = ref(5)
    const importFile = ref(null)
    const importDryRun = ref(true)
    const importLimit = ref(null)
    const importStatus = ref('')
    const importResult = ref(null)
    const importing = ref(false)

    const navItems = [
      { id: 'overview', label: 'Dashboard', icon: '📊' },
      { id: 'products', label: 'Products', icon: '📦' },
      { id: 'categories', label: 'Categories', icon: '🗂️' },
      { id: 'orders', label: 'Orders', icon: '🛍️' },
      { id: 'customers', label: 'Customers', icon: '👥' },
      { id: 'reports', label: 'Reports', icon: '📈' },
      { id: 'import', label: 'Import', icon: '⬆️' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ]

    const stats = {
      totalOrders: 1243,
      totalRevenue: 156780,
      totalCustomers: 5023,
      conversionRate: 3.5,
    }

    const topProducts = [
      { id: 1, name: 'Mountain Tent Pro', sales: 342 },
      { id: 2, name: 'Sleeping Bag Deluxe', sales: 287 },
      { id: 3, name: 'Hiking Backpack 65L', sales: 256 },
      { id: 4, name: 'Camping Stove', sales: 198 },
    ]

    const recentOrders = [
      { id: 'ORD-2601', customer: 'John Smith', amount: '249.99', status: 'Shipped', date: '2026-02-20' },
      { id: 'ORD-2600', customer: 'Sarah Johnson', amount: '189.99', status: 'Processing', date: '2026-02-19' },
      { id: 'ORD-2599', customer: 'Michael Chen', amount: '349.98', status: 'Delivered', date: '2026-02-18' },
      { id: 'ORD-2598', customer: 'Emily Davis', amount: '129.99', status: 'Pending', date: '2026-02-17' },
      { id: 'ORD-2597', customer: 'David Wilson', amount: '499.97', status: 'Delivered', date: '2026-02-16' },
    ]

    const allOrders = [
      { id: 'ORD-2601', customer: 'John Smith', email: 'john@example.com', amount: 249.99, items: 3, status: 'shipped', date: '2026-02-20' },
      { id: 'ORD-2600', customer: 'Sarah Johnson', email: 'sarah@example.com', amount: 189.99, items: 2, status: 'processing', date: '2026-02-19' },
      { id: 'ORD-2599', customer: 'Michael Chen', email: 'michael@example.com', amount: 349.98, items: 4, status: 'delivered', date: '2026-02-18' },
      { id: 'ORD-2598', customer: 'Emily Davis', email: 'emily@example.com', amount: 129.99, items: 1, status: 'pending', date: '2026-02-17' },
      { id: 'ORD-2597', customer: 'David Wilson', email: 'david@example.com', amount: 499.97, items: 5, status: 'delivered', date: '2026-02-16' },
    ]

    const customers = [
      { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+1 555-0101', orders: 5, totalSpent: 1249.95, joinDate: '2025-01-15', avatar: 'https://i.pravatar.cc/150?img=1' },
      { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-0102', orders: 3, totalSpent: 569.97, joinDate: '2025-03-20', avatar: 'https://i.pravatar.cc/150?img=2' },
      { id: 3, name: 'Michael Chen', email: 'michael@example.com', phone: '+1 555-0103', orders: 8, totalSpent: 2149.92, joinDate: '2024-11-10', avatar: 'https://i.pravatar.cc/150?img=3' },
      { id: 4, name: 'Emily Davis', email: 'emily@example.com', phone: '+1 555-0104', orders: 2, totalSpent: 379.98, joinDate: '2025-12-05', avatar: 'https://i.pravatar.cc/150?img=4' },
      { id: 5, name: 'David Wilson', email: 'david@example.com', phone: '+1 555-0105', orders: 6, totalSpent: 1899.94, joinDate: '2025-02-28', avatar: 'https://i.pravatar.cc/150?img=5' },
    ]

    const getCurrentTabName = () => {
      const item = navItems.find(i => i.id === activeTab.value)
      return item ? item.label : 'Dashboard'
    }

    const loadProducts = async () => {
      productsLoading.value = true
      productsError.value = ''

      try {
        const params = new URLSearchParams({
          page: String(productPagination.value.page || 1),
          limit: String(productPagination.value.limit || 20),
        })

        if (productSearch.value) {
          params.append('search', productSearch.value)
        }

        const categoryId = Number(productCategory.value)
        if (Number.isFinite(categoryId) && categoryId > 0) {
          params.append('category_id', String(categoryId))
        }

        const response = await fetch(`/api/products?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load products')
        }

        products.value = Array.isArray(data.data) ? data.data : []
        if (data.pagination) {
          productPagination.value = data.pagination
        }
      } catch (error) {
        productsError.value = error.message || 'Failed to load products'
      } finally {
        productsLoading.value = false
      }
    }

    const resetProductForm = () => {
      productForm.value = {
        product_id: null,
        name: '',
        brand: '',
        sku_code: '',
        spu_no: '',
        category_id: null,
        price: 0,
        stock_quantity: 0,
        brief_description: '',
        description: '',
        long_description: '',
        shipping_method: '',
        shipping_limitations: '',
        processing_time: '',
        image_urls_text: '',
        variations_text: '',
      }
    }

    const openCreateProductForm = async () => {
      await router.push('/admin/products/new/edit')
    }

    const openEditProductForm = async (product) => {
      await router.push(`/admin/products/${product.product_id}/edit`)
    }

    const closeProductForm = () => {
      productFormVisible.value = false
      resetProductForm()
    }

    const saveProduct = async () => {
      const name = String(productForm.value.name || '').trim()
      if (!name) {
        productsError.value = 'Product name is required'
        return
      }

      const parseLines = (value = '') => {
        return String(value)
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      }

      const images = (() => {
        const unique = new Set()
        return parseLines(productForm.value.image_urls_text).reduce((result, url) => {
          const key = url.toLowerCase()
          if (unique.has(key)) {
            return result
          }

          unique.add(key)
          result.push({
            image_url: url,
            image_order: result.length + 1,
            is_additional: false,
          })
          return result
        }, [])
      })()

      const variations = (() => {
        const unique = new Set()
        return parseLines(productForm.value.variations_text).reduce((result, line) => {
          const parts = line.split('|').map((part) => part.trim())
          const theme_name = parts[0] || ''
          const variation_value = parts[1] || ''
          const variation_sku = parts[2] || null

          if (!theme_name || !variation_value) {
            return result
          }

          const key = `${theme_name}|${variation_value}`.toLowerCase()
          if (unique.has(key)) {
            return result
          }

          unique.add(key)
          result.push({
            theme_name,
            variation_value,
            variation_sku,
            variation_order: result.length + 1,
          })
          return result
        }, [])
      })()

      const payload = {
        name,
        brand: String(productForm.value.brand || '').trim() || null,
        sku_code: String(productForm.value.sku_code || '').trim() || null,
        spu_no: String(productForm.value.spu_no || '').trim() || null,
        category_id: productForm.value.category_id || null,
        price: Number(productForm.value.price || 0),
        stock_quantity: Number(productForm.value.stock_quantity || 0),
        brief_description: String(productForm.value.brief_description || '').trim() || null,
        description: String(productForm.value.description || '').trim() || null,
        long_description: String(productForm.value.long_description || '').trim() || null,
        shipping_method: String(productForm.value.shipping_method || '').trim() || null,
        shipping_limitations: String(productForm.value.shipping_limitations || '').trim() || null,
        processing_time: String(productForm.value.processing_time || '').trim() || null,
        images,
        variations,
      }

      try {
        const isCreate = productFormMode.value === 'create'
        const endpoint = isCreate ? '/api/products' : `/api/products/${productForm.value.product_id}`
        const method = isCreate ? 'POST' : 'PUT'

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Failed to ${isCreate ? 'create' : 'update'} product`)
        }

        closeProductForm()
        await loadProducts()
      } catch (error) {
        productsError.value = error.message || 'Failed to save product'
      }
    }

    const deleteProduct = async (product) => {
      const confirmed = window.confirm(`Delete ${product.name}?`)
      if (!confirmed) {
        return
      }

      try {
        const response = await fetch(`/api/products/${product.product_id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to delete product')
        }

        await loadProducts()
      } catch (error) {
        productsError.value = error.message || 'Failed to delete product'
      }
    }

    const getPlaceholderImage = () => 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="100%" height="100%" fill="%23e8ecf5"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="16">%F0%9F%93%A6</text></svg>'

    const getImageDedupKey = (imageUrl) => {
      const raw = String(imageUrl || '').trim()
      if (!raw) {
        return ''
      }

      const normalized = raw.replace(/[?#].*$/, '').toLowerCase()
      const parts = normalized.split('/').filter(Boolean)
      return parts.length ? parts[parts.length - 1] : normalized
    }

    const getProductImage = (product = {}) => {
      const directCandidates = [
        product.primary_image_url,
        product.image,
        product.image_url,
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)

      if (directCandidates.length) {
        return directCandidates[0]
      }

      if (Array.isArray(product.images) && product.images.length) {
        const seen = new Set()
        for (const item of product.images) {
          const imageUrl = String(item?.image_url || item || '').trim()
          if (!imageUrl) {
            continue
          }

          const dedupKey = getImageDedupKey(imageUrl)
          if (!dedupKey || seen.has(dedupKey)) {
            continue
          }

          seen.add(dedupKey)
          return imageUrl
        }
      }

      return getPlaceholderImage()
    }

    const flattenCategoryTree = (nodes = [], depth = 0) => {
      return nodes.flatMap((node) => {
        const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
        const current = {
          ...node,
          label: `${prefix}${node.name}`,
          depth,
        }

        return [current, ...flattenCategoryTree(node.children || [], depth + 1)]
      })
    }

    const loadCategories = async () => {
      categoriesLoading.value = true
      categoriesError.value = ''

      try {
        const response = await fetch('/api/categories/tree')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load categories')
        }

        categoryTree.value = Array.isArray(data.data) ? data.data : []
        categoryOptions.value = flattenCategoryTree(categoryTree.value)
      } catch (error) {
        categoriesError.value = error.message || 'Failed to load categories'
      } finally {
        categoriesLoading.value = false
      }
    }

    const createCategory = async () => {
      const name = newCategoryName.value.trim()
      if (!name) {
        categoriesError.value = 'Category name is required'
        return
      }

      categoriesError.value = ''

      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            parent_id: newCategoryParentId.value || null,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create category')
        }

        newCategoryName.value = ''
        newCategoryParentId.value = null
        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to create category'
      }
    }

    const renameCategory = async (category) => {
      const name = window.prompt('Rename category:', category.name)
      if (!name || name.trim() === category.name) {
        return
      }

      categoriesError.value = ''

      try {
        const response = await fetch(`/api/categories/${category.category_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to rename category')
        }

        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to rename category'
      }
    }

    const moveCategory = async (category) => {
      const input = window.prompt(
        'Enter new parent category ID (leave blank for root):',
        category.parent_id || ''
      )

      if (input === null) {
        return
      }

      const parentId = input.trim() === '' ? null : Number(input)
      if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
        categoriesError.value = 'Parent ID must be a positive integer or blank'
        return
      }

      categoriesError.value = ''

      try {
        const response = await fetch(`/api/categories/${category.category_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: parentId }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to move category')
        }

        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to move category'
      }
    }

    const deleteCategory = async (category) => {
      if (!window.confirm(`Delete category "${category.name}"?`)) {
        return
      }

      categoriesError.value = ''

      try {
        const response = await fetch(`/api/categories/${category.category_id}`, {
          method: 'DELETE',
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete category')
        }

        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to delete category'
      }
    }

    const getCategoryParentPath = (category) => {
      if (!category?.path) {
        return '-'
      }

      const parts = String(category.path).split(' > ').filter(Boolean)
      if (parts.length <= 1) {
        return '-'
      }

      parts.pop()
      return parts.join(' > ')
    }

    watch(activeTab, async (tab) => {
      if (tab === 'products' && products.value.length === 0) {
        await loadProducts()
      }

      if (tab === 'products' && categoryOptions.value.length === 0) {
        await loadCategories()
      }

      if (tab === 'categories' && categoryOptions.value.length === 0) {
        await loadCategories()
      }
    })

    watch(
      () => route.query.tab,
      (tabValue) => {
        const nextTab = String(tabValue || '').trim()
        if (nextTab && navItems.some((item) => item.id === nextTab)) {
          activeTab.value = nextTab
        }
      }
    )

    onMounted(async () => {
      const queryTab = String(route.query.tab || '').trim()
      if (queryTab && navItems.some((item) => item.id === queryTab)) {
        activeTab.value = queryTab
      }

      if (activeTab.value === 'products') {
        await loadProducts()
      }

      if (activeTab.value === 'categories') {
        await loadCategories()
      }
    })

    const onFileSelected = (event) => {
      importFile.value = event.target.files?.[0] || null
      importStatus.value = ''
      importResult.value = null
    }

    const runImport = async () => {
      if (!importFile.value) {
        importStatus.value = 'Please choose a CSV file first.'
        return
      }

      importing.value = true
      importStatus.value = 'Uploading and processing...'
      importResult.value = null

      try {
        const formData = new FormData()
        formData.append('csvFile', importFile.value)
        formData.append('dryRun', String(importDryRun.value))

        if (importLimit.value && Number(importLimit.value) > 0) {
          formData.append('limit', String(importLimit.value))
        }

        const response = await fetch('/api/admin/import-products', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Import request failed')
        }

        importResult.value = data
        importStatus.value = data.message || 'Import completed.'
      } catch (error) {
        importStatus.value = error.message || 'Import failed'
      } finally {
        importing.value = false
      }
    }

    return {
      activeTab,
      productSearch,
      productCategory,
      products,
      productsLoading,
      productsError,
      productPagination,
      categoryOptions,
      categoriesLoading,
      categoriesError,
      newCategoryName,
      newCategoryParentId,
      customerSearch,
      notificationCount,
      importDryRun,
      importLimit,
      importStatus,
      importResult,
      importing,
      navItems,
      stats,
      topProducts,
      recentOrders,
      allOrders,
      customers,
      getCurrentTabName,
      loadProducts,
      openCreateProductForm,
      openEditProductForm,
      closeProductForm,
      saveProduct,
      deleteProduct,
      getProductImage,
      productFormVisible,
      productFormMode,
      productForm,
      loadCategories,
      createCategory,
      renameCategory,
      moveCategory,
      deleteCategory,
      getCategoryParentPath,
      onFileSelected,
      runImport,
    }
  },
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.admin-dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  height: 100vh;
  background-color: #f5f5f5;
}

/* Sidebar */
.sidebar {
  background-color: #2c3e50;
  color: white;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #34495e;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  font-weight: 700;
  font-size: 1.3rem;
}

.logo-icon {
  font-size: 1.8rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #ecf0f1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background-color: #667eea;
  color: white;
}

.nav-icon {
  font-size: 1.2rem;
}

.sidebar-footer {
  padding-top: 1rem;
  border-top: 1px solid #34495e;
}

.logout-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #c0392b;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.dashboard-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h1 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #999;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.notification-bell {
  position: relative;
  cursor: pointer;
}

.bell-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-pic {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.user-role {
  margin: 0;
  font-size: 0.8rem;
  color: #999;
}

/* Tab Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.stat-card h3 {
  font-size: 0.95rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-change.positive {
  color: #27ae60;
}

.stat-change.negative {
  color: #e74c3c;
}

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.chart-placeholder {
  background-color: #f5f5f5;
  padding: 2rem;
  border-radius: 4px;
  text-align: center;
  color: #999;
}

.top-products {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.product-name {
  font-weight: 600;
  color: #333;
}

.product-sales {
  color: #667eea;
  font-weight: 600;
}

/* Tables */
.recent-orders,
.products-table,
.orders-table,
.customers-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.recent-orders h3,
.section-header h2 {
  padding: 1.5rem;
  padding-bottom: 0.75rem;
  margin-bottom: 0;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 8px 8px 0 0;
  margin-bottom: 1rem;
}

table {
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

.order-id {
  font-weight: 600;
  color: #667eea;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.processing {
  background-color: #cfe2ff;
  color: #084298;
}

.status-badge.shipped {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status-badge.delivered {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background-color: #f8d7da;
  color: #842029;
}

.action-btn {
  padding: 0.5rem 1rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background-color: #5568d3;
}

/* Products Specific */
.products-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
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
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.product-thumb {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.stock {
  font-weight: 600;
  color: #27ae60;
}

.stock.low {
  color: #e74c3c;
}

.rating {
  color: #f39c12;
  font-weight: 600;
}

.edit-btn,
.view-btn {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn:hover,
.view-btn:hover {
  background-color: #5568d3;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.status-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.center {
  text-align: center;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.customer-name {
  display: flex;
  align-items: center;
}

/* Reports */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.report-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.report-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.report-card .chart-placeholder {
  margin-bottom: 1rem;
}

/* Settings */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.settings-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Import */
.import-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-options {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.import-limit {
  min-width: 220px;
}

.import-status {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.import-result {
  margin: 0;
  padding: 1rem;
  background: #f8f9fb;
  border-radius: 6px;
  border: 1px solid #e5e8ef;
  font-size: 0.85rem;
  max-height: 320px;
  overflow: auto;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
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

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.full-width {
  width: 100%;
}

@media (max-width: 1024px) {
  .admin-dashboard {
    grid-template-columns: 200px 1fr;
  }

  .nav-text {
    display: none;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>