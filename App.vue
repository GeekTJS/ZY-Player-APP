<template>
  <view id="app" :class="appTheme">
    <view class="app-body">
      <slot />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const appTheme = ref('theme-light')

onMounted(() => {
  const theme = uni.getStorageSync('theme') || 'light'
  appTheme.value = `theme-${theme}`
  
  const systemInfo = uni.getSystemInfoSync()
  console.log('Device Info:', systemInfo)
  
  if (systemInfo.platform === 'android' && systemInfo.screenWidth > 1200) {
    console.log('Running on TV')
    uni.setStorageSync('isTv', true)
  } else {
    uni.setStorageSync('isTv', false)
  }
})
</script>

<style>
@import './assets/scss/theme.scss';
@import './assets/scss/style.scss';

page {
  height: 100%;
  background-color: #f5f5f5;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-body {
  flex: 1;
  overflow: hidden;
}
</style>
