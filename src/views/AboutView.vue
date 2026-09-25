<script setup>
import { useHead } from '@unhead/vue'

useHead({
	title: 'About | Fargo Small Engine Repair',

	meta: [
		{
			name: 'description',
			content:
				'Learn about Fargo Small Engine Repair, a veteran-owned local business focused on reliable repairs, superior service, and keeping good equipment running.'
		}
	]
})
</script>

<template>
	<main>
<!-- Hero -->
		<section class="bg-light py-5">
			<div class="container text-center py-4">
				<h1 class="display-5 fw-bold">About Fargo Small Engine Repair</h1>
				<p class="lead text-muted mb-0">
					Veteran-owned. Locally operated. Built around reliable repairs and superior service.
				</p>
			</div>
		</section>


		<!-- Story -->
		<section class="py-5">
			<div class="container">
				<div class="row justify-content-center align-items-center g-5">
					<div class="col-lg-4">

						<p class="lead">
							I’m Adam, a U.S. Army veteran and the owner of Fargo Small Engine Repair. I’ve had an interest in figuring out how things work for as long as I can remember, and this business gives me the opportunity to put that experience to work helping others.
						</p>
					</div>
					<div class="col-md-8 col-lg-4">
						<img
							src="/owner.jpg"
							alt="Adam, owner of Fargo Small Engine Repair, in his workshop"
							width="3392"
							height="2544"
							class="img-fluid rounded shadow-sm about-photo mb-5"
						/>
					</div>
				</div>

				<div class="row justify-content-center align-items-center g-5">


					<div class="col-lg-8">

						<p>
							That interest started in the 1990s in my grandfather’s garage.
							He owned a small engine repair shop of his own, so I grew up around lawn mowers,
							engines, tools, and the idea that just because a machine stopped working
							didn’t mean it needed to be thrown away.
						</p>

						<p>
							<em>Years later, that lesson still matters.</em>
						</p>

						<p>
							I’ve spent years restoring small-engine equipment. What started as something I simply enjoyed doing became a way for me to help people save money and keep good equipment running.
							Sometimes a machine that looks finished only needs a relatively simple repair, and fixing it can save someone hundreds of dollars compared with replacing it.
						</p>

					</div>
				</div>
			</div>
		</section>

		<!-- Closing CTA -->
		<section class="bg-light py-5">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-lg-8">

						<h2 class="fw-bold mb-4">Reliable Repairs. Superior Service.</h2>

						<p>
							My goal is simple: diagnose the problem honestly, repair what makes sense, and help you get more life out of the equipment you already own.
						</p>
					</div>

					<div class="col-lg-8 text-center">
						<RouterLink to="/contact" class="btn btn-primary btn-lg">
							Get in Touch
						</RouterLink>

					</div>
				</div>
			</div>
		</section>

	</main>
</template>

<style>
.about-photo {
	width: 100%;
	aspect-ratio: 4 / 3;
	object-fit: cover;
}
</style>
