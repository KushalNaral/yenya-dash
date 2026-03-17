<template>
  <div>
    <header>User Header</header>
    <AppSidebar />
    <main>
      <router-view />
    </main>
    <footer>User Footer</footer>
  </div>
</template>

<script setup>
import AppSideBar from "@/components/AppSideBar.vue";
</script>
