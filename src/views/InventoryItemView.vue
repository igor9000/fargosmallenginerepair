<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue';
import InventoryFeaturesBanner from '@/components/inventory-features-banner.vue'
import InventoryImage from '@/components/inventory-image.vue'

const route = useRoute()

const item = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedMedia = ref(null)

useHead(() => ({
	title: item.value
		? `${item.value.name} | Fargo Small Engine Repair`
		: 'Inventory | Fargo Small Engine Repair',

	meta: [
		{
			name: 'description',
			content: item.value
				? `${item.value.name} for sale at Fargo Small Engine Repair. View photos, details, price, and availability.`
				: 'Shop inspected and serviced used outdoor power equipment for sale in Fargo, ND.'
		}
	]
}))


const ribbon = computed(() => {
	if (item.value?.pending) {
		return {
			class: `sale-pending-ribbon`,
			text: 'Sale Pending'
		}
	} else if (item.value?.clearance) {
		return {
			class: `clearance-ribbon`,
			text: 'Clearance'
		}
	}
	return false;
})


// The API can return video entries alongside images in `images`, or in `videos`.
// Each media entry needs a `url`. Video entries may use media_type: 'video'
// (or type: 'video', mime_type: 'video/mp4'), or simply end in .mp4/.webm.
const isVideo = (media) =>
	media?._galleryType === 'video' ||
	media?.is_video === true ||
	String(media?.media_type ?? media?.type ?? media?.mime_type ?? '').toLowerCase().startsWith('video') ||
	/\.(mp4|webm|ogv|ogg|m4v|mov)(?:[?#]|$)/i.test(String(media?.url ?? ''))

const galleryMedia = computed(() => {
	const images = Array.isArray(item.value?.images) ? item.value.images : []
	const videos = Array.isArray(item.value?.videos) ? item.value.videos : []

	return [
		...images.map((media, index) => ({
			...media,
			_galleryType: isVideo(media) ? 'video' : 'image',
			_galleryKey: `image-${media.id ?? index}-${media.url}`
		})),
		...videos.map((media, index) => ({
			...media,
			_galleryType: 'video',
			_galleryKey: `video-${media.id ?? index}-${media.url}`
		}))
	].filter(media => media.url)
})

const mediaUrl = (path) => {
	const url = String(path ?? '').trim()
	if (/^(https?:)?\/\//i.test(url) || url.startsWith('/')) return url
	return `//media.fargosmallenginerepair.com/inventory/${item.value?.sku}/${url}`
}


// The inventory API should return joined attribute definitions and values:
// attributes: [{ attribute_id, name, slug, value, unit, sort_order }]
const attributes = computed(() => {
	const rows = item.value?.attributes
	if (!Array.isArray(rows)) return []

	return rows
		.filter(attribute =>
			attribute?.name &&
			attribute.value != null &&
			String(attribute.value).trim() !== ''
		)
		.slice()
		.sort((a, b) =>
			(Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
			a.name.localeCompare(b.name)
		)
})

const formatAttributeValue = (attribute) => {
	const value = typeof attribute.value === 'boolean'
		? (attribute.value ? 'Yes' : 'No')
		: String(attribute.value).trim()
	const unit = attribute.unit?.trim()

	return unit && !value.endsWith(` ${unit}`)
		? `${value} ${unit}`
		: value
}

const selectMedia = (media) => {
	selectedMedia.value = media
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

		selectedMedia.value =
			galleryMedia.value.find(media => media.is_primary) ??
			galleryMedia.value[0] ??
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

				<!-- Images and videos -->
				<div class="col-lg-7">

					<div
						v-if="selectedMedia"
						class="main-image border rounded-3 bg-light mb-3"
					>
						<video
							v-if="selectedMedia._galleryType === 'video'"
							:key="selectedMedia._galleryKey"
							class="main-video"
							:src="mediaUrl(selectedMedia.url)"
							:poster="selectedMedia.poster_url ? mediaUrl(selectedMedia.poster_url) : undefined"
							controls
							playsinline
							preload="metadata"
						>
							Your browser doesn't support embedded video.
						</video>
						<InventoryImage
							v-else
							:image="{ src: `${item.sku}/${selectedMedia.url}`, name: item.name }"
							:ribbon
						/>
					</div>

					<div
						v-if="galleryMedia.length > 1"
						class="d-flex gap-2 flex-wrap"
						aria-label="Product media gallery"
					>
						<button
							v-for="media in galleryMedia"
							:key="media._galleryKey"
							type="button"
							class="thumbnail border rounded-2 p-0"
							:class="{ active: selectedMedia?._galleryKey === media._galleryKey, 'video-thumbnail': media._galleryType === 'video' }"
							:aria-label="media._galleryType === 'video' ? `Show video of ${item.name}` : `Show photo of ${item.name}`"
							:aria-pressed="selectedMedia?._galleryKey === media._galleryKey"
							@click="selectMedia(media)"
						>
							<template v-if="media._galleryType === 'video'">
								<img
									v-if="media.poster_url"
									:src="mediaUrl(media.poster_url)"
									:alt="''"
								>
								<span class="play-icon" aria-hidden="true"></span>
							</template>
							<img
								v-else
								:src="mediaUrl(media.url)"
								:alt="''"
							>
						</button>
					</div>

					<section
						v-if="attributes.length > 0"
						class="specifications mt-4 border rounded-3"
						aria-labelledby="specifications-heading"
					>
						<h2 id="specifications-heading" class="h4 fw-bold mb-0">
							Specifications
						</h2>
						<dl class="specifications-list mb-0">
							<div
								v-for="attribute in attributes"
								:key="attribute.slug"
								class="specification-row"
							>
								<dt>{{ attribute.name }}</dt>
								<dd>{{ formatAttributeValue(attribute) }}</dd>
							</div>
						</dl>
					</section>

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
					<div class="my-4">
						<h5 class="h3 fw-bold">Questions About This {{item.type_name}}?</h5>
						<div class="row g-2">
							<div class="col-12 col-sm-6">
								<a
									href="tel:7014918696"
									class="btn btn-primary w-100"
								>
									Call 701-491-8696
								</a>
							</div>

							<div class="col-12 col-sm-6">
								<a
									href="sms:7014918696"
									class="btn btn-outline-dark w-100"
								>
									Text 701-491-8696
								</a>
							</div>
						</div>
					</div>

					<div class="cta-container mt-4">
						<div class="cta-body">
							<h2 class="h3 fw-bold mb-3">
								Message Us About This {{item.type_name}}
							</h2>
							<p class="text-muted small mb-3">
								Send us a quick message and we’ll get back to you.
							</p>
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
									{{ isSending ? 'Sending...' : 'Send Us a Message' }}
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
.specifications {
	overflow: hidden;
	background: var(--bs-body-bg, #fff);
}

.specifications h2 {
	padding: 1rem 1.25rem;
	border-bottom: 1px solid var(--bs-border-color, #dee2e6);
	background: var(--bs-light, #f8f9fa);
}

.specifications-list {
	padding: 0 1.25rem;
}

.specification-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	gap: 1rem;
	padding: .8rem .25rem;
}

.specification-row + .specification-row {
	border-top: 1px solid var(--bs-border-color, #dee2e6);
}

.specification-row dt,
.specification-row dd {
	margin: 0;
	overflow-wrap: anywhere;
}

.specification-row dt {
	color: var(--bs-secondary-color, #6c757d);
	font-weight: 400;
}

.specification-row dd {
	color: var(--bs-body-color, #212529);
	font-weight: 500;
}

@media (max-width: 575.98px) {
	.specifications h2 {
		padding: .875rem 1rem;
	}

	.specifications-list {
		padding: 0 1rem;
	}

	.specification-row {
		gap: .75rem;
	}
}

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

.main-video {
	display: block;
	width: 100%;
	height: 100%;
	background: #111;
	object-fit: contain;
}

.video-thumbnail {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #292929;
}

.play-icon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
}

.play-icon::before {
    content: "";
    grid-area: 1 / 1;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.8);
    border: 0px solid white;
}

.play-icon::after {
    content: "";
    grid-area: 1 / 1;
    width: 0;
    height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-left: 12px solid white;
    transform: translateX(2px);
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
.cta-body {
	margin-top: 1.25rem;
    padding: 1rem;
    border: 1px solid var(--bs-border-color);
    border-radius: var(--bs-border-radius-lg);
    background: var(--bs-light);
}

</style>
