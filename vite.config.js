import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "Frontend/index.html"),
        about: resolve(__dirname, "Frontend/about.html"),
        account: resolve(__dirname, "Frontend/account.html"),
        cart: resolve(__dirname, "Frontend/cart.html"),
        checkout: resolve(__dirname, "Frontend/checkout.html"),
        confirmation: resolve(__dirname, "Frontend/confirmation.html"),
        contact: resolve(__dirname, "Frontend/contact.html"),
        accessories: resolve(__dirname, "Frontend/collection pages/Accessories.html"),
        bags: resolve(__dirname, "Frontend/collection pages/Bags.html"),
        dresses: resolve(__dirname, "Frontend/collection pages/Dresses.html"),
        shoes: resolve(__dirname, "Frontend/collection pages/Shoes.html")
      }
    }
  }
});
