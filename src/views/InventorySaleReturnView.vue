
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
				Loading return receipt...
			</p>
		</div>

		<div v-else-if="error" class="alert alert-warning">
			<h1 class="h5">Return Receipt Unavailable</h1>
			<p class="mb-0">{{ error }}</p>
		</div>

		<template v-else-if="receipt">
			<ReceiptHeader
				:title="`${hasRefund ? 'Refund Receipt' : 'Return Confirmation'} #${receipt.return_id}`"
				:date="receipt.return_date"
				:date-label="hasRefund ? 'Refund Date' : 'Return Date'"
				:status="hasRefund ? 'Refund Receipt' : 'Return Receipt'"
				status-class="bg-success"
			/>

			<section class="card mb-4">
				<div class="card-body">
					<h2 class="h4 mb-2">
						{{ hasRefund ? 'Return / Refund Details' : 'Equipment Return Details' }}
					</h2>

					<p class="text-muted mb-4">
						Original Sale:
						<RouterLink :to="originalSaleUrl">
							#{{ receipt.sale_number }}
						</RouterLink>
					</p>

					<div class="table-responsive">
						<table class="table table-bordered align-middle mb-0 refund-table">
							<thead class="table-light">
								<tr>
									<th>Equipment</th>
									<th>Physically Returned</th>
									<th class="text-end">
										Refund Amount
									</th>
								</tr>
							</thead>

							<tbody>
								<tr
									v-for="(item, index) in receipt.items"
									:key="index"
								>
									<td>
										<div class="fw-semibold">
											{{ item.inventory_name }}
										</div>

										<div class="small text-muted">
											SKU: {{ item.sku }}
										</div>
									</td>

									<td>
										{{ Number(item.physically_returned) === 1
											? 'Yes' : 'No' }}
									</td>

									<td class="text-end text-nowrap">
										{{ currency(item.refund_total) }}
									</td>
								</tr>

								<tr class="table-footer">
									<td colspan="2">
										Refund Subtotal
									</td>
									<td class="text-end text-nowrap">
										{{ currency(receipt.refund_subtotal) }}
									</td>
								</tr>

								<tr class="table-footer">
									<td colspan="2">
										Sales Tax Refunded
									</td>
									<td class="text-end text-nowrap">
										{{ currency(receipt.refund_sales_tax) }}
									</td>
								</tr>

								<tr class="table-primary">
									<th colspan="2" class="fs-5">
										Total Refunded
									</th>
									<th class="text-end text-nowrap fs-5">
										{{ currency(receipt.refund_total) }}
									</th>
								</tr>
							</tbody>
						</table>
					</div>

					<p
						v-if="hasRefund && hasRefundMethod"
						class="small text-muted mt-3 mb-0"
					>
						Refund Method: {{ receipt.refund_method }}
					</p>

					<p
						v-if="!hasRefund"
						class="small text-muted mt-3 mb-0"
					>
						Equipment return recorded without a
						monetary refund.
					</p>
				</div>
			</section>

			<ReceiptThankYou>
				Thank you for giving us the opportunity to
				address your concern.

				<template #follow-up>
					If you have any questions about this
					return or refund, please don't hesitate
					to reach out.
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

const receipt = ref(null);
const loading = ref(true);
const error = ref('');

const hasRefund = computed(() =>
	Number(receipt.value?.refund_total ?? 0) > 0
);

const hasRefundMethod = computed(() => {
	const method = receipt.value?.refund_method;

	return Boolean(method) &&
		method.toLowerCase() !== 'not specified';
});

const originalSaleUrl = computed(() => {
	if (!receipt.value) return '/';

	return `/inventory-sales/${
		encodeURIComponent(receipt.value.sale_number)
	}/${
		encodeURIComponent(receipt.value.sale_token)
	}`;
});

function currency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(Number(value ?? 0));
}

function printReceipt() {
	window.print();
}

async function loadReceipt() {
	loading.value = true;
	error.value = '';
	receipt.value = null;

	try {
		const returnId = encodeURIComponent(
			String(route.params.returnId)
		);

		const token = encodeURIComponent(
			String(route.params.token)
		);

		const response = await fetch(
			`/api/inventory-sale-returns/${returnId}/${token}`,
			{ cache: 'no-store' }
		);

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(
					'This receipt is unavailable or the link is invalid.'
				);
			}

			throw new Error('Unable to load return receipt.');
		}

		receipt.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
}

watch(
	() => [route.params.returnId, route.params.token],
	loadReceipt,
	{ immediate: true }
);
</script>

<style scoped>
.refund-table td,
.refund-table th {
	border-color: var(--bs-border-color);
	border-left: none;
	border-right: none;
}

.refund-table {
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
