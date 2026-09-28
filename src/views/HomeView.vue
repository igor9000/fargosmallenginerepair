<script setup>
import { useHead } from '@unhead/vue'
import { ref, computed, onMounted } from 'vue';
import inventorycard from '../components/inventory-card.vue';
import homecard from '../components/homecard.vue';

useHead({
	title: 'Small Engine Repair Services | Fargo Small Engine Repair',

	meta: [
		{
			name: 'description',
			content:
				'Lawn mower, snow blower, pressure washer, and small engine repair services in Fargo, ND.'
		}
	]
})




const inventory = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
	try {
		const response = await fetch('/api/inventory?featured=true')

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
		<!-- Hero -->
	<section class="bg-light py-5">
		<div class="container py-5 text-center">
			<img src="/logo-horizontal.png" alt="Fargo Small Engine Repair" class="img-fluid" width="929" height="213" />
		</div>
		<div class="container py-5 text-center">
			<h1 class="display-4 fw-bold">
				Small Engine Repair You Can Count On
			</h1>

			<p class="lead mt-3">
				Lawn mowers, snow blowers, generators, and more.
			</p>

			<a href="/contact" class="btn btn-primary btn-lg mt-3">
				Request Service
			</a>
		</div>
	</section>


	<!-- Services -->
	<section id="services" class="py-5">
		<div class="container">

			<div class="text-center mb-5">
				<h2>Services</h2>
				<p class="text-muted">
					Repair and maintenance for your outdoor power equipment.
				</p>
			</div>

			<div class="row g-4">

				<homecard
					title="Lawn Mowers"
					body="Diagnosis, repair, tune-ups, and maintenance."
					image="lawnmower.png"
					alt="Lawn mower cutting grass"
				/>

				<homecard
					title="Snow Blowers"
					body="Get your equipment ready before winter hits."
					image="snowblower.png"
					alt="Snow blower clearing driveway"
				/>

				<homecard
					title="Other Equipment"
					body="Generators, pressure washers, tillers, and more."
					image="pressurewasher.png"
					alt="Pressure washer cleaning driveway"
				/>

			</div>
		</div>
	</section>

	<!-- Inventory -->
	<section id="inventory" class="py-5">
		<div class="container">

			<div class="text-center mb-5">
				<h2>Current Inventory</h2>
				<p class="text-muted">
					Quality used equipment without the new equipment price tag.
				</p>
			</div>

			<div class="row g-4">
				<inventorycard 
					v-if="!loading && !error"
					v-for="item in inventory"
					:key="item.id"
					class="col-md-6 col-lg-3"
					:item
				/>

				<div class="col-md-6 col-lg-3">	
					<div class="card h-100 shadow-sm full-inventory-card">
						<div class="card-body d-flex flex-column justify-content-center text-center p-4">
							<div class="mb-3">
								<i class="bi bi-grid-3x3-gap fs-1"></i>
							</div>

							<h4 class="card-title mb-2">
								See All Inventory
							</h4>

							<p class="card-text text-muted mb-4">
								Browse our selection of fully-serviced equipment.
							</p>

							<a href="/inventory" class="btn btn-primary mt-auto">
								View Inventory
							</a>
						</div>
					</div>
				</div>

			</div>
		</div>
	</section>
	</main>
</template>

<style scoped>
.full-inventory-card {
	border-radius: 0.5rem;
	overflow: hidden;
}
</style>