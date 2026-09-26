<script setup>
import homecard from '../components/homecard.vue'
import { useHead } from '@unhead/vue'

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

	<!-- Call to Action -->
	<section id="contact" class="py-5">
		<div class="container text-center">

			<h2>Need Something Fixed?</h2>

			<p class="lead">
				Contact us to schedule service.
			</p>

			<a href="/contact" class="btn btn-primary btn-lg mt-3">
				Contact Us
			</a>

		</div>
	</section>
	</main>
</template>

