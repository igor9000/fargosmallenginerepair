<script setup>
import { useHead } from '@unhead/vue'

useHead({
	title: 'Small Engine Repair Services in Fargo, ND | Fargo Small Engine Repair',

	meta: [
		{
			name: 'description',
			content:
				'Lawn mower, snow blower, pressure washer, and other small engine repair and maintenance services in Fargo, ND.'
		}
	]
})
</script>

<template>
	<main>

		<!-- Page intro -->
		<section class="bg-light py-5 border-bottom">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-lg-9 text-center">

						<h1 class="display-5 fw-bold mb-3">
							Small Engine Repair Services
						</h1>

						<p class="lead text-muted mb-0">
							Whether your mower won’t start, your snowblower is running rough,
							or your equipment just needs routine maintenance, Fargo Small
							Engine Repair can help get it back in working order.
						</p>

					</div>
				</div>
			</div>
		</section>


		<!-- Services -->
		<section class="py-5">
			<div class="container">

				<div class="row g-4">

					<div class="col-md-6">
						<div class="card service-card h-100">
							<div class="card-body p-4">
								<h2 class="h3">Lawn Mower Repair</h2>

								<p class="mb-0">
									Push mowers, self-propelled mowers, and other lawn equipment
									can develop starting problems, poor performance, fuel issues,
									and other mechanical problems over time. We diagnose the problem
									and make the repairs needed to get you mowing again.
								</p>
							</div>
						</div>
					</div>


					<div class="col-md-6">
						<div class="card service-card h-100">
							<div class="card-body p-4">
								<h2 class="h3">Snowblower Repair</h2>

								<p class="mb-0">
									Don’t wait until the first major snowfall to find out your
									snowblower isn’t ready. We service and repair snowblowers with
									starting issues, fuel-system problems, poor running conditions,
									drive problems, and more.
								</p>
							</div>
						</div>
					</div>


					<div class="col-md-6">
						<div class="card service-card h-100">
							<div class="card-body p-4">
								<h2 class="h3">Tune-Ups &amp; Maintenance</h2>

								<p class="mb-0">
									Routine maintenance helps your equipment start easier, run better,
									and last longer. Services may include oil changes, spark plugs,
									air filters, fuel-system service, blade inspection, and general
									equipment checks.
								</p>
							</div>
						</div>
					</div>


					<div class="col-md-6">
						<div class="card service-card h-100">
							<div class="card-body p-4">
								<h2 class="h3">Fuel &amp; Carburetor Problems</h2>

								<p class="mb-0">
									Old fuel and dirty carburetors are some of the most common causes
									of small-engine problems. If your equipment won’t start, only runs
									with the choke on, surges, stalls, or runs poorly, we can diagnose
									and repair the fuel system.
								</p>
							</div>
						</div>
					</div>


					<div class="col-md-6">
						<div class="card service-card h-100">
							<div class="card-body p-4">
								<h2 class="h3">Engine Diagnostics &amp; Repair</h2>

								<p class="mb-0">
									Sometimes the problem isn’t obvious. We troubleshoot starting,
									ignition, compression, fuel, and mechanical issues to determine
									what’s actually wrong before replacing parts unnecessarily.
								</p>
							</div>
						</div>
					</div>


					<div class="col-md-6">
						<div class="card service-card h-100">
							<div class="card-body p-4">
								<h2 class="h3">Other Outdoor Power Equipment</h2>

								<p class="mb-0">
									We also work on a variety of other small-engine equipment,
									including generators, pressure washers, tillers, and similar
									equipment.
								</p>
							</div>
						</div>
					</div>

				</div>
			</div>
		</section>


		<!-- CTA -->
		<section class="bg-dark text-light py-5">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-lg-8 text-center">

						<h2 class="fw-bold mb-3">
							Need Something Fixed?
						</h2>

						<p class="lead mb-4">
							Tell us what equipment you have and what it’s doing.
							We’ll help determine the best way to get it running again.
						</p>

						<div class="d-flex justify-content-center gap-3 flex-wrap">
							<RouterLink
								to="/contact"
								class="btn btn-primary btn-lg"
							>
								Request Service
							</RouterLink>

							<a
								href="tel:+17014918696"
								class="btn btn-outline-light btn-lg"
							>
								Call 701-491-8696
							</a>
						</div>

					</div>
				</div>
			</div>
		</section>

	</main>
</template>

<style scoped>
.service-card {
	border-top: 4px solid var(--fser-brand-primary);
	box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}

.service-card h2 {
	margin-bottom: 1rem;
}

.service-card p {
	line-height: 1.6;
}
</style>