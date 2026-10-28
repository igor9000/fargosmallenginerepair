
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>
				{{ isEditing ? 'Manage Standard Charge' : 'Add Standard Charge' }}
			</h1>

			<RouterLink
				to="/admin/standard-charges"
				class="btn btn-outline-secondary"
			>
				Back to Charges
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>
		<div v-if="success" class="alert alert-success">{{ success }}</div>
		<p v-if="loading">Loading charge...</p>

		<div v-else-if="!loadFailed" style="max-width: 950px">
			<form @submit.prevent="save" class="row g-3">
				<div class="col-md-6">
					<label class="form-label">Charge Name *</label>
					<input
						v-model="charge.name"
						class="form-control"
						maxlength="100"
						:readonly="isEditing"
						required
						@blur="suggestSlug"
					/>
				</div>

				<div class="col-md-6">
					<label class="form-label">Slug *</label>
					<input
						v-model="charge.slug"
						class="form-control"
						maxlength="100"
						:readonly="isEditing"
						required
						pattern="[a-z0-9]+(-[a-z0-9]+)*"
					/>
				</div>

				<div class="col-md-6">
					<label class="form-label">Calculation Type *</label>
					<select
						v-model="charge.calculation_type"
						class="form-select"
						:disabled="isEditing"
						required
					>
						<option value="unit_price">Unit Price</option>
						<option value="percentage">Percentage</option>
					</select>
				</div>

				<div class="col-md-4">
					<label class="form-label">Unit</label>
					<input
						v-model="charge.unit"
						class="form-control"
						maxlength="30"
						:readonly="isEditing"
						placeholder="oz, each, %, etc."
					/>
				</div>

				<div v-if="!isEditing" class="col-md-2">
					<label class="form-label">Status</label>
					<div class="form-check mt-2">
						<input
							id="standard-charge-active"
							v-model="charge.active"
							type="checkbox"
							class="form-check-input"
						/>
						<label
							for="standard-charge-active"
							class="form-check-label"
						>
							Active
						</label>
					</div>
				</div>

				<div v-if="isEditing" class="col-12">
					<div class="form-text">
						Charge definitions are read-only after creation.
						New rates are added as dated versions below.
					</div>
				</div>

				<div class="col-12 mt-4">
					<h2 class="h4">
						{{ isEditing ? 'Add Rate Version' : 'Initial Rate' }}
					</h2>
				</div>

				<div class="col-md-6">
					<label class="form-label">
						{{ charge.calculation_type === 'percentage'
							? 'Percentage'
							: 'Unit Price' }}
						{{ isEditing ? '*' : '(optional)' }}
					</label>

					<div class="input-group">
						<span class="input-group-text">
							{{ charge.calculation_type === 'percentage' ? '%' : '$' }}
						</span>

						<input
							v-model="version.value"
							class="form-control"
							type="number"
							min="0"
							max="99999999.9999"
							step="0.0001"
							:required="isEditing"
							placeholder="0.0000"
						/>
					</div>
				</div>

				<div class="col-md-6">
					<label class="form-label">Effective Date</label>
					<input
						v-model="version.effective_date"
						class="form-control"
						type="date"
						:required="isEditing || version.value !== ''"
					/>
				</div>

				<div class="col-12">
					<button
						type="submit"
						class="btn btn-primary"
						:disabled="saving"
					>
						{{ saving
							? 'Saving...'
							: isEditing
								? 'Add Rate Version'
								: 'Create Standard Charge' }}
					</button>
				</div>
			</form>

			<div v-if="isEditing" class="mt-5">
				<h2 class="h4 mb-3">Rate History</h2>

				<div class="table-responsive">
					<table class="table table-striped align-middle">
						<thead>
							<tr>
								<th>Effective Date</th>
								<th>Rate</th>
								<th>Status</th>
								<th>Created</th>
							</tr>
						</thead>

						<tbody>
							<tr v-for="entry in versions" :key="entry.id">
								<td>{{ entry.effective_date }}</td>
								<td>{{ formatRate(entry.value) }}</td>
								<td>
									{{ entry.effective_date > today
										? 'Scheduled'
										: entry.id === currentVersionId
											? 'Current'
											: 'Historical' }}
								</td>
								<td>{{ formatDate(entry.created_at) }}</td>
							</tr>

							<tr v-if="!versions.length">
								<td colspan="4" class="text-center py-4">
									No rates have been added yet.
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

