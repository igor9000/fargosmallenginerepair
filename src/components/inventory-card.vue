<script setup>
import { computed } from 'vue'
const props = defineProps({
	item: {
		type: Object,
		required: true
	}
})


const ribbon = computed(() => {
	if (props.item.pending) {
		return {
			class: `sale-pending-ribbon`,
			text: 'Sale Pending'
		}
	} else if (props.item.clearance) {
		return {
			class: `clearance-ribbon`,
			text: 'Clearance'
		}
	}
	return false;
})
</script>

<template>
<div>	
	<div :class="{
		 	'card h-100': true,
		 	'shadow-sm': true,
		 	'inventory-card': true,
			'card-sale-pending': item.pending === 1,
			'card-clearance': item.clearance === 1
		}">

		<div
			v-if="item.image_url"
			class="inventory-image-wrap"
		>
			<img
				:src="`/images/inventory/${item.sku}/${item.image_url}`"
				:alt="item.name"
				class="card-img-top inventory-image"
			>

			<div
				v-if="ribbon"
				:class="`inventory-ribbon ${ribbon.class}`"
			>
				{{ribbon.text}}
			</div>
		</div>

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
						:to="`/inventory/${item.slug}/${item.sku}`"
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

.inventory-image-wrap {
	position: relative;
	overflow: hidden;
}

.inventory-image {
	display: block;
	width: 100%;
	height: 250px;
	object-fit: cover;
}

.inventory-ribbon {
	top: 4.75rem;
	left: -6.5rem;
	width: 25rem;
	font-size: 1.5rem;


	position: absolute;
	z-index: 2;
	padding: 0.35rem 0;
	transform: rotate(-45deg);
	background: #fff;
	color: #000;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	font-weight: 800;
	line-height: 1;
	letter-spacing: 0.03em;
	text-align: center;
	text-transform: uppercase;
	pointer-events: none;
}
.clearance-ribbon {
	color: #333;
	background-color: #fff64d;
}
.sale-pending-ribbon {
	color: #eee;
	background-color: #333;
	opacity: .85;
}
.sale-ribbon {
	color: #eee;
	background-color: #2dd11b;
}

.brand-logo {
	max-width: 100%;
	max-height: 2em;
	object-fit: contain;
	object-position: left center;
}

.pricetag {
	width: 1em;
	height: 1em;
	object-fit: contain;
}

.card-sale-pending {
	opacity: .7;
}
</style>
