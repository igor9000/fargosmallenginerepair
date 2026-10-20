
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
						v-if="entry.comment"
						class="p-3 small text-muted media-comment"
					>
						{{ entry.comment }}
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
</script>

<style scoped>
.media-preview {
	aspect-ratio: 4 / 3;
	object-fit: contain;
	background: #171717;
	display: block;
}

.media-comment {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
</style>
