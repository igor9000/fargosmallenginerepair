<script setup>
import { RouterLink, RouterView } from 'vue-router'
import navbar from './components/navbar.vue'
import footerbar from './components/footerbar.vue'
</script>

<template>
  <navbar />
  <RouterView />
  <footerbar />
</template>

<style scoped>

</style>
