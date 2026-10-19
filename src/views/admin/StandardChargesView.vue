
<template>
	<section>
		<div class="d-flex justify-content-between align-items-center mb-4">
			<div>
				<h1>Standard Charges</h1>
				<span class="text-muted">
					{{ filteredCharges.length }} charges
				</span>
			</div>

			<RouterLink
				to="/admin/standard-charges/new"
				class="btn btn-primary"
			>
				Add Standard Charge
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>

		<input
			v-model="search"
			class="form-control mb-3"
			placeholder="Search charges by name, slug, or type..."
		/>

		<p v-if="loading">Loading standard charges...</p>

		<div v-else class="table-responsive">
			<table class="table table-striped table-hover align-middle">
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>Current Rate</th>
						<th>Effective Date</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>

				<tbody>
					<tr v-for="charge in filteredCharges" :key="charge.id">
						<td>
							<strong>{{ charge.name }}</strong>
							<div class="text-muted small">
								{{ charge.slug }}
							</div>
						</td>

						<td>
							{{ charge.calculation_type === 'percentage'
								? 'Percentage'
								: 'Unit Price' }}
						</td>

						<td>
							{{ formatRate(charge) }}
						</td>

						<td>{{ charge.effective_date || '—' }}</td>

						<td>
							<span
								class="badge"
								:class="charge.active
									? 'bg-success'
									: 'bg-secondary'"
							>
								{{ charge.active ? 'Active' : 'Inactive' }}
							</span>
						</td>

						<td>
							<RouterLink
								:to="`/admin/standard-charges/${charge.id}/edit`"
								class="btn btn-sm btn-outline-primary"
							>
								Manage Rates
							</RouterLink>
						</td>
					</tr>

					<tr v-if="!filteredCharges.length">
						<td colspan="6" class="text-center py-4">
							No standard charges found.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const charges = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');

const filteredCharges = computed(() => {
	const query = search.value.trim().toLowerCase();

	return charges.value.filter(charge =>
		!query ||
		[
			charge.name,
			charge.slug,
			charge.calculation_type
		].some(value =>
			String(value ?? '').toLowerCase().includes(query)
		)
	);
});

function formatRate(charge) {
	if (charge.current_value == null) {
		return 'No effective rate';
	}

	const value = Number(charge.current_value);

	if (charge.calculation_type === 'percentage') {
		return `${value}%`;
	}

	return `$${value.toFixed(4)}${charge.unit ? ` / ${charge.unit}` : ''}`;
}

onMounted(async () => {
	try {
		const response = await fetch('/api/admin/standard-charges', {
			credentials: 'same-origin'
		});

		if (!response.ok) {
			throw new Error('Unable to load standard charges');
		}

		charges.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
});
</script>
