
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>{{ isEditing ? 'Edit Service Ticket' : 'Add Service Ticket' }}</h1>

			<RouterLink
				to="/admin/service-tickets"
				class="btn btn-outline-secondary"
			>
				Cancel
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>
		<p v-if="loading">Loading service ticket...</p>

		<form
			v-else-if="!loadFailed"
			@submit.prevent="save"
			class="row g-3"
			style="max-width: 950px"
		>
			<div class="col-md-4">
				<label class="form-label">Ticket Number *</label>
				<input
					v-model="ticket.ticket_number"
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
				<div class="form-text">Assigned by the external system.</div>
			</div>

			<div v-if="customerReportUrl" class="col-12 mt-4">
				<label class="form-label fw-bold">Customer Report Link</label>

				<div class="input-group">
					<input
						:value="customerReportUrl"
						class="form-control"
						readonly
						aria-label="Customer report link"
					/>

					<button
						type="button"
						class="btn btn-outline-secondary"
						@click="copyCustomerReportUrl"
					>
						Copy Link
					</button>
				</div>

				<div class="form-text">
					Anyone with this link can view the ticket.
				</div>
			</div>

			<div class="col-md-8">
				<label class="form-label">Customer *</label>

				<input
					v-model="customerSearch"
					class="form-control mb-2"
					placeholder="Filter by customer name or external ID..."
				/>

				<select
					v-model="ticket.customer_id"
					class="form-select"
					required
				>
					<option value="" disabled>Select customer</option>
					<option
						v-for="customer in filteredCustomers"
						:key="customer.id"
						:value="customer.id"
					>
						{{ customerName(customer) }} — #{{ customer.external_id }}
					</option>
				</select>

				<div v-if="!filteredCustomers.length" class="form-text">
					No matching customers.
				</div>
			</div>

			<div class="col-12">
				<label class="form-label">Customer Concern</label>
				<textarea
					v-model="ticket.description"
					class="form-control"
					rows="7"
					placeholder="Equipment, reported problem, customer notes, etc..."
				></textarea>
			</div>


			<!-- Diagnostics -->
			<div class="col-12 mt-4">
				<h2 class="h4 mb-3">Diagnostics</h2>

				<label class="form-label">Diagnostic Notes</label>
				<textarea
					v-model="ticket.diagnostic_notes"
					class="form-control"
					rows="7"
					placeholder="Inspection findings, test results, diagnosis..."
				></textarea>
			</div>

			<AdminMediaEditor
				class="mt-3"
				title="Diagnostic Media"
				category="diagnostic"
				:entries="categoryMedia('diagnostic')"
				:get-media-url="mediaUrl"
				filename-field="filename"
				poster-field="poster_filename"
				:comment-multiline="true"
				@add="addMedia"
				@update:entries="updateCategoryMedia('diagnostic', $event)"
			/>

			<!-- Service -->
			<div class="col-12 mt-4">
				<h2 class="h4 mb-3">Service Performed</h2>

				<label class="form-label">Service Notes</label>
				<textarea
					v-model="ticket.service_notes"
					class="form-control"
					rows="7"
					placeholder="Work completed, parts replaced, testing performed..."
				></textarea>
			</div>

			<AdminMediaEditor
				class="mt-3"
				title="Service Media"
				category="service"
				:entries="categoryMedia('service')"
				:get-media-url="mediaUrl"
				filename-field="filename"
				poster-field="poster_filename"
				:comment-multiline="true"
				@add="addMedia"
				@update:entries="updateCategoryMedia('service', $event)"
			/>

			<ServiceTicketChargesEditor
				v-if="isEditing"
				:ticket-id="ticketId"
			/>

			<div v-else-if="!isEditing" class="col-12 mt-4">
				<p class="text-muted">
					Create the ticket first, then reopen it to add billing charges.
				</p>
			</div>

			<div class="col-md-6 mt-4">
				<label for="ticket-status" class="form-label">
					Ticket Status
				</label>

				<select
					id="ticket-status"
					v-model="ticket.status"
					class="form-select"
				>
					<option value="new">New</option>
					<option value="pickup_scheduled">Pickup Scheduled</option>
					<option value="diagnostic_complete">Diagnostic Complete</option>
					<option value="services_complete">Services Complete</option>
					<option value="paid">Paid</option>
				</select>

				<div class="form-text">
					Status controls what the customer can see.
				</div>
			</div>

			<div v-if="isEditing" class="col-12">
				<div v-if="token" class="text-muted small">
					Token: <code>{{ token }}</code>
				</div>
				<div v-if="createdAt" class="text-muted small">
					Created: {{ formatDate(createdAt) }}
				</div>
				<div v-if="completedAt" class="text-muted small">
					Completed: {{ formatDate(completedAt) }}
				</div>
			</div>

			<div class="col-12 mt-4">
				<button
					type="submit"
					class="btn btn-primary"
					:disabled="saving"
				>
					{{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Ticket' }}
				</button>
			</div>
		</form>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import AdminMediaEditor from '@/components/admin/AdminMediaEditor.vue';
import ServiceTicketChargesEditor from '@/components/admin/ServiceTicketChargesEditor.vue';

const route = useRoute();
const router = useRouter();

const isEditing = computed(() => Boolean(route.params.id));
const ticketId = computed(() => Number(route.params.id));

const loading = ref(true);
const saving = ref(false);
const loadFailed = ref(false);
const error = ref('');
const numberConflict = ref('');

const customers = ref([]);
const customerSearch = ref('');

const token = ref('');
const createdAt = ref(null);
const completedAt = ref(null);

const ticket = ref({
	ticket_number: '',
	customer_id: '',
	description: '',
	diagnostic_notes: '',
	service_notes: '',
	status: 'new'
});


let nextMediaKey = 1;

const media = ref([]);

const mediaCategories = [
	{ value: 'diagnostic', label: 'Diagnostic Media' },
	{ value: 'service', label: 'Service Media' }
];

const customerReportUrl = computed(() => {
	if (
		!isEditing.value ||
		!ticket.value.ticket_number ||
		!token.value
	) {
		return '';
	}

	return `${window.location.origin}/service-tickets/` +
		`${encodeURIComponent(ticket.value.ticket_number)}/` +
		encodeURIComponent(token.value);
});


useHead(() => ({
	title: `FSER Admin - Service Tickets${ticket.value.ticket_number && route.params.id ? ' - ' + ticket.value.ticket_number : ' - Create'}`
}));

async function checkExternalNumber() {
	const number = String(ticket.value.ticket_number ?? '');

	if (!/^[1-9]\d*$/.test(number) ||
		Number(number) > 4294967295) {
		numberConflict.value = 'Enter a valid ticket number';
		return false;
	}

	const params = new URLSearchParams({
		number,
		kind: 'service',
		excludeId: isEditing.value ? String(ticketId.value) : '0'
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
		numberConflict.value = 'Unable to verify ticket number';
		return false;
	}
}

async function copyCustomerReportUrl() {
	if (!customerReportUrl.value) return;

	await navigator.clipboard.writeText(customerReportUrl.value);
}

function addMedia(category) {
	media.value.push({
		key: nextMediaKey++,
		filename: '',
		media_type: 'image',
		poster_filename: '',
		comment: '',
		category
	});
}

// Accept the editor's new order for one category only.
// Keep the other category's entries in their existing positions.
function updateCategoryMedia(category, entries) {
	let index = 0;

	const updated = media.value.flatMap(entry => {
		if (entry.category !== category) return [entry];

		return index < entries.length
			? [entries[index++]]
			: [];
	});

	// Also supports additional entries if the editor ever adds them.
	media.value = [...updated, ...entries.slice(index)];
}

function categoryMedia(category) {
	return media.value.filter(entry => entry.category === category);
}

function mediaUrl(filename) {
	if (!filename?.trim() || !token.value ||
		!ticket.value.ticket_number) {
		return null;
	}

	const folder = `${ticket.value.ticket_number}-${token.value}`;
	const file = encodeURIComponent(filename.trim());

	return `https://media.fargosmallenginerepair.com/service/${encodeURIComponent(folder)}/${file}`;
}



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
		Number(customer.id) === Number(ticket.value.customer_id)
	);
});

