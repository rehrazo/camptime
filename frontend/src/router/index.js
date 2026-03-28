import { createRouter, createWebHistory } from 'vue-router'
import StorefrontLayout from '../layouts/StorefrontLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import Home from '../views/store/Home.vue'
import About from '../views/store/About.vue'
import Contact from '../views/store/Contact.vue'
import FAQ from '../views/store/FAQ.vue'
import Products from '../views/store/Products.vue'
import ProductDetail from '../views/store/ProductDetail.vue'
import Cart from '../views/store/Cart.vue'
import Login from '../views/store/Login.vue'
import ForgotPassword from '../views/store/ForgotPassword.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import Signup from '../views/store/Signup.vue'
import Account from '../views/store/Account.vue'
import Checkout from '../views/store/Checkout.vue'
import NotFound from '../views/store/NotFound.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminProductEdit from '../views/admin/AdminProductEdit.vue'
import AdminUncategorizedProducts from '../views/admin/AdminUncategorizedProducts.vue'
import CategoryManager from '../views/admin/CategoryManager.vue'
import ProductCategoryMover from '../views/admin/ProductCategoryMover.vue'
import OrderConfirmation from '../views/store/OrderConfirmation.vue'
import AdminOrderExportManager from '../views/admin/AdminOrderExportManager.vue'
import TaxManagement from '../views/admin/TaxManagement.vue'
import ShippingManagement from '../views/admin/ShippingManagement.vue'
import DropShippersManagement from '../views/admin/DropShippersManagement.vue'
import ShippingReturns from '../views/store/ShippingReturns.vue'
import PrivacyPolicy from '../views/store/PrivacyPolicy.vue'
import TermsConditions from '../views/store/TermsConditions.vue'
import TrackOrder from '../views/store/TrackOrder.vue'
import { applyPageSeo, DEFAULT_DESCRIPTION } from '../utils/seo'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    component: StorefrontLayout,
    children: [
            {
              path: 'store/design-guide',
              name: 'DesignGuide',
              component: () => import('../views/store/DesignGuide.vue'),
              meta: {
                title: 'Design Guide | Razo Wild',
                description: 'Brand color palette, typography, spacing, and UI components for Razo Wild.',
              },
            },
      {
        path: '',
        name: 'Home',
        component: Home,
        meta: {
          title: 'Razo Wild | Camping Gear and Outdoor Essentials',
          description: 'Find premium tents, sleeping bags, camp furniture, and outdoor gear at Razo Wild.',
        },
      },
      {
        path: 'about',
        name: 'About',
        component: About,
        meta: {
          title: 'About Us | Razo Wild',
          description: 'Learn more about Razo Wild and our mission to serve outdoor enthusiasts.',
        },
      },
      {
        path: 'contact',
        name: 'Contact',
        component: Contact,
        meta: {
          title: 'Contact Us | Razo Wild',
          description: 'Contact the Razo Wild team for product, shipping, and support questions.',
        },
      },
      {
        path: 'faq',
        name: 'FAQ',
        component: FAQ,
        meta: {
          title: 'FAQ | Razo Wild',
          description: 'Browse frequently asked questions about orders, shipping, returns, and products.',
        },
      },
      {
        path: 'products',
        name: 'Products',
        component: Products,
        meta: {
          title: 'Shop Camping Products | Razo Wild',
          description: 'Browse the Razo Wild catalog of camping products, outdoor equipment, and travel essentials.',
        },
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: ProductDetail,
        meta: {
          title: 'Product Details | Razo Wild',
          description: 'View product features, specifications, packaging, shipping, and availability on Razo Wild.',
        },
      },
      {
        path: 'cart',
        name: 'Cart',
        component: Cart,
        meta: {
          title: 'Your Cart | Razo Wild',
          description: 'Review items in your cart before checkout.',
          noindex: true,
        },
      },
      {
        path: 'login',
        name: 'Login',
        component: Login,
        meta: {
          title: 'Login | Razo Wild',
          description: 'Sign in to your Razo Wild account.',
          noindex: true,
        },
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: ForgotPassword,
        meta: {
          title: 'Reset Password | Razo Wild',
          description: 'Reset your Razo Wild account password securely.',
          noindex: true,
        },
      },
      {
        path: 'admin/login',
        name: 'AdminLogin',
        component: AdminLogin,
        meta: {
          title: 'Admin Login | Razo Wild',
          description: 'Sign in to the Razo Wild admin portal.',
          noindex: true,
        },
      },
      {
        path: 'login/admin',
        redirect: '/admin/login',
      },
      {
        path: 'register',
        name: 'Signup',
        component: Signup,
        meta: {
          title: 'Create Account | Razo Wild',
          description: 'Create your Razo Wild account to manage orders and checkout faster.',
          noindex: true,
        },
      },
      {
        path: 'signup',
        redirect: '/register',
      },
      {
        path: 'account',
        name: 'Account',
        component: Account,
        meta: {
          requiresAuth: true,
          title: 'My Account | Razo Wild',
          description: 'Manage your Razo Wild account settings and order history.',
          noindex: true,
        },
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: Checkout,
        meta: {
          requiresAuth: true,
          title: 'Checkout | Razo Wild',
          description: 'Complete your order securely on Razo Wild.',
          noindex: true,
        },
      },
      {
        path: 'order-confirmation/:orderId',
        name: 'OrderConfirmation',
        component: OrderConfirmation,
        meta: {
          title: 'Order Confirmation | Razo Wild',
          description: 'Review your order confirmation details.',
          noindex: true,
        },
      },
      {
        path: 'shipping-returns',
        name: 'ShippingReturns',
        component: ShippingReturns,
        meta: {
          title: 'Shipping and Returns | Razo Wild',
          description: 'Read Razo Wild shipping timelines and return policy information.',
        },
      },
      {
        path: 'privacy-policy',
        name: 'PrivacyPolicy',
        component: PrivacyPolicy,
        meta: {
          title: 'Privacy Policy | Razo Wild',
          description: 'Review how Razo Wild collects, uses, and protects your information.',
        },
      },
      {
        path: 'terms-conditions',
        name: 'TermsConditions',
        component: TermsConditions,
        meta: {
          title: 'Terms and Conditions | Razo Wild',
          description: 'Read Razo Wild terms and conditions for using the site and services.',
        },
      },
      {
        path: 'track-order',
        name: 'TrackOrder',
        component: TrackOrder,
        meta: {
          title: 'Track Order | Razo Wild',
          description: 'Track your Razo Wild order status and delivery progress.',
          noindex: true,
        },
      },
    ],
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: {
          title: 'Admin Dashboard | Razo Wild',
          description: DEFAULT_DESCRIPTION,
          noindex: true,
        },
      },
      {
        path: 'products/:id/edit',
        name: 'AdminProductEdit',
        component: AdminProductEdit,
        meta: {
          title: 'Admin Product Edit | Razo Wild',
          description: DEFAULT_DESCRIPTION,
          noindex: true,
        },
      },
      {
        path: 'products/uncategorized',
        name: 'AdminUncategorizedProducts',
        component: AdminUncategorizedProducts,
      },
      {
        path: 'categories/manager',
        name: 'CategoryManager',
        component: CategoryManager,
      },
      {
        path: 'products/category-mover',
        name: 'ProductCategoryMover',
        component: ProductCategoryMover,
      },
      {
        path: 'orders/export-manager',
        name: 'AdminOrderExportManager',
        component: AdminOrderExportManager,
      },
      {
        path: 'tax',
        name: 'TaxManagement',
        component: TaxManagement,
        meta: {
          title: 'Tax Management | Razo Wild',
          noindex: true,
        },
      },
      {
        path: 'shipping',
        name: 'ShippingManagement',
        component: ShippingManagement,
        meta: {
          title: 'Shipping Management | Razo Wild',
          noindex: true,
        },
      },
      {
        path: 'drop-shippers',
        name: 'DropShippersManagement',
        component: DropShippersManagement,
        meta: {
          title: 'Drop Shippers | Razo Wild',
          noindex: true,
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: 'Page Not Found | Razo Wild',
      description: DEFAULT_DESCRIPTION,
      noindex: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function decodeJwtPayload(token) {
  try {
    const payloadPart = String(token || '').split('.')[1] || ''
    if (!payloadPart) {
      return null
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payloadJson = atob(padded)
    return JSON.parse(payloadJson)
  } catch (_error) {
    return null
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token)
  const exp = Number(payload?.exp || 0)
  if (!exp) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  return exp <= now
}

function clearStoredAuth() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authRole')
  localStorage.removeItem('adminApiToken')
}

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((record) => Boolean(record.meta?.requiresAuth))
  const requiresAdmin = to.matched.some((record) => Boolean(record.meta?.requiresAdmin))
  const authStore = useAuthStore()
  const authToken = String(localStorage.getItem('authToken') || '').trim()
  const adminApiToken = String(localStorage.getItem('adminApiToken') || '').trim()
  const authTokenExpired = isTokenExpired(authToken)
  const adminTokenExpired = isTokenExpired(adminApiToken)

  if ((authToken && authTokenExpired) || (adminApiToken && adminTokenExpired)) {
    clearStoredAuth()
  }

  if (requiresAdmin && (!authStore.isAdmin || !adminApiToken || !authToken || authTokenExpired || adminTokenExpired)) {
    return {
      name: 'AdminLogin',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (!requiresAuth) {
    return true
  }

  if (authStore.isLoggedIn && authToken && !authTokenExpired) {
    return true
  }

  return {
    name: requiresAdmin ? 'AdminLogin' : 'Login',
    query: {
      redirect: to.fullPath,
    },
  }
})

router.afterEach((to) => {
  if (to.name === 'ProductDetail') {
    return
  }

  applyPageSeo({
    title: to.meta?.title || 'Razo Wild - Camping Gear E-commerce',
    description: to.meta?.description || DEFAULT_DESCRIPTION,
    path: to.fullPath,
    noindex: Boolean(to.meta?.noindex),
  })
})

export default router