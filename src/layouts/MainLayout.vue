<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> {{ AppName }} </q-toolbar-title>

        <div>v{{ AppVersion.major }}.{{ AppVersion.minor }}</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { AppName, AppVersion } from 'src/components/AppInfo';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MainLayout',
  setup() {
    return { AppVersion, AppName };
  },
});
</script>
