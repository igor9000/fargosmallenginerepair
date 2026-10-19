
<template>
	<div class="col-12 mt-3">
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h3 class="h5 mb-0">{{ title }}</h3>

			<button
				type="button"
				class="btn btn-outline-primary btn-sm"
				@click="emit('add', category)"
			>
				+ Add Media
			</button>
		</div>

		<div
			v-for="(entry, index) in entries"
			:key="entry.key"
			class="card mb-3"
		>
			<div class="card-body">
				<div class="row g-3">
					<div class="col-md-3">
						<label class="form-label">Type</label>
						<select v-model="entry.media_type" class="form-select">
							<option value="image">Image</option>
							<option value="video">Video</option>
						</select>
					</div>

					<div class="col-md-9">
						<label class="form-label">Filename *</label>
						<input
							v-model="entry.filename"
							class="form-control"
							maxlength="255"
							required
						/>
					</div>

					<div v-if="entry.media_type === 'video'" class="col-12">
						<label class="form-label">Video Poster Filename</label>
						<input
							v-model="entry.poster_filename"
							class="form-control"
							maxlength="255"
						/>
					</div>

					<div class="col-12">
						<label class="form-label">Comment</label>
						<textarea
							v-model="entry.comment"
							class="form-control"
							rows="3"
						></textarea>
					</div>

					<div v-if="getMediaUrl(entry.filename)" class="col-12">
						<img
							v-if="entry.media_type === 'image'"
							:src="getMediaUrl(entry.filename)"
							:alt="`${title} preview`"
							class="img-thumbnail"
							style="max-width: 300px; max-height: 220px; object-fit: contain"
						/>

						<video
							v-else
							:src="getMediaUrl(entry.filename)"
							:poster="getMediaUrl(entry.poster_filename) || undefined"
							controls
							preload="metadata"
							style="max-width: 400px; width: 100%"
						></video>
					</div>

					<div class="col-12 d-flex gap-2">
						<button
							type="button"
							class="btn btn-outline-secondary btn-sm"
							:disabled="index === 0"
							@click="emit('move', entry, -1)"
						>
							↑ Up
						</button>

						<button
							type="button"
							class="btn btn-outline-secondary btn-sm"
							:disabled="index === entries.length - 1"
							@click="emit('move', entry, 1)"
						>
							↓ Down
						</button>

						<button
							type="button"
							class="btn btn-outline-danger btn-sm"
							@click="emit('remove', entry)"
						>
							Remove
						</button>
					</div>
				</div>
			</div>
		</div>

		<p v-if="entries.length === 0" class="text-muted small">
			No media added yet.
		</p>
	</div>
</template>

<script setup>
defineProps({
	title: {
		type: String,
		required: true
	},
	category: {
		type: String,
		required: true
	},
	entries: {
		type: Array,
		required: true
	},
	getMediaUrl: {
		type: Function,
		required: true
	}
});

const emit = defineEmits(['add', 'remove', 'move']);
</script>
