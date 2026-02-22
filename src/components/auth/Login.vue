<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
    <div class="links">
      <router-link to="/signup">Sign Up</router-link>
      <router-link to="/forgot-password">Forgot Password?</router-link>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
    };
  },
  methods: {
    handleLogin() {
      // Logic to handle login (e.g., API call)
      console.log(`Logging in with ${this.email} and ${this.password}`);
    },
  },
};
</script>

<style scoped>
.login-container {
  width: 300px;
  margin: 0 auto;
}
.links {
  margin-top: 10px;
}
</style>
