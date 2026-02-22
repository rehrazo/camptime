<template>
  <div class="email-templates">
    <!-- Header -->
    <div class="templates-header">
      <h1>Email Templates</h1>
      <button @click="showNewTemplate = true" class="btn btn-primary">
        + Create Template
      </button>
    </div>

    <!-- Template Categories -->
    <div class="template-categories">
      <button 
        v-for="category in categories"
        :key="category"
        @click="selectedCategory = category"
        class="category-btn"
        :class="{ active: selectedCategory === category }"
      >
        {{ category }}
      </button>
    </div>

    <!-- Templates List -->
    <div class="templates-container">
      <div v-if="filteredTemplates.length > 0" class="templates-grid">
        <div v-for="template in filteredTemplates" :key="template.id" class="template-card">
          <div class="template-header">
            <h3>{{ template.name }}</h3>
            <span class="template-status" :class="template.active ? 'active' : 'inactive'">
              {{ template.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <p class="template-subject">Subject: {{ template.subject }}</p>
          <p class="template-description">{{ template.description }}</p>

          <div class="template-stats">
            <span>📧 {{ template.sent }} sent</span>
            <span>📈 {{ template.openRate }}% open rate</span>
            <span>✓ Last edited {{ template.lastEdited }}</span>
          </div>

          <div class="template-actions">
            <button @click="editTemplate(template)" class="btn btn-secondary btn-small">
              Edit
            </button>
            <button @click="previewTemplate(template)" class="btn btn-secondary btn-small">
              Preview
            </button>
            <button @click="duplicateTemplate(template)" class="btn btn-secondary btn-small">
              Duplicate
            </button>
            <button @click="deleteTemplate(template.id)" class="btn btn-danger btn-small">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-else class="no-templates">
        <p>No templates found in this category.</p>
      </div>
    </div>

    <!-- Template Editor Modal -->
    <div v-if="showEditor" class="modal-overlay" @click.self="showEditor = false">
      <div class="modal-content editor-modal">
        <div class="modal-header">
          <h2>{{ editingTemplate ? 'Edit Template' : 'New Template' }}</h2>
          <button @click="showEditor = false" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveTemplate" class="editor-form">
          <div class="form-row">
            <div class="form-group">
              <label>Template Name</label>
              <input 
                v-model="editingTemplate.name"
                type="text"
                placeholder="e.g., Order Confirmation"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Category</label>
              <select v-model="editingTemplate.category" class="form-input">
                <option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Email Subject</label>
            <input 
              v-model="editingTemplate.subject"
              type="text"
              placeholder="Subject line"
              class="form-input"
            />
            <small>Use {{variables}} for dynamic content</small>
          </div>

          <div class="form-group">
            <label>Email Body</label>
            <div class="editor-toolbar">
              <button type="button" class="toolbar-btn" title="Bold"><strong>B</strong></button>
              <button type="button" class="toolbar-btn" title="Italic"><em>I</em></button>
              <button type="button" class="toolbar-btn" title="Link">🔗</button>
              <span class="toolbar-divider"></span>
              <button type="button" @click="insertVariable" class="toolbar-btn" title="Insert Variable">
                {var}
              </button>
              <select @change="insertVariable" class="variable-select">
                <option value="">Insert Variable...</option>
                <option value="{{customer_name}}">Customer Name</option>
                <option value="{{order_id}}">Order ID</option>
                <option value="{{order_total}}">Order Total</option>
                <option value="{{order_date}}">Order Date</option>
                <option value="{{tracking_number}}">Tracking Number</option>
              </select>
            </div>
            <textarea 
              v-model="editingTemplate.body"
              placeholder="Email content"
              class="form-textarea"
              rows="10"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-option">
              <input v-model="editingTemplate.active" type="checkbox" />
              <span>Active (Send this template)</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Template</button>
            <button type="button" @click="showEditor = false" class="btn btn-secondary">
              Cancel
            </button>
            <button type="button" @click="previewTemplate(editingTemplate)" class="btn btn-secondary">
              Preview
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" class="modal-overlay" @click.self="showPreview = false">
      <div class="modal-content preview-modal">
        <div class="modal-header">
          <h2>Preview: {{ previewingTemplate.name }}</h2>
          <button @click="showPreview = false" class="close-btn">✕</button>
        </div>

        <div class="preview-content">
          <div class="preview-field">
            <strong>Subject:</strong>
            <p>{{ previewingTemplate.subject }}</p>
          </div>

          <div class="preview-field">
            <strong>Body:</strong>
            <div class="preview-body">
              {{ previewingTemplate.body }}
            </div>
          </div>

          <div class="preview-actions">
            <button @click="sendTestEmail(previewingTemplate)" class="btn btn-primary">
              Send Test Email
            </button>
            <button @click="showPreview = false" class="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'EmailTemplates',
  setup() {
    const selectedCategory = ref('All')
    const showEditor = ref(false)
    const showPreview = ref(false)
    const showNewTemplate = ref(false)
    const editingTemplate = ref(null)
    const previewingTemplate = ref(null)

    const categories = [
      'All',
      'Order Confirmation',
      'Shipping Notification',
      'Delivery Confirmation',
      'Customer Feedback',
      'Promotional',
      'Abandoned Cart',
      'Newsletter',
    ]

    const templates = ref([
      {
        id: 1,
        name: 'Order Confirmation',
        category: 'Order Confirmation',
        subject: 'Your order #{{order_id}} has been confirmed',
        description: 'Sent when a customer completes a purchase',
        body: 'Thank you for your order!\n\nOrder #{{order_id}}\nTotal: {{order_total}}\nDate: {{order_date}}',
        active: true,
        sent: 1523,
        openRate: 45,
        lastEdited: '2 days ago',
      },
      {
        id: 2,
        name: 'Shipping Notification',
        category: 'Shipping Notification',
        subject: 'Your order is on the way! Tracking: {{tracking_number}}',
        description: 'Sent when an order ships',
        body: 'Your order #{{order_id}} is on its way!\n\nTracking Number: {{tracking_number}}\nEstimated Delivery: 5-7 business days',
        active: true,
        sent: 1201,
        openRate: 52,
        lastEdited: '5 days ago',
      },
      {
        id: 3,
        name: 'Delivery Confirmation',
        category: 'Delivery Confirmation',
        subject: 'Your order has been delivered!',
        description: 'Sent when an order is delivered',
        body: 'Great news! Your order #{{order_id}} has been delivered.\n\nThank you for shopping with us!',
        active: true,
        sent: 987,
        openRate: 38,
        lastEdited: '1 week ago',
      },
      {
        id: 4,
        name: 'Product Review Request',
        category: 'Customer Feedback',
        subject: 'How was your experience with {{product_name}}?',
        description: 'Request customer reviews',
        body: 'We\'d love to hear your thoughts on {{product_name}}.\n\nShare your review and help other campers!',
        active: true,
        sent: 756,
        openRate: 28,
        lastEdited: '1 week ago',
      },
      {
        id: 5,
        name: 'Promotional Email',
        category: 'Promotional',
        subject: '🎉 Special offer: 20% off camping gear!',
        description: 'Marketing and promotional campaigns',
        body: 'Hello {{customer_name}},\n\nEnjoy 20% off on selected camping gear this week only!\n\nUse code: CAMP20',
        active: true,
        sent: 3421,
        openRate: 35,
        lastEdited: '3 days ago',
      },
      {
        id: 6,
        name: 'Abandoned Cart Recovery',
        category: 'Abandoned Cart',
        subject: 'Don\'t forget your items!',
        description: 'Recover abandoned shopping carts',
        body: 'Hi {{customer_name}},\n\nYou left some great items in your cart. Complete your purchase now!',
        active: true,
        sent: 892,
        openRate: 22,
        lastEdited: '2 weeks ago',
      },
    ])

    const filteredTemplates = computed(() => {
      if (selectedCategory.value === 'All') {
        return templates.value
      }
      return templates.value.filter(t => t.category === selectedCategory.value)
    })

    const editTemplate = (template) => {
      editingTemplate.value = { ...template }
      showEditor.value = true
    }

    const saveTemplate = () => {
      if (editingTemplate.value.id) {
        const index = templates.value.findIndex(t => t.id === editingTemplate.value.id)
        templates.value[index] = editingTemplate.value
      } else {
        editingTemplate.value.id = Math.max(...templates.value.map(t => t.id)) + 1
        editingTemplate.value.sent = 0
        editingTemplate.value.openRate = 0
        editingTemplate.value.lastEdited = 'Just now'
        templates.value.push(editingTemplate.value)
      }
      showEditor.value = false
      editingTemplate.value = null
    }

    const previewTemplate = (template) => {
      previewingTemplate.value = template
      showPreview.value = true
    }

    const duplicateTemplate = (template) => {
      const newTemplate = {
        ...template,
        id: Math.max(...templates.value.map(t => t.id)) + 1,
        name: `${template.name} (Copy)`,
        sent: 0,
        openRate: 0,
        lastEdited: 'Just now',
      }
      templates.value.push(newTemplate)
    }

    const deleteTemplate = (id) => {
      if (confirm('Are you sure you want to delete this template?')) {
        templates.value = templates.value.filter(t => t.id !== id)
      }
    }

    const insertVariable = (event) => {
      const variable = event.target.value
      if (variable && editingTemplate.value) {
        editingTemplate.value.body += variable
        event.target.value = ''
      }
    }

    const sendTestEmail = (template) => {
      alert(`Test email for "${template.name}" would be sent to your email address.`)
      showPreview.value = false
    }

    return {
      selectedCategory,
      showEditor,
      showPreview,
      showNewTemplate,
      editingTemplate,
      previewingTemplate,
      categories,
      templates,
      filteredTemplates,
      editTemplate,
      saveTemplate,
      previewTemplate,
      duplicateTemplate,
      deleteTemplate,
      insertVariable,
      sendTestEmail,
    }
  },
}
</script>

<style scoped>
.email-templates {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.templates-header h1 {
  margin: 0;
  color: #333;
}

.template-categories {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.75rem 1.5rem;
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.category-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.category-btn.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.template-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.template-card h3 {
  margin: 0;
  color: #333;
}

.template-status {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.template-status.active {
  background-color: #d4edda;
  color: #155724;
}

.template-status.inactive {
  background-color: #f8d7da;
  color: #842029;
}

.template-subject {
  color: #667eea;
  font-weight: 600;
  margin: 0.75rem 0;
  font-size: 0.9rem;
}

.template-description {
  color: #666;
  margin: 0.75rem 0;
  font-size: 0.95rem;
}

.template-stats {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.85rem;
  color: #999;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1rem;
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
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.no-templates {
  text-align: center;
  padding: 3rem;
  color: #999;
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.editor-modal {
  width: 90vw;
}

.preview-modal {
  width: 80vw;
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
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.editor-form {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group small {
  color: #999;
  font-size: 0.85rem;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  align-items: center;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.toolbar-btn:hover {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: #ddd;
  margin: 0 0.5rem;
}

.variable-select {
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.form-textarea {
  resize: vertical;
  min-height: 200px;
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

.form-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

/* Preview */
.preview-content {
  padding: 1.5rem;
}

.preview-field {
  margin-bottom: 1.5rem;
}

.preview-field strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

.preview-body {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #555;
}

.preview-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .templates-grid {
    grid-template-columns: 1fr;
  }

  .editor-modal,
  .preview-modal {
    width: 95vw;
  }

  .template-actions {
    flex-wrap: wrap;
  }
}
</style>