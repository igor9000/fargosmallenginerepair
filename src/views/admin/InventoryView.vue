
<template>
	<section>
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>Inventory</h1>
			<span>{{ filteredItems.length }} items</span>
			<RouterLink to="/admin/inventory/new" class="btn btn-primary">
				Add Inventory
			</RouterLink>
		</div>

		<input
			v-model="search"
			class="form-control mb-3"
			placeholder="Search by SKU, name, brand, or type..."
		/>

		<p v-if="error" class="alert alert-danger">{{ error }}</p>
		<p v-if="loading">Loading inventory...</p>

		<div v-else class="table-responsive">
			<table class="table table-striped table-hover align-middle">
				<thead>
					<tr>
						<th>SKU</th>
						<th>Name</th>
						<th>Brand</th>
						<th>Type</th>
						<th class="text-end">Price</th>
						<th>Active</th>
						<th>Pending</th>
						<th>Featured</th>
						<th>Clearance</th>
						<th>Actions</th>
					</tr>
				</thead>

				<tbody>
					<tr v-for="item in filteredItems" :key="item.id">
						<td>{{ item.sku }}</td>
						<td>{{ item.name }}</td>
						<td>{{ item.brand_name || '—' }}</td>
						<td>{{ item.type_name || '—' }}</td>
						<td class="text-end">{{ money(item.price) }}</td>

						<td v-for="field in flags" :key="field">
							{{ item[field] ? 'Yes' : 'No' }}
						</td>


						<td>
							<div class="d-flex gap-2">
								<RouterLink
									class="btn btn-sm btn-outline-primary"
									:to="`/admin/inventory/${item.id}/edit`"
								>
									Edit
								</RouterLink>

								<RouterLink
									class="btn btn-sm btn-outline-secondary"
									:to="{
										name: 'inventory-item',
										params: {
											name: item.slug,
											sku: item.sku
										}
									}"
									target="_blank"
									rel="noopener noreferrer"
								>
									{{ item.active ? 'View' : 'Preview' }}
								</RouterLink>
							</div>
						</td>

					</tr>

					<tr v-if="filteredItems.length === 0">
						<td colspan="10" class="text-center">
							No inventory found.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const items = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');

const flags = ['active', 'pending', 'featured', 'clearance'];

const filteredItems = computed(() => {
	const query = search.value.toLowerCase();

	return items.value.filter(item =>
		[item.sku, item.name, item.brand_name, item.type_name]
			.some(value => String(value ?? '').toLowerCase().includes(query))
	);
});

const money = value =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(value);

async function load() {
	error.value = '';
	loading.value = true;

	try {
		const response = await fetch('/api/admin/inventory', {
			credentials: 'same-origin'
		});

		if (!response.ok) {
			throw new Error('Unable to load inventory');
		}

		items.value = await response.json();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
}

onMounted(load);
</script>
