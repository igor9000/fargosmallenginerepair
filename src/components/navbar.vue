<script setup>
</script>

<template>
	<!-- navbar -->
	<nav class="navbar navbar-expand-lg bg-dark navbar-dark">
		<div class="container">
			<a class="navbar-brand" href="/">
				Fargo Small Engine Repair
			</a>

			<button
				class="navbar-toggler"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#navbarNav"
			>
				<span class="navbar-toggler-icon"></span>
			</button>

			<div class="collapse navbar-collapse" id="navbarNav">
				<ul class="navbar-nav ms-auto">
					<li class="nav-item">
						<RouterLink class="nav-link" to="/services">
							Services
						</RouterLink>
					</li>

					<li class="nav-item">
						<RouterLink class="nav-link" to="/about">
							About
						</RouterLink>
					</li>

					<li class="nav-item">
						<RouterLink class="nav-link" to="/contact">
							Contact
						</RouterLink>
					</li>
				</ul>
			</div>
		</div>
	</nav>
</template>

<style scoped>
</style>