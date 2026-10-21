<template>
	<div class="admin-layout">
		<aside class="admin-sidebar">
			<h2>Administration</h2>

			<nav>
				<RouterLink to="/admin" exact-active-class="active">
					Dashboard
				</RouterLink>

				<div class="nav-heading">Business</div>

				<RouterLink to="/admin/customers">Customers</RouterLink>
				<RouterLink to="/admin/service-tickets">Service Tickets</RouterLink>
				<RouterLink to="/admin/inventory-sales">Inventory Sales</RouterLink>

				<div class="nav-heading">Inventory</div>

				<RouterLink to="/admin/inventory">Inventory</RouterLink>
				<RouterLink to="/admin/brands">Brands</RouterLink>
				<RouterLink to="/admin/inventory-types">Inventory Types</RouterLink>
				<RouterLink to="/admin/inventory-images">Inventory Images</RouterLink>
				<RouterLink to="/admin/inventory-attributes">Inventory Attributes</RouterLink>
				<RouterLink to="/admin/inventory-attribute-values">Attribute Values</RouterLink>
				<RouterLink to="/admin/standard-charges">Standard Charges</RouterLink>
			</nav>

			<button class="logout" @click="logout">Log Out</button>
		</aside>

		<main class="admin-content">
			<RouterView />
		</main>
	</div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

async function logout() {
	const response = await fetch('/api/admin/logout', {
		method: 'POST',
		credentials: 'same-origin'
	});

	if (response.ok) {
		router.replace('/admin/login');
	}
}
</script>

<style scoped>
.admin-layout {
	display: flex;
	min-height: 100vh;
}

.admin-sidebar {
	width: 250px;
	flex-shrink: 0;
	padding: 24px 16px;
	background: #202631;
	color: white;
	display: flex;
	flex-direction: column;
}

.admin-sidebar h2 {
	font-size: 20px;
	margin-bottom: 28px;
}

.admin-sidebar nav {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.admin-sidebar a {
	padding: 10px 12px;
	color: #cbd5e1;
	text-decoration: none;
	border-radius: 6px;
}

.admin-sidebar a:hover,
.admin-sidebar a.active {
	background: #374151;
	color: white;
}

.nav-heading {
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 1px;
	color: #94a3b8;
	margin: 22px 12px 8px;
}

.logout {
	margin-top: auto;
	padding: 10px;
	background: transparent;
	color: white;
	border: 1px solid #64748b;
	border-radius: 6px;
	cursor: pointer;
}

.admin-content {
	flex: 1;
	min-width: 0;
	padding: 32px;
	background: #f8fafc;
	color: #1e293b;
}

@media (max-width: 700px) {
	.admin-layout {
		flex-direction: column;
	}

	.admin-sidebar {
		width: 100%;
	}
}
</style>
