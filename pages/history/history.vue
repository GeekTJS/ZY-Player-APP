<template>
  <view class="history-container">
    <view v-if="historyList.length === 0" class="empty">
      <text class="empty-icon">📜</text>
      <text class="empty-text">暂无历史记录</text>
    </view>
    
    <scroll-view v-else scroll-y class="history-list">
      <view 
        v-for="(item, index) in historyList" 
        :key="index"
        class="history-item"
        @click="playItem(item)"
      >
        <view class="history-info">
          <text class="history-name">【{{ item.site }}】{{ item.name }}</text>
          <text class="history-meta">
            第 {{item.index + 1}} 集 | 
            <text v-if="item.time && item.duration">{{ formatTime(item.time) }}/{{ formatTime(item.duration) }}</text>
            <text v-else>未记录进度</text>
          </text>
        </view>
        <view class="history-actions">
          <text class="delete-btn" @click.stop="removeHistory(item)">删除</text>
        </view>
      </view>
    </scroll-view>
    
    <view v-if="historyList.length > 0" class="clear-btn-wrapper">
      <button @click="clearAll" class="clear-btn">清空历史</button>
    </view>
  </view>
</template>

<script>
import { history } from '../../lib/storage'

export default {
  data() {
    return {
      historyList: []
    }
  },
  async onShow() {
    await this.loadHistory()
  },
  methods: {
    async loadHistory() {
      try {
        this.historyList = await history.all()
        this.historyList.reverse()
      } catch (e) {
        console.error('加载历史失败', e)
      }
    },
    playItem(item) {
      uni.navigateTo({
        url: `/pages/play/play?key=${item.site}&id=${item.ids}&name=${encodeURIComponent(item.name)}&index=${item.index}`
      })
    },
    async removeHistory(item) {
      try {
        await history.remove(item.id)
        await this.loadHistory()
        uni.showToast({ title: '已删除' })
      } catch (e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
    async clearAll() {
      uni.showModal({
        title: '提示',
        content: '确定要清空所有历史记录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await history.clear()
              await this.loadHistory()
              uni.showToast({ title: '已清空' })
            } catch (e) {
              uni.showToast({ title: '清空失败', icon: 'none' })
            }
          }
        }
      })
    },
    formatTime(seconds) {
      const min = Math.floor(seconds / 60)
      const sec = Math.floor(seconds % 60)
      return `${min}:${sec < 10 ? '0' : ''}${sec}`
    }
  }
}
</script>

<style scoped>
.history-container {
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

.history-list {
  height: calc(100vh - 200rpx);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.history-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.history-meta {
  font-size: 24rpx;
  color: #999999;
  display: block;
}

.history-actions {
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

.clear-btn-wrapper {
  padding: 30rpx 0;
}

.clear-btn {
  background-color: #ff4757;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 28rpx;
}
</style>
