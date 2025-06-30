<script setup lang="ts">
import BlogHero from "vuepress-theme-hope/blog/components/BlogHero.js";
import BingHeroBackground from "vuepress-theme-hope/presets/BingHeroBackground.js";
</script>

<template>
  <BlogHero>
    <template #bg>
      <BingHeroBackground />
    </template>
  </BlogHero>
</template>