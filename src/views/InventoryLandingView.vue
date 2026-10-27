
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useHead } from '@unhead/vue';
import InventoryFeaturesBanner from '@/components/inventory-features-banner.vue';

const types = ref([]);
const inventory = ref([]);
const loading = ref(true);
const error = ref('');
const failedImages = ref({});

const featuredSlugs = ['lawn-mowers', 'snow-blowers'];

useHead({
	title: 'Used Outdoor Equipment for Sale in Fargo, ND | Fargo Small Engine Repair',
	meta: [
		{
			name: 'description',
			content: 'Browse inspected and serviced used lawn mowers, snow blowers, pressure washers, generators, and more in Fargo, ND.'
		}
	]
});

// Build category data from the existing API responses.
const categoryCards = computed(() => {
	return types.value.map(type => {
		const items = inventory.value.filter(item =>
			Number(item.type_id) === Number(type.id)
		);

		// Pending sales do not count as available.
		const available = items.filter(
			item => !Number(item.pending)
		);

		// Category photos
		const byPriceDescending = (a, b) =>
			Number(b.price) - Number(a.price);

		const photoItem = available
			.filter(item => item.image_url)
			.sort(byPriceDescending)[0]
			?? items
				.filter(item => item.image_url)
				.sort(byPriceDescending)[0];

		return {
			...type,
			count: available.length,
			photoPrice: photoItem ? Number(photoItem.price) : 0,
			photo: photoItem
				? `https://media.fargosmallenginerepair.com/inventory/${encodeURIComponent(photoItem.sku)}/${encodeURIComponent(photoItem.image_url)}`
				: null
		};
	}).sort((a, b) => a.name.localeCompare(b.name));
});

// Always show the two featured types, in this order.
const featuredCategories = computed(() =>
	featuredSlugs
		.map(slug => categoryCards.value.find(
			type => type.slug === slug
		))
		.filter(Boolean)
);

const allAvailableCount = computed(() =>
	categoryCards.value.reduce(
		(total, type) => total + type.count,
		0
	)
);

// Use photos from up to three different stocked categories.
const allEquipmentPhotos = computed(() =>
	categoryCards.value
		.filter(type =>
			type.count > 0 &&
			type.photo &&
			!failedImages.value[type.id]
		)
		.sort((a, b) => b.photoPrice - a.photoPrice)
		.slice(0, 3)
);

// Other categories with available inventory.
const otherAvailable = computed(() =>
	categoryCards.value.filter(type =>
		!featuredSlugs.includes(type.slug) &&
		type.count > 0
	)
);

// Other categories without available inventory.
const otherUnavailable = computed(() =>
	categoryCards.value.filter(type =>
		!featuredSlugs.includes(type.slug) &&
		type.count === 0
	)
);

const availabilityLabel = count =>
	count === 0
		? 'Currently unavailable'
		: `${count} available`;

onMounted(async () => {
	try {
		const [typesResponse, inventoryResponse] =
			await Promise.all([
				fetch('/api/inventory/types'),
				fetch('/api/inventory')
			]);

		if (!typesResponse.ok || !inventoryResponse.ok) {
			throw new Error('Unable to load equipment categories');
		}

		types.value = await typesResponse.json();
		inventory.value = await inventoryResponse.json();
	} catch (err) {
		console.error(err);
		error.value = 'Unable to load equipment categories.';
	} finally {
		loading.value = false;
	}
});
</script>

<template>
	<main>
		<!-- Page intro -->
		<section class="bg-light py-5 border-bottom">
			<div class="container text-center">
				<h1 class="display-5 fw-bold mb-3">
					Outdoor Equipment For Sale
				</h1>

				<p class="lead text-muted mb-0">
					Quality used equipment without the new equipment price tag.
				</p>
			</div>
		</section>

		<section class="py-5">
			<div class="container">

				<p v-if="loading" class="text-muted">
					Loading equipment...
				</p>

				<div v-else-if="error" class="alert alert-danger">
					{{ error }}
				</div>

				<template v-else>

					<!-- FEATURED EQUIPMENT -->
					<section class="mb-5">
						<div class="d-flex flex-wrap
							align-items-center
							justify-content-between
							gap-3 mb-4"
						>
							<h2 class="h3 fw-bold mb-0">
								Featured Equipment
							</h2>
						</div>

						<div class="row g-4">
							<div
								v-for="type in featuredCategories"
								:key="type.id"
								class="col-sm-6 col-lg-4">

								<RouterLink
									:to="`/inventory/${type.slug}`"
									class="card h-100 shadow-sm
										category-card
										text-decoration-none text-reset">

									<div class="category-photo featured-photo bg-body-tertiary">
										<img
											v-if="type.photo && !failedImages[type.id]"
											:src="type.photo"
											:alt="type.name"
											loading="lazy"
											@error="failedImages[type.id] = true"
										/>

										<div v-else class="category-placeholder">
											<span class="fw-semibold text-muted">
												{{ type.name }}
											</span>
										</div>
									</div>

									<div class="card-body">
										<div class="d-flex flex-wrap
											justify-content-between
											align-items-center gap-2">

											<h3 class="h4 fw-bold mb-0">
												{{ type.name }}
											</h3>

											<span class="badge text-bg-light border">
												{{ availabilityLabel(type.count) }}
											</span>
										</div>

										<p class="text-muted mt-2 mb-0">
											{{ type.description }}
										</p>
									</div>
								</RouterLink>

							</div>

