<script setup>
const props = defineProps({
	showCTA: {
		type: Boolean,
		default: true
	}
})
</script>

<template>
	<!-- CTA -->
	<section v-if="showCTA" class="bg-dark text-light py-5">
		<div class="container">
			<div class="row justify-content-center">
				<div class="col-lg-8 text-center">

					<h2 class="fw-bold mb-3">
						Need Something Fixed?
					</h2>

					<p class="lead mb-4">
						Tell us what equipment you have and what it’s doing.<br />
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

	<!-- Footer -->
	<footer class="bg-dark text-light py-4">
		<div class="container d-flex justify-content-center align-items-center gap-2">
			<small>
				© 2026 Fargo Small Engine Repair
			</small>
			<a
			  href="https://www.facebook.com/people/Adams-Small-Engine-Repair/61560170892373/"
			  target="_blank"
			  rel="noopener noreferrer"
			>
				<img src="/images/icons/facebook.png" class="footer-img">
			</a>
			<RouterLink to="/contact">
				<img src="/images/icons/email.png" class="footer-img">
			</RouterLink>
			<small>
				701-491-8696
			</small>
		</div>
	</footer>
</template>

<style scoped>
.footer-img {
	height: 1em;
}
</style>