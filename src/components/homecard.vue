<script setup>
import { computed } from 'vue'

const props = defineProps({
	title: String,
	body: String,
	alt: String,
	image: String
})

const imgsrc = computed(() => {
	return `/card-images/${props.image}`
})
</script>

<template>
	<div class="col-md-4">
		<div class="card h-100">
			<img
				:src="imgsrc"
				class="card-img-top service-image"
				:alt="alt"
			>

			<div class="card-body">
				<h5 class="card-title">{{title}}</h5>
				<p class="card-text">
					{{body}}
				</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
.service-image {
	width: 100%;
	aspect-ratio: 4 / 3;
	object-fit: cover;
}
</style>
