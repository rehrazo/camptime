<template>
  <div class="admin-product-edit">
    <div class="page-header">
      <div>
        <h1>{{ isCreateMode ? 'Create Product' : 'Edit Product' }}</h1>
        <p class="subtitle">Update product fields used by storefront UI</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" @click="goBackToList" :disabled="saving">Cancel</button>
        <button class="btn btn-primary" @click="saveProduct" :disabled="saving || loading">
          {{ saving ? 'Saving...' : isCreateMode ? 'Create Product' : 'Save Product' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>

    <div v-if="loading" class="loading">Loading product...</div>

    <div v-else class="form-card">
      <div class="form-tabs" role="tablist" aria-label="Edit product sections">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'details' }"
          @click="activeTab = 'details'"
        >
          Details
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'descriptions' }"
          @click="activeTab = 'descriptions'"
        >
          Descriptions
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'media' }"
          @click="activeTab = 'media'"
        >
          Media & Variants
        </button>
      </div>

      <div class="settings-grid">
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productName">Name</label>
          <input id="productName" v-model="form.name" type="text" class="form-input" placeholder="Product name" />
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productBrand">Brand</label>
          <input id="productBrand" v-model="form.brand" type="text" class="form-input" placeholder="Brand" />
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productSku">SKU</label>
          <input id="productSku" v-model="form.sku_code" type="text" class="form-input" placeholder="SKU code" />
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productSpu">SPU</label>
          <input id="productSpu" v-model="form.spu_no" type="text" class="form-input" placeholder="SPU number" />
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productCategoryId">Category</label>
          <select id="productCategoryId" v-model="form.category_id" class="form-input">
            <option :value="null">Uncategorized</option>
            <option v-for="category in categoryOptions" :key="category.category_id" :value="category.category_id">
              {{ category.label }}
            </option>
          </select>
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productPrice">Price</label>
          <input id="productPrice" v-model.number="form.price" type="number" min="0" step="0.01" class="form-input" />
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productStock">Stock</label>
          <input id="productStock" v-model.number="form.stock_quantity" type="number" min="0" step="1" class="form-input" />
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productShippingMethod">Shipping Method</label>
          <input id="productShippingMethod" v-model="form.shipping_method" type="text" class="form-input" placeholder="e.g. Standard, Air" />
        </div>
        <div v-if="activeTab === 'details'" class="form-group">
          <label for="productProcessingTime">Processing Time</label>
          <input id="productProcessingTime" v-model="form.processing_time" type="text" class="form-input" placeholder="e.g. 1-3 business days" />
        </div>
        <div v-if="activeTab === 'descriptions'" class="form-group form-group-full">
          <label for="productBriefDescription">Brief Description</label>
          <textarea
            id="productBriefDescription"
            v-model="form.brief_description"
            class="form-input form-textarea"
            rows="3"
            placeholder="Short summary shown in listing/detail contexts"
          ></textarea>
        </div>
        <div v-if="activeTab === 'descriptions'" class="form-group form-group-full">
          <label for="productDescription">Description</label>
          <textarea
            id="productDescription"
            v-model="form.description"
            class="form-input form-textarea"
            rows="5"
            placeholder="Primary plain-text fallback description"
          ></textarea>
        </div>
        <div v-if="activeTab === 'descriptions'" class="form-group form-group-full">
          <label for="productHtmlDescription">Description Editor (HTML)</label>
          <QuillEditor
            id="productHtmlDescription"
            v-model:content="form.html_description"
            contentType="html"
            theme="snow"
            :toolbar="editorToolbar"
            class="description-editor"
          />
          <p class="subtitle">Use this for bullet points and line breaks on product detail pages.</p>
        </div>
        <div v-if="activeTab === 'descriptions'" class="form-group form-group-full">
          <label for="productLongDescription">Long Description</label>
          <textarea
            id="productLongDescription"
            v-model="form.long_description"
            class="form-input form-textarea"
            rows="8"
            placeholder="Extended content used to derive sections/highlights/specifications"
          ></textarea>
        </div>
        <div v-if="activeTab === 'descriptions'" class="form-group form-group-full">
          <label for="productShippingLimitations">Shipping Limitations</label>
          <textarea
            id="productShippingLimitations"
            v-model="form.shipping_limitations"
            class="form-input form-textarea"
            rows="3"
            placeholder="Shipping restrictions or notes"
          ></textarea>
        </div>
        <div v-if="activeTab === 'media'" class="form-group form-group-full">
          <label for="newProductImageUrl">Images</label>
          <div class="image-add-row">
            <input
              id="newProductImageUrl"
              v-model="newImageUrl"
              type="url"
              class="form-input"
              placeholder="https://.../image.jpg"
              @keyup.enter="addImage"
            />
            <button type="button" class="btn btn-secondary" @click="addImage">Add Image</button>
          </div>
          <p v-if="imageFormError" class="error-message image-error">{{ imageFormError }}</p>
          <div v-if="form.imageUrls.length" class="image-preview-grid">
            <div v-for="(url, index) in form.imageUrls" :key="`${url}-${index}`" class="image-preview-card">
              <img :src="url" :alt="`Product image ${index + 1}`" class="image-preview" @error="onPreviewError" />
              <div class="image-preview-meta">
                <span class="image-index">{{ index === 0 ? 'Primary' : `Image ${index + 1}` }}</span>
                <div class="image-actions">
                  <button
                    v-if="index !== 0"
                    type="button"
                    class="set-primary-btn"
                    @click="setPrimaryImage(index)"
                  >
                    Set Primary
                  </button>
                  <button type="button" class="remove-image-btn" @click="removeImage(index)">Remove</button>
                </div>
              </div>
              <p class="image-url">{{ url }}</p>
            </div>
          </div>
          <p v-else class="subtitle">No images added yet.</p>
        </div>
        <div v-if="activeTab === 'media'" class="form-group form-group-full">
          <label for="productVariations">Variations (one per line: Theme|Value|SKU)</label>
          <textarea
            id="productVariations"
            v-model="form.variations_text"
            class="form-input form-textarea"
            rows="6"
            placeholder="Color|Red|SKU-RED&#10;Color|Blue|SKU-BLUE"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'

