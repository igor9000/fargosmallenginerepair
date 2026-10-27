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


					<li class="nav-item dropdown d-flex align-items-center">
						<RouterLink
							class="nav-link pe-1"
							to="/inventory">
							Inventory
						</RouterLink>

						<button
							type="button"
							class="nav-link dropdown-toggle dropdown-toggle-split px-1"
							data-bs-toggle="dropdown"
							aria-expanded="false"
							aria-label="Choose inventory category">
						</button>

						<ul class="dropdown-menu dropdown-menu-end">
							<li>
								<RouterLink class="dropdown-item" to="/inventory/all">
									All Inventory
								</RouterLink>
							</li>

							<li>
								<RouterLink class="dropdown-item" to="/inventory/lawn-mowers">
									Lawn Mowers
								</RouterLink>
							</li>

							<li>
								<RouterLink class="dropdown-item" to="/inventory/snow-blowers">
									Snow Blowers
								</RouterLink>
							</li>

							<li><hr class="dropdown-divider"></li>

							<li>
								<RouterLink class="dropdown-item" to="/inventory/other-equipment">
									Other Equipment
								</RouterLink>
							</li>
						</ul>
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