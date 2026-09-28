<script setup>
const props = defineProps({
	item: {
		type: Array,
		required: true
	}
})

</script>

<template>
<div>
			<div class="card h-100 shadow-sm inventory-card">

				<img
					v-if="item.image_url"
					:src="`/images/inventory/${item.sku}/${item.image_url}`"
					:alt="item.name"
					class="card-img-top inventory-image"
				>

				<div class="card-body d-flex flex-column">

					<!-- Brand / availability -->
					<div class="d-flex justify-content-between align-items-center mb-3">
						<img
							v-if="item.brand_logo"
							:src="`/images/brands/${item.brand_logo}`"
							:alt="item.brand_name"
							class="brand-logo"
						>

						<span v-if="false" class="badge rounded-pill bg-success-subtle text-success">
							● Available
						</span>
					</div>

					<hr class="mt-0 mb-3">

					<div class="row align-items-start">
						<div class="col lh-1">
							<h5 class="h5 card-title fw-bold">
								{{ item.name }}
							</h5>

							<p class="text-muted small">
								SKU: {{ item.sku }}
							</p>
						</div>
						<div class="col-auto fs-4 fw-bold lh-1 d-flex align-items-center gap-2">
							<img
								src="/images/icons/pricetag.png"
								alt=""
								class="pricetag"
							/>
							<span>${{ Number(item.price).toFixed(2) }}</span>
						</div>
					</div>

					<p class="card-text inventory-description">
						{{ item.description }}
					</p>

					<div class="mt-auto pt-3">
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
								More Details
							</RouterLink>

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
.pricetag {
	width: 1em;
	height: 1em;
	object-fit: contain;
}
</style>
