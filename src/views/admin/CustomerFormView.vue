
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>{{ isEditing ? 'Edit Customer' : 'Add Customer' }}</h1>

			<RouterLink to="/admin/customers" class="btn btn-outline-secondary">
				Cancel
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>

		<p v-if="loading">Loading customer...</p>

		<form
			v-else-if="!loadFailed"
			@submit.prevent="save"
			class="row g-3"
			style="max-width: 950px"
		>
			<div class="col-md-4">
				<label class="form-label">External ID *</label>
				<input
					v-model="customer.external_id"
					type="number"
					min="1"
					max="4294967295"
					step="1"
					class="form-control"
					required
				/>
				<div class="form-text">Assigned by the external system.</div>
			</div>

			<div class="col-md-4">
				<label class="form-label">First Name *</label>
				<input
					v-model="customer.first_name"
					class="form-control"
					maxlength="255"
					required
				/>
			</div>

			<div class="col-md-4">
				<label class="form-label">Last Name</label>
				<input
					v-model="customer.last_name"
					class="form-control"
					maxlength="255"
				/>
			</div>

			<div class="col-12">
				<h2 class="h5 mt-3">Contact Information</h2>
			</div>

			<div class="col-md-6">
				<label class="form-label">Phone</label>
				<input
					v-model="customer.phone"
					type="tel"
					class="form-control"
					maxlength="32"
				/>
			</div>

			<div class="col-md-6">
				<label class="form-label">Email</label>
				<input
					v-model="customer.email"
					type="email"
					class="form-control"
					maxlength="255"
				/>
			</div>

			<div class="col-12">
				<h2 class="h5 mt-3">Address</h2>
			</div>

			<div class="col-12">
				<label class="form-label">Street Address</label>
				<input
					v-model="customer.address_1"
					class="form-control"
					maxlength="255"
				/>
			</div>

			<div class="col-md-6">
				<label class="form-label">City</label>
				<input
					v-model="customer.city"
					class="form-control"
					maxlength="255"
				/>
			</div>

			<div class="col-md-3">
				<label class="form-label">State</label>
				<input
					v-model="customer.state"
					class="form-control"
					maxlength="2"
				/>
			</div>

			<div class="col-md-3">
				<label class="form-label">ZIP Code</label>
				<input
					v-model="customer.zip"
					class="form-control"
					maxlength="10"
				/>
			</div>

			<div class="col-12">
				<h2 class="h5 mt-3">Notes</h2>
				<textarea
					v-model="customer.notes"
					class="form-control"
					rows="5"
					placeholder="Customer notes..."
				></textarea>
			</div>

			<div v-if="isEditing && createdAt" class="col-12">
				<small class="text-muted">
					Customer created: {{ formatDate(createdAt) }}
				</small>
			</div>

			<div class="col-12 mt-4">
				<button type="submit" class="btn btn-primary" :disabled="saving">
					{{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Customer' }}
				</button>
			</div>
		</form>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

const route = useRoute();
const router = useRouter();

const isEditing = computed(() => Boolean(route.params.id));
const customerId = computed(() => Number(route.params.id));

const loading = ref(true);
const saving = ref(false);
const loadFailed = ref(false);
const error = ref('');
const createdAt = ref(null);

const customer = ref({
	external_id: '',
	first_name: '',
	last_name: '',
	address_1: '',
	city: '',
	state: '',
	zip: '',
	phone: '',
	email: '',
	notes: ''
});

useHead(() => ({
	title: `FSER Admin - Customers${customerId.value ? ' - ' + customerId.value : ' - Create'}`
}));

function formatDate(value) {
	return new Date(value).toLocaleString('en-US');
}

onMounted(async () => {
	try {
		if (isEditing.value) {
			if (!Number.isSafeInteger(customerId.value) || customerId.value < 1) {
				throw new Error('Invalid customer ID');
			}

			const response = await fetch(
				`/api/admin/customers/${customerId.value}`,
				{ credentials: 'same-origin' }
			);

			if (!response.ok) {
				throw new Error(
					response.status === 404
						? 'Customer not found'
						: 'Unable to load customer'
				);
			}

			const existing = await response.json();

			createdAt.value = existing.created_at;

			for (const field of Object.keys(customer.value)) {
				customer.value[field] = existing[field] ?? '';
			}
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
			? `/api/admin/customers/${customerId.value}`
			: '/api/admin/customers';

		const response = await fetch(url, {
			method: isEditing.value ? 'PUT' : 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(customer.value)
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to save customer');
		}

		await router.push('/admin/customers');
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
