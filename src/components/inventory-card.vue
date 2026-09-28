<script setup>
const props = defineProps({
	item: {
		type: Object,
		required: true
	}
})
</script>

<template>
	<div class="card h-100 shadow-sm inventory-card">

		<img
			v-if="item.image_url"
			:src="`/images/inventory/${item.sku}/${item.image_url}`"
			:alt="item.name"
			class="card-img-top inventory-image"
		>

		<div class="card-body d-flex flex-column">

			<!-- Brand / price -->
			<div class="d-flex justify-content-between align-items-center gap-3 mb-3">
				<img
					v-if="item.brand_logo"
					:src="`/images/brands/${item.brand_logo}`"
					:alt="item.brand_name"
					class="brand-logo"
				>

				<div class="fs-5 fw-bold d-flex align-items-center gap-2 flex-shrink-0">
					<img
						src="/images/icons/pricetag.png"
						alt=""
						class="pricetag"
					>
					<span>
						${{ Number(item.price).toFixed(2) }}
					</span>
				</div>
			</div>

			<h5 class="card-title fw-bold mb-3">
				{{ item.name }}
			</h5>

			<div class="mt-auto">
				<RouterLink
					:to="`/inventory/${item.sku}`"
					class="btn btn-primary w-100"
				>
					View {{ item.type_singular_name || 'Machine' }}
				</RouterLink>
			</div>

		</div>

	</div>
</template>

<style scoped>
.inventory-card {
	border-radius: .5rem;
	overflow: hidden;
}

.inventory-image {
	aspect-ratio: 4 / 3;
	width: 100%;
	object-fit: cover;
}

.brand-logo {
	max-width: 45%;
	max-height: 42px;
	object-fit: contain;
	object-position: left center;
}

.pricetag {
	width: 1em;
	height: 1em;
	object-fit: contain;
}

.card-title {
	line-height: 1.25;
}
</style>