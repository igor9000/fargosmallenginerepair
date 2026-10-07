<script setup>
import { computed } from 'vue'
const props = defineProps({
	image: {
		type: Object,
		required: true
	},
	ribbon: {
		type: Object,
		required: true
	}
})
</script>

<template>
	<div class="inventory-image-wrap">
		<img
			:src="`/images/inventory/${image.src}`"
			:alt="image.name"
			:class="image.class"
		>
		<div
			v-if="ribbon"
			:class="`inventory-ribbon ${ribbon.class}`"
		>
			{{ribbon.text}}
		</div>
	</div>
</template>

<style scoped>
.inventory-image-wrap {
	position: relative;
	overflow: hidden;
}
.inventory-ribbon {
	top: 9.75rem;
	left: -12.5rem;
	width: 50rem;
	font-size: 3rem;


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



@media (max-width: 575.98px) {
	.inventory-ribbon {
		top: 4.75rem;
		left: -6.5rem;
		width: 25rem;
		font-size: 1.5rem;
	}
}
</style>
