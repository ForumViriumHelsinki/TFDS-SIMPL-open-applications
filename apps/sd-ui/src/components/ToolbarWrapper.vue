<template>
  <SToolbar
    id="main-navigation-toolbar"
    logoRoute="/"
    :showUserProfile="true"
    :firstName="firstName"
    :lastName="lastName"
    :menuItems="menuItems"
    welcomeMessage="Welcome"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { SToolbar } from '@simpl/vue-components';
import type { MenuItem } from 'primevue/menuitem';

interface Props {
  currentUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentUrl: '',
});

const menuItems = computed<MenuItem[]>(() => {
  if (!props.currentUrl) {
    return [];
  }
  return [
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => {
        window.location.href = `/logout?redirectUri=${props.currentUrl}`;
      },
    },
  ];
});

const firstName = ref('User');
const lastName = ref('Name');

const handleSearch = (query: string) => {
  if (query) {
    window.location.assign(`/?search=${query}`);
  }
};

const fetchUserInfo = async () => {
  try {
    const response = await fetch('/api/userinfo');
    if (response.ok) {
      const data = await response.json();
      firstName.value = data.firstName || 'User';
      lastName.value = data.lastName || 'Name';
    }
  } catch (err) {
    console.error('Failed to fetch user info:', err);
  }
};

onMounted(() => {
  fetchUserInfo();
});
</script>
