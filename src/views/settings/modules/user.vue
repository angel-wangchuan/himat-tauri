<template>
  <div class="flex">
    <span class="text-md">用户设置</span>
    <Button class="ml-auto" @click="logout"> 退出登陆 </Button>
  </div>
</template>

<script setup>
import { useUserStore } from "@stores/user";
const { logout } = useUserStore();
</script>
