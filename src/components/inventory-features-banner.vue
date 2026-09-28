<script setup>
const props = defineProps({
	isFreeDeliveryPromoActive: {
		type: Boolean,
		default: false
	}
})

</script>

<template>
	<!-- Inspection / Service & Warranty -->
	<section class="py-4">
		<div class="container">
			<div class="bg-light border rounded-3 p-4 shadow-sm">
				<div class="row align-items-start g-4">

					<!-- Inspection / Service -->
					<div
						class="col-md-5 border-end-md"
						:class="{
							'col-md-5': isFreeDeliveryPromoActive,
							'col-md-7': !isFreeDeliveryPromoActive
						}"
					>
						<div class="d-flex align-items-center gap-3 pe-md-4">

							<div class="feature-icon">
								<img
									src="/images/icons/checklist.png"
									alt=""
								>
							</div>

							<div>
								<h2 class="h4 fw-bold mb-0">
									Inspected. Serviced. Ready to Work.
								</h2>
							</div>

						</div>
						<div>
							<p class="text-muted mb-0">
								Every machine goes through a full inspection and service before it’s listed for sale. This always includes an oil change, a new spark plug, and a carburetor cleaning. Wear items and safety components are also checked, and anything that needs attention is addressed before the machine is listed.
							</p>
						</div>
					</div>


					<!-- Warranty -->
					<div
						:class="{
							'border-end-md': isFreeDeliveryPromoActive,
							'col-md-4': isFreeDeliveryPromoActive,
							'col-md-5': !isFreeDeliveryPromoActive
						}"
					>
						<div class="ps-md-3">
							<div class="d-flex align-items-center gap-3">

								<div class="feature-icon">
									<img
										src="/images/icons/warranty.png"
										alt=""
									>
								</div>

								<div>
									<h2 class="h4 fw-bold mb-0">
										30-Day Warranty
									</h2>
								</div>

							</div>
							<div>
								<p class="text-muted mb-0">
									Every equipment purchase includes a 30-day warranty for added peace of mind. If something we serviced or repaired gives you trouble during that time, bring it back and we’ll make it right.
								</p>
							</div>
						</div>
					</div>



					<!-- Delivery -->
					<div
						v-if="isFreeDeliveryPromoActive"
						class="col-md-3"
					>
						<div class="ps-md-3">
							<div class="d-flex align-items-center gap-3">

								<div class="feature-icon">
									<img
										src="/images/icons/delivery.png"
										alt=""
									>
								</div>

								<div>
									<h2 class="h4 fw-bold mb-0">
										FREE Delivery
									</h2>
								</div>

							</div>
						</div>
						<div>
							<p class="text-muted mb-0">
								Free local delivery to Fargo/Moorhead is included with every equipment purchase.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
@media (min-width: 768px) {
	.border-end-md {
		border-right: 1px solid var(--bs-border-color);
	}
}
.feature-icon img {
	width: 56px;
	height: 56px;
	object-fit: contain;
}
</style>
