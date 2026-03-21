<template>
  <div class="category-manager">
    <div class="admin-page-top">
      <div class="admin-page-heading">
        <h1>Category Manager</h1>
        <p class="admin-page-subtitle">Drag a category and drop it on another category to make it a child.</p>
      </div>
      <div class="admin-page-actions">
        <button class="btn btn-primary" @click="loadCategories" :disabled="loading">Refresh</button>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

    <div class="drop-root" :class="{ active: rootDropActive }" @dragover.prevent="onRootDragOver" @dragleave="rootDropActive = false" @drop.prevent="dropOnRoot">
      Drop here to move category to root level
    </div>

    <div v-if="loading" class="loading">Loading categories...</div>

    <div v-else ref="treeCardRef" class="tree-card">
      <div v-if="flatCategories.length === 0" class="empty-state">No categories found.</div>

      <div
        v-for="category in visibleCategories"
        :key="category.category_id"
        class="category-row"
        :class="{
          dragging: draggedCategoryId === category.category_id,
          'dragging-child': isDraggingDescendant(category.category_id),
          'drop-target': dropTargetId === category.category_id,
          'selected-category': selectedCategoryId === category.category_id,
        }"
        draggable="true"
        @dragstart="onDragStart($event, category)"
        @dragend="onDragEnd"
        @dragover.prevent="onRowDragOver($event, category)"
        @dragleave="onRowDragLeave(category)"
        @drop.prevent="dropOnCategory($event, category)"
        @keydown="handleCategoryKeydown($event, category)"
        @click="selectedCategoryId = category.category_id"
        tabindex="0"
      >
        <div class="category-name" :style="{ paddingLeft: `${category.depth * 1.2}rem` }">
          <span class="drag-handle" aria-hidden="true">⋮⋮</span>
          <button
            v-if="parentCategoryIds.has(category.category_id)"
            class="collapse-toggle"
            type="button"
            draggable="false"
            :aria-label="collapsedIds.has(category.category_id) ? 'Expand' : 'Collapse'"
            @click.stop="toggleCollapse(category.category_id)"
          >{{ collapsedIds.has(category.category_id) ? '▶' : '▼' }}</button>
          <span>{{ category.name }}</span>
          <span
            v-if="lastReorderedCategoryId === category.category_id"
            class="reordered-indicator"
          >
            {{ lastReorderedDirection === 'down' ? 'Moved down' : 'Moved up' }}
          </span>
        </div>
        <div class="category-path">{{ category.path || category.name }}</div>
        <div class="category-products">
          <select
            class="home-group-select"
            :value="String(category.home_feature_group || 'none').toLowerCase()"
            draggable="false"
            @click.stop
            @mousedown.stop
            @change="updateCategoryHomeGroup(category, $event.target.value)"
          >
            <option value="none">None</option>
            <option value="featured">Featured</option>
            <option value="recommended">Recommended</option>
          </select>
          <span class="product-count">{{ countsLoading ? '…' : getProductCount(category.category_id) }} products</span>
          <router-link
            class="view-products-link"
            :to="{ path: '/admin', query: { tab: 'products', category_id: String(category.category_id) } }"
            draggable="false"
            @click.stop
          >
            View Products
          </router-link>
          <button
            type="button"
            class="move-up-btn"
            draggable="false"
            :disabled="loading || !canMoveUp(category)"
            @click.stop="moveCategoryUp(category)"
          >
            Move Up
          </button>
          <button
            type="button"
            class="move-down-btn"
            draggable="false"
            :disabled="loading || !canMoveDown(category)"
            @click.stop="moveCategoryDown(category)"
          >
            Move Down
          </button>
          <button
            type="button"
            class="delete-category-btn"
            draggable="false"
            @click.stop="deleteCategory(category)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

