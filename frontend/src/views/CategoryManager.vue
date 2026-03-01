<template>
  <div class="category-manager">
    <div class="page-header">
      <div>
        <h1>Category Manager</h1>
        <p class="subtitle">Drag a category and drop it on another category to make it a child.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">Back to Admin</button>
        <button class="btn btn-primary" @click="loadCategories" :disabled="loading">Refresh</button>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

    <div class="drop-root" :class="{ active: rootDropActive }" @dragover.prevent="onRootDragOver" @dragleave="rootDropActive = false" @drop.prevent="dropOnRoot">
      Drop here to move category to root level
    </div>

    <div v-if="loading" class="loading">Loading categories...</div>

    <div v-else class="tree-card">
      <div v-if="flatCategories.length === 0" class="empty-state">No categories found.</div>

      <div
        v-for="category in flatCategories"
        :key="category.category_id"
        class="category-row"
        :class="{
          dragging: draggedCategoryId === category.category_id,
          'drop-target': dropTargetId === category.category_id,
        }"
        :draggable="draggedCategoryId !== category.category_id"
        @dragstart="onDragStart(category)"
        @dragend="onDragEnd"
        @dragover.prevent="onRowDragOver(category)"
        @dragleave="onRowDragLeave(category)"
        @drop.prevent="dropOnCategory(category)"
      >
        <div class="category-name" :style="{ paddingLeft: `${category.depth * 1.2}rem` }">
          <span class="drag-handle" aria-hidden="true">⋮⋮</span>
          <span>{{ category.name }}</span>
        </div>
        <div class="category-path">{{ category.path || category.name }}</div>
        <div class="category-products">
          <span class="product-count">{{ countsLoading ? '…' : getProductCount(category.category_id) }} products</span>
          <router-link
            class="view-products-link"
            :to="{ path: '/admin', query: { tab: 'products', category_id: String(category.category_id) } }"
            draggable="false"
            @click.stop
          >
            View Products
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'CategoryManager',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const tree = ref([])
    const flatCategories = ref([])
    const productCounts = ref({})
    const countsLoading = ref(false)
    const draggedCategoryId = ref(null)
    const dropTargetId = ref(null)
    const rootDropActive = ref(false)
    const descendantsMap = ref(new Map())

    const goBack = () => {
      router.push({ path: '/admin', query: { tab: 'categories' } })
    }

    const flattenTree = (nodes = [], depth = 0) => {
      return nodes.flatMap((node) => {
        const current = {
          category_id: node.category_id,
          name: node.name,
          path: node.path,
          parent_id: node.parent_id,
          depth,
        }

        return [current, ...flattenTree(node.children || [], depth + 1)]
      })
    }

    const collectDescendants = (nodes = [], map = new Map()) => {
      const walk = (node) => {
        const descendants = []

        const collect = (items = []) => {
          items.forEach((item) => {
            descendants.push(item.category_id)
            collect(item.children || [])
          })
        }

        collect(node.children || [])
        map.set(node.category_id, descendants)

        ;(node.children || []).forEach(walk)
      }

      nodes.forEach(walk)
      return map
    }

    const loadCategories = async () => {
      loading.value = true
      error.value = ''

      try {
        const response = await fetch('/api/categories/tree')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load categories')
        }

        tree.value = Array.isArray(data.data) ? data.data : []
        flatCategories.value = flattenTree(tree.value)
        descendantsMap.value = collectDescendants(tree.value)
        await loadProductCounts(flatCategories.value)
      } catch (loadError) {
        error.value = loadError.message || 'Failed to load categories'
      } finally {
        loading.value = false
      }
    }

    const loadProductCounts = async (categories = []) => {
      countsLoading.value = true

      try {
        const countsEntries = await Promise.all(
          categories.map(async (category) => {
            try {
              const params = new URLSearchParams({
                page: '1',
                limit: '1',
                category_id: String(category.category_id),
              })

              const response = await fetch(`/api/products?${params.toString()}`)
              const data = await response.json().catch(() => ({}))
              if (!response.ok) {
                return [category.category_id, 0]
              }

              return [category.category_id, Number(data?.pagination?.total || 0)]
            } catch {
              return [category.category_id, 0]
            }
          })
        )

        productCounts.value = Object.fromEntries(countsEntries)
      } finally {
        countsLoading.value = false
      }
    }

    const getProductCount = (categoryId) => {
      const value = productCounts.value?.[categoryId]
      return Number.isFinite(value) ? value : 0
    }

    const onDragStart = (category) => {
      draggedCategoryId.value = category.category_id
      successMessage.value = ''
      error.value = ''
    }

    const onDragEnd = () => {
      draggedCategoryId.value = null
      dropTargetId.value = null
      rootDropActive.value = false
    }

    const onRowDragOver = (category) => {
      if (!draggedCategoryId.value || draggedCategoryId.value === category.category_id) {
        return
      }

      dropTargetId.value = category.category_id
      rootDropActive.value = false
    }

    const onRowDragLeave = (category) => {
      if (dropTargetId.value === category.category_id) {
        dropTargetId.value = null
      }
    }

    const onRootDragOver = () => {
      if (!draggedCategoryId.value) {
        return
      }

      rootDropActive.value = true
      dropTargetId.value = null
    }

    const moveCategory = async (categoryId, newParentId) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: newParentId }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to move category')
      }

      await loadCategories()
      successMessage.value = newParentId
        ? 'Category moved successfully.'
        : 'Category moved to root successfully.'
    }

    const dropOnCategory = async (targetCategory) => {
      const sourceId = draggedCategoryId.value
      if (!sourceId || sourceId === targetCategory.category_id) {
        return
      }

      const descendants = descendantsMap.value.get(sourceId) || []
      if (descendants.includes(targetCategory.category_id)) {
        error.value = 'Cannot move a category under one of its descendants.'
        return
      }

      try {
        error.value = ''
        await moveCategory(sourceId, targetCategory.category_id)
      } catch (moveError) {
        error.value = moveError.message || 'Failed to move category'
      } finally {
        onDragEnd()
      }
    }

    const dropOnRoot = async () => {
      const sourceId = draggedCategoryId.value
      if (!sourceId) {
        return
      }

      try {
        error.value = ''
        await moveCategory(sourceId, null)
      } catch (moveError) {
        error.value = moveError.message || 'Failed to move category'
      } finally {
        onDragEnd()
      }
    }

    onMounted(async () => {
      await loadCategories()
    })

    return {
      loading,
      error,
      successMessage,
      flatCategories,
      countsLoading,
      draggedCategoryId,
      dropTargetId,
      rootDropActive,
      getProductCount,
      goBack,
      loadCategories,
      onDragStart,
      onDragEnd,
      onRowDragOver,
      onRowDragLeave,
      onRootDragOver,
      dropOnCategory,
      dropOnRoot,
    }
  },
}
</script>