<!-- ALL EQUIPMENT CARD -->
<div class="col-sm-6 col-lg-4">
	<RouterLink
		to="/inventory/all"
		class="card h-100 shadow-sm
			category-card
			text-decoration-none text-reset">

		<div class="category-photo featured-photo bg-body-tertiary">
			<div
				v-if="allEquipmentPhotos.length"
				class="all-equipment-collage"
				:class="{
					'single-photo': allEquipmentPhotos.length === 1,
					'two-photos': allEquipmentPhotos.length === 2
				}">

				<img
					v-for="type in allEquipmentPhotos"
					:key="type.id"
					:src="type.photo"
					:alt="type.name"
					loading="lazy"
					@error="failedImages[type.id] = true"
				/>
			</div>

			<div v-else class="category-placeholder">
				<span class="fw-semibold text-muted">
					All Equipment
				</span>
			</div>
		</div>

		<div class="card-body">
			<div class="d-flex flex-wrap
				justify-content-between
				align-items-center gap-2">

				<h3 class="h4 fw-bold mb-0">
					All Equipment
				</h3>

				<span class="badge text-bg-light border">
					{{ availabilityLabel(allAvailableCount) }}
				</span>
			</div>

			<p class="text-muted mt-2 mb-0">
				Browse our complete selection of inspected
				and serviced outdoor power equipment.
			</p>
		</div>
	</RouterLink>
</div>

						</div>
					</section>

					<!-- OTHER EQUIPMENT -->
					<section>
						<div class="d-flex align-items-center gap-3 mb-4">
							<h2 class="h3 fw-bold mb-0 flex-shrink-0">
								Other Equipment
							</h2>

							<hr class="flex-grow-1 border-brand-primary
								border-3 opacity-100 m-0">
						</div>

						<!-- Available categories -->
						<div class="mb-5">
							<h3 class="h5 fw-bold mb-3">
								Currently Available
							</h3>

							<div v-if="otherAvailable.length" class="row g-4">
								<div
									v-for="type in otherAvailable"
									:key="type.id"
									class="col-sm-6 col-lg-4">

									<RouterLink
										:to="`/inventory/${type.slug}`"
										class="card h-100 shadow-sm
											category-card
											text-decoration-none text-reset">

										<div class="category-photo other-photo bg-body-tertiary">
											<img
												v-if="type.photo && !failedImages[type.id]"
												:src="type.photo"
												:alt="type.name"
												loading="lazy"
												@error="failedImages[type.id] = true"
											/>

											<div v-else class="category-placeholder">
												<span class="fw-semibold text-muted">
													{{ type.name }}
												</span>
											</div>
										</div>

										<div class="card-body">
											<div class="d-flex flex-wrap
												justify-content-between
												align-items-center gap-2">

												<h4 class="h5 fw-bold mb-0">
													{{ type.name }}
												</h4>

												<span class="badge text-bg-light border">
													{{ availabilityLabel(type.count) }}
												</span>
											</div>

											<p class="small text-muted mt-2 mb-0">
												{{ type.description }}
											</p>
										</div>
									</RouterLink>
								</div>
							</div>

							<p v-else class="text-muted mb-0">
								No other equipment is currently available.
							</p>
						</div>

						<!-- Unavailable categories -->
						<div v-if="otherUnavailable.length">
							<h3 class="h5 fw-bold mb-2">
								Currently Unavailable
							</h3>

							<p class="small text-muted mb-3">
								We also carry these equipment types,
								but none are available right now.
							</p>

							<div class="d-flex flex-wrap gap-2">
								<RouterLink
									v-for="type in otherUnavailable"
									:key="type.id"
									:to="`/inventory/${type.slug}`"
									class="unavailable-link border rounded-pill
										bg-light text-secondary
										text-decoration-none px-3 py-2">

									{{ type.name }}
								</RouterLink>
							</div>
						</div>

					</section>

				</template>
			</div>
		</section>

		<InventoryFeaturesBanner :isFreeDeliveryPromoActive="true" />
	</main>
</template>

<style scoped>
.category-card {
	overflow: hidden;
	transition: transform .15s ease, box-shadow .15s ease;
}


.category-photo {
	overflow: hidden;
}

.featured-photo {
    height: auto;
    aspect-ratio: 4 / 3;
    background-color: #f8f9fa;
}

.featured-photo img {
    object-fit: contain;
}

.other-photo {
	height: 185px;
}

.category-photo img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.category-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 1rem;
	text-align: center;
}

.unavailable-link {
	font-size: .9rem;
	transition: background-color .15s ease;
}

.unavailable-link:hover {
	background-color: #e9ecef !important;
	color: #212529 !important;
}

.border-brand-primary {
	border-color: var(--fser-brand-primary);
}

@media (max-width: 575.98px) {
	.featured-photo {
		height: 220px;
	}
}









/* All Equipment photo collage */
.all-equipment-collage {
	display: grid;
	grid-template-columns: 1.2fr 1fr;
	grid-template-rows: repeat(2, minmax(0, 1fr));
	gap: 4px;
	padding: 4px;
	width: 100%;
	height: 100%;
}

.all-equipment-collage img {
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	object-fit: cover;
}

.all-equipment-collage img:first-child {
	grid-row: 1 / 3;
}

/* Only two usable photos */
.all-equipment-collage.two-photos img:nth-child(2) {
	grid-row: 1 / 3;
}

/* Only one usable photo */
.all-equipment-collage.single-photo img:first-child {
	grid-column: 1 / 3;
	grid-row: 1 / 3;
	object-fit: contain;
}

</style>
