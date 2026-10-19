
<template>
	<section>
		<div class="d-flex justify-content-between align-items-center mb-4">
			<div>
				<h1>Service Tickets</h1>
				<span class="text-muted">
					{{ filteredTickets.length }} tickets
				</span>
			</div>

			<RouterLink
				to="/admin/service-tickets/new"
				class="btn btn-primary"
			>
				Add Ticket
			</RouterLink>
		</div>

		<input
			v-model="search"
			class="form-control mb-3"
			placeholder="Search ticket number, customer, description, or token..."
		/>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>
		<p v-if="loading">Loading service tickets...</p>

		<div v-else class="table-responsive">
			<table class="table table-striped table-hover align-middle">
				<thead>
					<tr>
						<th>Ticket #</th>
						<th>Customer</th>
						<th>Token</th>
						<th>Created</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>

				<tbody>
					<tr v-for="ticket in filteredTickets" :key="ticket.id">
						<td>{{ ticket.ticket_number }}</td>

						<td>
							{{ customerName(ticket) }}
							<div class="small text-muted">
								Customer #{{ ticket.customer_external_id }}
							</div>
						</td>

						<td>
							{{ ticket.token || '—' }}
						</td>

						<td>{{ formatDate(ticket.created_at) }}</td>

						<td>
							<span
								class="badge"
								:class="ticket.completed_at ? 'bg-success' : 'bg-warning text-dark'"
							>
								{{ ticket.completed_at ? 'Completed' : 'Open' }}
							</span>
						</td>

						<td>
							<RouterLink
								:to="`/admin/service-tickets/${ticket.id}/edit`"
								class="btn btn-sm btn-outline-primary"
							>
								Edit
							</RouterLink>
						</td>
					</tr>

					<tr v-if="filteredTickets.length === 0">
						<td colspan="6" class="text-center py-4">
							No service tickets found.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const tickets = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');

function customerName(ticket) {
	return [ticket.first_name, ticket.last_name]
		.filter(Boolean)
		.join(' ');
}

function formatDate(value) {
	return value ? new Date(value).toLocaleDateString('en-US') : '—';
}

const filteredTickets = computed(() => {
	const query = search.value.trim().toLowerCase();

	if (!query) return tickets.value;

	return tickets.value.filter(ticket =>
		[
			ticket.ticket_number,
			customerName(ticket),
			ticket.customer_external_id,
			ticket.description,
			ticket.token
		].some(value =>
			String(value ?? '').toLowerCase().includes(query)
		)
	);
});

onMounted(async () => {
	try {
		const response = await fetch('/api/admin/service-tickets', {
			credentials: 'same-origin'
		});

		if (!response.ok) {
			throw new Error('Unable to load service tickets');
		}

		tickets.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
});
</script>
