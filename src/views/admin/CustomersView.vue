
<template>
	<section>
		<div class="d-flex justify-content-between align-items-center mb-4">
			<div>
				<h1>Customers</h1>
				<span class="text-muted">{{ filteredCustomers.length }} customers</span>
			</div>

			<RouterLink to="/admin/customers/new" class="btn btn-primary">
				Add Customer
			</RouterLink>
		</div>

		<input
			v-model="search"
			class="form-control mb-3"
			placeholder="Search name, external ID, phone, email, or city..."
		/>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>
		<p v-if="loading">Loading customers...</p>

		<div v-else class="table-responsive">
			<table class="table table-striped table-hover align-middle">
				<thead>
					<tr>
						<th>External ID</th>
						<th>Name</th>
						<th>Phone</th>
						<th>Email</th>
						<th>City</th>
						<th>State</th>
						<th>Actions</th>
					</tr>
				</thead>

				<tbody>
					<tr v-for="customer in filteredCustomers" :key="customer.id">
						<td>{{ customer.external_id }}</td>
						<td>{{ customer.first_name }} {{ customer.last_name }}</td>
						<td>
							{{ customer.phone || '—' }}
						</td>
						<td>
							<a v-if="customer.email" :href="`mailto:${customer.email}`">
								{{ customer.email }}
							</a>
							<span v-else>—</span>
						</td>
						<td>{{ customer.city || '—' }}</td>
						<td>{{ customer.state || '—' }}</td>
						<td>
							<RouterLink
								:to="`/admin/customers/${customer.id}/edit`"
								class="btn btn-sm btn-outline-primary"
							>
								Edit
							</RouterLink>
						</td>
					</tr>

					<tr v-if="filteredCustomers.length === 0">
						<td colspan="7" class="text-center py-4">
							No customers found.
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

const customers = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');

const filteredCustomers = computed(() => {
	const query = search.value.trim().toLowerCase();

	if (!query) return customers.value;

	return customers.value.filter(customer =>
		[
			customer.external_id,
			customer.first_name,
			customer.last_name,
			`${customer.first_name} ${customer.last_name}`,
			customer.phone,
			customer.email,
			customer.city,
			customer.state
		].some(value =>
			String(value ?? '').toLowerCase().includes(query)
		)
	);
});

useHead(() => ({
	title: `FSER Admin - Customers List`
}));

onMounted(async () => {
	try {
		const response = await fetch('/api/admin/customers', {
			credentials: 'same-origin'
		});

		if (!response.ok) {
			throw new Error('Unable to load customers');
		}

		customers.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
});
</script>
