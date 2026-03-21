import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import {
	initTheme,
} from './utils/theme'
import './assets/styles/main.scss'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const adminMutationPathMatchers = [
	/^\/api\/products(?:\/|$)/,
	/^\/api\/categories(?:\/|$)/,
	/^\/api\/admin(?:\/|$)/,
	/^\/api\/orders\/export\/doba$/,
	/^\/api\/orders\/lifecycle\/update$/,
]

const readOnlyMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

const isProtectedAdminMutationRequest = (input, init = {}) => {
	const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
	if (readOnlyMethods.has(method)) {
		return false
	}

	const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : ''

	let pathname = ''
	try {
		pathname = new URL(requestUrl, window.location.origin).pathname
	} catch {
		return false
	}

	return adminMutationPathMatchers.some((matcher) => matcher.test(pathname))
}

const getRequestPathname = (input) => {
	const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : ''

	try {
		return new URL(requestUrl, window.location.origin).pathname
	} catch {
		return ''
	}
}

const isAdminApiRequest = (input) => {
	const pathname = getRequestPathname(input)
	if (!pathname.startsWith('/api/')) {
		return false
	}

	if (pathname === '/api/auth/admin/login' || pathname === '/api/auth/login') {
		return false
	}

	return adminMutationPathMatchers.some((matcher) => matcher.test(pathname))
}

const clearStoredSession = () => {
	localStorage.removeItem('authToken')
	localStorage.removeItem('authRole')
	localStorage.removeItem('adminApiToken')
}

const originalFetch = window.fetch.bind(window)
window.fetch = async (input, init = {}) => {
	if (!isProtectedAdminMutationRequest(input, init)) {
		const response = await originalFetch(input, init)
		if (response.status === 401 && isAdminApiRequest(input)) {
			clearStoredSession()
			const currentPath = String(router.currentRoute.value?.fullPath || '/admin')
			if (currentPath !== '/admin/login') {
				router.push({
					name: 'AdminLogin',
					query: { redirect: currentPath },
				})
			}
		}
		return response
	}

	const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
	const authToken = String(localStorage.getItem('authToken') || '').trim()
	const adminToken = String(localStorage.getItem('adminApiToken') || import.meta.env.VITE_ADMIN_API_TOKEN || '').trim()

	if (adminToken && !headers.has('x-admin-token')) {
		headers.set('x-admin-token', adminToken)
	}

	if (authToken && !headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${authToken}`)
	}

	if (input instanceof Request) {
		const request = new Request(input, {
			...init,
			headers,
		})
		const response = await originalFetch(request)
		if (response.status === 401 && isAdminApiRequest(request)) {
			clearStoredSession()
			const currentPath = String(router.currentRoute.value?.fullPath || '/admin')
			if (currentPath !== '/admin/login') {
				router.push({
					name: 'AdminLogin',
					query: { redirect: currentPath },
				})
			}
		}
		return response
	}

	const response = await originalFetch(input, {
		...init,
		headers,
	})

	if (response.status === 401 && isAdminApiRequest(input)) {
		clearStoredSession()
		const currentPath = String(router.currentRoute.value?.fullPath || '/admin')
		if (currentPath !== '/admin/login') {
			router.push({
				name: 'AdminLogin',
				query: { redirect: currentPath },
			})
		}
	}

	return response
}

const app = createApp(App)

initTheme()

app.use(createPinia())
app.use(router)

app.mount('#app')