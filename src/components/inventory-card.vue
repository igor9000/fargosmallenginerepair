<script setup>
const props = defineProps({
	item: {
		type: Object,
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


			<div class="row align-items-center">
				<div class="col lh-1">
					<img
						v-if="item.brand_logo"
						:src="`/images/brands/${item.brand_logo}`"
						:alt="item.brand_name"
						class="brand-logo"
					>
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


			<div class="row align-items-start">
				<div class="col lh-1">
					<h5 class="h5 card-title fw-bold my-3">
						{{ item.name }}
					</h5>
				</div>
			</div>

			<div class="mt-auto pt-3">
				<div class="d-flex">
					<RouterLink
						:to="`/inventory/${item.sku}`"
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
	height: 250px;
	object-fit: cover;
}

.brand-logo {
	max-width: 100%;
	max-height: 42px;
	object-fit: contain;
	object-position: left center;
}

.pricetag {
	width: 1em;
	height: 1em;
	object-fit: contain;
}
</style>