export default {
  name: 'CategoryManager',
  setup() {
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
    const collapsedIds = ref(new Set())
    const treeCardRef = ref(null)
    const lastReorderedCategoryId = ref(null)
    const lastReorderedDirection = ref('')
    const selectedCategoryId = ref(null)
    let reorderFeedbackTimeoutId = null

    const getAuthHeaders = () => {
      const adminToken = String(localStorage.getItem('adminApiToken') || '').trim()
      return {
        credentials: 'include',
        ...(adminToken && { headers: { 'x-admin-token': adminToken } }),
      }
    }

    const redirectToAdminLogin = () => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authRole')
      localStorage.removeItem('adminApiToken')

      const currentPath = `${window.location.pathname}${window.location.search}`
      const redirect = encodeURIComponent(currentPath || '/admin')
      window.location.assign(`/admin/login?redirect=${redirect}`)
    }

    const ensureAuthorizedResponse = (response) => {
      const status = Number(response?.status || 0)
      if (status === 401 || status === 403) {
        redirectToAdminLogin()
        return false
      }

      return true
    }

    const flattenTree = (nodes = [], depth = 0) => {
      return nodes.flatMap((node) => {
        const current = {
          category_id: node.category_id,
          name: node.name,
          path: node.path,
          parent_id: node.parent_id,
          home_feature_group: node.home_feature_group,
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

    const parentCategoryIds = computed(() => {
      const ids = new Set()
      flatCategories.value.forEach((cat) => {
        if (cat.parent_id) ids.add(cat.parent_id)
      })
      return ids
    })

    const visibleCategories = computed(() => {
      if (collapsedIds.value.size === 0) return flatCategories.value
      const hiddenIds = new Set()
      for (const cat of flatCategories.value) {
        if (collapsedIds.value.has(cat.category_id)) {
          const desc = descendantsMap.value.get(cat.category_id) || []
          desc.forEach((id) => hiddenIds.add(id))
        }
      }
      return flatCategories.value.filter((cat) => !hiddenIds.has(cat.category_id))
    })

    const getSiblingCategories = (category) => {
      return flatCategories.value.filter((item) => item.parent_id === category.parent_id)
    }

    const canMoveUp = (category) => {
      const siblings = getSiblingCategories(category)
      const currentIndex = siblings.findIndex((item) => item.category_id === category.category_id)
      return currentIndex > 0
    }

    const canMoveDown = (category) => {
      const siblings = getSiblingCategories(category)
      const currentIndex = siblings.findIndex((item) => item.category_id === category.category_id)
      return currentIndex > -1 && currentIndex < siblings.length - 1
    }

    const getSiblingGroupLabel = (category) => {
      if (!category?.parent_id) {
        return 'root level'
      }

      const parent = flatCategories.value.find((item) => item.category_id === category.parent_id)
      return parent?.name ? `"${parent.name}"` : 'this group'
    }

    const setReorderFeedback = (category, direction) => {
      lastReorderedCategoryId.value = category.category_id
      lastReorderedDirection.value = direction

      if (reorderFeedbackTimeoutId) {
        window.clearTimeout(reorderFeedbackTimeoutId)
      }

      reorderFeedbackTimeoutId = window.setTimeout(() => {
        lastReorderedCategoryId.value = null
        lastReorderedDirection.value = ''
        reorderFeedbackTimeoutId = null
      }, 3500)
    }

    const toggleCollapse = (categoryId) => {
      const next = new Set(collapsedIds.value)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      collapsedIds.value = next
    }

    const isDraggingDescendant = (categoryId) => {
      if (!draggedCategoryId.value) return false
      const desc = descendantsMap.value.get(draggedCategoryId.value) || []
      return desc.includes(categoryId)
    }

    const loadCategories = async () => {
      loading.value = true
      error.value = ''

      try {
        const response = await fetch('/api/categories/tree', {
          ...getAuthHeaders(),
        })

        if (!ensureAuthorizedResponse(response)) {
          return
        }

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

    const restoreTreeScroll = async (scrollTop = 0, pageScrollY = 0) => {
      await nextTick()

      if (treeCardRef.value) {
        treeCardRef.value.scrollTop = scrollTop
      }

      if (Number.isFinite(pageScrollY)) {
        window.scrollTo({ top: pageScrollY, behavior: 'auto' })
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

              const response = await fetch(`/api/products?${params.toString()}`, {
                ...getAuthHeaders(),
              })

              if (!ensureAuthorizedResponse(response)) {
                return [category.category_id, 0]
              }

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

    const onDragStart = (event, category) => {
      draggedCategoryId.value = category.category_id
      if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.dropEffect = 'move'
        event.dataTransfer.setData('text/plain', String(category.category_id))
      }
      successMessage.value = ''
      error.value = ''
    }

    const onDragEnd = () => {
      draggedCategoryId.value = null
      dropTargetId.value = null
      rootDropActive.value = false
    }

    const onRowDragOver = (event, category) => {
      if (!draggedCategoryId.value || draggedCategoryId.value === category.category_id) {
        return
      }

      if (event?.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
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
      const authOpts = getAuthHeaders()
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authOpts.headers || {}),
        },
        credentials: authOpts.credentials,
        body: JSON.stringify({ parent_id: newParentId }),
      })

      if (!ensureAuthorizedResponse(response)) {
        return
      }

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to move category')
      }

      await loadCategories()
      successMessage.value = newParentId
        ? 'Category moved successfully.'
        : 'Category moved to root successfully.'
    }

    const dropOnCategory = async (_event, targetCategory) => {
      const sourceId = draggedCategoryId.value
      if (!sourceId || sourceId === targetCategory.category_id) {
        return
      }

      const sourceCategory = flatCategories.value.find((item) => item.category_id === sourceId)
      const isTopLevelToTopLevelDrop = Number(sourceCategory?.depth || 0) === 0 && Number(targetCategory?.depth || 0) === 0

      const descendants = descendantsMap.value.get(sourceId) || []
      if (descendants.includes(targetCategory.category_id)) {
        error.value = 'Cannot move a category under one of its descendants.'
        return
      }

      try {
        error.value = ''
        await moveCategory(sourceId, isTopLevelToTopLevelDrop ? null : targetCategory.category_id)
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

    const deleteCategory = async (category) => {
      const categoryName = String(category?.name || '').trim() || 'this category'
      const confirmed = window.confirm(`Delete "${categoryName}"?`)
      if (!confirmed) {
        return
      }

      const previousScrollTop = treeCardRef.value?.scrollTop || 0
      const previousPageScrollY = window.scrollY || 0

      try {
        error.value = ''
        successMessage.value = ''

        const response = await fetch(`/api/categories/${category.category_id}`, {
          method: 'DELETE',
          ...getAuthHeaders(),
        })

        if (!ensureAuthorizedResponse(response)) {
          return
        }

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete category')
        }

        await loadCategories()
        await restoreTreeScroll(previousScrollTop, previousPageScrollY)
        successMessage.value = 'Category deleted successfully.'
      } catch (deleteError) {
        error.value = deleteError.message || 'Failed to delete category'
      }
    }

    const moveCategoryUp = async (category) => {
      if (!canMoveUp(category) || loading.value) {
        return
      }

      const previousScrollTop = treeCardRef.value?.scrollTop || 0
      const previousPageScrollY = window.scrollY || 0

      try {
        error.value = ''
        successMessage.value = ''

        const response = await fetch(`/api/categories/${category.category_id}/move-up`, {
          method: 'POST',
          ...getAuthHeaders(),
        })

        if (!ensureAuthorizedResponse(response)) {
          return
        }

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to move category up')
        }

        await loadCategories()
        await restoreTreeScroll(previousScrollTop, previousPageScrollY)
        setReorderFeedback(category, 'up')
        successMessage.value = `Moved "${category.name}" up within ${getSiblingGroupLabel(category)}.`
      } catch (moveError) {
        error.value = moveError.message || 'Failed to move category up'
      }
    }

    const moveCategoryDown = async (category) => {
      if (!canMoveDown(category) || loading.value) {
        return
      }

      const previousScrollTop = treeCardRef.value?.scrollTop || 0
      const previousPageScrollY = window.scrollY || 0

      try {
        error.value = ''
        successMessage.value = ''

        const response = await fetch(`/api/categories/${category.category_id}/move-down`, {
          method: 'POST',
          ...getAuthHeaders(),
        })

        if (!ensureAuthorizedResponse(response)) {
          return
        }

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to move category down')
        }

        await loadCategories()
        await restoreTreeScroll(previousScrollTop, previousPageScrollY)
        setReorderFeedback(category, 'down')
        successMessage.value = `Moved "${category.name}" down within ${getSiblingGroupLabel(category)}.`
      } catch (moveError) {
        error.value = moveError.message || 'Failed to move category down'
      }
    }

    const handleCategoryKeydown = async (event, category) => {
      if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault()
        if (canMoveUp(category) && !loading.value) {
          await moveCategoryUp(category)
        }
      } else if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault()
        if (canMoveDown(category) && !loading.value) {
          await moveCategoryDown(category)
        }
      }
    }

    const updateCategoryHomeGroup = async (category, nextGroup) => {
      const categoryId = Number(category?.category_id)
      const normalizedGroup = String(nextGroup || '').trim().toLowerCase()

      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return
      }

      if (!['featured', 'recommended', 'none'].includes(normalizedGroup)) {
        error.value = 'Home section must be featured, recommended, or none.'
        return
      }

      try {
        error.value = ''
        successMessage.value = ''

        const authOpts = getAuthHeaders()
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authOpts.headers || {}),
          },
          credentials: authOpts.credentials,
          body: JSON.stringify({ home_feature_group: normalizedGroup }),
        })

        if (!ensureAuthorizedResponse(response)) {
          return
        }

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update home section')
        }

        await loadCategories()
        successMessage.value = 'Home section updated successfully.'
      } catch (updateError) {
        error.value = updateError.message || 'Failed to update home section'
      }
    }

    onMounted(async () => {
      await loadCategories()
    })

    onBeforeUnmount(() => {
      if (reorderFeedbackTimeoutId) {
        window.clearTimeout(reorderFeedbackTimeoutId)
      }
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
      treeCardRef,
      getProductCount,
      loadCategories,
      onDragStart,
      onDragEnd,
      onRowDragOver,
      onRowDragLeave,
      onRootDragOver,
      dropOnCategory,
      dropOnRoot,
      updateCategoryHomeGroup,
      deleteCategory,
      collapsedIds,
      parentCategoryIds,
      visibleCategories,
      canMoveUp,
      canMoveDown,
      toggleCollapse,
      isDraggingDescendant,
      moveCategoryUp,
      moveCategoryDown,
      handleCategoryKeydown,
      lastReorderedCategoryId,
      lastReorderedDirection,
      selectedCategoryId,
    }
  },
}
</script>

