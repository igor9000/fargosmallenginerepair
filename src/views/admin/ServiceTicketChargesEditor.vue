
<template>
	<section class="col-12 mt-4">
		<h2 class="h4 mb-3">Charges</h2>

		<div v-if="error" class="alert alert-danger">
			{{ error }}
		</div>

		<div v-if="success" class="alert alert-success">
			{{ success }}
		</div>

		<p v-if="loading">Loading billing details...</p>

		<div v-else>
			<div class="card mb-3">
				<div class="card-body">
					<label class="form-label fw-bold">
						Quoted Total (Tax Included)
					</label>

					<div class="input-group" style="max-width: 250px">
						<span class="input-group-text">$</span>
						<input
							v-model="quotedTotal"
							type="number"
							min="0"
							step="0.01"
							class="form-control"
							:disabled="saving"
						/>
					</div>

					<div class="form-text">
						The customer pays exactly this amount.
						Labor balances the remaining charges.
					</div>
				</div>
			</div>

			<div class="card mb-3">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-center mb-3">
						<h3 class="h5 mb-0">Entered Charges</h3>

						<div class="d-flex gap-2">
							<button
								type="button"
								class="btn btn-sm btn-outline-primary"
								:disabled="saving"
								@click="addPart"
							>
								+ Add Part
							</button>

							<button
								type="button"
								class="btn btn-sm btn-outline-primary"
								:disabled="saving"
								@click="addStandard"
							>
								+ Standard Charge
							</button>
						</div>
					</div>

					<div class="table-responsive">
						<table class="table table-bordered align-middle">
							<thead>
								<tr>
									<th style="min-width: 115px">Type</th>
									<th style="min-width: 180px">Description</th>
									<th style="min-width: 95px">Qty</th>
									<th>Unit</th>
									<th style="min-width: 125px">Rate</th>
									<th class="text-center">Taxable</th>
									<th>Total</th>
									<th></th>
								</tr>
							</thead>

							<tbody>
								<tr v-for="item in items" :key="item.key">
									<td>
										{{ item.category === 'part'
											? 'Part'
											: 'Standard Charge' }}
									</td>

									<td>
										<input
											v-if="item.category === 'part'"
											v-model="item.description"
											class="form-control"
											maxlength="255"
											placeholder="Part description"
										/>

										<select
											v-else
											v-model="item.standard_charge_id"
											class="form-select"
										>
											<option value="" disabled>
												Select charge
											</option>

											<option
												v-for="charge in availableStandardCharges"
												:key="charge.id"
												:value="charge.id"
											>
												{{ charge.name }}
											</option>
										</select>
									</td>

									<td>
										<input
											v-model="item.quantity"
											type="number"
											min="0.0001"
											step="0.0001"
											class="form-control"
										/>
									</td>

									<td>
										<template v-if="item.category === 'standard'">
											{{ standardCharge(item)?.unit || '—' }}
										</template>

										<input
											v-else
											v-model="item.unit"
											class="form-control"
											maxlength="30"
											placeholder="each"
										/>
									</td>

									<td>
										<div
											v-if="item.category === 'standard'"
											class="text-nowrap"
										>
											{{ standardRate(item) }}
											<div class="text-muted small">
												From standard rates
											</div>
										</div>

										<input
											v-else
											v-model="item.unit_price"
											type="number"
											min="0"
											step="0.0001"
											class="form-control"
										/>
									</td>

									<td class="text-center">
										<input
											v-if="item.category === 'part'"
											v-model="item.taxable"
											type="checkbox"
											class="form-check-input"
											:aria-label="`${item.description || 'Part'} is taxable`"
										/>
										<span v-else class="text-muted">—</span>
									</td>

									<td class="text-nowrap">
										{{ draftLineTotal(item) }}
									</td>

									<td>
										<button
											type="button"
											class="btn btn-sm btn-outline-danger"
											@click="removeItem(item)"
										>
											Remove
										</button>
									</td>
								</tr>

								<tr v-if="!items.length">
									<td colspan="7" class="text-center text-muted py-3">
										No charges added yet.
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div v-if="calculated" class="card mb-3">
				<div class="card-body">
					<h3 class="h5 mb-3">Calculated Charges</h3>

					<table class="table">
						<tbody>
							<tr>
								<td>Shop Materials</td>
								<td>
									{{ Number(calculated.automatic.shop_materials_rate) }}%
								</td>
								<td class="text-end">
									{{ currency(calculated.automatic.shop_materials) }}
								</td>
							</tr>

							<tr>
								<td>Labor (Calculated Remainder)</td>
								<td>Automatic</td>
								<td class="text-end">
									{{ currency(calculated.automatic.labor) }}
								</td>
							</tr>

							<tr>
								<td>Sales Tax</td>
								<td>
									{{ Number(calculated.automatic.sales_tax_rate) }}%
								</td>
								<td class="text-end">
									{{ currency(calculated.automatic.sales_tax) }}
								</td>
							</tr>

							<tr>
								<th>Subtotal Before Tax</th>
								<td></td>
								<th class="text-end">
									{{ currency(calculated.totals.subtotal_before_tax) }}
								</th>
							</tr>

							<tr class="table-primary">
								<th>Customer Total</th>
								<td></td>
								<th class="text-end">
									{{ currency(calculated.totals.customer_total) }}
								</th>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<p v-else class="text-muted small">
				Save billing details to calculate the final amounts.
			</p>

			<button
				type="button"
				class="btn btn-primary"
				:disabled="saving || loading"
				@click="saveBilling"
			>
				{{ saving ? 'Saving...' : 'Save Billing Details' }}
			</button>

			<div class="form-text mt-2">
				Billing saves separately from ticket notes and media.
			</div>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
	ticketId: {
		type: Number,
		required: true
	}
});

