
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>Record Inventory Sale</h1>

			<RouterLink
				to="/admin/inventory-sales"
				class="btn btn-outline-secondary"
			>
				Cancel
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">
			{{ error }}
		</div>

		<p v-if="loading">Loading sale options...</p>

		<form
			v-else-if="!loadFailed"
			@submit.prevent="save"
			class="row g-3"
			style="max-width: 950px"
		>
			<div class="col-md-4">
				<label class="form-label">Sale Number *</label>
				<input
					v-model="sale.sale_number"
					type="number"
					min="1"
					max="4294967295"
					step="1"
					class="form-control"
					required
				/>
				<div class="form-text">
					Assigned by the external system.
				</div>
			</div>

			<div class="col-12">
				<h2 class="h5 mt-3">Equipment</h2>

				<label class="form-label">Inventory Item *</label>

				<input
					v-model="inventorySearch"
					class="form-control mb-2"
					placeholder="Filter by equipment name or SKU..."
				/>

				<select
					v-model="sale.inventory_id"
					class="form-select"
					required
				>
					<option value="" disabled>Select equipment</option>

					<option
						v-for="item in filteredInventory"
						:key="item.id"
						:value="item.id"
					>
						{{ item.sku }} — {{ item.name }}
					</option>
				</select>

				<div v-if="selectedItem" class="form-text">
					Listed price: {{ currency(selectedItem.price) }}
				</div>
			</div>

			<div class="col-12">
				<h2 class="h5 mt-3">Customer</h2>

				<label class="form-label">Customer *</label>

				<input
					v-model="customerSearch"
					class="form-control mb-2"
					placeholder="Filter by customer name or external ID..."
				/>

				<select
					v-model="sale.customer_id"
					class="form-select"
					required
				>
					<option value="" disabled>Select customer</option>

					<option
						v-for="customer in filteredCustomers"
						:key="customer.id"
						:value="customer.id"
					>
						{{ customerName(customer) }}
						— #{{ customer.external_id }}
					</option>
				</select>
			</div>

			<div class="col-12">
				<h2 class="h5 mt-3">Sale Details</h2>
			</div>

			<div class="col-md-6">
				<label class="form-label">
					Total Selling Price *
				</label>

				<div class="input-group">
					<span class="input-group-text">$</span>

					<input
						v-model="sale.total"
						type="number"
						min="0.01"
						step="0.01"
						class="form-control"
						required
					/>
				</div>

				<div class="form-text">
					Final agreed price, including sales tax.
				</div>
			</div>

			<div class="col-12">
				<label class="form-label">Notes</label>

				<textarea
					v-model="sale.notes"
					class="form-control"
					rows="4"
					placeholder="Optional notes about the sale..."
				></textarea>
			</div>

			<div class="col-12 mt-4">
				<button
					type="submit"
					class="btn btn-primary"
					:disabled="saving"
				>
					{{ saving ? 'Recording...' : 'Record Sale' }}
				</button>
			</div>
		</form>
	</section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const loading = ref(true);
const loadFailed = ref(false);
const saving = ref(false);
const error = ref('');

const inventory = ref([]);
const customers = ref([]);

const inventorySearch = ref('');
const customerSearch = ref('');

const sale = ref({
	sale_number: '',
	inventory_id: '',
	customer_id: '',
	total: '',
	notes: ''
});

const availableInventory = computed(() =>
	inventory.value.filter(item => Boolean(item.active))
);

const selectedItem = computed(() =>
	inventory.value.find(item =>
		Number(item.id) === Number(sale.value.inventory_id)
	) ?? null
);

const filteredInventory = computed(() => {
	const query = inventorySearch.value.trim().toLowerCase();

	return availableInventory.value.filter(item =>
		!query ||
		[item.sku, item.name, item.brand_name]
			.some(value =>
				String(value ?? '').toLowerCase().includes(query)
			)
	);
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
		)
	);
});

function currency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(Number(value));
}

// Pre-fill the selling price from the inventory listing.
// The price can still be changed before recording the sale.
watch(
	() => sale.value.inventory_id,
	() => {
		sale.value.total = selectedItem.value?.price ?? '';
	}
);

onMounted(async () => {
	try {
		const [inventoryResponse, customersResponse] =
			await Promise.all([
				fetch('/api/admin/inventory', {
					credentials: 'same-origin'
				}),
				fetch('/api/admin/customers', {
					credentials: 'same-origin'
				})
			]);

		if (!inventoryResponse.ok || !customersResponse.ok) {
			throw new Error('Unable to load sale options');
		}

		inventory.value = await inventoryResponse.json();
		customers.value = await customersResponse.json();
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
		const response = await fetch('/api/admin/inventory-sales', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(sale.value)
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to record sale');
		}

		await router.push('/admin/inventory-sales');
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
