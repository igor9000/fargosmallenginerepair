<script setup>
import { ref } from 'vue'
import { useHead } from '@unhead/vue'

useHead({
	title: 'Contact Small Engine Repair | Fargo Small Engine Repair',

	meta: [
		{
			name: 'description',
			content:
				'Contact Fargo Small Engine Repair for small engine service, repairs, and questions in Fargo, ND and the surrounding area.'
		}
	]
})

const name = ref('')
const email = ref('')
const message = ref('')

const isSending = ref(false)
const statusMessage = ref('')
const sendSuccessful = ref(false)

async function submitForm() {
	isSending.value = true
	statusMessage.value = ''
	sendSuccessful.value = false

	try {
		const response = await fetch('/api/contact', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: name.value,
				email: email.value,
				message: message.value
			})
		})

		const result = await response.json()

		if (!response.ok) {
			throw new Error(result.error || 'Unable to send message')
		}

		sendSuccessful.value = true
		statusMessage.value = 'Got it! We\'ll be in touch with you shortly.'

		name.value = ''
		email.value = ''
		message.value = ''
	} catch (error) {
		console.error('Contact form error:', error)

		sendSuccessful.value = false
		statusMessage.value =
			'Unable to send your message. Please try again or call us at 701-491-8696.'
	} finally {
		isSending.value = false
	}
}
</script>

<template>
	<main>
		<section class="contact-page py-5">
			<div class="container">

				<div class="contact-heading text-center mx-auto mb-5">
					<h1 class="display-5 fw-bold mb-3">
						Need Small Engine Service?
					</h1>

					<p class="lead text-secondary mb-0">
						Tell us what you've got and what's going on.
					</p>
				</div>

				<div class="contact-card mx-auto">
					<div class="row g-0">

						<!-- Call / Text CTA -->
						<div class="col-12 col-lg-5">
							<div class="contact-info h-100">

								<p class="contact-eyebrow mb-2">
									PREFER TO TALK?
								</p>

								<h2 class="fw-bold mb-3">
									Give us a call or text.
								</h2>

								<p class="contact-info-text mb-4">
									Have a question about a repair or want to talk through
									what your equipment is doing? Reach out directly.
								</p>

								<a
									href="tel:+17014918696"
									class="phone-number d-block mb-4"
								>
									(701) 491-8696
								</a>

								<div class="d-grid gap-3">
									<a
										href="tel:+17014918696"
										class="btn btn-primary btn-lg fw-semibold"
									>
										Call Us
									</a>

									<a
										href="sms:+17014918696"
										class="btn btn-outline-light btn-lg fw-semibold"
									>
										Text Us
									</a>
								</div>

								<div class="service-area mt-4 pt-4">
									<strong>Fargo Small Engine Repair</strong>
									<div>Fargo, North Dakota</div>
								</div>

							</div>
						</div>

						<!-- Contact Form -->
						<div class="col-12 col-lg-7">
							<div class="contact-form">

								<h2 class="fw-bold mb-2">
									Send Us a Message
								</h2>

								<p class="text-secondary mb-4">
									Describe what you need help with and we'll get back to you.
								</p>

								<form @submit.prevent="submitForm">

									<div class="mb-3">
										<label
											for="contact-name"
											class="form-label fw-semibold"
										>
											Name
										</label>

										<input
											id="contact-name"
											v-model="name"
											type="text"
											class="form-control form-control-lg"
											autocomplete="name"
											placeholder="Your name"
											required
										>
									</div>

									<div class="mb-3">
										<label
											for="contact-email"
											class="form-label fw-semibold"
										>
											Email
										</label>

										<input
											id="contact-email"
											v-model="email"
											type="email"
											class="form-control form-control-lg"
											autocomplete="email"
											placeholder="you@example.com"
											required
										>
									</div>

									<div class="mb-4">
										<label
											for="contact-message"
											class="form-label fw-semibold"
										>
											What's going on with it?
										</label>

										<textarea
											id="contact-message"
											v-model="message"
											class="form-control"
											rows="6"
											placeholder="Tell us what kind of equipment you have, what it's doing, and anything else that might help."
											required
										></textarea>
									</div>

									<button
										type="submit"
										class="btn btn-primary btn-lg w-100 fw-bold"
										:disabled="isSending"
									>
										{{ isSending ? 'Sending...' : 'Request Service' }}
									</button>

									<div
										v-if="statusMessage"
										class="mt-3 alert mb-0"
										:class="sendSuccessful ? 'alert-success' : 'alert-danger'"
										role="alert"
									>
										{{ statusMessage }}
									</div>

								</form>

							</div>
						</div>

					</div>
				</div>

			</div>
		</section>
	</main>
</template>

<style scoped>
.contact-page {
	background: #f8f9fa;
}

.contact-heading {
	max-width: 750px;
}

.contact-card {
	max-width: 1000px;
	background: white;
	border-radius: 14px;
	overflow: hidden;
	box-shadow: 0 10px 35px rgba(0, 0, 0, 0.12);
}

.contact-info {
	background: #212529;
	color: white;
	padding: 3rem;
}

.contact-eyebrow {
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	color: #dc3545;
}

.contact-info-text {
	color: #ced4da;
	line-height: 1.6;
}

.phone-number {
	color: white;
	font-size: 1.9rem;
	font-weight: 700;
	text-decoration: none;
}

.phone-number:hover {
	color: #dc3545;
}

.service-area {
	border-top: 1px solid rgba(255, 255, 255, 0.15);
	color: #adb5bd;
	font-size: 0.95rem;
}

.service-area strong {
	color: white;
}

.contact-form {
	padding: 3rem;
}

.form-control {
	border-color: #ced4da;
	padding: 0.8rem 1rem;
}

.form-control:focus {
	border-color: #dc3545;
	box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.15);
}

textarea.form-control {
	resize: vertical;
	min-height: 160px;
}

@media (max-width: 991.98px) {
	.contact-info,
	.contact-form {
		padding: 2rem;
	}

	.phone-number {
		font-size: 1.6rem;
	}
}

@media (max-width: 575.98px) {
	.contact-page {
		padding-top: 2rem !important;
	}

	.contact-heading {
		margin-bottom: 2rem !important;
	}

	.contact-info,
	.contact-form {
		padding: 1.5rem;
	}

	.contact-card {
		border-radius: 10px;
	}
}
</style>