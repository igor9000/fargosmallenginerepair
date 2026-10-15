<template>
	<main class="container py-5">
		<h1>Admin Dashboard</h1>
		<p>Authenticated successfully.</p>

		<button class="btn btn-outline-danger" @click="logout">
			Log Out
		</button>
	</main>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

async function logout() {
	const response = await fetch('/api/admin/logout', {
		method: 'POST',
		credentials: 'same-origin'
	});

	if (response.ok) {
		router.replace('/admin/login');
	}
}
</script>