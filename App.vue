<template>
  <view id="app" :class="appTheme">
    <navigator url="/pages/index/index" hover-class="none" class="app-header">
      <text class="app-title">ZY-Player</text>
    </navigator>
    
    <view class="app-body">
      <slot />
    </view>
    
    <view class="tab-bar-custom" v-if="showCustomTab">
      <view class="tab-item" v-for="(tab, index) in tabs" :key="index" @click="switchTab(tab)">
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-text" :class="{ active: currentTab === tab.page }">{{ tab.name }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      appTheme: 'theme-light',
      currentTab: 'film',
      showCustomTab: true,
      tabs: [
        { name: '影视', icon: '🎬', page: 'film' },
        { name: '直播', icon: '📺', page: 'iptv' },
        { name: '播放', icon: '▶️', page: 'play' },
        { name: '收藏', icon: '⭐', page: 'star' },
        { name: '设置', icon: '⚙️', page: 'setting' }
      ]
    }
  },
  onLaunch() {
    console.log('App Launch')
    this.initTheme()
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
  methods: {
    initTheme() {
      const theme = uni.getStorageSync('theme') || 'light'
      this.appTheme = `theme-${theme}`
    },
    switchTab(tab) {
      this.currentTab = tab.page
      uni.switchTab({
        url: `/pages/${tab.page}/${tab.page}`
      })
    }
  }
}
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

.app-header {
  height: 88rpx;
  background-color: #2C3E50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: bold;
}

.app-body {
  flex: 1;
  overflow: hidden;
}

.tab-bar-custom {
  height: 100rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1rpx solid #e5e5e5;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 20%;
}

.tab-icon {
  font-size: 40rpx;
  margin-bottom: 6rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #999999;
}

.tab-text.active {
  color: #409EFF;
}
</style>