<style scoped>
.category-manager {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 2rem 2rem;
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
  border-color: var(--color-forest);
  background: rgba(99, 172, 77, 0.08);
  color: var(--color-forest);
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
  background: rgba(99, 172, 77, 0.08);
  outline: 2px solid var(--color-forest);
  outline-offset: -2px;
}

.category-row.selected-category {
  background: rgba(99, 172, 77, 0.12);
  border-left: 4px solid var(--color-forest);
  padding-left: calc(1rem - 4px);
}

.category-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: #222;
  font-weight: 600;
}

.reordered-indicator {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(99, 172, 77, 0.14);
  color: var(--color-forest);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
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

.home-group-select {
  border: 1px solid #d4dbe6;
  border-radius: 4px;
  padding: 0.3rem 0.45rem;
  font-size: 0.82rem;
  background: #fff;
}

.product-count {
  color: #444;
  font-size: 0.9rem;
  font-weight: 600;
}

.view-products-link {
  color: var(--color-forest);
  font-weight: 600;
  text-decoration: none;
}

.view-products-link:hover {
  text-decoration: underline;
}

.move-up-btn,
.move-down-btn,
.delete-category-btn {
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.move-up-btn {
  background: #e2f0dd;
  color: #1f4f18;
}

.move-down-btn {
  background: #dbe7f6;
  color: #23406b;
}

.move-up-btn:hover:not(:disabled) {
  background: #d3e7cb;
}

.move-down-btn:hover:not(:disabled) {
  background: #d0def1;
}

.move-up-btn:disabled,
.move-down-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.delete-category-btn {
  background: #f5d8d8;
  color: #7e1f1f;
}

.delete-category-btn:hover {
  background: #efc6c6;
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
  padding: 0.5rem 0.85rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background-color: var(--color-forest);
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

.category-row.dragging-child {
  opacity: 0.4;
}

.collapse-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 0.2rem;
  color: #888;
  font-size: 0.65rem;
  line-height: 1;
  flex-shrink: 0;
}

.collapse-toggle:hover {
  color: var(--color-forest);
}

@media (max-width: 768px) {
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
