import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false,
  }),
  actions: {
    setUser(userData) {
      this.user = userData;
      this.isAuthenticated = true;
    },
    logout() {
      this.user = null;
      this.isAuthenticated = false;
    },
  },
  getters: {
    getUserProfile: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },
});