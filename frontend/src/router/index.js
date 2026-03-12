import { createRouter, createWebHistory } from 'vue-router'
import StorefrontLayout from '../layouts/StorefrontLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import Home from '../views/store/Home.vue'
import Products from '../views/store/Products.vue'
import ProductDetail from '../views/store/ProductDetail.vue'
import Cart from '../views/store/Cart.vue'
import Login from '../views/store/Login.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import Signup from '../views/store/Signup.vue'
import Account from '../views/store/Account.vue'
import Checkout from '../views/store/Checkout.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminProductEdit from '../views/admin/AdminProductEdit.vue'
import AdminUncategorizedProducts from '../views/admin/AdminUncategorizedProducts.vue'
import CategoryManager from '../views/admin/CategoryManager.vue'
import ProductCategoryMover from '../views/admin/ProductCategoryMover.vue'
import OrderConfirmation from '../views/store/OrderConfirmation.vue'
import AdminOrderExportManager from '../views/admin/AdminOrderExportManager.vue'
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
        path: '',
        name: 'Home',
        component: Home,
        meta: {
          title: 'Camptime | Camping Gear and Outdoor Essentials',
          description: 'Find premium tents, sleeping bags, camp furniture, and outdoor gear at Camptime.',
        },
      },
      {
        path: 'products',
        name: 'Products',
        component: Products,
        meta: {
          title: 'Shop Camping Products | Camptime',
          description: 'Browse the Camptime catalog of camping products, outdoor equipment, and travel essentials.',
        },
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: ProductDetail,
        meta: {
          title: 'Product Details | Camptime',
          description: 'View product features, specifications, packaging, shipping, and availability on Camptime.',
        },
      },
      {
        path: 'cart',
        name: 'Cart',
        component: Cart,
        meta: {
          title: 'Your Cart | Camptime',
          description: 'Review items in your cart before checkout.',
          noindex: true,
        },
      },
      {
        path: 'login',
        name: 'Login',
        component: Login,
        meta: {
          title: 'Login | Camptime',
          description: 'Sign in to your Camptime account.',
          noindex: true,
        },
      },
      {
        path: 'admin/login',
        name: 'AdminLogin',
        component: AdminLogin,
        meta: {
          title: 'Admin Login | Camptime',
          description: 'Sign in to the Camptime admin portal.',
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
          title: 'Create Account | Camptime',
          description: 'Create your Camptime account to manage orders and checkout faster.',
          noindex: true,
        },
      },
      {
        path: 'account',
        name: 'Account',
        component: Account,
        meta: {
          requiresAuth: true,
          title: 'My Account | Camptime',
          description: 'Manage your Camptime account settings and order history.',
          noindex: true,
        },
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: Checkout,
        meta: {
          requiresAuth: true,
          title: 'Checkout | Camptime',
          description: 'Complete your order securely on Camptime.',
          noindex: true,
        },
      },
      {
        path: 'order-confirmation/:orderId',
        name: 'OrderConfirmation',
        component: OrderConfirmation,
        meta: {
          title: 'Order Confirmation | Camptime',
          description: 'Review your order confirmation details.',
          noindex: true,
        },
      },
      {
        path: 'shipping-returns',
        name: 'ShippingReturns',
        component: ShippingReturns,
        meta: {
          title: 'Shipping and Returns | Camptime',
          description: 'Read Camptime shipping timelines and return policy information.',
        },
      },
      {
        path: 'privacy-policy',
        name: 'PrivacyPolicy',
        component: PrivacyPolicy,
        meta: {
          title: 'Privacy Policy | Camptime',
          description: 'Review how Camptime collects, uses, and protects your information.',
        },
      },
      {
        path: 'terms-conditions',
        name: 'TermsConditions',
        component: TermsConditions,
        meta: {
          title: 'Terms and Conditions | Camptime',
          description: 'Read Camptime terms and conditions for using the site and services.',
        },
      },
      {
        path: 'track-order',
        name: 'TrackOrder',
        component: TrackOrder,
        meta: {
          title: 'Track Order | Camptime',
          description: 'Track your Camptime order status and delivery progress.',
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
          title: 'Admin Dashboard | Camptime',
          description: DEFAULT_DESCRIPTION,
          noindex: true,
        },
      },
      {
        path: 'products/:id/edit',
        name: 'AdminProductEdit',
        component: AdminProductEdit,
        meta: {
          title: 'Admin Product Edit | Camptime',
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
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((record) => Boolean(record.meta?.requiresAuth))
  const requiresAdmin = to.matched.some((record) => Boolean(record.meta?.requiresAdmin))
  const authStore = useAuthStore()

  if (requiresAdmin && !authStore.isAdmin) {
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

  if (authStore.isLoggedIn) {
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
    title: to.meta?.title || 'Camptime - Camping Gear E-commerce',
    description: to.meta?.description || DEFAULT_DESCRIPTION,
    path: to.fullPath,
    noindex: Boolean(to.meta?.noindex),
  })
})

export default router