<script setup>
import { useHead } from '@unhead/vue'
import { ref, computed, onMounted } from 'vue'

useHead({
	title: 'Small Engine Repair Services in Fargo, ND | Fargo Small Engine Repair',

	meta: [
		{
			name: 'description',
			content:
				'Lawn mower, snow blower, pressure washer, and other small engine repair and maintenance services in Fargo, ND.'
		}
	]
});

const inventoryByType = computed(() => {
	const groups = new Map();

	for (const item of inventory.value) {
		if (!groups.has(item.type_id)) {
			groups.set(item.type_id, {
				id: item.type_id,
				name: item.type_name,
				description: item.type_description,
				items: []
			});
		}

		groups.get(item.type_id).items.push(item);
	}

	return Array.from(groups.values());
});


const showDeliveryBanner = true;
const inventory = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
	try {
		const response = await fetch('/api/inventory')

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`)
		}

		inventory.value = await response.json()
	} catch (err) {
		console.error(err)
		error.value = 'Unable to load inventory'
	} finally {
		loading.value = false
	}
});
</script>

<template>
	<main>

		<!-- Page intro -->
		<section class="bg-light py-5 border-bottom">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-lg-9 text-center">

						<h1 class="display-5 fw-bold mb-3">
							Outdoor Equipment For Sale
						</h1>

						<p class="lead text-muted mb-0">
							Quality used equipment without the new equipment price tag.
						</p>

					</div>
				</div>
			</div>
		</section>


		<!-- Inventory -->

		<section v-if="loading" class="py-5">
			<div class="container">
				<p>Loading...</p>
			</div>
		</section>

		<section v-else-if="error" class="py-5">
			<div class="container">
				<p>{{ error }}</p>
			</div>
		</section>

		<template v-else>
			<template
				v-for="(type, index) in inventoryByType"
				:key="type.id"
			>
				<section class="py-5">
					<div class="container">
						<section class="mb-5">
							<div class="mb-4">
								<h2 class="fw-bold mb-2">
									{{ type.name }}
								</h2>

								<p class="lead text-muted mb-0">
									{{ type.description }}
								</p>
							</div>

							<div class="row g-4">
								<div
									v-for="item in type.items"
									:key="item.id"
									class="col-md-6 col-lg-4"
								>
									<div class="card h-100 shadow-sm">

									<img
										v-if="item.image_url"
										:src="`/inventory-images/${item.sku}/${item.image_url}`"
										:alt="item.name"
										class="card-img-top inventory-image"
									>

										<div class="card-body d-flex flex-column">

											<h3 class="h5 card-title fw-bold">
												{{ item.name }}
											</h3>

											<p class="text-muted small mb-2">
												SKU: {{ item.sku }}
											</p>

											<p class="card-text inventory-description">
												{{ item.description }}
											</p>

											<div class="mt-auto pt-3">
												<div class="fs-4 fw-bold">
													${{ Number(item.price).toFixed(2) }}
												</div>
											</div>

										</div>
									</div>
								</div>
							</div>
						</section>

						<!-- Free delivery banner -->
						<section
							v-if="showDeliveryBanner && index === 0"
							class="delivery-banner py-3 mb-5"
						>
							<div class="container text-center">
								<div class="fw-bold fs-5">
									🚚 FREE DELIVERY IN FARGO–MOORHEAD
								</div>

								<div class="small">
									Free local delivery with any equipment purchase.
								</div>
							</div>
						</section>
					</div>
				</section>
			</template>
		</template>


		<!-- CTA -->
		<section class="bg-dark text-light py-5">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-lg-8 text-center">

						<h2 class="fw-bold mb-3">
							Need Something Fixed?
						</h2>

						<p class="lead mb-4">
							Tell us what equipment you have and what it’s doing.
							We’ll help determine the best way to get it running again.
						</p>

						<div class="d-flex justify-content-center gap-3 flex-wrap">
							<RouterLink
								to="/contact"
								class="btn btn-primary btn-lg"
							>
								Request Service
							</RouterLink>

							<a
								href="tel:+17014918696"
								class="btn btn-outline-light btn-lg"
							>
								Call 701-491-8696
							</a>
						</div>

					</div>
				</div>
			</div>
		</section>

	</main>
</template>

<style scoped>
.inventory-description {
	white-space: pre-line;
}
.inventory-image {
	height: 350px;
	object-fit: cover;
}
.delivery-banner {
	background: #ffc107;
	color: #212529;
	border-bottom: 1px solid rgba(0, 0, 0, 0.15);
}
</style>
