<script setup>
import { useHead } from '@unhead/vue';
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import inventorycard from '../components/inventory-card.vue';
import inventoryfeaturesbanner from '../components/inventory-features-banner.vue';

useHead({
	title: 'Outdoor Equipment for Sale in Fargo, ND | Fargo Small Engine Repair',

	meta: [
		{
			name: 'description',
			content:
				'Shop inspected and serviced used outdoor power equipment for sale in Fargo, ND, with a 30-day warranty and free Fargo-Moorhead delivery.'
		}
	]
});


const route = useRoute();
const inventoryTypes = ref([]);

const typeSlug = computed(() =>
	String(route.params.typeSlug ?? '')
);

const selectedType = computed(() =>
	inventoryTypes.value.find(type =>
		type.slug === typeSlug.value
	) ?? null
);

const visibleInventory = computed(() => {
	if (!typeSlug.value) {
		return inventoryByType.value;
	}

	if (!selectedType.value) {
		return [];
	}

	const group = inventoryByType.value.find(type =>
		type.slug === typeSlug.value
	);

	return [group ?? {
		id: selectedType.value.id,
		name: selectedType.value.name,
		description: selectedType.value.description,
		slug: selectedType.value.slug,
		items: []
	}];
});




const inventoryByType = computed(() => {
	const groups = new Map();

	for (const item of inventory.value) {
		if (!groups.has(item.type_id)) {
			groups.set(item.type_id, {
				id: item.type_id,
				name: item.type_name,
				slug: item.type_slug,
				description: item.type_description,
				items: []
			});
		}

		groups.get(item.type_id).items.push(item);
	}

	return Array.from(groups.values());
});


const isFreeDeliveryPromoActive = true;
const inventory = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
	try {
		const [inventoryResponse, typesResponse] =
			await Promise.all([
				fetch('/api/inventory'),
				fetch('/api/inventory/types')
			]);

		if (!inventoryResponse.ok || !typesResponse.ok) {
			throw new Error('Unable to load inventory');
		}

		inventory.value = await inventoryResponse.json();
		inventoryTypes.value = await typesResponse.json();
	} catch (err) {
		console.error(err);
		error.value = 'Unable to load inventory';
	} finally {
		loading.value = false;
	}
});
</script>

<template>
	<main>

		<!-- Page intro -->
		<section class="bg-light py-5 border-bottom">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-lg-9 text-center">


					<h1 class="display-5 fw-bold mb-3">
						{{ selectedType?.name ?? (
							typeSlug ? 'Equipment Type Not Found' : 'Outdoor Equipment For Sale'
						) }}
					</h1>

					<p class="lead text-muted mb-0">
						{{ selectedType?.description ??
							(typeSlug
								? 'This equipment category does not exist.'
								: 'Quality used equipment without the new equipment price tag.')
						}}
					</p>


					</div>
				</div>
			</div>
		</section>


		<!-- Inventory -->

		<section v-if="loading" class="py-5">
			<div class="container">
				<p>Loading...</p>
			</div>
		</section>

		<section v-else-if="error" class="py-5">
			<div class="container">
				<p>{{ error }}</p>
			</div>
		</section>

		<template v-else>
			<inventoryfeaturesbanner :isFreeDeliveryPromoActive />

			<template
				v-for="(type, index) in visibleInventory"
				:key="type.id"
			>
				<section class="py-5">
					<div class="container">
						<section class="mb-5">
							<div class="mb-4">
								<div class="d-flex align-items-center gap-3">
									<h2 class="fw-bold mb-0 flex-shrink-0">
										{{ type.name }}
									</h2>

									<hr class="flex-grow-1 border-brand-primary border-3 opacity-100 m-0">
								</div>

								<p class="lead text-muted mt-2 mb-0">
									{{ type.description }}
								</p>
							</div>

							<div class="row g-4">
								<inventorycard 
									v-for="item in type.items"
									:key="item.id"
									class="col-md-6 col-lg-3"
									:item
								 />
							</div>

							<p v-if="!type.items.length" class="text-muted">
								No equipment currently available in this category.
							</p>
						</section>
					</div>
				</section>

			</template>
		</template>


		

	</main>
</template>

<style scoped>
.inventory-description {
	white-space: pre-line;
}
.inventory-image {
	height: 350px;
	object-fit: cover;
}
.delivery-banner {
	background: #ffc107;
	color: #212529;
	border-bottom: 1px solid rgba(0, 0, 0, 0.15);
}
.border-brand-primary {
	border-color: var(--fser-brand-primary);
}
</style>
