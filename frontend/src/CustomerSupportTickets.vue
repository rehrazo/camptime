<template>
  <div class="support-tickets">
    <!-- Header -->
    <div class="tickets-header">
      <h1>Support Tickets</h1>
      <div class="header-stats">
        <div class="stat">
          <span class="stat-label">Open</span>
          <span class="stat-value">{{ openCount }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Pending</span>
          <span class="stat-value">{{ pendingCount }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Avg Response</span>
          <span class="stat-value">2h 15m</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="ticket-filters">
      <input 
        v-model="searchQuery"
        type="text"
        placeholder="Search tickets..."
        class="search-input"
      />

      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      <select v-model="priorityFilter" class="filter-select">
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <select v-model="assignedFilter" class="filter-select">
        <option value="">All Agents</option>
        <option value="me">Assigned to Me</option>
        <option value="unassigned">Unassigned</option>
      </select>
    </div>

    <!-- Tickets Table -->
    <div class="tickets-table-container">
      <table class="tickets-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Created</th>
            <th>Last Update</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in filteredTickets" :key="ticket.id" class="ticket-row">
            <td class="ticket-id">
              <span class="id-badge">#{{ ticket.id }}</span>
            </td>
            <td class="customer-name">
              <img :src="ticket.customerAvatar" :alt="ticket.customerName" class="avatar" />
              {{ ticket.customerName }}
            </td>
            <td class="subject">
              <button @click="openTicket(ticket)" class="subject-link">
                {{ ticket.subject }}
              </button>
            </td>
            <td>
              <span class="priority-badge" :class="`priority-${ticket.priority}`">
                {{ ticket.priority }}
              </span>
            </td>
            <td>
              <select 
                :value="ticket.status"
                @change="updateTicketStatus(ticket, $event)"
                class="status-select"
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </td>
            <td class="assigned-to">
              <select 
                v-if="ticket.status !== 'closed'"
                :value="ticket.assignedTo || ''"
                @change="assignTicket(ticket, $event)"
                class="assign-select"
              >
                <option value="">Unassigned</option>
                <option value="john">John Martinez</option>
                <option value="sarah">Sarah Chen</option>
                <option value="michael">Michael Johnson</option>
              </select>
              <span v-else class="assigned-text">{{ ticket.assignedTo || 'N/A' }}</span>
            </td>
            <td class="date">{{ formatDate(ticket.createdAt) }}</td>
            <td class="date">{{ formatDate(ticket.updatedAt) }}</td>
            <td class="action-buttons">
              <button @click="openTicket(ticket)" class="btn-reply" title="Reply">💬</button>
              <button @click="deleteTicket(ticket.id)" class="btn-delete" title="Delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Ticket Detail Modal -->
    <div v-if="selectedTicket && showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal-content ticket-detail-modal">
        <div class="modal-header">
          <div>
            <h2>Ticket #{{ selectedTicket.id }}</h2>
            <p class="ticket-subject">{{ selectedTicket.subject }}</p>
          </div>
          <button @click="showDetail = false" class="close-btn">✕</button>
        </div>

        <div class="ticket-info">
          <div class="info-grid">
            <div class="info-item">
              <label>Customer</label>
              <p>{{ selectedTicket.customerName }}</p>
              <small>{{ selectedTicket.customerEmail }}</small>
            </div>
            <div class="info-item">
              <label>Priority</label>
              <p>
                <span class="priority-badge" :class="`priority-${selectedTicket.priority}`">
                  {{ selectedTicket.priority }}
                </span>
              </p>
            </div>
            <div class="info-item">
              <label>Status</label>
              <p>
                <select 
                  v-model="selectedTicket.status"
                  class="status-select"
                  @change="updateTicketStatus(selectedTicket, $event)"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </p>
            </div>
            <div class="info-item">
              <label>Assigned To</label>
              <p>
                <select 
                  v-model="selectedTicket.assignedTo"
                  class="assign-select"
                  @change="assignTicket(selectedTicket, $event)"
                >
                  <option value="">Unassigned</option>
                  <option value="john">John Martinez</option>
                  <option value="sarah">Sarah Chen</option>
                  <option value="michael">Michael Johnson</option>
                </select>
              </p>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div class="ticket-messages">
          <div v-for="message in selectedTicket.messages" :key="message.id" class="message">
            <div class="message-header">
              <img :src="message.avatar" :alt="message.author" class="avatar" />
              <div class="message-info">
                <strong>{{ message.author }}</strong>
                <span class="message-type">{{ message.type }}</span>
              </div>
              <span class="message-time">{{ formatDate(message.timestamp) }}</span>
            </div>
            <p class="message-content">{{ message.content }}</p>
          </div>
        </div>

        <!-- Reply Form -->
        <div class="reply-form" v-if="selectedTicket.status !== 'closed'">
          <textarea 
            v-model="replyText"
            placeholder="Type your response..."
            class="reply-textarea"
            rows="4"
          ></textarea>
          <div class="reply-actions">
            <button @click="sendReply" class="btn btn-primary">Send Reply</button>
            <label class="checkbox-option">
              <input v-model="closeAfterReply" type="checkbox" />
              <span>Close ticket after reply</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'CustomerSupportTickets',
  setup() {
    const searchQuery = ref('')
    const statusFilter = ref('')
    const priorityFilter = ref('')
    const assignedFilter = ref('')
    const showDetail = ref(false)
    const selectedTicket = ref(null)
    const replyText = ref('')
    const closeAfterReply = ref(false)

    const tickets = ref([
      {
        id: 'TKT-2601',
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerAvatar: 'https://i.pravatar.cc/150?img=1',
        subject: 'Tent arrived with damaged zipper',
        priority: 'high',
        status: 'open',
        assignedTo: 'Sarah',
        createdAt: new Date('2026-02-22 10:30'),
        updatedAt: new Date('2026-02-22 2:15 PM'),
        messages: [
          {
            id: 1,
            author: 'John Smith',
            type: 'Customer',
            avatar: 'https://i.pravatar.cc/150?img=1',
            content: 'I received my order today but the tent zipper is damaged. It won\'t zip properly. Can I get a replacement?',
            timestamp: new Date('2026-02-22 10:30'),
          },
          {
            id: 2,
            author: 'Sarah Chen',
            type: 'Agent',
            avatar: 'https://i.pravatar.cc/150?img=2',
            content: 'Thank you for contacting us! I apologize for the issue with your tent. I\'m arranging a replacement for you right away. You should receive it within 3-5 business days.',
            timestamp: new Date('2026-02-22 11:00'),
          },
        ],
      },
      {
        id: 'TKT-2600',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah@example.com',
        customerAvatar: 'https://i.pravatar.cc/150?img=2',
        subject: 'Question about sleeping bag temperature rating',
        priority: 'low',
        status: 'pending',
        assignedTo: 'John',
        createdAt: new Date('2026-02-21 2:15 PM'),
        updatedAt: new Date('2026-02-22 9:00 AM'),
        messages: [
          {
            id: 1,
            author: 'Sarah Johnson',
            type: 'Customer',
            avatar: 'https://i.pravatar.cc/150?img=2',
            content: 'Hi, I\'m trying to choose between two sleeping bags. Can you help explain the temperature ratings?',
            timestamp: new Date('2026-02-21 2:15 PM'),
          },
        ],
      },
      {
        id: 'TKT-2599',
        customerName: 'Michael Chen',
        customerEmail: 'michael@example.com',
        customerAvatar: 'https://i.pravatar.cc/150?img=3',
        subject: 'Order not yet shipped',
        priority: 'medium',
        status: 'open',
        assignedTo: null,
        createdAt: new Date('2026-02-20 3:45 PM'),
        updatedAt: new Date('2026-02-20 4:20 PM'),
        messages: [
          {
            id: 1,
            author: 'Michael Chen',
            type: 'Customer',
            avatar: 'https://i.pravatar.cc/150?img=3',
            content: 'I placed an order on Feb 15 and it still hasn\'t shipped. Order ID is ORD-2587. When will it ship?',
            timestamp: new Date('2026-02-20 3:45 PM'),
          },
        ],
      },
      {
        id: 'TKT-2598',
        customerName: 'Emily Davis',
        customerEmail: 'emily@example.com',
        customerAvatar: 'https://i.pravatar.cc/150?img=4',
        subject: 'Return request approved',
        priority: 'low',
        status: 'resolved',
        assignedTo: 'Michael',
        createdAt: new Date('2026-02-19 11:20 AM'),
        updatedAt: new Date('2026-02-21 4:00 PM'),
        messages: [
          {
            id: 1,
            author: 'Emily Davis',
            type: 'Customer',
            avatar: 'https://i.pravatar.cc/150?img=4',
            content: 'I want to return my backpack as it doesn\'t fit well.',
            timestamp: new Date('2026-02-19 11:20 AM'),
          },
          {
            id: 2,
            author: 'Michael Johnson',
            type: 'Agent',
            avatar: 'https://i.pravatar.cc/150?img=3',
            content: 'Your return has been approved. I\'ve sent you a return shipping label via email.',
            timestamp: new Date('2026-02-21 4:00 PM'),
          },
        ],
      },
    ])

    const filteredTickets = computed(() => {
      return tickets.value.filter(ticket => {
        const matchesSearch = !searchQuery.value ||
          ticket.id.includes(searchQuery.value) ||
          ticket.subject.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          ticket.customerName.toLowerCase().includes(searchQuery.value.toLowerCase())

        const matchesStatus = !statusFilter.value || ticket.status === statusFilter.value
        const matchesPriority = !priorityFilter.value || ticket.priority === priorityFilter.value

        let matchesAssigned = true
        if (assignedFilter.value === 'me') {
          matchesAssigned = ticket.assignedTo === 'John' // Current user
        } else if (assignedFilter.value === 'unassigned') {
          matchesAssigned = !ticket.assignedTo
        }

        return matchesSearch && matchesStatus && matchesPriority && matchesAssigned
      })
    })

    const openCount = computed(() => tickets.value.filter(t => t.status === 'open').length)
    const pendingCount = computed(() => tickets.value.filter(t => t.status === 'pending').length)

    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const openTicket = (ticket) => {
      selectedTicket.value = ticket
      showDetail.value = true
      replyText.value = ''
      closeAfterReply.value = false
    }

    const sendReply = () => {
      if (!replyText.value.trim() || !selectedTicket.value) return

      const newMessage = {
        id: selectedTicket.value.messages.length + 1,
        author: 'John Martinez',
        type: 'Agent',
        avatar: 'https://i.pravatar.cc/150?img=1',
        content: replyText.value,
        timestamp: new Date(),
      }

      selectedTicket.value.messages.push(newMessage)
      selectedTicket.value.updatedAt = new Date()

      if (closeAfterReply.value) {
        selectedTicket.value.status = 'closed'
      }

      replyText.value = ''
      closeAfterReply.value = false
      alert('Reply sent successfully!')
    }

    const updateTicketStatus = (ticket, event) => {
      ticket.status = event.target.value
      ticket.updatedAt = new Date()
    }

    const assignTicket = (ticket, event) => {
      ticket.assignedTo = event.target.value || null
      ticket.updatedAt = new Date()
    }

    const deleteTicket = (ticketId) => {
      if (confirm('Are you sure you want to delete this ticket?')) {
        tickets.value = tickets.value.filter(t => t.id !== ticketId)
      }
    }

    return {
      searchQuery,
      statusFilter,
      priorityFilter,
      assignedFilter,
      showDetail,
      selectedTicket,
      replyText,
      closeAfterReply,
      tickets,
      filteredTickets,
      openCount,
      pendingCount,
      formatDate,
      openTicket,
      sendReply,
      updateTicketStatus,
      assignTicket,
      deleteTicket,
    }
  },
}
</script>

<style scoped>
.support-tickets {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.tickets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tickets-header h1 {
  margin: 0;
  color: #333;
}

.header-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-label {
  color: #999;
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.ticket-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
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

.tickets-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tickets-table {
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

.ticket-row {
  transition: background-color 0.3s;
}

.id-badge {
  background-color: #e8f0ff;
  color: #667eea;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 0.75rem;
  vertical-align: middle;
}

.customer-name {
  display: flex;
  align-items: center;
}

.subject-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 600;
  padding: 0;
}

.subject-link:hover {
  color: #5568d3;
}

.priority-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.priority-low {
  background-color: #d4edda;
  color: #155724;
}

.priority-medium {
  background-color: #fff3cd;
  color: #856404;
}

.priority-high {
  background-color: #f8d7da;
  color: #842029;
}

.priority-urgent {
  background-color: #e74c3c;
  color: white;
}

.status-select,
.assign-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

.assigned-text {
  color: #666;
}

.date {
  font-size: 0.9rem;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-reply,
.btn-delete {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-reply:hover {
  background-color: #e8f0ff;
  color: #667eea;
}

.btn-delete:hover {
  background-color: #f8d7da;
  color: #842029;
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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90vw;
}

.ticket-detail-modal {
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.ticket-subject {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.ticket-info {
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.info-item label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.info-item p {
  margin: 0;
  color: #555;
}

.info-item small {
  display: block;
  color: #999;
  font-size: 0.85rem;
}

.ticket-messages {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.message {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.message:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.message-info {
  flex: 1;
}

.message-info strong {
  display: block;
  color: #333;
}

.message-type {
  font-size: 0.8rem;
  color: #999;
  background-color: #f5f5f5;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
}

.message-time {
  color: #999;
  font-size: 0.85rem;
}

.message-content {
  margin: 0;
  color: #555;
  line-height: 1.6;
}

.reply-form {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.reply-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
}

.reply-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-option input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

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

@media (max-width: 768px) {
  .tickets-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-stats {
    width: 100%;
  }

  .ticket-filters {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  table {
    font-size: 0.85rem;
  }

  th, td {
    padding: 0.75rem;
  }
}
</style>