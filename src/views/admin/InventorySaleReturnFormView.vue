
<template>
	<section class="container-fluid" style="max-width: 950px">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>Record Return / Refund</h1>
			<RouterLink
				to="/admin/inventory-sales"
				class="btn btn-outline-secondary"
			>
				Back to Sales
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">
			{{ error }}
		</div>

		<div v-if="saved" class="alert alert-success">
			<h2 class="h5">Return / Refund Recorded</h2>
			<p class="mb-1">
				Return ID: {{ saved.id }}
			</p>
			<a
				:href="`/inventory-sale-returns/${saved.id}/${saved.token}`"
				class="btn btn-sm btn-outline-success my-2"
				target="_blank"
				rel="noopener noreferrer"
			>
				View Refund Receipt
			</a>
			<p class="mb-1">
				Refund recorded: {{ currency(saved.refund_total) }}
			</p>
			<p class="mb-0 small">
				This documents the refund. It does not send money
				through your external payment system or change
				inventory availability.
			</p>
		</div>

		<p v-if="loading">Loading sale...</p>

		<form
			v-else-if="!loadFailed && !saved"
			@submit.prevent="save"
			class="row g-3"
		>
			<div class="col-12">
				<div class="card">
					<div class="card-body">
						<h2 class="h5">
							Sale #{{ sale.sale_number }}
						</h2>
						<div class="text-muted">
							Original sale total:
							{{ currency(sale.total) }}
						</div>
					</div>
				</div>
			</div>

			<div class="col-12 mt-4">
				<h2 class="h5">Equipment</h2>
				<p class="text-muted small">
					Select the equipment involved in this
					return or refund.
				</p>
			</div>

			<div
				v-for="item in items"
				:key="item.id"
				class="col-12"
			>
				<div class="border rounded p-3">
					<div class="form-check mb-3">
						<input
							:id="`select-${item.id}`"
							v-model="item.selected"
							type="checkbox"
							class="form-check-input"
							:disabled="!canSelect(item)"
							@change="onSelect(item)"
						/>

						<label
							:for="`select-${item.id}`"
							class="form-check-label fw-semibold"
						>
							{{ item.name }}
							<span class="text-muted fw-normal">
								— {{ item.sku }}
							</span>
						</label>
					</div>

					<div class="small text-muted mb-3">
						Original:
						{{ currency(item.total) }}
						· Previously refunded:
						{{ currency(item.refunded_total) }}
						· Remaining:
						{{ currency(remaining(item)) }}
					</div>

					<div
						v-if="item.selected"
						class="row g-3"
					>
						<div class="col-md-6">
							<label class="form-label">
								Refund Amount (including tax)
							</label>

							<div class="input-group">
								<span class="input-group-text">$</span>
								<input
									v-model="item.refund_amount"
									type="number"
									min="0"
									:max="remaining(item)"
									step="0.01"
									class="form-control"
									required
								/>
							</div>
						</div>

						<div class="col-md-6 d-flex align-items-end">
							<div class="form-check mb-2">
								<input
									:id="`returned-${item.id}`"
									v-model="item.physically_returned"
									type="checkbox"
									class="form-check-input"
									:disabled="Boolean(Number(item.already_returned))"
								/>
								<label
									:for="`returned-${item.id}`"
									class="form-check-label"
								>
									Equipment physically returned
								</label>
							</div>
						</div>
					</div>

					<div
						v-if="Number(item.already_returned)"
						class="small text-muted"
					>
						Physical return already recorded.
					</div>
				</div>
			</div>

			<div class="col-12 mt-3">
				<div class="bg-body-tertiary rounded p-3 d-flex justify-content-between">
					<strong>Total Refund</strong>
					<strong class="fs-4">
						{{ currency(refundTotal) }}
					</strong>
				</div>
				<div class="form-text">
					Refunded sales tax is calculated automatically
					using the original sale's tax rate.
				</div>
			</div>

			<div class="col-md-6 mt-4">
				<label class="form-label">Refund Method</label>
				<select
					v-model="form.refund_method"
					class="form-select"
				>
					<option>Not Specified</option>
					<option>Cash</option>
					<option>Check</option>
					<option>Venmo</option>
					<option>Card</option>
					<option>Other</option>
				</select>
			</div>

			<div class="col-md-6 mt-4">
				<label class="form-label">
					External Refund Reference
				</label>
				<input
					v-model="form.refund_reference"
					class="form-control"
					maxlength="100"
					placeholder="Optional transaction ID"
				/>
			</div>

			<div class="col-12">
				<label class="form-label">Reason</label>
				<textarea
					v-model="form.reason"
					class="form-control"
					rows="3"
					maxlength="10000"
					placeholder="Reason for return or refund..."
				></textarea>
			</div>

			<div class="col-12">
				<label class="form-label">Internal Notes</label>
				<textarea
					v-model="form.notes"
					class="form-control"
					rows="3"
					maxlength="10000"
				></textarea>
			</div>

			<div class="col-12">
				<div class="alert alert-secondary small">
					Recording this transaction will not automatically
					refund the customer or reactivate returned equipment.
				</div>
			</div>

			<div class="col-12">
				<button
					type="submit"
					class="btn btn-primary"
					:disabled="saving || !canSubmit"
				>
					{{ saving ? 'Recording...' : 'Record Return / Refund' }}
				</button>
			</div>

			<div
				v-if="history.length"
				class="col-12 mt-4"
			>
				<h2 class="h5">Previous Returns / Refunds</h2>

				<div
					v-for="entry in history"
					:key="entry.id"
					class="border rounded p-3 mb-2"
				>
					<div class="d-flex justify-content-between">
						<div>
							<strong>Return #{{ entry.id }}</strong>
							<div class="small text-muted">
								{{ formatDate(entry.return_date) }}
							</div>
						</div>
						<strong>
							{{ currency(entry.refund_total) }}
						</strong>
					</div>
					<div class="small mt-2">
						{{ entry.reason }}
					</div>
					<a
						:href="`/inventory-sale-returns/${entry.id}/${entry.token}`"
						class="btn btn-sm btn-outline-primary mt-2"
						target="_blank"
						rel="noopener noreferrer"
					>
						View Refund Receipt
					</a>
				</div>
			</div>
		</form>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';

