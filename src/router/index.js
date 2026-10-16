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
			path: '/inventory/:name/:sku',
			name: 'inventory-item',
			component: () => import('../views/InventoryItemView.vue'),
			meta: {
				showFooterCTA: false
			}
		},
		{
			path: '/admin/login',
			name: 'admin-login',
			component: () => import('../views/admin/AdminLoginView.vue')
		},
		{
			path: '/admin',
			name: 'admin',
			component: () => import('../views/admin/AdminView.vue'),
			meta: { requiresAdmin: true }
		},
		{
			path: '/admin',
			component: () => import('../views/admin/AdminLayout.vue'),
			meta: { requiresAdmin: true },
			children: [
				{
					path: '',
					name: 'admin',
					component: () => import('../views/admin/AdminView.vue')
				},
				{
					path: '/admin/inventory',
					name: 'admin-inventory',
					component: () => import('../views/admin/InventoryView.vue')
				},
				...[
					'brands',
					'customers',
					'inventory-attribute-values',
					'inventory-attributes',
					'inventory-images',
					'inventory-types',
					'service-tickets'
				].map(table => ({
					path: table,
					name: `admin-${table}`,
					component: () => import('../views/admin/AdminPlaceholder.vue'),
					props: { table }
				}))
			]
		}

	],
})

router.beforeEach(async (to) => {
	if (!to.meta.requiresAdmin && to.name !== 'admin-login') {
		return true;
  	}

  	try {
		const response = await fetch('/api/admin/session', {
			credentials: 'same-origin'
		});

		if (response.ok) {
			if (to.name === 'admin-login') {
				return { name: 'admin' };
			}
			return true;
		}
	} catch {
		// Treat network errors as unauthenticated.
	}

	if (to.meta.requiresAdmin) {
		return { name: 'admin-login' };
	}

	return true;
});

export default router