const route = useRoute();
const router = useRouter();

const isEditing = computed(() => Boolean(route.params.id));
const chargeId = computed(() => Number(route.params.id));

const loading = ref(true);
const saving = ref(false);
const loadFailed = ref(false);
const error = ref('');
const success = ref('');
const versions = ref([]);

function localDate() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

const today = ref(localDate());

const charge = ref({
	name: '',
	slug: '',
	calculation_type: 'unit_price',
	unit: '',
	active: true
});

const version = ref({
	value: '',
	effective_date: localDate()
});

const currentVersionId = computed(() =>
	versions.value.find(entry => entry.effective_date <= today.value)?.id
);

useHead(() => ({
	title: `FSER Admin - Standard Charges${charge.value.name ? ' - ' + charge.value.name : ' - Create'}`
}));

function suggestSlug() {
	if (isEditing.value || charge.value.slug.trim()) return;

	charge.value.slug = charge.value.name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function formatRate(value) {
	const number = Number(value);

	if (charge.value.calculation_type === 'percentage') {
		return `${number}%`;
	}

	return `$${number.toFixed(4)}${charge.value.unit
		? ` / ${charge.value.unit}`
		: ''}`;
}

function formatDate(value) {
	return value ? new Date(value).toLocaleString('en-US') : '—';
}

async function loadCharge() {
	const response = await fetch(
		`/api/admin/standard-charges/${chargeId.value}`,
		{ credentials: 'same-origin' }
	);

	if (!response.ok) {
		throw new Error(
			response.status === 404
				? 'Standard charge not found'
				: 'Unable to load standard charge'
		);
	}

	const existing = await response.json();

	charge.value = {
		name: existing.name,
		slug: existing.slug,
		calculation_type: existing.calculation_type,
		unit: existing.unit ?? '',
		active: Boolean(existing.active)
	};

	versions.value = existing.versions ?? [];
}

onMounted(async () => {
	try {
		if (isEditing.value) {
			if (!Number.isSafeInteger(chargeId.value) || chargeId.value < 1) {
				throw new Error('Invalid standard charge ID');
			}

			await loadCharge();
		}
	} catch (err) {
		error.value = err.message;
		loadFailed.value = true;
	} finally {
		loading.value = false;
	}
});

async function postJson(url, body) {
	const response = await fetch(url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Unable to save standard charge');
	}

	return data;
}

async function save() {
	if (saving.value) return;

	saving.value = true;
	error.value = '';
	success.value = '';

	try {
		if (isEditing.value) {
			await postJson(
				`/api/admin/standard-charges/${chargeId.value}/versions`,
				version.value
			);

			version.value.value = '';
			version.value.effective_date = localDate();

			await loadCharge();
			success.value = 'Rate version added successfully.';
		} else {
			const hasInitialRate = version.value.value !== '';

			if (hasInitialRate && !version.value.effective_date) {
				throw new Error('Select an effective date');
			}

			const created = await postJson(
				'/api/admin/standard-charges',
				charge.value
			);

			// A new definition can exist without any rate versions.
			// If requested, create its first version immediately.
			if (hasInitialRate) {
				try {
					await postJson(
						`/api/admin/standard-charges/${created.id}/versions`,
						version.value
					);
				} catch (err) {
					await router.push(
						`/admin/standard-charges/${created.id}/edit`
					);

					throw new Error(
						`Charge created, but its initial rate failed: ${err.message}`
					);
				}
			}

			await router.push('/admin/standard-charges');
		}
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