const quotedTotal = ref('');
const items = ref([]);
const standardCharges = ref([]);
const calculated = ref(null);

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');

let nextKey = 1;

const availableStandardCharges = computed(() =>
	standardCharges.value.filter(charge =>
		Boolean(charge.active) &&
		charge.calculation_type === 'unit_price' &&
		charge.current_value !== null
	)
);

function currency(value) {
	return `$${Number(value ?? 0).toFixed(2)}`;
}

function standardCharge(item) {
	return standardCharges.value.find(
		charge => Number(charge.id) === Number(item.standard_charge_id)
	);
}

function standardRate(item) {
	const charge = standardCharge(item);

	if (!charge || charge.current_value == null) {
		return 'Select a charge';
	}

	return `$${Number(charge.current_value).toFixed(4)}`;
}

function draftLineTotal(item) {
	const quantity = Number(item.quantity);

	const price = item.category === 'standard'
		? Number(standardCharge(item)?.current_value)
		: Number(item.unit_price);

	if (!Number.isFinite(quantity) || !Number.isFinite(price)) {
		return '—';
	}

	return currency(quantity * price);
}

function invalidateCalculation() {
	calculated.value = null;
	success.value = '';
}


function addPart() {
	items.value.push({
		key: nextKey++,
		category: 'part',
		description: '',
		quantity: '1',
		unit: 'each',
		unit_price: '0.00',
		taxable: true
	});

	invalidateCalculation();
}

function addStandard() {
	items.value.push({
		key: nextKey++,
		category: 'standard',
		standard_charge_id: '',
		quantity: '1'
	});

	invalidateCalculation();
}

function removeItem(item) {
	items.value = items.value.filter(entry => entry.key !== item.key);
	invalidateCalculation();
}

function normalizeItems(entries) {
	return entries
		.filter(item => ['part', 'standard'].includes(item.category))
		.map(item => {
			if (item.category === 'standard') {
				return {
					key: nextKey++,
					category: 'standard',
					standard_charge_id: Number(item.standard_charge_id),
					quantity: String(item.quantity)
				};
			}

			return {
				key: nextKey++,
				category: 'part',
				description: item.description,
				quantity: String(item.quantity),
				unit: item.unit ?? 'each',
				unit_price: String(item.unit_price),
				taxable: Boolean(item.taxable)
			};
		});
}

async function fetchJson(url, options = {}) {
	const response = await fetch(url, {
		credentials: 'same-origin',
		...options
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Request failed');
	}

	return data;
}

async function loadBilling() {
	const billing = await fetchJson(
		`/api/admin/service-tickets/${props.ticketId}/billing`
	);

	quotedTotal.value = billing.quoted_total ?? '';
	items.value = normalizeItems(billing.items ?? []);

	calculated.value = billing.automatic ? billing : null;
}

onMounted(async () => {
	try {
		standardCharges.value = await fetchJson(
			'/api/admin/standard-charges'
		);

		await loadBilling();
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
});

async function saveBilling() {
	if (saving.value) return;

	error.value = '';
	success.value = '';
	saving.value = true;

	try {
		if (quotedTotal.value === '') {
			throw new Error('Enter the quoted total');
		}

		for (const item of items.value) {
			if (
				item.category === 'standard' &&
				!item.standard_charge_id
			) {
				throw new Error('Select a standard charge');
			}
		}

		const payload = {
			billing_method: 'quoted_total',
			quoted_total: String(quotedTotal.value),
			items: items.value.map(item => {
				if (item.category === 'standard') {
					return {
						category: 'standard',
						standard_charge_id: Number(item.standard_charge_id),
						quantity: String(item.quantity)
					};
				}

				return {
					category: 'part',
					description: item.description,
					quantity: String(item.quantity),
					unit: item.unit,
					unit_price: String(item.unit_price),
					taxable: Boolean(item.taxable)
				};
			})
		};

		await fetchJson(
			`/api/admin/service-tickets/${props.ticketId}/billing`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			}
		);

		await loadBilling();

		success.value = 'Billing details saved.';
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
