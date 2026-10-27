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
			component: () => import('../views/InventoryLandingView.vue')
		},
		{
			path: '/inventory/:typeSlug',
			name: 'inventory-type',
			component: () => import('../views/InventoryView.vue')
		},
		{
			path: '/inventory/:typeSlug',
			name: 'inventory-type',
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
			path: '/service-tickets/:ticketNumber/:token',
			name: 'public-service-ticket',
			component: () => import('../views/ServiceTicketView.vue'),
			meta: {
				showFooterCTA: false
			}
		},
		{
			path: '/inventory-sales/:saleNumber/:token',
			name: 'public-inventory-sale',
			component: () => import('../views/InventorySaleView.vue'),
			meta: {
				showFooterCTA: false
			}
		},
		{
			path: '/inventory-sale-returns/:returnId/:token',
			name: 'public-inventory-sale-return',
			component: () => import('../views/InventorySaleReturnView.vue'),
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
					path: 'inventory',
					name: 'admin-inventory',
					component: () => import('../views/admin/InventoryView.vue')
				},
				{
					path: 'inventory/new',
					name: 'admin-inventory-new',
					component: () => import('../views/admin/InventoryCreateView.vue')
				},
				{
					path: 'inventory/:id/edit',
					name: 'admin-inventory-edit',
					component: () => import('../views/admin/InventoryCreateView.vue')
				},
				{
					path: 'customers',
					name: 'admin-customers',
					component: () => import('../views/admin/CustomersView.vue')
				},
				{
					path: 'customers/new',
					name: 'admin-customers-new',
					component: () => import('../views/admin/CustomerFormView.vue')
				},
				{
					path: 'customers/:id/edit',
					name: 'admin-customers-edit',
					component: () => import('../views/admin/CustomerFormView.vue')
				},
				{
					path: 'service-tickets',
					name: 'admin-service-tickets',
					component: () => import('../views/admin/ServiceTicketsView.vue')
				},
				{
					path: 'service-tickets/new',
					name: 'admin-service-tickets-new',
					component: () => import('../views/admin/ServiceTicketFormView.vue')
				},
				{
					path: 'service-tickets/:id/edit',
					name: 'admin-service-tickets-edit',
					component: () => import('../views/admin/ServiceTicketFormView.vue')
				},
				{
					path: 'standard-charges',
					name: 'admin-standard-charges',
					component: () => import('../views/admin/StandardChargesView.vue')
				},
				{
					path: 'standard-charges/new',
					name: 'admin-standard-charges-new',
					component: () => import('../views/admin/StandardChargeFormView.vue')
				},
				{
					path: 'standard-charges/:id/edit',
					name: 'admin-standard-charges-edit',
					component: () => import('../views/admin/StandardChargeFormView.vue')
				},
				{
					path: 'inventory-sales',
					name: 'admin-inventory-sales',
					component: () => import('../views/admin/InventorySalesView.vue')
				},
				{
					path: 'inventory-sales/:id/edit',
					name: 'admin-inventory-sales-edit',
					component: () => import('../views/admin/InventorySaleFormView.vue')
				},
				{
					path: 'inventory-sales/new',
					name: 'admin-inventory-sales-new',
					component: () => import('../views/admin/InventorySaleFormView.vue')
				},
				{
					path: 'inventory-sales/:id/refunds/new',
					name: 'admin-inventory-sale-refund-new',
					component: () => import(
						'../views/admin/InventorySaleReturnFormView.vue'
					)
				},
				...[
					'brands',
					'inventory-attribute-values',
					'inventory-attributes',
					'inventory-images',
					'inventory-types'
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
