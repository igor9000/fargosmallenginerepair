
<template>
	<section class="container-fluid">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1>{{ isEditing ? 'Edit Inventory' : 'Add Inventory' }}</h1>
			<RouterLink to="/admin/inventory" class="btn btn-outline-secondary">
				Cancel
			</RouterLink>
		</div>

		<div v-if="error" class="alert alert-danger">{{ error }}</div>

		<form @submit.prevent="save" class="row g-3" style="max-width: 950px">
			<div class="col-md-4">
				<label class="form-label">SKU *</label>
				<input v-model="item.sku" class="form-control"
					maxlength="255" required />
			</div>

			<div class="col-md-8">
				<label class="form-label">Name *</label>
				<input v-model="item.name" class="form-control"
					maxlength="255" @input="updateSlug" required />
			</div>

			<div class="col-12">
				<label class="form-label">Description</label>
				<textarea v-model="item.description"
					class="form-control" rows="5"></textarea>
			</div>

			<div class="col-md-4">
				<label class="form-label">Price</label>
				<input v-model="item.price" type="number" min="0"
					max="99999999.99" step="0.01" class="form-control" />
			</div>

			<div class="col-md-4">
				<label class="form-label">Inventory Type *</label>
				<select v-model="item.inventory_type_id"
					class="form-select" required>
					<option value="" disabled>Select type</option>
					<option v-for="type in types" :key="type.id" :value="type.id">
						{{ type.name }}
					</option>
				</select>
			</div>

			<div class="col-md-4">
				<label class="form-label">Brand</label>
				<select v-model="item.brand_id" class="form-select">
					<option :value="null">No brand</option>
					<option v-for="brand in brands" :key="brand.id" :value="brand.id">
						{{ brand.name }}
					</option>
				</select>
			</div>

			<div class="col-12">
				<label class="form-label">Slug</label>
				<input v-model="item.slug" @input="slugEdited = true"
					class="form-control" maxlength="255" />
			</div>

			<div class="col-12 d-flex gap-4 flex-wrap">
				<label v-for="field in flags" :key="field" class="form-check">
					<input v-model="item[field]" type="checkbox"
						class="form-check-input" />
					<span class="form-check-label text-capitalize">{{ field }}</span>
				</label>
			</div>

			<!-- Media -->
			<div class="col-12 mt-5">
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h2 class="h4 mb-0">Images & Videos</h2>
					<button type="button" class="btn btn-outline-primary btn-sm"
						@click="addMedia">
						+ Add Media
					</button>
				</div>

				<p class="text-muted small">
					Enter filenames only. Files must already exist on the media server.
				</p>
				
				<div v-for="(media, index) in item.images"
					:key="media.key" class="card mb-3">
					<div class="card-body">
						<div class="row g-3">
							<!-- Preview -->
							<div class="col-lg-3">
								<div class="border rounded bg-light d-flex align-items-center
									justify-content-center overflow-hidden"
									style="height: 240px">

									<img
										v-if="media.media_type === 'image' &&
											getInventoryMediaUrl(media.url) &&
											media.previewError !== getInventoryMediaUrl(media.url)"
										:key="getInventoryMediaUrl(media.url)"
										:src="getInventoryMediaUrl(media.url)"
										:alt="media.url"
										class="w-100 h-100"
										style="object-fit: contain"
										@error="media.previewError = getInventoryMediaUrl(media.url)"
									/>

									<video
										v-else-if="media.media_type === 'video' && media.url.trim()"
										:src="getInventoryMediaUrl(media.url)"
										:poster="getInventoryMediaUrl(media.poster_url) || undefined"
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

									<div class="col-md-5">
										<select v-model="media.media_type"
											class="form-select"
											@change="mediaTypeChanged(media)">
											<option value="image">Image</option>
											<option value="video">Video</option>
										</select>
									</div>

									<!-- Active / Primary -->
									<div class="col-md-5 d-flex align-items-center
										gap-3 flex-wrap">

										<label class="form-check mb-0">
											<input type="checkbox"
												v-model="media.is_active"
												class="form-check-input"
												@change="ensurePrimary" />
											<span class="form-check-label">Active</span>
										</label>

										<label v-if="media.media_type === 'image'"
											class="form-check mb-0">
											<input type="radio"
												name="primaryImage"
												class="form-check-input"
												:checked="media.is_primary"
												:disabled="!media.is_active"
												@change="setPrimary(index)" />
											<span class="form-check-label">Primary image</span>
										</label>
									</div>

									<!-- Filename / Poster -->
									<div class="col-md-2">
										<label class="form-label mb-0">Filename *</label>
									</div>

									<div class="col-md-10">
										<div class="row g-2 align-items-center">
											<div :class="media.media_type === 'video'
												? 'col-md-6' : 'col-12'">
												<input v-model="media.url"
													class="form-control"
													placeholder="Filename"
													maxlength="255"
													required />
											</div>

											<div v-if="media.media_type === 'video'"
												class="col-md-6">
												<div class="d-flex align-items-center gap-2">
													<label :for="`poster-${media.key}`"
														class="form-label mb-0 text-nowrap">
														Poster
													</label>
													<input :id="`poster-${media.key}`"
														v-model="media.poster_url"
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
										<input v-model="media.comment"
											class="form-control"
											placeholder="Optional comment"
											maxlength="255" />
									</div>
								</div>

								<!-- Actions -->
								<div class="d-flex gap-2 mt-auto pt-3">
									<button type="button"
										class="btn btn-outline-secondary btn-sm flex-fill"
										:disabled="index === 0"
										@click="moveMedia(index, -1)">
										↑ Up
									</button>

									<button type="button"
										class="btn btn-outline-secondary btn-sm flex-fill"
										:disabled="index === item.images.length - 1"
										@click="moveMedia(index, 1)">
										↓ Down
									</button>

									<button type="button"
										class="btn btn-outline-danger btn-sm flex-fill"
										@click="removeMedia(index)">
										Remove
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<p v-if="!item.images.length" class="text-muted">
					No media added yet.
				</p>
			</div>

			<!-- Attributes -->
			<div class="col-12 mt-5">
				<h2 class="h4 mb-3">Attributes</h2>

				<div v-if="!attributes.length" class="text-muted">
					No attribute definitions available.
				</div>

				<div class="row g-3">
					<div v-for="attribute in attributes"
						:key="attribute.id" class="col-md-6">
						<label class="form-label">
							{{ attribute.name }}
							<span v-if="attribute.unit" class="text-muted">
								({{ attribute.unit }})
							</span>
						</label>

						<select v-if="attribute.data_type === 'boolean'"
							v-model="attributeValues[attribute.id]" class="form-select">
							<option value="">Not specified</option>
							<option value="true">Yes</option>
							<option value="false">No</option>
						</select>

						<input v-else
							v-model="attributeValues[attribute.id]"
							:type="attribute.data_type === 'number' ? 'number' : 'text'"
							:step="attribute.data_type === 'number' ? 'any' : undefined"
							class="form-control" />
					</div>
				</div>
			</div>

			<div class="col-12 mt-4">
				<button type="submit" class="btn btn-primary"
					:disabled="saving || loading">
					{{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Inventory Item' }}
				</button>
			</div>
		</form>
	</section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const isEditing = computed(() => Boolean(route.params.id));
const inventoryId = computed(() => Number(route.params.id));

const brands = ref([]);
const types = ref([]);
const attributes = ref([]);
const attributeValues = ref({});
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const slugEdited = ref(false);

const flags = ['active', 'pending', 'featured', 'clearance'];

let nextMediaKey = 1;

const item = ref({
	sku: '',
	name: '',
	description: '',
	price: '',
	slug: '',
	inventory_type_id: '',
	brand_id: null,
	active: false,
	pending: false,
	featured: false,
	clearance: false,
	images: []
});

function getInventoryMediaUrl(filename) {
	const sku = String(item.value.sku ?? '').trim();
	const name = String(filename ?? '').trim();

	if (!sku || !name) return '';

	return `https://media.fargosmallenginerepair.com/inventory/${encodeURIComponent(sku)}/${encodeURIComponent(name)}`;
}

function updateSlug() {
	if (slugEdited.value) return;

	item.value.slug = item.value.name
		.toLowerCase()
		.trim()
		.replace(/["“”]/g, 'in')
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}


function addMedia() {
	const hasPrimary = item.value.images.some(media =>
		media.media_type === 'image' &&
		media.is_active &&
		media.is_primary
	);

	item.value.images.push({
		key: nextMediaKey++,
		url: '',
		comment: '',
		media_type: 'image',
		poster_url: '',
		is_active: true,
		is_primary: !hasPrimary
	});
}

function setPrimary(index) {
	const selected = item.value.images[index];

	if (selected.media_type !== 'image' || !selected.is_active) return;

	item.value.images.forEach((media, i) => {
		media.is_primary = i === index;
	});
}

function ensurePrimary() {
	const images = item.value.images.filter(media =>
		media.media_type === 'image' && media.is_active
	);

	const primary = images.find(media => media.is_primary);

	item.value.images.forEach(media => {
		media.is_primary = media === primary;
	});

	if (!primary && images.length) {
		images[0].is_primary = true;
	}
}


function mediaTypeChanged(media) {
	if (media.media_type === 'video') {
		media.is_primary = false;
	}

	ensurePrimary();
}

function removeMedia(index) {
	item.value.images.splice(index, 1);
	ensurePrimary();
}

function moveMedia(index, direction) {
	const target = index + direction;

	if (target < 0 || target >= item.value.images.length) return;

	const media = item.value.images.splice(index, 1)[0];
	item.value.images.splice(target, 0, media);
}

onMounted(async () => {
	try {
		const response = await fetch('/api/admin/inventory/options', {
			credentials: 'same-origin'
		});

		if (!response.ok) throw new Error('Could not load inventory options');

		const data = await response.json();

		brands.value = data.brands;
		types.value = data.types;
		attributes.value = data.attributes;

		for (const attribute of attributes.value) {
			attributeValues.value[attribute.id] =
				attribute.slug === 'warranty' ? '30 days' : '';
		}

		
		if (isEditing.value) {
			if (!Number.isSafeInteger(inventoryId.value) ||
				inventoryId.value < 1) {
				throw new Error('Invalid inventory ID');
			}

			const response = await fetch(
				`/api/admin/inventory/${inventoryId.value}`,
				{ credentials: 'same-origin' }
			);

			if (!response.ok) {
				throw new Error('Could not load inventory item');
			}

			const data = await response.json();
			const existing = data.item;

			item.value = {
				sku: existing.sku,
				name: existing.name,
				description: existing.description ?? '',
				price: existing.price ?? '',
				slug: existing.slug,
				inventory_type_id: existing.inventory_type_id,
				brand_id: existing.brand_id,
				active: Boolean(existing.active),
				pending: Boolean(existing.pending),
				featured: Boolean(existing.featured),
				clearance: Boolean(existing.clearance),
				images: data.images.map(image => ({
					key: nextMediaKey++,
					url: image.url,
					comment: image.comment ?? '',
					media_type: image.media_type,
					poster_url: image.poster_url ?? '',
					is_primary: Boolean(image.is_primary),
					is_active: image.is_active == null
						? true
						: Boolean(image.is_active)
				}))
			};

			// Editing must reflect stored values, not creation defaults.
			for (const attribute of attributes.value) {
				attributeValues.value[attribute.id] = '';
			}

			for (const attribute of data.attributes) {
				attributeValues.value[attribute.id] = attribute.value ?? '';
			}
		}

	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
});

async function save() {
	if (saving.value) return;

	saving.value = true;
	error.value = '';

	try {
		const payload = {
			...item.value,
			price: item.value.price === '' ? null : item.value.price,
			images: item.value.images.map((media, index) => ({
				url: media.url.trim(),
				comment: media.comment,
				media_type: media.media_type,
				poster_url: media.media_type === 'video'
					? media.poster_url.trim() || null
					: null,
				is_primary: media.is_primary,
				is_active: media.is_active,
				sort_order: index + 1
			})),
			attributes: attributes.value
				.filter(attribute => {
					const value = attributeValues.value[attribute.id];
					return value !== '' && value !== null && value !== undefined;
				})
				.map(attribute => ({
					id: attribute.id,
					value: String(attributeValues.value[attribute.id])
				}))
		};

		
		const url = isEditing.value
			? `/api/admin/inventory/${inventoryId.value}`
			: '/api/admin/inventory';

		const response = await fetch(url, {
			method: isEditing.value ? 'PUT' : 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});


		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Unable to create inventory item');
		}

		await router.push('/admin/inventory');
	} catch (err) {
		error.value = err.message;
	} finally {
		saving.value = false;
	}
}
</script>
