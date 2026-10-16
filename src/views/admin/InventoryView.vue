
<template>
  <section>
	<div class="d-flex justify-content-between align-items-center mb-4">
	  <h1>Inventory</h1>
	  <span>{{ filteredItems.length }} items</span>
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

			<td>
			  <input
				v-if="editingId === item.id"
				v-model="draft.name"
				class="form-control form-control-sm"
			  />
			  <span v-else>{{ item.name }}</span>
			</td>

			<td>{{ item.brand_name || '—' }}</td>
			<td>{{ item.type_name || '—' }}</td>

			<td class="text-end">
			  <input
				v-if="editingId === item.id"
				v-model.number="draft.price"
				type="number"
				min="0"
				step="0.01"
				class="form-control form-control-sm"
				style="min-width: 100px"
			  />
			  <span v-else>{{ money(item.price) }}</span>
			</td>

			<td v-for="field in flags" :key="field">
			  <input
				v-if="editingId === item.id"
				v-model="draft[field]"
				type="checkbox"
				class="form-check-input"
			  />
			  <span v-else>{{ item[field] ? 'Yes' : 'No' }}</span>
			</td>

			<td>
			  <div v-if="editingId === item.id" class="d-flex gap-1">
				<button
				  class="btn btn-sm btn-success"
				  :disabled="saving"
				  @click="save"
				>
				  Save
				</button>
				<button
				  class="btn btn-sm btn-secondary"
				  :disabled="saving"
				  @click="cancel"
				>
				  Cancel
				</button>
			  </div>

			  <button
				v-else
				class="btn btn-sm btn-outline-primary"
				@click="edit(item)"
			  >
				Edit
			  </button>
			</td>
		  </tr>
		  <tr v-if="filteredItems.length === 0">
			<td colspan="10" class="text-center">No inventory found.</td>
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
const saving = ref(false);
const error = ref('');
const editingId = ref(null);
const draft = ref({});

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

	if (!response.ok) throw new Error('Unable to load inventory');

	items.value = (await response.json()).map(item => ({
	  ...item,
	  ...Object.fromEntries(
		flags.map(field => [field, Boolean(item[field])])
	  )
	}));
  } catch (err) {
	error.value = err.message;
  } finally {
	loading.value = false;
  }
}

function edit(item) {
  editingId.value = item.id;
  draft.value = { ...item };
  error.value = '';
}

function cancel() {
  editingId.value = null;
  draft.value = {};
}

async function save() {
  saving.value = true;
  error.value = '';

  try {
	const response = await fetch(
	  `/api/admin/inventory/${editingId.value}`,
	  {
		method: 'PATCH',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
		  name: draft.value.name,
		  price: draft.value.price,
		  ...Object.fromEntries(
			flags.map(field => [field, draft.value[field]])
		  )
		})
	  }
	);

	if (!response.ok) {
	  throw new Error('Unable to save inventory item');
	}

	cancel();
	await load();
  } catch (err) {
	error.value = err.message;
  } finally {
	saving.value = false;
  }
}

onMounted(load);
</script>
