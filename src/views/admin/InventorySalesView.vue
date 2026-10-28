
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
						<th class="text-end pe-5">Total</th>
						<th>Adjustments</th>
						<th>Receipt</th>
						<th>Actions</th>
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
							<div
								v-for="item in sale.items"
								:key="item.inventory_id"
								class="mb-1"
							>
								{{ item.name }}
								<div class="small text-muted">
									SKU: {{ item.sku }}
								</div>
							</div>
						</td>

						<td>{{ formatDate(sale.sale_date) }}</td>

						<td class="text-end fw-semibold pe-5">
							{{ currency(sale.total) }}
						</td>

						<td>
							<!-- Financial refund status -->
							<div v-if="Number(sale.refunded_total) > 0">
								<span
									class="badge"
									:class="
										Number(sale.refunded_total) >= Number(sale.total)
											? 'bg-success'
											: 'bg-warning text-dark'
									"
								>
									{{
										Number(sale.refunded_total) >= Number(sale.total)
											? 'Fully refunded'
											: 'Partial refund'
									}}
								</span>

								<div class="small text-muted mt-1">
									{{ currency(sale.refunded_total) }} refunded
								</div>
							</div>
							<!-- No returns or refunds -->
							<div
								v-if="
									Number(sale.refunded_total) === 0 &&
									Number(sale.returned_item_count) === 0
								"
							>
								&mdash;
							</div>
						</td>


						<td>
							<a
								:href="`/inventory-sales/${sale.sale_number}/${sale.token}`"
								class="btn btn-sm btn-outline-primary"
								target="_blank"
								rel="noopener noreferrer"
							>
								View Receipt
							</a>
						</td>

						<td>
							<RouterLink
								:to="`/admin/inventory-sales/${sale.id}/edit`"
								class="btn btn-sm btn-outline-primary"
							>
								Edit
							</RouterLink>

							<RouterLink
								:to="`/admin/inventory-sales/${sale.id}/refunds/new`"
								class="btn btn-sm btn-outline-secondary ms-2"
							>
								Return / Refund
							</RouterLink>
						</td>
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
import { useHead } from '@unhead/vue';

const sales = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');
const numberConflict = ref('');

useHead(() => ({
	title: `FSER Admin - Sales List`
}));

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
			...(sale.items ?? []).flatMap(item => [
				item.name,
				item.sku
			]),
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
