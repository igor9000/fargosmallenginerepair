<template>
	<section class="card mb-4">
		<div class="card-body p-4">
			<h2 class="h5 mb-3">
				Thank You for Your Business!
			</h2>

			<p class="mb-2">
				<slot>
					Thank you for supporting my small business.
				</slot>
			</p>

			<p class="mb-3">
				<slot name="follow-up">
					If you have any questions, please don't
					hesitate to reach out.
				</slot>
			</p>

			<div class="mt-4">
				<p class="mb-2">Sincerely,</p>

				<img
					src="/signature.svg"
					alt="Adam's signature"
					class="d-block mb-1"
					style="width: 180px; max-width: 100%; height: auto"
				/>

				<div class="fw-semibold">Adam</div>

				<div class="text-muted small">
					701-491-8696
				</div>

				<div class="text-muted small">
					Fargo Small Engine Repair
				</div>
			</div>
		</div>
	</section>
</template>
