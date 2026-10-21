
<template>
	<section>
		<div class="d-flex justify-content-between align-items-center mb-4">
			<div>
				<h1>Inventory Sales</h1>
				<span class="text-muted">
					{{ filteredSales.length }} sales
				</span>
			</div>

			<RouterLink
				to="/admin/inventory-sales/new"
				class="btn btn-primary"
			>
				Record Sale
			</RouterLink>
		</div>

		<input
			v-model="search"
			class="form-control mb-3"
			placeholder="Search sale number, customer, equipment, or SKU..."
		/>

		<div v-if="error" class="alert alert-danger">
			{{ error }}
		</div>

		<p v-if="loading">Loading inventory sales...</p>

		<div v-else class="table-responsive">
			<table class="table table-striped table-hover align-middle">
				<thead>
					<tr>
						<th>Sale #</th>
						<th>Customer</th>
						<th>Equipment</th>
						<th>Sale Date</th>
						<th class="text-end">Subtotal</th>
						<th class="text-end">Tax</th>
						<th class="text-end">Total</th>
						<th>Payment</th>
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="sale in filteredSales"
						:key="sale.id"
					>
						<td>{{ sale.sale_number }}</td>

						<td>
							{{ customerName(sale) }}
							<div class="small text-muted">
								Customer #{{ sale.customer_external_id }}
							</div>
						</td>

						<td>
							{{ sale.inventory_name }}
							<div class="small text-muted">
								SKU: {{ sale.sku }}
							</div>
						</td>

						<td>{{ formatDate(sale.sale_date) }}</td>

						<td class="text-end">
							{{ currency(sale.subtotal) }}
						</td>

						<td class="text-end">
							{{ currency(sale.sales_tax) }}
						</td>

						<td class="text-end fw-semibold">
							{{ currency(sale.total) }}
						</td>

						<td>{{ sale.payment_method }}</td>
					</tr>

					<tr v-if="filteredSales.length === 0">
						<td colspan="8" class="text-center py-4">
							No inventory sales found.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const sales = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');

function customerName(sale) {
	return [sale.first_name, sale.last_name]
		.filter(Boolean)
		.join(' ');
}

function formatDate(value) {
	if (!value) return '—';

	return new Date(value).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'America/Chicago'
	});
}

function currency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(Number(value));
}

const filteredSales = computed(() => {
	const query = search.value.trim().toLowerCase();

	if (!query) return sales.value;

	return sales.value.filter(sale =>
		[
			sale.sale_number,
			sale.inventory_name,
			sale.sku,
			customerName(sale),
			sale.customer_external_id
		].some(value =>
			String(value ?? '').toLowerCase().includes(query)
		)
	);
});

onMounted(async () => {
	try {
		const response = await fetch('/api/admin/inventory-sales', {
			credentials: 'same-origin'
		});

		if (!response.ok) {
			throw new Error('Unable to load inventory sales');
		}

		sales.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
});
</script>