<style scoped>
.category-manager {
  max-width: 1100px;
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

.drop-root {
  border: 2px dashed #b7b7b7;
  border-radius: 8px;
  padding: 0.85rem;
  margin-bottom: 1rem;
  text-align: center;
  background: #fafafa;
  color: #444;
  font-weight: 600;
}

.drop-root.active {
  border-color: #2F4F3E;
  background: rgba(47, 79, 62, 0.08);
  color: #2F4F3E;
}

.tree-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.category-row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(220px, 1fr) minmax(170px, auto);
  gap: 1rem;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 0.75rem 1rem;
  cursor: grab;
  background: #fff;
}

.category-row:last-child {
  border-bottom: none;
}

.category-row.dragging {
  opacity: 0.5;
}

.category-row.drop-target {
  background: rgba(47, 79, 62, 0.08);
  outline: 2px solid #2F4F3E;
  outline-offset: -2px;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #222;
  font-weight: 600;
}

.drag-handle {
  color: #777;
  letter-spacing: -1px;
}

.category-path {
  color: #555;
  font-size: 0.92rem;
  text-align: right;
}

.category-products {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.product-count {
  color: #444;
  font-size: 0.9rem;
  font-weight: 600;
}

.view-products-link {
  color: #2F4F3E;
  font-weight: 600;
  text-decoration: none;
}

.view-products-link:hover {
  text-decoration: underline;
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
  color: #D9C7A3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
  }

  .category-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .category-path {
    text-align: left;
  }

  .category-products {
    justify-content: flex-start;
  }
}
</style>
