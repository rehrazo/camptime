import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
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

const originalFetch = window.fetch.bind(window)
window.fetch = (input, init = {}) => {
	if (!isProtectedAdminMutationRequest(input, init)) {
		return originalFetch(input, init)
	}

	const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
	const authToken = String(localStorage.getItem('authToken') || '').trim()
	const adminToken = String(localStorage.getItem('adminApiToken') || import.meta.env.VITE_ADMIN_API_TOKEN || authToken).trim()

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
		return originalFetch(request)
	}

	return originalFetch(input, {
		...init,
		headers,
	})
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')