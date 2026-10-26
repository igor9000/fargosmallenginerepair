
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>
				{{ isEditing ? 'Edit Inventory Sale' : 'Record Inventory Sale' }}
			</h1>

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

		<p v-if="loading">Loading sale...</p>

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
					@input="numberConflict = ''"
					@blur="checkExternalNumber"
					required
				/>
				<div v-if="numberConflict" class="text-danger small mt-1">
					{{ numberConflict }}
				</div>
				<div class="form-text">
					Assigned by the external system.
				</div>
			</div>

			<div class="col-12 mt-4">
				<h2 class="h5">Customer</h2>

				<input
					v-model="customerSearch"
					class="form-control mb-2"
					placeholder="Search name or external ID..."
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

			<div class="col-12 mt-4">
				<div class="d-flex justify-content-between align-items-center">
					<h2 class="h5 mb-0">Equipment</h2>
					<button
						type="button"
						class="btn btn-sm btn-outline-primary"
						@click="addItem"
					>
						Add Equipment
					</button>
				</div>

				<input
					v-model="inventorySearch"
					class="form-control mt-3"
					placeholder="Filter equipment by name or SKU..."
				/>
			</div>

			<div
				v-for="(line, index) in sale.items"
				:key="line.key"
				class="col-12"
			>
				<div class="border rounded p-3">
					<div class="row g-3 align-items-end">
						<div class="col-md-7">
							<label class="form-label">
								Equipment {{ index + 1 }} *
							</label>

							<select
								v-model="line.inventory_id"
								class="form-select"
								required
								@change="onEquipmentChange(line)"
							>
								<option value="" disabled>
									Select equipment
								</option>

								<option
									v-for="item in equipmentChoices(line)"
									:key="item.id"
									:value="item.id"
								>
									{{ item.sku }} — {{ item.name }}
								</option>
							</select>
						</div>

						<div class="col-md-3">
							<label class="form-label">
								Selling Price *
							</label>

							<div class="input-group">
								<span class="input-group-text">$</span>

								<input
									v-model="line.total"
									type="number"
									min="0.01"
									max="99999999.99"
									step="0.01"
									class="form-control"
									required
								/>
							</div>
						</div>

						<div class="col-md-2">
							<button
								type="button"
								class="btn btn-outline-danger w-100"
								:disabled="sale.items.length === 1"
								@click="removeItem(index)"
							>
								Remove
							</button>
						</div>
					</div>

					<div class="form-text mt-2">
						Price includes sales tax.
						<span v-if="findEquipment(line.inventory_id)">
							Listed:
							{{ currency(findEquipment(line.inventory_id).price) }}
						</span>
					</div>
				</div>
			</div>

			<div class="col-12">
				<div class="bg-body-tertiary rounded p-3 d-flex justify-content-between">
					<strong>Total Selling Price</strong>
					<strong class="fs-4">{{ currency(saleTotal) }}</strong>
				</div>

				<div class="form-text">
					Sum of all equipment selling prices, including sales tax.
					Tax is calculated by the server.
				</div>
			</div>

			<div class="col-12 mt-4">
				<label class="form-label">Notes</label>
				<textarea
					v-model="sale.notes"
					class="form-control"
					rows="4"
					placeholder="Internal sale notes..."
				></textarea>
			</div>

			<div class="col-12 mt-4">
				<button
					type="submit"
					class="btn btn-primary"
					:disabled="saving"
				>
					{{ saving ? 'Saving...' :
						isEditing ? 'Save Changes' : 'Record Sale' }}
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
const saleId = computed(() => Number(route.params.id));

const loading = ref(true);
const loadFailed = ref(false);
const saving = ref(false);
const error = ref('');

const inventory = ref([]);
const customers = ref([]);
const customerSearch = ref('');
const inventorySearch = ref('');
const numberConflict = ref('');

// Existing sold items are permitted while editing their own sale.
const originalInventoryIds = ref([]);

