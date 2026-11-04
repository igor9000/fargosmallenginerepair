
<template>
	<div v-if="entries?.length">
		<h3 class="h6 mb-3">{{ title }}</h3>

		<div class="row g-3">
			<div
				v-for="(entry, index) in entries"
				:key="index"
				class="col-12 col-sm-6 col-lg-4"
			>
				<figure class="border rounded overflow-hidden h-100 mb-0">
					<a
						v-if="entry.media_type === 'image'"
						:href="entry.url"
						target="_blank"
						rel="noopener noreferrer"
						class="d-block"
					>
						<img
							:src="entry.url"
							:alt="entry.comment || 'Service report photo'"
							class="w-100 media-preview"
							loading="lazy"
						/>
					</a>

					<video
						v-else-if="entry.media_type === 'video'"
						:src="entry.url"
						:poster="entry.poster_url || undefined"
						class="w-100 media-preview"
						controls
						preload="metadata"
						playsinline
					>
						Your browser does not support video playback.
					</video>

					<figcaption
						v-if="entry.comment || entry.media_label"
						class="p-3 small text-muted media-comment"
					>
						<span
							v-if="entry.media_label"
							class="badge rounded-pill media-label"
							:class="[
								mediaLabelClass(entry.media_label),
								{ 'me-2': entry.comment }
							]"
						>
							{{ entry.media_label }}
						</span>
						<span
							v-if="entry.comment"
							class="media-comment-text"
						>{{ entry.comment }}</span>
					</figcaption>
				</figure>
			</div>
		</div>
	</div>
</template>

<script setup>
defineProps({
	entries: {
		type: Array,
		default: () => []
	},
	title: {
		type: String,
		default: 'Photos & Videos'
	}
});



function mediaLabelClass(label) {
    switch (label?.toLowerCase()) {
        case 'before':
            return 'bg-warning text-dark';

        case 'after':
            return 'bg-success text-white';

        case 'damage':
            return 'bg-danger text-white';

        case 'machine reference photo':
            return 'bg-secondary';

        case 'showcase':
            return 'bg-dark';

        default:
            return 'bg-info text-dark';
    }
}


</script>

<style scoped>
.media-preview {
	aspect-ratio: 4 / 3;
	object-fit: contain;
	background: #171717;
	display: block;
}

.media-comment {
	overflow-wrap: anywhere;
}

.media-comment-text {
	white-space: pre-wrap;
}

.media-label {
	font-size: 0.65rem;
	letter-spacing: 0.035em;
	text-transform: uppercase;
    vertical-align: middle;
}
</style>
