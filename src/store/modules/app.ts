import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("app", () => {
  const loading = ref(false);
  const setLoading = (v: boolean) => (loading.value = v);

  return { loading, setLoading };
});
