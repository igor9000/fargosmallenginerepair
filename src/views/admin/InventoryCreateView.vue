
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>Add Inventory</h1>
			<RouterLink to="/admin/inventory" class="btn btn-outline-secondary">
				Cancel
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>

		<form @submit.prevent="save" class="row g-3" style="max-width: 850px">
			<div class="col-md-4">
				<label class="form-label">SKU *</label>
				<input v-model="item.sku" class="form-control" maxlength="255" required />
			</div>

			<div class="col-md-8">
				<label class="form-label">Name *</label>
				<input v-model="item.name" class="form-control" maxlength="255"
					@input="updateSlug" required />
			</div>

			<div class="col-12">
				<label class="form-label">Description</label>
				<textarea v-model="item.description" class="form-control" rows="5" />
			</div>

			<div class="col-md-4">
				<label class="form-label">Price</label>
				<input v-model="item.price" type="number" min="0" max="99999999.99"
					step="0.01" class="form-control" />
			</div>

			<div class="col-md-4">
				<label class="form-label">Inventory Type *</label>
				<select v-model="item.inventory_type_id" class="form-select" required>
					<option value="" disabled>Select type</option>
					<option v-for="type in types" :key="type.id" :value="type.id">
						{{ type.name }}
					</option>
				</select>
			</div>

			<div class="col-md-4">
				<label class="form-label">Brand</label>
				<select v-model="item.brand_id" class="form-select">
					<option :value="null">No brand</option>
					<option v-for="brand in brands" :key="brand.id" :value="brand.id">
						{{ brand.name }}
					</option>
				</select>
			</div>

			<div class="col-12">
				<label class="form-label">Slug</label>
				<input v-model="item.slug" @input="slugEdited = true"
					class="form-control" maxlength="255" />
			</div>

			<div class="col-12 d-flex gap-4 flex-wrap">
				<label v-for="field in flags" :key="field" class="form-check">
					<input v-model="item[field]" type="checkbox"
						class="form-check-input" />
					<span class="form-check-label">{{ field }}</span>
				</label>
			</div>

			<div class="col-12">
				<button type="submit" class="btn btn-primary"
					:disabled="saving || loading">
					{{ saving ? 'Saving...' : 'Create Inventory Item' }}
				</button>
			</div>
		</form>
	</section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const brands = ref([]);
const types = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const slugEdited = ref(false);

const flags = ['active', 'pending', 'featured', 'clearance'];

const item = ref({
	sku: '',
	name: '',
	description: '',
	price: '',
	slug: '',
	inventory_type_id: '',
	brand_id: null,
	active: true,
	pending: false,
	featured: false,
	clearance: false
});

function updateSlug() {
	if (!slugEdited.value) {
		item.value.slug = item.value.name
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}
}

onMounted(async () => {
	try {
		const response = await fetch('/api/admin/inventory/options');

		if (!response.ok) throw new Error('Could not load dropdown options');

		const data = await response.json();
		brands.value = data.brands;
		types.value = data.types;
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
});

async function save() {
	if (saving.value) return;

	saving.value = true;
	error.value = '';

	try {
		const response = await fetch('/api/admin/inventory', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				...item.value,
				price: item.value.price === '' ? null : item.value.price
			})
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to create inventory item');
		}

		await router.push('/admin/inventory');
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
