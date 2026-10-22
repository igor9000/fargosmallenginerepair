
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
			<header class="mb-4">
				<div class="row align-items-start">
					<div class="col-4 col-lg-6">
						<img
							src="/logo-square.png"
							alt="Fargo Small Engine Repair"
							class="img-fluid mb-3"
							style="max-height: 250px"
						/>
					</div>

					<div class="col-8 col-lg-6 text-end">
						<h1 class="h2 mb-1">
							Sale #{{ sale.sale_number }}
						</h1>

						<p class="text-muted small mb-2">
							Sale Date: {{ formatDate(sale.sale_date) }}
						</p>

						<span class="badge bg-success fs-6">
							Paid
						</span>

						<div class="d-flex flex-column gap-1 mt-3">
							<div>701-491-8696</div>
							<div>adam@fargosmallenginerepair.com</div>
							<div>www.fargosmallenginerepair.com</div>
						</div>
					</div>
				</div>
			</header>

			<section class="card mb-4">
				<div class="card-body">
					<h2 class="h5 mb-3">Sold To</h2>

					<div class="fw-semibold">
						{{ customerName }}
					</div>
				</div>
			</section>

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
								<tr>
									<td>
										<div class="fw-semibold">
											{{ sale.inventory_name }}
										</div>

										<div class="small text-muted">
											SKU: {{ sale.sku }}
										</div>
									</td>

									<td class="text-end">1</td>

									<td class="text-end text-nowrap">
										{{ currency(sale.subtotal) }}
									</td>

									<td class="text-end text-nowrap">
										{{ currency(sale.subtotal) }}
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
										({{ Number(sale.tax_rate) }}%)
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

			<section class="card mb-4">
				<div class="card-body p-4">
					<h2 class="h5 mb-3">
						Thank You for Your Business!
					</h2>

					<p class="mb-2">
						Thank you for supporting my small business.
						I appreciate your purchase and the trust
						you've placed in me.
					</p>

					<p class="mb-3">
						If you have any questions about your
						equipment, please don't hesitate to
						reach out.
					</p>

					<div class="mt-4">
						<p class="mb-2">Sincerely,</p>

						<img
							src="/signature.svg"
							alt="Adam's signature"
							class="d-block mb-1"
							style="width: 180px; max-width: 100%; height: auto"
						/>

						<div class="fw-semibold">Adam</div>

						<div class="text-muted small">
							701-491-8696
						</div>

						<div class="text-muted small">
							Fargo Small Engine Repair
						</div>
					</div>
				</div>
			</section>

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

const route = useRoute();

const sale = ref(null);
const loading = ref(true);
const error = ref('');

const customerName = computed(() => {
	if (!sale.value) return '';

	return [
		sale.value.first_name,
		sale.value.last_name
	].filter(Boolean).join(' ');
});

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
