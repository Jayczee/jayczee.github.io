import { defineClientConfig } from "vuepress/client";
import Popper from "./components/Popper.vue";

export default defineClientConfig({
  enhance({ app, router, siteData }) {},
  setup() {},
  rootComponents: [Popper],
});