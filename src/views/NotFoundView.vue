
<script setup>
import { useHead } from '@unhead/vue';

useHead({
	title: 'Page Not Found | Fargo Small Engine Repair',
	meta: [
		{
			name: 'robots',
			content: 'noindex, follow'
		}
	]
});
</script>

<template>
	<main class="container py-5">
		<div class="row justify-content-center">
			<div class="col-md-8 col-lg-6 text-center py-5">

				<h1 class="display-1 fw-bold text-danger mb-3">
					404
				</h1>

				<h2 class="h3 fw-bold mb-3">
					We Couldn't Find That Page
				</h2>

				<p class="lead text-secondary mb-4">
					The page you're looking for doesn't exist.
				</p>

				<div class="d-flex flex-wrap justify-content-center gap-3">
					<RouterLink
						to="/"
						class="btn btn-primary btn-lg"
					>
						Back to Home
					</RouterLink>

					<RouterLink
						to="/inventory"
						class="btn btn-outline-secondary btn-lg"
					>
						Browse Equipment
					</RouterLink>
				</div>

			</div>
		</div>
	</main>
</template>
