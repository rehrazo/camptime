<template>
  <div class="user-role-management">
    <!-- Header -->
    <div class="management-header">
      <h1>User & Role Management</h1>
      <button @click="showNewUser = true" class="btn btn-primary">
        + Add User
      </button>
    </div>

    <!-- Tabs -->
    <div class="management-tabs">
      <button 
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Users Management -->
    <section v-if="activeTab === 'Users'" class="users-section">
      <div class="section-controls">
        <input 
          v-model="userSearch"
          type="text"
          placeholder="Search users..."
          class="search-input"
        />
        <select v-model="roleFilter" class="filter-select">
          <option value="">All Roles</option>
          <option value="admin">Administrator</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>2FA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="user-name">
                <img :src="user.avatar" :alt="user.name" class="avatar" />
                {{ user.name }}
              </td>
              <td>{{ user.email }}</td>
              <td>
                <select 
                  :value="user.role"
                  @change="updateUserRole(user, $event)"
                  class="role-select"
                >
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </td>
              <td>
                <span class="status-badge" :class="user.active ? 'active' : 'inactive'">
                  {{ user.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="last-login">{{ user.lastLogin }}</td>
              <td class="center">
                <span v-if="user.twoFactorEnabled" class="badge-2fa">✓ Enabled</span>
                <span v-else class="badge-disabled">Disabled</span>
              </td>
              <td class="action-buttons">
                <button @click="editUser(user)" class="btn-action edit" title="Edit">✎</button>
                <button @click="toggleUserStatus(user)" class="btn-action" title="Toggle Status">
                  {{ user.active ? '⊘' : '✓' }}
                </button>
                <button @click="deleteUser(user.id)" class="btn-action delete" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Roles Management -->
    <section v-if="activeTab === 'Roles'" class="roles-section">
      <button @click="showNewRole = true" class="btn btn-primary">
        + Create Role
      </button>

      <div class="roles-grid">
        <div v-for="role in roles" :key="role.id" class="role-card">
          <div class="role-header">
            <h3>{{ role.name }}</h3>
            <span class="user-count">{{ role.users }} users</span>
          </div>

          <p class="role-description">{{ role.description }}</p>

          <div class="permissions-list">
            <h4>Permissions</h4>
            <div class="permission-badges">
              <span v-for="perm in role.permissions" :key="perm" class="perm-badge">
                {{ perm }}
              </span>
            </div>
          </div>

          <div class="role-actions">
            <button @click="editRole(role)" class="btn btn-secondary btn-small">Edit</button>
            <button @click="deleteRole(role.id)" class="btn btn-danger btn-small">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Permissions Management -->
    <section v-if="activeTab === 'Permissions'" class="permissions-section">
      <h2>Permission Matrix</h2>
      <p class="section-description">Define which roles have access to which features</p>

      <div class="permissions-matrix">
        <table class="permissions-table">
          <thead>
            <tr>
              <th>Feature/Action</th>
              <th v-for="role in roles" :key="role.id">{{ role.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="perm in allPermissions" :key="perm">
              <td class="permission-name">{{ perm }}</td>
              <td v-for="role in roles" :key="role.id" class="permission-cell">
                <label class="checkbox">
                  <input 
                    type="checkbox"
                    :checked="hasPermission(role.id, perm)"
                    @change="togglePermission(role.id, perm)"
                  />
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="save-permissions">
        <button class="btn btn-primary">Save Permissions</button>
      </div>
    </section>

    <!-- User Editor Modal -->
    <div v-if="showUserEditor" class="modal-overlay" @click.self="showUserEditor = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingUser ? 'Edit User' : 'New User' }}</h2>
          <button @click="showUserEditor = false" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input 
                v-model="editingUser.firstName"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input 
                v-model="editingUser.lastName"
                type="text"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input 
              v-model="editingUser.email"
              type="email"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Role</label>
            <select v-model="editingUser.role" class="form-input" required>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div class="form-group">
            <label>Department</label>
            <input 
              v-model="editingUser.department"
              type="text"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-option">
              <input v-model="editingUser.active" type="checkbox" />
              <span>Active Account</span>
            </label>
          </div>

          <div v-if="!editingUser.id" class="form-group">
            <label class="checkbox-option">
              <input v-model="sendInvite" type="checkbox" />
              <span>Send invitation email</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingUser?.id ? 'Update User' : 'Create User' }}
            </button>
            <button type="button" @click="showUserEditor = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Role Editor Modal -->
    <div v-if="showRoleEditor" class="modal-overlay" @click.self="showRoleEditor = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingRole ? 'Edit Role' : 'New Role' }}</h2>
          <button @click="showRoleEditor = false" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveRole" class="role-form">
          <div class="form-group">
            <label>Role Name</label>
            <input 
              v-model="editingRole.name"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="editingRole.description"
              class="form-input"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Permissions</label>
            <div class="permissions-checklist">
              <label v-for="perm in allPermissions" :key="perm" class="checkbox-option">
                <input 
                  v-model="editingRole.permissions"
                  type="checkbox"
                  :value="perm"
                />
                <span>{{ perm }}</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingRole?.id ? 'Update Role' : 'Create Role' }}
            </button>
            <button type="button" @click="showRoleEditor = false" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'UserRoleManagement',
  setup() {
    const activeTab = ref('Users')
    const userSearch = ref('')
    const roleFilter = ref('')
    const showUserEditor = ref(false)
    const showRoleEditor = ref(false)
    const showNewUser = ref(false)
    const showNewRole = ref(false)
    const sendInvite = ref(true)
    const editingUser = ref(null)
    const editingRole = ref(null)

    const tabs = ['Users', 'Roles', 'Permissions']

    const allPermissions = [
      'View Dashboard',
      'Manage Products',
      'Manage Orders',
      'Manage Customers',
      'View Reports',
      'Manage Users',
      'Manage Settings',
      'Manage Emails',
      'View Inventory',
      'Edit Inventory',
      'Manage Promotions',
      'Export Data',
    ]

    const users = ref([
      {
        id: 1,
        name: 'John Martinez',
        firstName: 'John',
        lastName: 'Martinez',
        email: 'john@camptime.com',
        role: 'admin',
        department: 'Management',
        avatar: 'https://i.pravatar.cc/150?img=1',
        active: true,
        lastLogin: '2026-02-22 10:30 AM',
        twoFactorEnabled: true,
      },
      {
        id: 2,
        name: 'Sarah Chen',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah@camptime.com',
        role: 'manager',
        department: 'Operations',
        avatar: 'https://i.pravatar.cc/150?img=2',
        active: true,
        lastLogin: '2026-02-22 2:15 PM',
        twoFactorEnabled: true,
      },
      {
        id: 3,
        name: 'Michael Johnson',
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael@camptime.com',
        role: 'staff',
        department: 'Support',
        avatar: 'https://i.pravatar.cc/150?img=3',
        active: true,
        lastLogin: '2026-02-21 9:00 AM',
        twoFactorEnabled: false,
      },
      {
        id: 4,
        name: 'Emily Davis',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily@camptime.com',
        role: 'staff',
        department: 'Marketing',
        avatar: 'https://i.pravatar.cc/150?img=4',
        active: true,
        lastLogin: '2026-02-20 3:45 PM',
        twoFactorEnabled: false,
      },
    ])

    const roles = ref([
      {
        id: 1,
        name: 'Administrator',
        description: 'Full access to all features and settings',
        users: 1,
        permissions: [
          'View Dashboard',
          'Manage Products',
          'Manage Orders',
          'Manage Customers',
          'View Reports',
          'Manage Users',
          'Manage Settings',
          'Manage Emails',
          'View Inventory',
          'Edit Inventory',
          'Manage Promotions',
          'Export Data',
        ],
      },
      {
        id: 2,
        name: 'Manager',
        description: 'Manage operations and view analytics',
        users: 1,
        permissions: [
          'View Dashboard',
          'Manage Products',
          'Manage Orders',
          'Manage Customers',
          'View Reports',
          'Manage Emails',
          'View Inventory',
          'Edit Inventory',
          'Export Data',
        ],
      },
      {
        id: 3,
        name: 'Staff',
        description: 'Limited access for daily operations',
        users: 2,
        permissions: [
          'View Dashboard',
          'View Reports',
          'Manage Orders',
          'View Inventory',
        ],
      },
      {
        id: 4,
        name: 'Viewer',
        description: 'Read-only access',
        users: 0,
        permissions: [
          'View Dashboard',
          'View Reports',
        ],
      },
    ])

    const filteredUsers = computed(() => {
      return users.value.filter(user => {
        const matchesSearch = !userSearch.value || 
          user.name.toLowerCase().includes(userSearch.value.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearch.value.toLowerCase())

        const matchesRole = !roleFilter.value || user.role === roleFilter.value

        return matchesSearch && matchesRole
      })
    })

    const editUser = (user) => {
      editingUser.value = { ...user }
      showUserEditor.value = true
    }

    const saveUser = () => {
      if (editingUser.value.id) {
        const index = users.value.findIndex(u => u.id === editingUser.value.id)
        users.value[index] = {
          ...editingUser.value,
          name: `${editingUser.value.firstName} ${editingUser.value.lastName}`,
        }
      } else {
        const newUser = {
          ...editingUser.value,
          id: Math.max(...users.value.map(u => u.id)) + 1,
          name: `${editingUser.value.firstName} ${editingUser.value.lastName}`,
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          lastLogin: 'Never',
          twoFactorEnabled: false,
        }
        users.value.push(newUser)
      }
      showUserEditor.value = false
      editingUser.value = null
    }

    const toggleUserStatus = (user) => {
      user.active = !user.active
    }

    const deleteUser = (userId) => {
      if (confirm('Are you sure you want to delete this user?')) {
        users.value = users.value.filter(u => u.id !== userId)
      }
    }

    const updateUserRole = (user, event) => {
      user.role = event.target.value
    }

    const editRole = (role) => {
      editingRole.value = { ...role, permissions: [...role.permissions] }
      showRoleEditor.value = true
    }

    const saveRole = () => {
      if (editingRole.value.id) {
        const index = roles.value.findIndex(r => r.id === editingRole.value.id)
        roles.value[index] = editingRole.value
      } else {
        editingRole.value.id = Math.max(...roles.value.map(r => r.id)) + 1
        editingRole.value.users = 0
        roles.value.push(editingRole.value)
      }
      showRoleEditor.value = false
      editingRole.value = null
    }

    const deleteRole = (roleId) => {
      if (confirm('Are you sure you want to delete this role?')) {
        roles.value = roles.value.filter(r => r.id !== roleId)
      }
    }

    const hasPermission = (roleId, permission) => {
      const role = roles.value.find(r => r.id === roleId)
      return role ? role.permissions.includes(permission) : false
    }

    const togglePermission = (roleId, permission) => {
      const role = roles.value.find(r => r.id === roleId)
      if (role) {
        const index = role.permissions.indexOf(permission)
        if (index > -1) {
          role.permissions.splice(index, 1)
        } else {
          role.permissions.push(permission)
        }
      }
    }

    return {
      activeTab,
      userSearch,
      roleFilter,
      showUserEditor,
      showRoleEditor,
      showNewUser,
      showNewRole,
      sendInvite,
      editingUser,
      editingRole,
      tabs,
      allPermissions,
      users,
      roles,
      filteredUsers,
      editUser,
      saveUser,
      toggleUserStatus,
      deleteUser,
      updateUserRole,
      editRole,
      saveRole,
      deleteRole,
      hasPermission,
      togglePermission,
    }
  },
}
</script>

