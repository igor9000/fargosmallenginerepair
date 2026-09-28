<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import InventoryFeaturesBanner from '@/components/inventory-features-banner.vue'

const route = useRoute()

const item = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedImage = ref(null)

const images = computed(() => {
	return item.value?.images ?? []
})

const selectImage = (image) => {
	selectedImage.value = image
}

onMounted(async () => {
	try {
		const response = await fetch(`/api/inventory/${route.params.sku}`)

		if (!response.ok) {
			throw new Error('Inventory item not found')
		}

		item.value = await response.json()

		selectedImage.value =
			images.value.find(image => image.is_primary) ??
			images.value[0] ??
			null
	}
	catch (err) {
		error.value = err.message
	}
	finally {
		loading.value = false
	}
})
</script>

<template>
	<main class="container py-5">

		<div v-if="loading" class="text-center py-5">
			Loading...
		</div>

		<div v-else-if="error" class="alert alert-danger">
			Unable to load product details.
		</div>

		<template v-else-if="item">

			<div class="row g-5">

				<!-- Images -->
				<div class="col-lg-7">

					<div
						v-if="selectedImage"
						class="main-image border rounded-3 bg-light mb-3"
					>
						<img
							:src="selectedImage.url"
							:alt="item.name"
						>
					</div>

					<div
						v-if="images.length > 1"
						class="d-flex gap-2 flex-wrap"
					>
						<button
							v-for="image in images"
							:key="image.id"
							type="button"
							class="thumbnail border rounded-2 p-0"
							:class="{ active: selectedImage?.id === image.id }"
							@click="selectImage(image)"
						>
							<img
								:src="image.url"
								:alt="item.name"
							>
						</button>
					</div>

				</div>


				<!-- Details -->
				<div class="col-lg-5">

					<div class="text-muted mb-2">
						{{ item.brand_name }}
					</div>

					<h1 class="display-6 fw-bold mb-3">
						{{ item.name }}
					</h1>

					<div class="fs-2 fw-bold mb-4">
						${{ Number(item.price).toFixed(2) }}
					</div>

					<p class="lead text-muted">
						{{ item.description }}
					</p>

					<hr class="my-4">

					<div class="mb-4">
						<div class="small text-muted">
							SKU
						</div>

						<div>
							{{ item.sku }}
						</div>
					</div>

					<a
						href="/contact"
						class="btn btn-primary btn-lg w-100"
					>
						I'm Interested
					</a>

				</div>

			</div>


			<!-- Inspection / Warranty / Delivery -->
			<div class="mt-5">
				<InventoryFeaturesBanner
					:isFreeDeliveryPromoActive="true"
				/>
			</div>

		</template>

	</main>
</template>

<style scoped>
.main-image {
	aspect-ratio: 4 / 3;
	overflow: hidden;
}

.main-image img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.thumbnail {
	width: 90px;
	height: 70px;
	overflow: hidden;
	background: var(--bs-light);
	opacity: .7;
}

.thumbnail:hover,
.thumbnail.active {
	opacity: 1;
}

.thumbnail.active {
	outline: 2px solid var(--bs-primary);
	outline-offset: 2px;
}

.thumbnail img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
</style>