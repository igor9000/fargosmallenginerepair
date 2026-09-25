<script setup>
import { computed } from 'vue'

const props = defineProps({
	title: String,
	body: String,
	alt: String,
	image: String,
	style: String
})

const imgsrc = computed(() => {
	return `/images/services/${props.image}`
})
</script>

<template>
	<div class="col-md-4">
		<div class="card service-card h-100">
			<img
				:src="imgsrc"
				class="card-img-top service-image"
				:alt="alt"
				:style="style"
			>
			<div class="card-body p-4">
				<h2 class="h3">{{title}}</h2>

				<p class="mb-0">
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