<style scoped>
.user-role-management {
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

.management-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.tab-btn {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

/* Users Section */
.section-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
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

.users-table-container,
.roles-grid {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.users-table {
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

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 0.75rem;
  vertical-align: middle;
}

.user-name {
  display: flex;
  align-items: center;
}

.role-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #842029;
}

.badge-2fa {
  background-color: #d4edda;
  color: #155724;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-disabled {
  color: #999;
  font-size: 0.85rem;
}

.center {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-action:hover {
  background-color: #f0f0f0;
}

.btn-action.edit:hover {
  color: #667eea;
}

.btn-action.delete:hover {
  color: #e74c3c;
}

/* Roles Section */
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.role-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.role-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.role-header h3 {
  margin: 0;
  color: #333;
}

.user-count {
  background-color: #f5f5f5;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #999;
}

.role-description {
  color: #666;
  margin: 0.75rem 0;
  font-size: 0.95rem;
}

.permissions-list h4 {
  margin: 1rem 0 0.75rem 0;
  font-size: 0.95rem;
  color: #333;
}

.permission-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.perm-badge {
  background-color: #e8f0ff;
  color: #667eea;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

/* Permissions Section */
.permissions-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-description {
  color: #666;
  margin: 0.5rem 0 1.5rem 0;
}

.permissions-matrix {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.permissions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.permissions-table th,
.permissions-table td {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  text-align: left;
}

.permissions-table thead {
  background-color: #f5f5f5;
}

.permission-name {
  font-weight: 600;
  color: #333;
  min-width: 150px;
}

.permission-cell {
  text-align: center;
}

.checkbox {
  cursor: pointer;
}

.checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.save-permissions {
  text-align: right;
}

/* Modals */
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90vw;
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

.user-form,
.role-form {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.permissions-checklist {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
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

@media (max-width: 768px) {
  .management-tabs {
    flex-wrap: wrap;
  }

  .section-controls {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .roles-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .permissions-checklist {
    grid-template-columns: 1fr;
  }

  .permissions-matrix {
    font-size: 0.85rem;
  }

  .permissions-table th,
  .permissions-table td {
    padding: 0.5rem;
  }
}
</style>