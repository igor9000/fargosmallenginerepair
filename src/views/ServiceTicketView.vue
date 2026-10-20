
<template>
	<main class="container py-4 py-md-5" style="max-width: 960px">
		<div v-if="loading" class="text-center py-5">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
			<p class="text-muted mt-3">Loading service report...</p>
		</div>

		<div v-else-if="error" class="alert alert-warning">
			<h1 class="h5">Service Report Unavailable</h1>
			<p class="mb-0">{{ error }}</p>
		</div>

		<template v-else-if="ticket">
			<header class="mb-4">
				<div class="justify-content-between align-items-start gap-3">
					<div class="row">
						<div class="col-4 col-lg-6">
							<img
								src="/logo-square.png"
								alt="Fargo Small Engine Repair"
								class="img-fluid mb-3"
								style="max-height: 250px;"
							/>
						</div>
						<div class="col-8 col-lg-6 text-end">
							<h1 class="h2 mb-1">
								Service Ticket #{{ ticket.ticket_number }}
							</h1>
							<p v-if="ticket.created_at" class="text-muted small mb-2">
								Ticket Date: {{ formatDate(ticket.created_at) }}
							</p>

							<span class="badge fs-6" :class="statusClass">
								{{ statusLabel }}
							</span>

							<div class="d-flex flex-column gap-1 mt-3">
								<div>701-491-8696</div>
								<div>adam@fargosmallenginerepair.com</div>
								<div>www.fargosmallenginerepair.com</div>
							</div>
						</div>
					</div>
				</div>
			</header>

			<section
				v-if="ticket.description"
				class="card mb-4"
			>
				<div class="card-body justify-content-between align-items-center gap-3">
					<div class="row">
						<div class="col">
							<h2 class="h5 mb-1">Customer Concern</h2>
							<p class="report-notes bg-body-tertiary rounded p-3 mb-4">{{ ticket.description }}</p>
						</div>
						<div
							v-if="ticket.status != 'paid' && !ticket.service"
							class="col-auto"
						>
							<div>
								<h2 class="h5 mb-1">Estimate For Services</h2>
							</div>
							<strong class="fs-3 text-nowrap">
								{{ currency(ticket.quoted_total) }}
							</strong>
						</div>
					</div>
					<div
						v-if="ticket.status != 'paid'"
						class="row"
					>
						<div class="col">
							<p class="text-muted small mb-0 mt-3">
								<small>This estimate is based on the issues identified during diagnosis. If additional problems are discovered during the repair, we will contact you for approval before performing any work that would increase the quoted price.</small>
							</p>
						</div>
					</div>
				</div>
			</section>

			<section
				v-if="ticket.diagnostic.notes || ticket.diagnostic.media.length > 0"
				class="card mb-4"
			>
				<div class="card-body">
					<h2 class="h4 mb-3">Diagnostic Report</h2>

					<p v-if="ticket.diagnostic.notes" class="report-notes bg-body-tertiary rounded p-3 mb-4">{{ ticket.diagnostic.notes }}</p>

					<MediaGallery
						:entries="ticket.diagnostic.media"
						title="Diagnostic Photos & Videos"
					/>
				</div>
			</section>

			<section v-if="ticket.service && (ticket.service.notes || ticket.service.media.length > 0)" class="card mb-4">
				<div class="card-body">
					<h2 class="h4 mb-3">Service Performed</h2>

					<p v-if="ticket.service.notes" class="report-notes bg-body-tertiary rounded p-3 mb-4">{{ ticket.service.notes }}</p>

					<MediaGallery
						:entries="ticket.service.media"
						title="Service Photos & Videos"
					/>
				</div>
			</section>

			<section
				v-if="ticket.billing"
				class="card mb-4"
			>
				<div class="card-body">
					<h2 class="h4 mb-2">Service Charges</h2>
					<p v-if="ticket.status !== 'paid'" class="text-muted mb-3">
						Payment methods: cash, check, and venmo
					</p>

					<div class="table-responsive">
						<table class="table table-bordered align-middle mb-0 service-charges-table">
							<thead class="table-light">
								<tr>
									<th>Description</th>
									<th class="text-end">Qty</th>
									<th>Unit</th>
									<th class="text-end">Rate</th>
									<th class="text-end">Amount</th>
								</tr>
							</thead>

							<tbody>
								<tr
									v-for="(item, index) in ticket.billing.items"
									:key="index"
								>
									<td>{{ item.description }}</td>
									<td class="text-end">
										{{ Number(item.quantity) }}
									</td>
									<td>{{ item.unit }}</td>
									<td class="text-end text-nowrap">
										{{ currency(item.unit_price) }}
									</td>
									<td class="text-end text-nowrap">
										{{ currency(item.amount) }}
									</td>
								</tr>

								<tr>
									<td colspan="4">Labor</td>
									<td class="text-end text-nowrap">
										{{ currency(ticket.billing.labor) }}
									</td>
								</tr>

								<tr>
									<td colspan="4">Shop Materials</td>
									<td class="text-end text-nowrap">
										{{ currency(ticket.billing.shop_materials) }}
									</td>
								</tr>

								<tr class="table-footer">
									<td colspan="4">Subtotal</td>
									<td class="text-end text-nowrap">
										{{ currency(ticket.billing.subtotal_before_tax) }}
									</td>
								</tr>

								<tr class="table-footer">
									<td colspan="4">Sales Tax</td>
									<td class="text-end text-nowrap">
										{{ currency(ticket.billing.sales_tax) }}
									</td>
								</tr>

								<tr class="table-primary">
									<th colspan="4" class="fs-5">{{ ticket.status === 'paid' ? 'Total Paid' : 'Amount Due' }}</th>
									<th class="text-end text-nowrap fs-5">
										{{ currency(ticket.billing.total) }}
									</th>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>





			<div v-if="ticket.status === 'paid'" class="alert alert-success">
				Thank you for your business!
			</div>

			
		</template>
	</main>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import MediaGallery from '../components/ServiceTicketMediaGallery.vue';

