<template>
  <view class="star-container">
    <view v-if="starList.length === 0" class="empty">
      <text class="empty-icon">⭐</text>
      <text class="empty-text">暂无收藏</text>
    </view>
    
    <scroll-view v-else scroll-y class="star-list">
      <view 
        v-for="(item, index) in starList" 
        :key="index"
        class="star-item"
        @click="playItem(item)"
      >
        <view class="star-info">
          <text class="star-name">{{ item.name }}</text>
          <text class="star-meta">第 {{item.index + 1}} 集</text>
        </view>
        <view class="star-actions">
          <text class="delete-btn" @click.stop="removeStar(item)">删除</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { star } from '../../lib/storage'

export default {
  data() {
    return {
      starList: []
    }
  },
  async onShow() {
    await this.loadStars()
  },
  methods: {
    async loadStars() {
      try {
        this.starList = await star.all()
      } catch (e) {
        console.error('加载收藏失败', e)
      }
    },
    playItem(item) {
      uni.navigateTo({
        url: `/pages/play/play?key=${item.key}&id=${item.ids}&name=${encodeURIComponent(item.name)}&index=${item.index}`
      })
    },
    async removeStar(item) {
      uni.showModal({
        title: '提示',
        content: '确定要取消收藏吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await star.remove(item.id)
              await this.loadStars()
              uni.showToast({ title: '已取消收藏' })
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.star-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999999;
}

.star-list {
  height: calc(100vh - 40rpx);
}

.star-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.star-name {
  font-size: 32rpx;
  color: #333333;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.star-meta {
  font-size: 24rpx;
  color: #999999;
  display: block;
}

.star-actions {
  display: flex;
  align-items: center;
}

.delete-btn {
  color: #ff4757;
  font-size: 28rpx;
  padding: 10rpx 20rpx;
  border: 1rpx solid #ff4757;
  border-radius: 10rpx;
}
</style>
