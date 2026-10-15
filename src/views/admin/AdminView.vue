<template>
	<h1>Admin Dashboard</h1>
	<p>Select a section from the navigation.</p>
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