const route = useRoute();

const ticket = ref(null);
const loading = ref(true);
const error = ref('');

const statusLabels = {
	diagnostic_complete: 'Diagnostic Complete',
	services_complete: 'Service Complete',
	paid: 'Paid'
};

const statusClasses = {
	diagnostic_complete: 'bg-warning text-dark',
	services_complete: 'bg-warning text-dark',
	paid: 'bg-success'
};

const statusLabel = computed(() =>
	statusLabels[ticket.value?.status] || 'Service Report'
);

const statusClass = computed(() =>
	statusClasses[ticket.value?.status] || 'bg-secondary'
);

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

async function loadTicket() {
	loading.value = true;
	error.value = '';
	ticket.value = null;

	try {
		const number = encodeURIComponent(
			String(route.params.ticketNumber)
		);

		const token = encodeURIComponent(
			String(route.params.token)
		);

		const response = await fetch(
			`/api/service-tickets/${number}/${token}`,
			{ cache: 'no-store' }
		);

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(
					'This report is not available yet, or the link is invalid.'
				);
			}

			throw new Error('Unable to load the service report.');
		}

		ticket.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
}

watch(
	() => [route.params.ticketNumber, route.params.token],
	loadTicket,
	{ immediate: true }
);
</script>

<style scoped>
.report-notes {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}

.report-notes {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
.service-charges-table td,
.service-charges-table th,
.service-charges-table tr {
	border-color: var(--bs-border-color);
	border-left: none;
	border-right: none;
}
.service-charges-table {
	border-left: 1px solid var(--bs-border-color);
	border-right: 1px solid var(--bs-border-color);
}
.table-footer > td {
	--bs-table-bg: var(--bs-light);
	background-color: var(--bs-table-bg);
}
tr:nth-child(1 of .table-footer) td {
	border-top-width: 2px;
}
</style>
