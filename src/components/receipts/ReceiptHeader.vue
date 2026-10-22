<template>
	<header class="mb-4">
		<div class="row align-items-start">
			<div class="col-4 col-lg-6">
				<img
					src="/logo-square.png"
					alt="Fargo Small Engine Repair"
					class="img-fluid mb-3"
					style="max-height: 250px"
				/>
			</div>

			<div class="col-8 col-lg-6 text-end">
				<h1 class="h2 mb-1">
					{{ title }}
				</h1>

				<p v-if="date" class="text-muted small mb-2">
					{{ dateLabel }}: {{ formatDate(date) }}
				</p>

				<span
					v-if="status"
					class="badge fs-6"
					:class="statusClass"
				>
					{{ status }}
				</span>

				<div class="d-flex flex-column gap-1 mt-3">
					<div>701-491-8696</div>
					<div>adam@fargosmallenginerepair.com</div>
					<div>www.fargosmallenginerepair.com</div>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup>
defineProps({
	title: {
		type: String,
		required: true
	},
	date: {
		type: [String, Date, Number],
		default: null
	},
	dateLabel: {
		type: String,
		default: 'Date'
	},
	status: {
		type: String,
		default: ''
	},
	statusClass: {
		type: String,
		default: 'bg-secondary'
	}
});

function formatDate(value) {
	if (!value) return '';

	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'America/Chicago'
	}).format(new Date(value));
}
</script>
