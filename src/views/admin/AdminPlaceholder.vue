
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Management interface coming soon.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  table: {
    type: String,
    required: true
  }
});

const title = computed(() =>
  props.table
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
);
</script>
