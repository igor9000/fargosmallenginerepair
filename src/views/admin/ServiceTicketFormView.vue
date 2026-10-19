
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>{{ isEditing ? 'Edit Service Ticket' : 'Add Service Ticket' }}</h1>

			<RouterLink
				to="/admin/service-tickets"
				class="btn btn-outline-secondary"
			>
				Cancel
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>
		<p v-if="loading">Loading service ticket...</p>

		<form
			v-else-if="!loadFailed"
			@submit.prevent="save"
			class="row g-3"
			style="max-width: 950px"
		>
			<div class="col-md-4">
				<label class="form-label">Ticket Number *</label>
				<input
					v-model="ticket.ticket_number"
					type="number"
					min="1"
					max="4294967295"
					step="1"
					class="form-control"
					required
				/>
				<div class="form-text">Assigned by the external system.</div>
			</div>

			<div class="col-md-8">
				<label class="form-label">Customer *</label>

				<input
					v-model="customerSearch"
					class="form-control mb-2"
					placeholder="Filter by customer name or external ID..."
				/>

				<select
					v-model="ticket.customer_id"
					class="form-select"
					required
				>
					<option value="" disabled>Select customer</option>
					<option
						v-for="customer in filteredCustomers"
						:key="customer.id"
						:value="customer.id"
					>
						{{ customerName(customer) }} — #{{ customer.external_id }}
					</option>
				</select>

				<div v-if="!filteredCustomers.length" class="form-text">
					No matching customers.
				</div>
			</div>

			<div class="col-12">
				<label class="form-label">Description</label>
				<textarea
					v-model="ticket.description"
					class="form-control"
					rows="7"
					placeholder="Equipment, reported problem, diagnosis, repair notes..."
				></textarea>
			</div>

			
			<!-- Diagnostics -->
			<div class="col-12 mt-4">
				<h2 class="h4 mb-3">Diagnostics</h2>

				<label class="form-label">Diagnostic Notes</label>
				<textarea
					v-model="ticket.diagnostic_notes"
					class="form-control"
					rows="7"
					placeholder="Inspection findings, test results, diagnosis..."
				></textarea>
			</div>

			<!-- Service -->
			<div class="col-12 mt-4">
				<h2 class="h4 mb-3">Service Performed</h2>

				<label class="form-label">Service Notes</label>
				<textarea
					v-model="ticket.service_notes"
					class="form-control"
					rows="7"
					placeholder="Work completed, parts replaced, testing performed..."
				></textarea>
			</div>


			<div class="col-12 mt-4">
				<div class="form-check">
					<input
						v-model="ticket.completed"
						type="checkbox"
						class="form-check-input"
						id="ticket-completed"
					/>
					<label class="form-check-label" for="ticket-completed">
						Mark ticket completed
					</label>
				</div>

				<div class="form-text">
					Uncheck to reopen a completed ticket.
				</div>
			</div>

			<div v-if="isEditing" class="col-12">
				<div v-if="token" class="text-muted small">
					Token: <code>{{ token }}</code>
				</div>
				<div v-if="createdAt" class="text-muted small">
					Created: {{ formatDate(createdAt) }}
				</div>
				<div v-if="completedAt" class="text-muted small">
					Completed: {{ formatDate(completedAt) }}
				</div>
			</div>

			<div class="col-12 mt-4">
				<button
					type="submit"
					class="btn btn-primary"
					:disabled="saving"
				>
					{{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Ticket' }}
				</button>
			</div>
		</form>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isEditing = computed(() => Boolean(route.params.id));
const ticketId = computed(() => Number(route.params.id));

const loading = ref(true);
const saving = ref(false);
const loadFailed = ref(false);
const error = ref('');

const customers = ref([]);
const customerSearch = ref('');

const token = ref('');
const createdAt = ref(null);
const completedAt = ref(null);

const ticket = ref({
	ticket_number: '',
	customer_id: '',
	description: '',
	diagnostic_notes: '',
	service_notes: '',
	completed: false
});

function customerName(customer) {
	return [customer.first_name, customer.last_name]
		.filter(Boolean)
		.join(' ');
}

const filteredCustomers = computed(() => {
	const query = customerSearch.value.trim().toLowerCase();

	return customers.value.filter(customer =>
		!query ||
		[
			customerName(customer),
			customer.external_id
		].some(value =>
			String(value ?? '').toLowerCase().includes(query)
		) ||
		Number(customer.id) === Number(ticket.value.customer_id)
	);
});

function formatDate(value) {
	return new Date(value).toLocaleString('en-US');
}

onMounted(async () => {
	try {
		const customersResponse = await fetch('/api/admin/customers', {
			credentials: 'same-origin'
		});

		if (!customersResponse.ok) {
			throw new Error('Unable to load customers');
		}

		customers.value = await customersResponse.json();

		if (isEditing.value) {
			if (!Number.isSafeInteger(ticketId.value) || ticketId.value < 1) {
				throw new Error('Invalid ticket ID');
			}

			const response = await fetch(
				`/api/admin/service-tickets/${ticketId.value}`,
				{ credentials: 'same-origin' }
			);

			if (!response.ok) {
				throw new Error(
					response.status === 404
						? 'Ticket not found'
						: 'Unable to load service ticket'
				);
			}

			const existing = await response.json();

			ticket.value = {
				ticket_number: existing.ticket_number,
				customer_id: existing.customer_id,
				description: existing.description ?? '',
				diagnostic_notes: existing.diagnostic_notes ?? '',
				service_notes: existing.service_notes ?? '',
				completed: Boolean(existing.completed_at)
			};

			token.value = existing.token;
			createdAt.value = existing.created_at;
			completedAt.value = existing.completed_at;
		}
	} catch (err) {
		error.value = err.message;
		loadFailed.value = true;
	} finally {
		loading.value = false;
	}
});

async function save() {
	if (saving.value) return;

	saving.value = true;
	error.value = '';

	try {
		const url = isEditing.value
			? `/api/admin/service-tickets/${ticketId.value}`
			: '/api/admin/service-tickets';

		const response = await fetch(url, {
			method: isEditing.value ? 'PUT' : 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(ticket.value)
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to save service ticket');
		}

		await router.push('/admin/service-tickets');
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
