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
		statusMessage.value = 'Your message has been sent. We will get back to you soon.'

		name.value = ''
		email.value = ''
		message.value = ''
	} catch (error) {
		console.error('Contact form error:', error)

		sendSuccessful.value = false
		statusMessage.value = `Unable to send your message. Please try again. ${error}`
	} finally {
		isSending.value = false
	}
}
</script>

<template>
	<main>
		<section class="py-5">
			<div class="container">

				<div class="text-center mx-auto mb-5">
					<h1 class="fw-bold mb-3">
						Get in Touch
					</h1>

					<p class="lead mb-4">
						For sales, service, or questions, call, text, or send us a message.
					</p>

					<h2 class="mb-4">
						(701) 491-8696
					</h2>

					<div class="d-flex gap-3 flex-wrap justify-content-center">
						<a
							href="tel:+17014918696"
							class="btn btn-primary btn-lg"
						>
							Call Us
						</a>

						<a
							href="sms:+17014918696"
							class="btn btn-outline-primary btn-lg"
						>
							Text Us
						</a>
					</div>
				</div>

				<div class="row justify-content-center">
					<div class="col-12 col-md-8 col-lg-6">

						<form @submit.prevent="submitForm">

							<div class="mb-3">
								<label for="contact-name" class="form-label">
									Name
								</label>

								<input
									id="contact-name"
									v-model="name"
									type="text"
									class="form-control"
									required
								>
							</div>

							<div class="mb-3">
								<label for="contact-email" class="form-label">
									Email
								</label>

								<input
									id="contact-email"
									v-model="email"
									type="email"
									class="form-control"
									required
								>
							</div>

							<div class="mb-3">
								<label for="contact-message" class="form-label">
									Message
								</label>

								<textarea
									id="contact-message"
									v-model="message"
									class="form-control"
									rows="6"
									required
								></textarea>
							</div>

							<button
								type="submit"
								class="btn btn-primary"
								:disabled="isSending"
							>
								{{ isSending ? 'Sending...' : 'Send Message' }}
							</button>

							<div
								v-if="statusMessage"
								class="mt-3 alert"
								:class="sendSuccessful ? 'alert-success' : 'alert-danger'"
								role="alert"
							>
								{{ statusMessage }}
							</div>

						</form>

					</div>
				</div>

			</div>
		</section>
	</main>
</template>

<style>
</style>