function formatDate(value) {
	return new Date(value).toLocaleString('en-US');
}

onMounted(async () => {
	try {
		const customersResponse = await fetch('/api/admin/customers', {
			credentials: 'same-origin'
		});

		if (!customersResponse.ok) {
			throw new Error('Unable to load customers');
		}

		customers.value = await customersResponse.json();

		if (!isEditing.value) {
			const nextResponse = await fetch(
				'/api/admin/external-ids/next',
				{ credentials: 'same-origin', cache: 'no-store' }
			);

			if (!nextResponse.ok) {
				throw new Error('Unable to suggest next ticket number');
			}

			const { nextNumber } = await nextResponse.json();
			ticket.value.ticket_number = nextNumber;
		}

		if (isEditing.value) {
			if (!Number.isSafeInteger(ticketId.value) || ticketId.value < 1) {
				throw new Error('Invalid ticket ID');
			}

			const response = await fetch(
				`/api/admin/service-tickets/${ticketId.value}`,
				{ credentials: 'same-origin' }
			);

			if (!response.ok) {
				throw new Error(
					response.status === 404
						? 'Ticket not found'
						: 'Unable to load service ticket'
				);
			}

			const existing = await response.json();

			ticket.value = {
				ticket_number: existing.ticket_number,
				customer_id: existing.customer_id,
				description: existing.description ?? '',
				diagnostic_notes: existing.diagnostic_notes ?? '',
				service_notes: existing.service_notes ?? '',
				status: existing.status ?? 'new'
			};

			token.value = existing.token;
			createdAt.value = existing.created_at;
			completedAt.value = existing.completed_at;

			media.value = (existing.media ?? []).map(entry => ({
				key: nextMediaKey++,
				filename: entry.filename,
				media_type: entry.media_type,
				poster_filename: entry.poster_filename ?? '',
				comment: entry.comment ?? '',
				category: entry.category
			}));

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

		const url = isEditing.value
			? `/api/admin/service-tickets/${ticketId.value}`
			: '/api/admin/service-tickets';

		const response = await fetch(url, {
			method: isEditing.value ? 'PUT' : 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...ticket.value,
				media: media.value.map(entry => ({
					filename: entry.filename.trim(),
					media_type: entry.media_type,
					poster_filename: entry.media_type === 'video'
						? entry.poster_filename.trim() || null
						: null,
					comment: entry.comment,
					category: entry.category
				}))
			})

		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to save service ticket');
		}

		await router.push('/admin/service-tickets');
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
