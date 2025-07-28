import { defineClientConfig } from "vuepress/client";
import Popper from "./components/Popper.vue";
import { setupTransparentNavbar } from "vuepress-theme-hope/presets/transparentNavbar.js";

export default defineClientConfig({
  enhance({ app, router, siteData }) {},
  setup() {
    setupTransparentNavbar({ type: "homepage" });
  },
  rootComponents: [Popper],
});