async function checkExternalNumber() {
	const number = String(sale.value.sale_number ?? '');

	if (!/^[1-9]\d*$/.test(number) ||
		Number(number) > 4294967295) {
		numberConflict.value = 'Enter a valid sale number';
		return false;
	}

	const params = new URLSearchParams({
		number,
		kind: 'sale',
		excludeId: isEditing.value ? String(saleId.value) : '0'
	});

	try {
		const response = await fetch(
			`/api/admin/external-ids/check?${params}`,
			{ credentials: 'same-origin', cache: 'no-store' }
		);

		if (!response.ok) {
			throw new Error('Number check failed');
		}

		const result = await response.json();

		numberConflict.value = result.available
			? ''
			: `Already used by a ${result.usedBy}`;

		return result.available;
	} catch (err) {
		numberConflict.value = 'Unable to verify sale number';
		return false;
	}
}


let nextKey = 1;

function emptyLine() {
	return {
		key: nextKey++,
		inventory_id: '',
		total: ''
	};
}

const sale = ref({
	sale_number: '',
	customer_id: '',
	notes: '',
	items: [emptyLine()]
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
		Number(customer.id) === Number(sale.value.customer_id)
	);
});

function findEquipment(id) {
	return inventory.value.find(item =>
		Number(item.id) === Number(id)
	);
}

function equipmentChoices(line) {
	const query = inventorySearch.value.trim().toLowerCase();

	const selectedElsewhere = new Set(
		sale.value.items
			.filter(other => other !== line && other.inventory_id)
			.map(other => Number(other.inventory_id))
	);

	return inventory.value.filter(item => {
		const id = Number(item.id);

		const available =
			Number(item.active) === 1 ||
			originalInventoryIds.value.includes(id) ||
			id === Number(line.inventory_id);

		if (!available || selectedElsewhere.has(id)) {
			return false;
		}

		return (
			!query ||
			id === Number(line.inventory_id) ||
			[item.sku, item.name, item.brand_name]
				.some(value =>
					String(value ?? '').toLowerCase().includes(query)
				)
		);
	});
}

function onEquipmentChange(line) {
	const item = findEquipment(line.inventory_id);

	// Switching equipment loads its listed price as a starting point.
	line.total = item?.price ?? '';
}

function addItem() {
	sale.value.items.push(emptyLine());
}

function removeItem(index) {
	if (sale.value.items.length > 1) {
		sale.value.items.splice(index, 1);
	}
}

const saleTotal = computed(() => {
	const cents = sale.value.items.reduce((sum, line) => {
		return sum + Math.round(Number(line.total || 0) * 100);
	}, 0);

	return cents / 100;
});

function currency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(Number(value));
}

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

		if (!isEditing.value) {
			const nextResponse = await fetch(
				'/api/admin/external-ids/next',
				{ credentials: 'same-origin', cache: 'no-store' }
			);

			if (!nextResponse.ok) {
				throw new Error('Unable to suggest next sale number');
			}

			const { nextNumber } = await nextResponse.json();
			sale.value.sale_number = nextNumber;
		}

		if (isEditing.value) {
			if (!Number.isSafeInteger(saleId.value) || saleId.value < 1) {
				throw new Error('Invalid sale ID');
			}

			const response = await fetch(
				`/api/admin/inventory-sales/${saleId.value}`,
				{ credentials: 'same-origin' }
			);

			if (!response.ok) {
				throw new Error(
					response.status === 404
						? 'Sale not found'
						: 'Unable to load sale'
				);
			}

			const existing = await response.json();

			originalInventoryIds.value = existing.items.map(
				item => Number(item.inventory_id)
			);

			sale.value = {
				sale_number: existing.sale_number,
				customer_id: existing.customer_id,
				notes: existing.notes ?? '',
				items: existing.items.map(item => ({
					key: nextKey++,
					inventory_id: item.inventory_id,
					total: item.total
				}))
			};
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
		if (!(await checkExternalNumber())) {
			throw new Error(numberConflict.value);
		}
		const selectedIds = sale.value.items.map(
			item => Number(item.inventory_id)
		);

		if (new Set(selectedIds).size !== selectedIds.length) {
			throw new Error('Each equipment item may only appear once');
		}

		const payload = {
			sale_number: sale.value.sale_number,
			customer_id: sale.value.customer_id,
			notes: sale.value.notes,
			items: sale.value.items.map(item => ({
				inventory_id: item.inventory_id,
				total: item.total
			}))
		};

		const response = await fetch(
			isEditing.value
				? `/api/admin/inventory-sales/${saleId.value}`
				: '/api/admin/inventory-sales',
			{
				method: isEditing.value ? 'PUT' : 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to save sale');
		}

		await router.push('/admin/inventory-sales');
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
