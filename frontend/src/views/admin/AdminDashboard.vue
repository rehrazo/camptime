<template>
  <div class="admin-dashboard">
    <!-- Main Content -->
    <main class="main-content">
      <!-- Header Tab Content -->
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

            <div class="chart-card">
              <h3>System Status</h3>
              <button class="btn btn-secondary btn-small mb-1" @click="loadSystemHealth" :disabled="healthLoading">
                {{ healthLoading ? 'Refreshing...' : 'Refresh Status' }}
              </button>
              <p v-if="healthLoading" class="subtitle">Checking health...</p>
              <p v-else-if="healthError" class="import-status">{{ healthError }}</p>
              <div v-else class="status-list">
                <div class="status-row">
                  <span>Admin Auth</span>
                  <span class="status-pill" :class="healthChecks.adminAuthConfigured ? 'ok' : 'warn'">
                    {{ healthChecks.adminAuthConfigured ? 'Configured' : 'Missing' }}
                  </span>
                </div>
                <div class="status-row">
                  <span>Database</span>
                  <span class="status-pill" :class="healthChecks.databaseConnected ? 'ok' : 'warn'">
                    {{ healthChecks.databaseConnected ? 'Connected' : 'Unavailable' }}
                  </span>
                </div>
                <div class="status-row">
                  <span>Stripe</span>
                  <span class="status-pill" :class="healthChecks.stripeConfigured ? 'ok' : 'warn'">
                    {{ healthChecks.stripeConfigured ? 'Configured' : 'Missing' }}
                  </span>
                </div>
                <div class="status-row">
                  <span>Products API</span>
                  <span class="status-pill" :class="healthChecks.productsRouteReady ? 'ok' : 'warn'">
                    {{ healthChecks.productsRouteReady ? 'Ready' : 'Check Failed' }}
                  </span>
                </div>
                <div class="status-row">
                  <span>Categories API</span>
                  <span class="status-pill" :class="healthChecks.categoriesRouteReady ? 'ok' : 'warn'">
                    {{ healthChecks.categoriesRouteReady ? 'Ready' : 'Check Failed' }}
                  </span>
                </div>
                <div class="status-row">
                  <span>CORS Origins</span>
                  <span class="status-pill ok">{{ healthChecks.corsAllowedOrigins.length }}</span>
                </div>
                <p class="subtitle mt-1" v-if="healthChecks.error">{{ healthChecks.error }}</p>
                <p class="subtitle mt-1" v-if="healthChecks.corsAllowedOrigins.length">
                  {{ healthChecks.corsAllowedOrigins.join(', ') }}
                </p>
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
              <button class="btn btn-secondary" @click="openUncategorizedProducts">Uncategorized Products</button>
              <button class="btn btn-primary" @click="openProductCategoryMover">Category Product Mover</button>
              <button class="btn btn-primary btn-refresh" @click="loadProducts" :disabled="productsLoading">Refresh</button>
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
              <button class="btn btn-primary btn-refresh" @click="loadCategories" :disabled="categoriesLoading">Refresh</button>
            </div>
          </div>

          <div class="products-controls">
            <div class="form-group">
              <label for="categoryFilterSearch">Filter Categories</label>
              <input
                id="categoryFilterSearch"
                v-model="categoryFilterSearch"
                type="text"
                class="form-input"
                placeholder="Search by name, path, or parent"
              />
            </div>
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
            <div class="form-group">
              <label for="newCategoryHomeGroup">Home Section</label>
              <select id="newCategoryHomeGroup" v-model="newCategoryHomeFeatureGroup" class="filter-select">
                <option value="none">None (not on home)</option>
                <option value="featured">Featured</option>
                <option value="recommended">Recommended</option>
              </select>
            </div>
            <button class="btn btn-primary" @click="createCategory" :disabled="categoriesLoading">+ Add Category</button>
          </div>

          <p v-if="categoriesError" class="import-status">{{ categoriesError }}</p>
          <p v-else-if="categoriesLoading" class="import-status">Loading categories...</p>

          <table class="products-table">
            <thead>
              <tr>
                <th>
                  <button class="sort-btn" @click="toggleCategorySort('category_id')">
                    ID {{ getSortIndicator('category_id') }}
                  </button>
                </th>
                <th>
                  <button class="sort-btn" @click="toggleCategorySort('name')">
                    Name {{ getSortIndicator('name') }}
                  </button>
                </th>
                <th>
                  <button class="sort-btn" @click="toggleCategorySort('path')">
                    Path {{ getSortIndicator('path') }}
                  </button>
                </th>
                <th>
                  <button class="sort-btn" @click="toggleCategorySort('parent')">
                    Parent {{ getSortIndicator('parent') }}
                  </button>
                </th>
                <th>Home Section</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in filteredCategoryRows" :key="category.category_id">
                <td>{{ category.category_id }}</td>
                <td>{{ category.label }}</td>
                <td>{{ category.path }}</td>
                <td>{{ getCategoryParentPath(category) }}</td>
                <td>
                  <select
                    class="filter-select"
                    :value="String(category.home_feature_group || 'none').toLowerCase()"
                    @change="updateCategoryHomeGroup(category, $event.target.value)"
                  >
                    <option value="none">None</option>
                    <option value="featured">Featured</option>
                    <option value="recommended">Recommended</option>
                  </select>
                </td>
                <td>{{ getCategoryProductCount(category.category_id) }}</td>
                <td class="action-buttons">
                  <img
                    v-if="category.home_feature_image_url"
                    :src="category.home_feature_image_url"
                    alt="Category image thumbnail"
                    class="upload-preview upload-preview-inline"
                  />
                  <button class="edit-btn" title="Rename" @click="renameCategory(category)">✎</button>
                  <button class="view-btn" title="Move" @click="moveCategory(category)">⇄</button>
                  <button
                    class="btn btn-secondary btn-small"
                    title="Upload category image"
                    @click="openExistingCategoryImagePicker(category)"
                    :disabled="uploadingCategoryImageId === category.category_id"
                  >
                    Choose Image
                  </button>
                  <button
                    v-if="selectedCategoryForImageUploadId === category.category_id && existingCategoryImagePendingFile"
                    class="btn btn-secondary btn-small"
                    title="Save selected image"
                    @click="saveExistingCategoryImage(category)"
                    :disabled="uploadingCategoryImageId === category.category_id"
                  >
                    {{ uploadingCategoryImageId === category.category_id ? 'Uploading...' : 'Save Image' }}
                  </button>
                  <img
                    v-if="selectedCategoryForImageUploadId === category.category_id && existingCategoryImagePreviewUrl"
                    :src="existingCategoryImagePreviewUrl"
                    alt="Pending category image preview"
                    class="upload-preview upload-preview-inline"
                  />
                  <button class="delete-btn" title="Delete" @click="deleteCategory(category)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!categoriesLoading && filteredCategoryRows.length === 0">
                <td colspan="7" class="center">No categories found.</td>
              </tr>
            </tbody>
          </table>

          <input
            ref="existingCategoryImageInput"
            type="file"
            accept="image/*"
            class="hidden-file-input"
            @change="onExistingCategoryImageSelected"
          />
        </section>

        <!-- Orders Management -->
        <section v-if="activeTab === 'orders'" class="orders-tab">
          <div class="section-header">
            <h2>Orders Management</h2>
            <div class="action-buttons">
              <button class="btn btn-primary" @click="openOrderExportManager">Open Order Export Manager</button>
            </div>
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
                  <input type="text" value="Razo Wild" class="form-input" />
                </div>

                <div class="form-group">
                  <label>Store Email</label>
                  <input type="email" value="support@razowild.com" class="form-input" />
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
import { computed, onMounted, ref, watch } from 'vue'
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
    const categoryFilterSearch = ref('')
    const newCategoryName = ref('')
    const newCategoryParentId = ref(null)
    const newCategoryHomeFeatureImageUrl = ref('')
    const newCategoryHomeFeatureOrder = ref(0)
    const newCategoryHomeFeatureGroup = ref('none')
    const newCategoryHomeImageFile = ref(null)
    const newCategoryHomeImagePreviewUrl = ref('')
    const newCategoryHomeImageUploading = ref(false)
    const existingCategoryImageInput = ref(null)
    const selectedCategoryForImageUploadId = ref(null)
    const existingCategoryImagePendingFile = ref(null)
    const existingCategoryImagePreviewUrl = ref('')
    const uploadingCategoryImageId = ref(null)
    const categoryProductCounts = ref({})
    const categorySortKey = ref('name')
    const categorySortDirection = ref('asc')
    const customerSearch = ref('')
    const importFile = ref(null)
    const importDryRun = ref(true)
    const importLimit = ref(null)
    const importStatus = ref('')
    const importResult = ref(null)
    const importing = ref(false)
    const healthLoading = ref(false)
    const healthError = ref('')
    const healthChecks = ref({
      adminAuthConfigured: false,
      corsAllowedOrigins: [],
      databaseConnected: false,
      stripeConfigured: false,
      productsRouteReady: false,
      categoriesRouteReady: false,
      error: null,
    })

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
        const currentPage = String(productPagination.value.page || 1)
        const currentLimit = String(productPagination.value.limit || 20)

        const params = new URLSearchParams({
          page: currentPage,
          limit: currentLimit,
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

        const items = Array.isArray(data.data) ? data.data : []

        if (categoryId > 0 && items.length === 0) {
          const fallbackParams = new URLSearchParams({
            page: currentPage,
            limit: currentLimit,
          })

          if (productSearch.value) {
            fallbackParams.append('search', productSearch.value)
          }

          const fallbackResponse = await fetch(`/api/products?${fallbackParams.toString()}`)
          const fallbackData = await fallbackResponse.json().catch(() => ({}))

          if (fallbackResponse.ok && Array.isArray(fallbackData.data) && fallbackData.data.length > 0) {
            productCategory.value = null
            products.value = fallbackData.data
            if (fallbackData.pagination) {
              productPagination.value = fallbackData.pagination
            }
            return
          }
        }

        products.value = items
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
        await loadCategoryProductCounts(categoryOptions.value)
      } catch (error) {
        categoriesError.value = error.message || 'Failed to load categories'
        categoryProductCounts.value = {}
      } finally {
        categoriesLoading.value = false
      }
    }

    const fetchProductsTotalForCategory = async (categoryId) => {
      const params = new URLSearchParams({
        page: '1',
        limit: '1',
        category_id: String(categoryId),
      })

      const response = await fetch(`/api/products?${params.toString()}`)
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        return 0
      }

      return Number(payload?.pagination?.total || 0)
    }

    const loadCategoryProductCounts = async (categories = []) => {
      const entries = await Promise.all(
        categories.map(async (category) => {
          const total = await fetchProductsTotalForCategory(category.category_id)
          return [category.category_id, total]
        })
      )

      categoryProductCounts.value = Object.fromEntries(entries)
    }

    const getCategoryProductCount = (categoryId) => {
      return Number(categoryProductCounts.value?.[categoryId] || 0)
    }

    const uploadCategoryImageFile = async (file) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/categories/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload category image')
      }

      return String(data?.data?.image_url || '').trim()
    }

    const setPreviewUrl = (targetRef, file) => {
      if (targetRef.value && String(targetRef.value).startsWith('blob:')) {
        URL.revokeObjectURL(targetRef.value)
      }

      if (!file) {
        targetRef.value = ''
        return
      }

      targetRef.value = URL.createObjectURL(file)
    }

    const onNewCategoryHomeImageSelected = (event) => {
      const file = event?.target?.files?.[0] || null
      newCategoryHomeImageFile.value = file
      setPreviewUrl(newCategoryHomeImagePreviewUrl, file)
    }

    const uploadNewCategoryHomeImage = async () => {
      if (!newCategoryHomeImageFile.value) {
        categoriesError.value = 'Choose an image file first'
        return
      }

      categoriesError.value = ''
      newCategoryHomeImageUploading.value = true

      try {
        const imageUrl = await uploadCategoryImageFile(newCategoryHomeImageFile.value)
        if (!imageUrl) {
          throw new Error('Image upload did not return a URL')
        }

        newCategoryHomeFeatureImageUrl.value = imageUrl
        newCategoryHomeImageFile.value = null
        setPreviewUrl(newCategoryHomeImagePreviewUrl, null)
      } catch (error) {
        categoriesError.value = error.message || 'Failed to upload category image'
      } finally {
        newCategoryHomeImageUploading.value = false
      }
    }

    const openExistingCategoryImagePicker = (category) => {
      selectedCategoryForImageUploadId.value = category.category_id
      if (existingCategoryImageInput.value) {
        existingCategoryImageInput.value.value = ''
        existingCategoryImageInput.value.click()
      }
    }

    const onExistingCategoryImageSelected = (event) => {
      const file = event?.target?.files?.[0] || null
      const categoryId = Number(selectedCategoryForImageUploadId.value)

      if (!file || !Number.isInteger(categoryId) || categoryId <= 0) {
        return
      }

      existingCategoryImagePendingFile.value = file
      setPreviewUrl(existingCategoryImagePreviewUrl, file)
    }

    const saveExistingCategoryImage = async (category) => {
      const categoryId = Number(category?.category_id)
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return
      }

      if (!existingCategoryImagePendingFile.value || selectedCategoryForImageUploadId.value !== categoryId) {
        categoriesError.value = 'Choose an image first'
        return
      }

      categoriesError.value = ''
      uploadingCategoryImageId.value = categoryId

      try {
        const imageUrl = await uploadCategoryImageFile(existingCategoryImagePendingFile.value)
        if (!imageUrl) {
          throw new Error('Image upload did not return a URL')
        }

        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ home_feature_image_url: imageUrl }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save uploaded category image')
        }

        existingCategoryImagePendingFile.value = null
        setPreviewUrl(existingCategoryImagePreviewUrl, null)
        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to upload category image'
      } finally {
        uploadingCategoryImageId.value = null
      }
    }

    const updateCategoryHomeGroup = async (category, nextGroup) => {
      const categoryId = Number(category?.category_id)
      const normalizedGroup = String(nextGroup || '').trim().toLowerCase()

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return
      }

      if (!['featured', 'recommended', 'none'].includes(normalizedGroup)) {
        categoriesError.value = 'Home section must be featured, recommended, or none'
        return
      }

      categoriesError.value = ''

      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            home_feature_group: normalizedGroup,
          }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update home section')
        }

        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to update home section'
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
            home_feature_image_url: String(newCategoryHomeFeatureImageUrl.value || '').trim() || null,
            home_feature_order: Number(newCategoryHomeFeatureOrder.value || 0),
            home_feature_group: String(newCategoryHomeFeatureGroup.value || 'none'),
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create category')
        }

        newCategoryName.value = ''
        newCategoryParentId.value = null
        newCategoryHomeFeatureImageUrl.value = ''
        newCategoryHomeFeatureOrder.value = 0
        newCategoryHomeFeatureGroup.value = 'none'
        newCategoryHomeImageFile.value = null
        setPreviewUrl(newCategoryHomeImagePreviewUrl, null)
        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to create category'
      }
    }

    const editHomeCategorySettings = async (category) => {
      const currentGroup = String(category.home_feature_group || 'none').toLowerCase()
      const groupInput = window.prompt(
        `Home section for "${category.name}":\n\nEnter: featured, recommended, or none`,
        currentGroup
      )

      if (groupInput === null) {
        return
      }

      const homeFeatureGroup = String(groupInput || '').trim().toLowerCase() || 'none'
      if (!['featured', 'recommended', 'none'].includes(homeFeatureGroup)) {
        categoriesError.value = 'Home section must be featured, recommended, or none'
        return
      }

      let homeFeatureImageUrl = String(category.home_feature_image_url || '').trim()
      let homeFeatureOrder = Number(category.home_feature_order || 0)

      if (homeFeatureGroup !== 'none') {
        const imageInput = window.prompt(
          'Home image URL (leave blank to clear):',
          homeFeatureImageUrl
        )

        if (imageInput === null) {
          return
        }

        homeFeatureImageUrl = String(imageInput || '').trim()

        const orderInput = window.prompt('Home display order (0, 1, 2, ...):', String(homeFeatureOrder))
        if (orderInput === null) {
          return
        }

        const nextOrder = Number(orderInput)
        if (!Number.isInteger(nextOrder) || nextOrder < 0) {
          categoriesError.value = 'Home display order must be a non-negative integer'
          return
        }

        homeFeatureOrder = nextOrder
      }

      categoriesError.value = ''

      try {
        const response = await fetch(`/api/categories/${category.category_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            home_feature_group: homeFeatureGroup,
            home_feature_image_url: homeFeatureImageUrl || null,
            home_feature_order: homeFeatureOrder,
          }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update home category settings')
        }

        await loadCategories()
      } catch (error) {
        categoriesError.value = error.message || 'Failed to update home category settings'
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

    const getCategorySortValue = (category, key) => {
      if (key === 'category_id') {
        return Number(category?.category_id || 0)
      }

      if (key === 'name') {
        return String(category?.name || '').toLowerCase()
      }

      if (key === 'path') {
        return String(category?.path || '').toLowerCase()
      }

      if (key === 'parent') {
        return String(getCategoryParentPath(category) || '').toLowerCase()
      }

      if (key === 'home_group') {
        return String(category?.home_feature_group || '').toLowerCase()
      }

      if (key === 'home_order') {
        return Number(category?.home_feature_order || 0)
      }

      return ''
    }

    const sortedCategoryRows = computed(() => {
      const rows = [...categoryOptions.value]
      const direction = categorySortDirection.value === 'asc' ? 1 : -1
      const key = categorySortKey.value

      rows.sort((a, b) => {
        const valueA = getCategorySortValue(a, key)
        const valueB = getCategorySortValue(b, key)

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return (valueA - valueB) * direction
        }

        return String(valueA).localeCompare(String(valueB), undefined, { numeric: true, sensitivity: 'base' }) * direction
      })

      return rows
    })

    const filteredCategoryRows = computed(() => {
      const query = String(categoryFilterSearch.value || '').trim().toLowerCase()
      if (!query) {
        return sortedCategoryRows.value
      }

      return sortedCategoryRows.value.filter((category) => {
        const name = String(category?.name || '').toLowerCase()
        const path = String(category?.path || '').toLowerCase()
        const parent = String(getCategoryParentPath(category) || '').toLowerCase()

        return name.includes(query) || path.includes(query) || parent.includes(query)
      })
    })

    const toggleCategorySort = (key) => {
      if (categorySortKey.value === key) {
        categorySortDirection.value = categorySortDirection.value === 'asc' ? 'desc' : 'asc'
        return
      }

      categorySortKey.value = key
      categorySortDirection.value = 'asc'
    }

    const getSortIndicator = (key) => {
      if (categorySortKey.value !== key) {
        return ''
      }

      return categorySortDirection.value === 'asc' ? '↑' : '↓'
    }

    const openCategoryManager = async () => {
      await router.push('/admin/categories/manager')
    }

    const openProductCategoryMover = async () => {
      await router.push('/admin/products/category-mover')
    }

    const openUncategorizedProducts = async () => {
      await router.push('/admin/products/uncategorized')
    }

    const openOrderExportManager = async () => {
      await router.push('/admin/orders/export-manager')
    }

    const applyProductCategoryFromQuery = () => {
      const rawValue = String(route.query.category_id || '').trim()
      const parsedValue = Number(rawValue)
      productCategory.value = Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
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
      async (tabValue) => {
        const nextTab = String(tabValue || '').trim()
        if (nextTab && navItems.some((item) => item.id === nextTab)) {
          activeTab.value = nextTab

          if (nextTab === 'products') {
            applyProductCategoryFromQuery()
            await loadProducts()
          }
        }
      }
    )

    watch(
      () => route.query.category_id,
      async () => {
        applyProductCategoryFromQuery()
        if (activeTab.value === 'products') {
          await loadProducts()
        }
      }
    )

    onMounted(async () => {
      const queryTab = String(route.query.tab || '').trim()
      if (queryTab && navItems.some((item) => item.id === queryTab)) {
        activeTab.value = queryTab
      }

      applyProductCategoryFromQuery()

      if (activeTab.value === 'products') {
        await loadProducts()
      }

      if (activeTab.value === 'categories') {
        await loadCategories()
      }

      await loadSystemHealth()
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

    const loadSystemHealth = async () => {
      healthLoading.value = true
      healthError.value = ''

      try {
        const response = await fetch('/api/health')
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load system health')
        }

        const checks = payload?.checks || {}
        healthChecks.value = {
          adminAuthConfigured: Boolean(checks.adminAuthConfigured),
          corsAllowedOrigins: Array.isArray(checks.corsAllowedOrigins) ? checks.corsAllowedOrigins : [],
          databaseConnected: Boolean(checks.databaseConnected),
          stripeConfigured: Boolean(checks.stripeConfigured),
          productsRouteReady: Boolean(checks.productsRouteReady),
          categoriesRouteReady: Boolean(checks.categoriesRouteReady),
          error: payload?.error || null,
        }
      } catch (error) {
        healthError.value = error.message || 'Failed to load system health'
      } finally {
        healthLoading.value = false
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
      sortedCategoryRows,
      filteredCategoryRows,
      categoryFilterSearch,
      getCategoryProductCount,
      categoriesLoading,
      categoriesError,
      newCategoryName,
      newCategoryParentId,
      newCategoryHomeFeatureImageUrl,
      newCategoryHomeFeatureOrder,
      newCategoryHomeFeatureGroup,
      newCategoryHomeImagePreviewUrl,
      newCategoryHomeImageUploading,
      categorySortKey,
      categorySortDirection,
      customerSearch,
      importDryRun,
      importLimit,
      importStatus,
      importResult,
      importing,
      healthLoading,
      healthError,
      healthChecks,
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
      onNewCategoryHomeImageSelected,
      uploadNewCategoryHomeImage,
      createCategory,
      renameCategory,
      moveCategory,
      editHomeCategorySettings,
      openExistingCategoryImagePicker,
      onExistingCategoryImageSelected,
      saveExistingCategoryImage,
      updateCategoryHomeGroup,
      deleteCategory,
      getCategoryParentPath,
      toggleCategorySort,
      getSortIndicator,
      existingCategoryImageInput,
      selectedCategoryForImageUploadId,
      existingCategoryImagePendingFile,
      existingCategoryImagePreviewUrl,
      uploadingCategoryImageId,
      openCategoryManager,
      openProductCategoryMover,
      openUncategorizedProducts,
      openOrderExportManager,
      loadSystemHealth,
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.3rem;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.8rem;
  background: none;
  border: 1px solid #d9deea;
  color: #2f3f5a;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.3s;
  font-size: 0.88rem;
  white-space: nowrap;
}

.nav-item:hover {
  background-color: #eef2ff;
}

.nav-item.active {
  background-color: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.nav-icon {
  font-size: 1rem;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-title {
  width: 100%;
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

.nav-item-logout {
  margin-left: auto;
  border-color: #f2c6c6;
  color: #9b2d2d;
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

.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.ok {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status-pill.warn {
  background-color: #fff3cd;
  color: #856404;
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
  color: var(--color-accent);
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

.recent-orders h3 {
  padding: 1.5rem;
  padding-bottom: 0.75rem;
  margin-bottom: 0;
  color: #333;
}

.section-header h2,
.section-header h3 {
  margin: 0;
  line-height: 1.15;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
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

.sort-btn {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.sort-btn:hover {
  text-decoration: underline;
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
  color: var(--color-accent);
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
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background-color: var(--color-accent-dark);
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

.products-controls .search-input,
.products-controls .filter-select,
.products-controls .form-input:not(textarea),
.products-controls .btn {
  height: 40px;
  box-sizing: border-box;
}

.products-controls .btn {
  align-self: flex-end;
}

.search-input {
  flex: 1;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--color-accent);
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
  background-color: var(--color-accent);
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
  background-color: var(--color-accent-dark);
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
  border-color: var(--color-accent);
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
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-accent-dark);
}

.btn-refresh {
  background-color: var(--color-forest);
  color: var(--color-sand);
}

.btn-refresh:hover {
  background-color: #549841;
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

.hidden-file-input {
  display: none;
}

.upload-preview-wrap {
  margin-top: 0.5rem;
}

.upload-preview {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #d8dfe8;
  background: #f6f8fc;
}

.upload-preview-inline {
  display: block;
  margin-bottom: 0.35rem;
}

.full-width {
  width: 100%;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-header .action-buttons {
    width: 100%;
  }

  .section-header .action-buttons .btn {
    flex: 1;
  }

  .section-header > .search-input,
  .section-header > .filter-select {
    width: 100%;
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem;
  }

  .header-nav {
    width: 100%;
  }
}
</style>