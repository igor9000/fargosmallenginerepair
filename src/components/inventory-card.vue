<script setup>
import { computed } from 'vue'

const props = defineProps({
	item: Object
})

</script>

<template>
	<div class="row g-4">
		<div
			v-for="item in type.items"
			:key="item.id"
			class="col-md-6 col-lg-4"
		>
			<div class="card h-100 shadow-sm inventory-card">

				<img
					v-if="item.image_url"
					:src="`/inventory-images/${item.sku}/${item.image_url}`"
					:alt="item.name"
					class="card-img-top inventory-image"
				>

				<div class="card-body d-flex flex-column">

					<!-- Brand / availability -->
					<div class="d-flex justify-content-between align-items-center mb-3">
						<img
							v-if="item.brand_logo_url"
							:src="`/images/brands/${iitem.brand_logo_url}`"
							:alt="item.brand_name"
							class="brand-logo"
						>

						<span v-if="false" class="badge rounded-pill bg-success-subtle text-success">
							● Available
						</span>
					</div>

					<hr class="mt-0 mb-3">

					<h3 class="h5 card-title fw-bold mb-1">
						{{ item.name }}
					</h3>

					<p class="text-muted small mb-3">
						SKU: {{ item.sku }}
					</p>

					<p class="card-text inventory-description">
						{{ item.description }}
					</p>

					<div class="mt-auto pt-3">

						<div class="fs-4 fw-bold mb-3">
							${{ Number(item.price).toFixed(2) }}
						</div>

						<div class="d-flex">
							<RouterLink
								:to="{
									path: '/contact',
									query: {
										sku: item.sku
									}
								}"
								class="btn btn-primary flex-fill"
							>
								Schedule Viewing
							</RouterLink>

						</div>

					</div>

				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.inventory-card {
	border-radius: 0.5rem;
	overflow: hidden;
}

.inventory-image {
	height: 350px;
	object-fit: cover;
}

.brand-logo {
	max-width: 150px;
	max-height: 42px;
	object-fit: contain;
	object-position: left center;
}

.inventory-description {
	white-space: pre-line;
}
</style>
