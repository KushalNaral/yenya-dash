<template>
  <div>
    <header>Admin Header</header>
    <Sidebar />
    <main>
      <router-view />
    </main>
    <footer>Admin Footer</footer>
  </div>
</template>

<script setup>
import Sidebar from "@/components/AppSideBar.vue";
</script>
