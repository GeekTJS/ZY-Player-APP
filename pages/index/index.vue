<template>
  <view class="index-container">
    <view class="header">
      <text class="title">ZY-Player</text>
    </view>
    
    <view class="menu-grid">
      <view class="grid-item" @click="switchTab('/pages/film/film')">
        <view class="grid-icon">🎬</view>
        <text class="grid-text">影视浏览</text>
      </view>
      
      <view class="grid-item" @click="switchTab('/pages/iptv/iptv')">
        <view class="grid-icon">📺</view>
        <text class="grid-text">IPTV直播</text>
      </view>
      
      <view class="grid-item" @click="navigateTo('/pages/play/play')">
        <view class="grid-icon">▶️</view>
        <text class="grid-text">播放</text>
      </view>
      
      <view class="grid-item" @click="switchTab('/pages/star/star')">
        <view class="grid-icon">⭐</view>
        <text class="grid-text">我的收藏</text>
      </view>
      
      <view class="grid-item" @click="switchTab('/pages/history/history')">
        <view class="grid-icon">📜</view>
        <text class="grid-text">历史记录</text>
      </view>
      
      <view class="grid-item" @click="switchTab('/pages/setting/setting')">
        <view class="grid-icon">⚙️</view>
        <text class="grid-text">设置</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
    }
  },
  methods: {
    switchTab(url) {
      uni.switchTab({ url })
    },
    navigateTo(url) {
      uni.navigateTo({ url })
    }
  }
}
</script>

<style scoped>
.index-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  margin-bottom: 30rpx;
}

.title {
  color: #ffffff;
  font-size: 48rpx;
  font-weight: bold;
}

.menu-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.grid-item {
  width: 30%;
  margin: 2%;
  padding: 30rpx 0;
  background-color: #ffffff;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.grid-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.grid-text {
  font-size: 28rpx;
  color: #333333;
}
</style>