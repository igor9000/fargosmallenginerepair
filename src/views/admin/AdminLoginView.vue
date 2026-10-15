<template>
	<main class="container py-5" style="max-width: 440px">
		<h1>Admin Login</h1>

		<form @submit.prevent="login">
			<input
				v-model="password"
				type="password"
				class="form-control my-3"
				placeholder="Password"
				autocomplete="current-password"
				required
			/>

			<p v-if="error" class="text-danger">{{ error }}</p>

			<button class="btn btn-primary" :disabled="loading">
				{{ loading ? 'Signing in...' : 'Sign In' }}
			</button>
		</form>
	</main>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const password = ref('');
const error = ref('');
const loading = ref(false);

async function login() {
	loading.value = true;
	error.value = '';

	try {
		const response = await fetch('/api/admin/login', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: password.value })
		});

		if (!response.ok) {
			throw new Error('Login failed');
		}

		password.value = '';
		await router.replace('/admin');
	} catch(e) {
		error.value = `Unable to sign in ${e}`;
	} finally {
		loading.value = false;
	}
}
</script>