export default {
  name: 'AdminProductEdit',
  components: {
    QuillEditor,
  },
  setup() {
    const route = useRoute()
    const router = useRouter()

    const loading = ref(true)
    const saving = ref(false)
    const error = ref('')
    const activeTab = ref('details')
    const categoryOptions = ref([])
    const newImageUrl = ref('')
    const imageFormError = ref('')
    const imageFallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220"><rect width="100%" height="100%" fill="%23ece3d1"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23666">Image unavailable</text></svg>'
    const editorToolbar = [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ]

    const form = ref({
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
      html_description: '',
      long_description: '',
      shipping_method: '',
      shipping_limitations: '',
      processing_time: '',
      imageUrls: [],
      variations_text: '',
    })

    const isCreateMode = computed(() => String(route.params.id || '').toLowerCase() === 'new')

    const goBackToList = () => {
      router.push({ path: '/admin', query: { tab: 'products' } })
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

    const parseLines = (value = '') => {
      return String(value)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    }

    const escapeHtml = (value = '') => {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    const textToEditorHtml = (value = '') => {
      const text = String(value || '').trim()
      if (!text) {
        return ''
      }

      const blocks = text.split(/\n\s*\n/)
      return blocks
        .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
        .join('')
    }

    const normalizeHtmlDescription = (value = '') => {
      const html = String(value || '').trim()
      if (!html) {
        return null
      }

      const textOnly = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .trim()

      return textOnly ? html : null
    }

    const normalizeImageUrl = (value) => String(value || '').trim()

    const addImage = () => {
      const value = normalizeImageUrl(newImageUrl.value)
      imageFormError.value = ''

      if (!value) {
        imageFormError.value = 'Enter an image URL first.'
        return
      }

      try {
        const parsed = new URL(value)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('invalid protocol')
        }
      } catch {
        imageFormError.value = 'Enter a valid http/https image URL.'
        return
      }

      const exists = form.value.imageUrls.some((item) => String(item).toLowerCase() === value.toLowerCase())
      if (exists) {
        imageFormError.value = 'That image URL is already added.'
        return
      }

      form.value.imageUrls.push(value)
      newImageUrl.value = ''
    }

    const removeImage = (index) => {
      form.value.imageUrls.splice(index, 1)
      imageFormError.value = ''
    }

    const setPrimaryImage = (index) => {
      const images = form.value.imageUrls
      if (!Array.isArray(images) || index <= 0 || index >= images.length) {
        return
      }

      const [selected] = images.splice(index, 1)
      images.unshift(selected)
      imageFormError.value = ''
    }

    const onPreviewError = (event) => {
      if (event?.target?.src !== imageFallback) {
        event.target.src = imageFallback
      }
    }

    const loadCategories = async () => {
      const response = await fetch('/api/categories/tree')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load categories')
      }

      categoryOptions.value = flattenCategoryTree(Array.isArray(data.data) ? data.data : [])
    }

    const loadProduct = async () => {
      if (isCreateMode.value) {
        loading.value = false
        return
      }

      const response = await fetch(`/api/products/${route.params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load product details')
      }

      const imageUrls = Array.isArray(data.images)
        ? data.images
            .map((item) => normalizeImageUrl(item?.image_url))
            .filter(Boolean)
        : []

      const variationsText = Array.isArray(data.variations)
        ? data.variations
            .map((item) => {
              const theme = String(item?.theme_name || '').trim()
              const value = String(item?.variation_value || '').trim()
              const sku = String(item?.variation_sku || '').trim()
              if (!theme || !value) {
                return ''
              }
              return sku ? `${theme}|${value}|${sku}` : `${theme}|${value}`
            })
            .filter(Boolean)
            .join('\n')
        : ''

      form.value = {
        product_id: data.product_id,
        name: data.name || '',
        brand: data.brand || '',
        sku_code: data.sku_code || '',
        spu_no: data.spu_no || '',
        category_id: data.category_id || null,
        price: Number(data.price || 0),
        stock_quantity: Number(data.stock_quantity || 0),
        brief_description: data.brief_description || '',
        description: data.description || '',
        html_description:
          String(data.html_description || '').trim() ||
          textToEditorHtml(data.long_description || data.description || ''),
        long_description: data.long_description || '',
        shipping_method: data.shipping_method || '',
        shipping_limitations: data.shipping_limitations || '',
        processing_time: data.processing_time || '',
        imageUrls,
        variations_text: variationsText,
      }
    }

    const buildPayload = () => {
      const images = (() => {
        const unique = new Set()
        return (Array.isArray(form.value.imageUrls) ? form.value.imageUrls : []).reduce((result, rawUrl) => {
          const url = normalizeImageUrl(rawUrl)
          if (!url) {
            return result
          }

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
        return parseLines(form.value.variations_text).reduce((result, line) => {
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

      return {
        name: String(form.value.name || '').trim(),
        brand: String(form.value.brand || '').trim() || null,
        sku_code: String(form.value.sku_code || '').trim() || null,
        spu_no: String(form.value.spu_no || '').trim() || null,
        category_id: form.value.category_id || null,
        price: Number(form.value.price || 0),
        stock_quantity: Number(form.value.stock_quantity || 0),
        brief_description: String(form.value.brief_description || '').trim() || null,
        description: String(form.value.description || '').trim() || null,
        html_description: normalizeHtmlDescription(form.value.html_description),
        long_description: String(form.value.long_description || '').trim() || null,
        shipping_method: String(form.value.shipping_method || '').trim() || null,
        shipping_limitations: String(form.value.shipping_limitations || '').trim() || null,
        processing_time: String(form.value.processing_time || '').trim() || null,
        images,
        variations,
      }
    }

    const saveProduct = async () => {
      const payload = buildPayload()

      if (!payload.name) {
        error.value = 'Product name is required'
        return
      }

      saving.value = true
      error.value = ''

      try {
        const endpoint = isCreateMode.value
          ? '/api/products'
          : `/api/products/${form.value.product_id || route.params.id}`
        const method = isCreateMode.value ? 'POST' : 'PUT'

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Failed to ${isCreateMode.value ? 'create' : 'update'} product`)
        }

        goBackToList()
      } catch (saveError) {
        error.value = saveError.message || 'Failed to save product'
      } finally {
        saving.value = false
      }
    }

    onMounted(async () => {
      loading.value = true
      error.value = ''

      try {
        await loadCategories()
        await loadProduct()
      } catch (loadError) {
        error.value = loadError.message || 'Failed to initialize product form'
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      saving,
      error,
      activeTab,
      form,
      editorToolbar,
      categoryOptions,
        newImageUrl,
        imageFormError,
      isCreateMode,
        addImage,
        removeImage,
        setPrimaryImage,
        onPreviewError,
      saveProduct,
      goBackToList,
    }
  },
}
</script>