const route = useRoute();
const saleId = Number(route.params.id);

const loading = ref(true);
const loadFailed = ref(false);
const saving = ref(false);
const error = ref('');
const saved = ref(null);

const sale = ref({});
const items = ref([]);
const history = ref([]);

const form = ref({
	refund_method: 'Not Specified',
	refund_reference: '',
	reason: '',
	notes: ''
});

useHead(() => ({
	title: `FSER Admin - Return${sale.value.sale_number ? ' - ' + sale.value.sale_number : ' - undefined'}`
}));

function cents(value) {
	return Math.round(Number(value || 0) * 100);
}

function remaining(item) {
	return (
		Math.max(
			0,
			cents(item.total) - cents(item.refunded_total)
		) / 100
	).toFixed(2);
}

function canSelect(item) {
	return cents(remaining(item)) > 0 ||
		!Number(item.already_returned);
}

function onSelect(item) {
	if (item.selected) {
		item.refund_amount = remaining(item);
	} else {
		item.refund_amount = '0.00';
		item.physically_returned = false;
	}
}

const selectedItems = computed(() =>
	items.value.filter(item => item.selected)
);

const refundTotal = computed(() =>
	selectedItems.value.reduce(
		(sum, item) => sum + cents(item.refund_amount),
		0
	) / 100
);

const canSubmit = computed(() =>
	selectedItems.value.length > 0 &&
	selectedItems.value.every(item => {
		const amount = cents(item.refund_amount);

		return (
			Number.isFinite(amount) &&
			amount >= 0 &&
			amount <= cents(remaining(item)) &&
			(
				amount > 0 ||
				item.physically_returned
			)
		);
	})
);

function currency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(Number(value || 0));
}

function formatDate(value) {
	return new Date(value).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'America/Chicago'
	});
}

onMounted(async () => {
	try {
		if (!Number.isSafeInteger(saleId) || saleId < 1) {
			throw new Error('Invalid sale ID');
		}

		const response = await fetch(
			`/api/admin/inventory-sales/${saleId}/refund-options`,
			{ credentials: 'same-origin' }
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to load sale');
		}

		sale.value = data.sale;
		history.value = data.history;

		items.value = data.items.map(item => ({
			...item,
			already_returned: item.physically_returned,
			selected: false,
			physically_returned: false,
			refund_amount: '0.00'
		}));
	} catch (err) {
		error.value = err.message;
		loadFailed.value = true;
	} finally {
		loading.value = false;
	}
});

async function save() {
	if (saving.value || !canSubmit.value) return;

	saving.value = true;
	error.value = '';

	try {
		const payload = {
			...form.value,
			items: selectedItems.value.map(item => ({
				inventory_sale_item_id: item.id,
				refund_total: item.refund_amount,
				physically_returned: item.physically_returned
			}))
		};

		const response = await fetch(
			`/api/admin/inventory-sales/${saleId}/returns`,
			{
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.error || 'Unable to record refund'
			);
		}

		saved.value = data;
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
