<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import navbar from './components/navbar.vue'
import footerbar from './components/footerbar.vue'

const route = useRoute();
</script>

<template>
  <navbar />
  <RouterView />
  <footerbar :showCTA="route.meta.showFooterCTA" />
</template>

<style scoped>

</style>
