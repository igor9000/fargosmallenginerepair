import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/about',
			name: 'about',
			component: () => import('../views/AboutView.vue'),
		},
		{
			path: '/contact',
			name: 'contact',
			component: () => import('../views/ContactView.vue'),
			meta: {
				showFooterCTA: false
			}
		},
		{
			path: '/services',
			name: 'services',
			component: () => import('../views/ServicesView.vue')
		},
		{
			path: '/inventory',
			name: 'inventory',
			component: () => import('../views/InventoryView.vue')
		},
		{
			path: '/inventory/:sku',
			name: 'inventory-item',
			component: () => import('../views/InventoryItemView.vue'),
			meta: {
				showFooterCTA: false
			}
		}
	],
})

export default router
