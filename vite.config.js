import { defineConfig } from "vite";

export default defineConfig({
  root: "Frontend",

  build: {
    outDir: "dist",

    rollupOptions: {
      input: {
        index: "Frontend/index.html",
        about: "Frontend/about.html",
        account: "Frontend/account.html",
        cart: "Frontend/cart.html",
        checkout: "Frontend/checkout.html",
        confirmation: "Frontend/confirmation.html",
        contact: "Frontend/contact.html",
        accessories: "Frontend/collection pages/Accessories.html",
        bags: "Frontend/collection pages/Bags.html",
        dresses: "Frontend/collection pages/Dresses.html",
        shoes: "Frontend/collection pages/Shoes.html"
      }
    }
  }
});