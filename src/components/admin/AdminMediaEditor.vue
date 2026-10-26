
<template>
	<div class="col-12">
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h2 class="h4 mb-0">{{ title }}</h2>

			<button type="button"
				class="btn btn-outline-primary btn-sm"
				@click="emit('add', category)">
				+ Add Media
			</button>
		</div>

		<p class="text-muted small">
			Enter filenames only. Files must already exist on the media server.
		</p>

		<div v-for="(entry, index) in entries"
			:key="entry.key" class="card mb-3">
			<div class="card-body">
				<div class="row g-3">

					<!-- Preview -->
					<div class="col-lg-3">
						<div class="border rounded bg-light d-flex
							align-items-center justify-content-center
							overflow-hidden"
							style="height: 240px">

							<img
								v-if="entry.media_type === 'image' &&
									mediaUrl(entry) &&
									entry.previewError !== mediaUrl(entry)"
								:key="mediaUrl(entry)"
								:src="mediaUrl(entry)"
								:alt="entry[filenameField]"
								class="w-100 h-100"
								style="object-fit: contain"
								@error="entry.previewError = mediaUrl(entry)"
							/>

							<video
								v-else-if="entry.media_type === 'video' &&
									mediaUrl(entry)"
								:src="mediaUrl(entry)"
								:poster="posterUrl(entry) || undefined"
								class="w-100 h-100"
								style="object-fit: contain"
								controls
								playsinline
								preload="none"
							></video>

							<span v-else class="text-muted small">
								No preview available
							</span>
						</div>
					</div>

					<!-- Fields -->
					<div class="col-lg-9 d-flex flex-column">
						<div class="row g-3 align-items-center">

							<!-- Media Type -->
							<div class="col-md-2">
								<label class="form-label mb-0">Media Type</label>
							</div>

							<div :class="showFlags ? 'col-md-5' : 'col-md-10'">
								<select v-model="entry.media_type"
									class="form-select"
									@change="emit('media-type-change', entry)">
									<option value="image">Image</option>
									<option value="video">Video</option>
								</select>
							</div>

							<!-- Inventory-only controls -->
							<div v-if="showFlags"
								class="col-md-5 d-flex align-items-center
									gap-3 flex-wrap">

								<label class="form-check mb-0">
									<input v-model="entry.is_active"
										type="checkbox"
										class="form-check-input"
										@change="emit('active-change', entry)" />
									<span class="form-check-label">Active</span>
								</label>

								<label v-if="entry.media_type === 'image'"
									class="form-check mb-0">
									<input type="radio"
										name="primaryImage"
										class="form-check-input"
										:checked="entry.is_primary"
										:disabled="!entry.is_active"
										@change="emit('set-primary', entry)" />
									<span class="form-check-label">
										Primary image
									</span>
								</label>
							</div>

							<!-- Filename / Poster -->
							<div class="col-md-2">
								<label class="form-label mb-0">Filename *</label>
							</div>

							<div class="col-md-10">
								<div class="row g-2 align-items-center">
									<div :class="entry.media_type === 'video'
										? 'col-md-6' : 'col-12'">
										<input v-model="entry[filenameField]"
											class="form-control"
											placeholder="Filename"
											maxlength="255"
											required />
									</div>

									<div v-if="entry.media_type === 'video'"
										class="col-md-6">
										<div class="d-flex align-items-center gap-2">
											<label :for="`poster-${entry.key}`"
												class="form-label mb-0 text-nowrap">
												Poster
											</label>
											<input :id="`poster-${entry.key}`"
												v-model="entry[posterField]"
												class="form-control"
												placeholder="Poster filename"
												maxlength="255" />
										</div>
									</div>
								</div>
							</div>

							<!-- Comment -->
							<div class="col-md-2">
								<label class="form-label mb-0">Comment</label>
							</div>

							<div class="col-md-10">
								<textarea
									v-if="commentMultiline"
									v-model="entry.comment"
									class="form-control"
									rows="3"
									placeholder="Optional comment">
								</textarea>

								<input v-else
									v-model="entry.comment"
									class="form-control"
									placeholder="Optional comment"
									:maxlength="commentMaxLength || undefined" />
							</div>
						</div>

						<!-- Actions -->
						<div class="d-flex gap-2 mt-auto pt-3">
							<button type="button"
								class="btn btn-outline-secondary btn-sm flex-fill"
								:disabled="index === 0"
								@click="emit('move', entry, -1)">
								↑ Up
							</button>

							<button type="button"
								class="btn btn-outline-secondary btn-sm flex-fill"
								:disabled="index === entries.length - 1"
								@click="emit('move', entry, 1)">
								↓ Down
							</button>

							<button type="button"
								class="btn btn-outline-danger btn-sm flex-fill"
								@click="emit('remove', entry)">
								Remove
							</button>
						</div>
					</div>

				</div>
			</div>
		</div>

		<p v-if="!entries.length" class="text-muted small">
			No media added yet.
		</p>
	</div>
</template>

<script setup>
const props = defineProps({
	title: {
		type: String,
		required: true
	},
	category: {
		type: String,
		default: null
	},
	entries: {
		type: Array,
		required: true
	},
	getMediaUrl: {
		type: Function,
		required: true
	},
	filenameField: {
		type: String,
		default: 'url'
	},
	posterField: {
		type: String,
		default: 'poster_url'
	},
	showFlags: {
		type: Boolean,
		default: false
	},
	commentMultiline: {
		type: Boolean,
		default: false
	},
	commentMaxLength: {
		type: Number,
		default: null
	}
});

const emit = defineEmits([
	'add',
	'remove',
	'move',
	'set-primary',
	'active-change',
	'media-type-change'
]);

function mediaUrl(entry) {
	const filename = String(
		entry?.[props.filenameField] ?? ''
	).trim();

	return filename ? props.getMediaUrl(filename) || '' : '';
}

function posterUrl(entry) {
	const filename = String(
		entry?.[props.posterField] ?? ''
	).trim();

	return filename ? props.getMediaUrl(filename) || '' : '';
}
</script>