<style scoped>
.admin-product-edit {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: #555;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.form-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 1.25rem;
}

.form-tabs {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tab-btn {
  border: 1px solid #d5d5d5;
  background: #f7f7f7;
  color: #333;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.tab-btn.active {
  background: #2F4F3E;
  color: #D9C7A3;
  border-color: #2F4F3E;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
  font-size: 0.95rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #2F4F3E;
  box-shadow: 0 0 0 2px rgba(47, 79, 62, 0.15);
}

.form-textarea {
  resize: vertical;
}

.description-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.description-editor :deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid #ddd;
}

.description-editor :deep(.ql-container) {
  border: none;
  min-height: 210px;
  font-family: inherit;
  font-size: 0.95rem;
}

.image-add-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.image-preview-grid {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.image-preview-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.6rem;
  background: #fff;
}

.image-preview {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 4px;
  background: #f3f3f3;
}

.image-preview-meta {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.image-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.image-index {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2F4F3E;
}

.set-primary-btn {
  border: none;
  border-radius: 4px;
  background: #2F4F3E;
  color: #D9C7A3;
  padding: 0.3rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.remove-image-btn {
  border: none;
  border-radius: 4px;
  background: #f5d8d8;
  color: #7e1f1f;
  padding: 0.3rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.image-url {
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  color: #555;
  word-break: break-all;
}

.image-error {
  margin: 0.35rem 0 0;
}

.loading {
  color: #555;
}

.error-message {
  margin: 0 0 1rem;
  color: #b3261e;
  font-weight: 600;
}

.btn {
  padding: 0.7rem 1.2rem;
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

  .actions {
    width: 100%;
  }

  .image-add-row {
    flex-direction: column;
    align-items: stretch;
  }

  .actions .btn {
    flex: 1;
  }
}
</style>
