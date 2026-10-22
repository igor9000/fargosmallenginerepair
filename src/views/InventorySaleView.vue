
<template>
	<main
		class="container py-4 py-md-5"
		style="max-width: 960px"
	>
		<div v-if="loading" class="text-center py-5">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>

			<p class="text-muted mt-3">
				Loading sales receipt...
			</p>
		</div>

		<div v-else-if="error" class="alert alert-warning">
			<h1 class="h5">Sales Receipt Unavailable</h1>
			<p class="mb-0">{{ error }}</p>
		</div>

		<template v-else-if="sale">
			<ReceiptHeader
				:title="`Sale #${sale.sale_number}`"
				:date="sale.sale_date"
				date-label="Sale Date"
				status="Paid"
				status-class="bg-success"
			/>

			<section class="card mb-4">
				<div class="card-body">
					<h2 class="h4 mb-3">
						Equipment Purchase
					</h2>

					<div class="table-responsive">
						<table
							class="table table-bordered align-middle mb-0 charges-table"
						>
							<thead class="table-light">
								<tr>
									<th>Description</th>
									<th class="text-end">Qty</th>
									<th class="text-end">Price</th>
									<th class="text-end">Amount</th>
								</tr>
							</thead>

							<tbody>
								<tr v-for="(item, index) in sale.items" :key="index">
									<td>
										<div class="fw-semibold">
											{{ item.inventory_name }}
										</div>

										<div class="small text-muted">
											SKU: {{ item.sku }}
										</div>
									</td>

									<td class="text-end">1</td>

									<td class="text-end text-nowrap">
										{{ currency(item.subtotal) }}
									</td>

									<td class="text-end text-nowrap">
										{{ currency(item.subtotal) }}
									</td>
								</tr>

								<tr class="table-footer">
									<td colspan="3">Subtotal</td>
									<td class="text-end text-nowrap">
										{{ currency(sale.subtotal) }}
									</td>
								</tr>

								<tr class="table-footer">
									<td colspan="3">
										Sales Tax
									</td>
									<td class="text-end text-nowrap">
										{{ currency(sale.sales_tax) }}
									</td>
								</tr>

								<tr class="table-primary">
									<th colspan="3" class="fs-5">
										Total Paid
									</th>

									<th class="text-end text-nowrap fs-5">
										{{ currency(sale.total) }}
									</th>
								</tr>
							</tbody>
						</table>
					</div>

					<p
						v-if="hasPaymentMethod"
						class="small text-muted mt-3 mb-0"
					>
						Payment Method: {{ sale.payment_method }}
					</p>
				</div>
			</section>

			<ReceiptThankYou>
				Thank you for supporting my small business.
				I appreciate your purchase and the trust
				you've placed in me.

				<template #follow-up>
					If you have any questions about your equipment,
					please don't hesitate to reach out.
				</template>
			</ReceiptThankYou>

			<div class="text-center mb-4 print-actions">
				<button
					type="button"
					class="btn btn-outline-secondary"
					@click="printReceipt"
				>
					Print Receipt
				</button>
			</div>
		</template>
	</main>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import ReceiptHeader from '../components/receipts/ReceiptHeader.vue';
import ReceiptThankYou from '../components/receipts/ReceiptThankYou.vue';

const route = useRoute();

const sale = ref(null);
const loading = ref(true);
const error = ref('');

const hasPaymentMethod = computed(() => {
	const method = sale.value?.payment_method;

	return Boolean(method) &&
		method.toLowerCase() !== 'not specified';
});

function formatDate(value) {
	if (!value) return '';

	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'America/Chicago'
	}).format(new Date(value));
}

function currency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(Number(value));
}

function printReceipt() {
	window.print();
}

async function loadSale() {
	loading.value = true;
	error.value = '';
	sale.value = null;

	try {
		const number = encodeURIComponent(
			String(route.params.saleNumber)
		);

		const token = encodeURIComponent(
			String(route.params.token)
		);

		const response = await fetch(
			`/api/inventory-sales/${number}/${token}`,
			{ cache: 'no-store' }
		);

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(
					'This receipt is unavailable or the link is invalid.'
				);
			}

			throw new Error('Unable to load sales receipt.');
		}

		sale.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
}

watch(
	() => [route.params.saleNumber, route.params.token],
	loadSale,
	{ immediate: true }
);
</script>

<style scoped>
.charges-table td,
.charges-table th {
	border-color: var(--bs-border-color);
	border-left: none;
	border-right: none;
}

.charges-table {
	border-left: 1px solid var(--bs-border-color);
	border-right: 1px solid var(--bs-border-color);
}

.table-footer > td {
	--bs-table-bg: var(--bs-light);
	background-color: var(--bs-table-bg);
}

@media print {
	.print-actions {
		display: none;
	}
}
</style>
