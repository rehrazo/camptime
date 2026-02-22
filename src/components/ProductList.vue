<template>
  <div>
    <h1>Product List</h1>
    <div v-for="product in products" :key="product.id">
      <product-card :product="product" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      products: [],
    };
  },
  components: {
    'product-card': () => import('./ProductCard.vue'),
  },
  mounted() {
    this.fetchProducts();
  },
  methods: {
    fetchProducts() {
      // Fetch products from API
    },
  },
};
</script>

<style scoped>
/* Styles for ProductList.vue */
</style>