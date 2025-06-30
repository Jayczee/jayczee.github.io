<template>
  <canvas id="moefy-canvas"></canvas>
</template>

<script setup lang="ts">
import {
   Popper,
   PopperShape,
   type PopperConfig,
   MAX_Z_INDEX,
   type CanvasOptions,
} from '@moefy-canvas/theme-popper'
import { onMounted } from "vue";

const themeConfig: PopperConfig = {
   shape: PopperShape.Star,
   size: 1.75,
   numParticles: 10,
}

const canvasOptions: CanvasOptions = {
   opacity: 1,
   zIndex: MAX_Z_INDEX,
}

onMounted(()=>{
  const el = document.getElementById('moefy-canvas')
  const popper = new Popper(themeConfig, canvasOptions)
  popper.mount(el as HTMLCanvasElement)
})
</script>