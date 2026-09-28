<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import InventoryFeaturesBanner from '@/components/inventory-features-banner.vue'

const route = useRoute()

const item = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedImage = ref(null)

const images = computed(() => {
	return item.value?.images ?? []
})

const selectImage = (image) => {
	selectedImage.value = image
}

const name = ref('')
const email = ref('')
const message = ref('')

onMounted(async () => {
	try {
		const response = await fetch(`/api/inventory/${route.params.sku}`)

		if (!response.ok) {
			throw new Error('Inventory item not found')
		}

		item.value = await response.json()

		selectedImage.value =
			images.value.find(image => image.is_primary) ??
			images.value[0] ??
			null

		message.value = `I'm interested in the ${item.value.name}, can you tell me more?`
	}
	catch (err) {
		error.value = err.message
	}
	finally {
		loading.value = false
	}
})







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
				productName: item.value.name,
				productSku: item.value.sku,
				productType: item.value.type_name,
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
	<main class="container py-5">

		<div v-if="loading" class="text-center py-5">
			Loading...
		</div>

		<div v-else-if="error" class="alert alert-danger">
			Unable to load product details.
		</div>

		<template v-else-if="item">

			<div class="row g-5">

				<!-- Images -->
				<div class="col-lg-7">

					<div
						v-if="selectedImage"
						class="main-image border rounded-3 bg-light mb-3"
					>
						<img
							:src="`/images/inventory/${item.sku}/${selectedImage.url}`"
							:alt="item.name"
						>
					</div>

					<div
						v-if="images.length > 1"
						class="d-flex gap-2 flex-wrap"
					>
						<button
							v-for="image in images"
							:key="image.id"
							type="button"
							class="thumbnail border rounded-2 p-0"
							:class="{ active: selectedImage?.id === image.id }"
							@click="selectImage(image)"
						>
							<img
								:src="`/images/inventory/${item.sku}/${image.url}`"
								:alt="item.name"
							>
						</button>
					</div>

				</div>


				<!-- Details -->
				<div class="col-lg-5">

					<div class="text-muted mb-2">
						<img
							v-if="item.brand_logo"
							:src="`/images/brands/${item.brand_logo}`"
							:alt="item.brand_name"
							class="brand-logo"
						>
					</div>

					<h1 class="display-6 fw-bold mb-3">
						{{ item.name }}
					</h1>

					<div class="fs-2 fw-bold mb-4">
						<img src="/images/icons/pricetag.png" alt="" class="pricetag">
						<span>
							${{ Number(item.price).toFixed(2) }}
						</span>
					</div>

					<p class="lead text-muted">
						{{ item.description }}
					</p>

					<hr class="my-4">

					<div class="mb-4">
						<div class="small text-muted">
							SKU
						</div>

						<div>
							{{ item.sku }}
						</div>
					</div>
<!-- CTA -->
<div class="card mt-4">
	<div class="card-body">
		<h2 class="h5 fw-bold mb-3">
			Ask About This {{item.type_name}}
		</h2>
		<form @submit.prevent="submitForm">
			<div class="mb-3">
				<label class="form-label" for="contact-name">Name</label>
				<input
					id="contact-name"
					v-model="name"
					type="text"
					class="form-control"
					autocomplete="name"
					placeholder="Your name"
					required
				>
			</div>

			<div class="mb-3">
				<label class="form-label" for="contact-email">Email</label>
				<input
					id="contact-email"
					v-model="email"
					type="email"
					class="form-control"
					autocomplete="email"
					placeholder="you@example.com"
					required
				>
			</div>

			<div class="mb-3">
				<label class="form-label" for="contact-message">Message</label>
				<textarea
					id="contact-message"
					v-model="message"
					class="form-control"
					rows="4"
					required
				/>
			</div>

			<button
				type="submit"
				class="btn btn-primary w-100"
				:disabled="isSending"
			>
				{{ isSending ? 'Sending...' : 'Send Inquiry' }}
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
<!-- /CTA -->

				</div>

			</div>


			<!-- Inspection / Warranty / Delivery -->
			<div class="mt-5">
				<InventoryFeaturesBanner
					:isFreeDeliveryPromoActive="true"
				/>
			</div>

		</template>

	</main>
</template>

<style scoped>
.main-image-container {
	display: flex;
	align-items: center;
	justify-content: center;
}

.main-image {
	aspect-ratio: 1 / 1;
	overflow: hidden;
}

.main-image img {
	width: 100%;
	object-fit: contain;
    object-position: center -100px;
}

.thumbnail {
	width: 90px;
	height: 70px;
	overflow: hidden;
	background: var(--bs-light);
	opacity: .7;
}

.thumbnail:hover,
.thumbnail.active {
	opacity: 1;
}

.thumbnail.active {
	outline: 2px solid var(--bs-primary);
	outline-offset: 2px;
}

.thumbnail img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.pricetag {
	width: 1em;
	height: 1em;
	object-fit: contain;
}
.brand-logo {
	display: block;
	max-width: 100%;
	height: auto;
	object-fit: contain;
}
</style>