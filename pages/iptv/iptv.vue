<template>
  <view class="iptv-container">
    <view v-if="channelList.length === 0" class="empty">
      <text class="empty-icon">📺</text>
      <text class="empty-text">暂无直播频道</text>
    </view>
    
    <view v-else>
      <view class="category-tabs">
        <view 
          v-for="(group, index) in categoryTabs" 
          :key="index"
          class="category-tab"
          :class="{ active: currentCategory === group }"
          @click="switchCategory(group)"
        >
          <text>{{ group }}</text>
        </view>
      </view>
      
      <scroll-view scroll-y class="channel-list">
        <view 
          v-for="(channel, index) in filteredChannels" 
          :key="index"
          class="channel-item"
          :class="{ playing: currentChannel && currentChannel.id === channel.id }"
          @click="playChannel(channel)"
        >
          <text class="channel-name">{{ channel.name }}</text>
          <text v-if="currentChannel && currentChannel.id === channel.id" class="playing-badge">正在播放</text>
        </view>
      </scroll-view>
    </view>
    
    <view v-if="currentChannel" class="player-wrapper">
      <video
        id="iptvPlayer"
        :src="currentChannel.url"
        :controls="true"
        :autoplay="true"
        :live="true"
        :enable-progress-gesture="false"
        :object-fit="'contain'"
        class="iptv-player"
        @error="onPlayError"
      ></video>
      <view class="channel-info">
        <text class="channel-title">{{ currentChannel.name }}</text>
        <text class="channel-group">{{ currentChannel.group }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { channelList, iptv } from '../../lib/storage'

export default {
  data() {
    return {
      channelList: [],
      currentChannel: null,
      currentCategory: '全部',
      categoryTabs: ['全部'],
      iptvPlayerContext: null
    }
  },
  computed: {
    filteredChannels() {
      if (this.currentCategory === '全部') {
        return this.channelList
      }
      return this.channelList.filter(ch => ch.group === this.currentCategory)
    }
  },
  onReady() {
    this.iptvPlayerContext = uni.createVideoContext('iptvPlayer', this)
  },
  async onLoad() {
    await this.loadChannels()
  },
  methods: {
    async loadChannels() {
      try {
        const channels = await channelList.all()
        this.channelList = channels.filter(ch => ch.isActive)
        
        const groups = [...new Set(this.channelList.map(ch => ch.group))]
        this.categoryTabs = ['全部', ...groups]
      } catch (e) {
        console.error('加载频道失败', e)
      }
    },
    switchCategory(group) {
      this.currentCategory = group
    },
    playChannel(channel) {
      this.currentChannel = channel
      setTimeout(() => {
        if (this.iptvPlayerContext) {
          this.iptvPlayerContext.play()
        }
      }, 200)
    },
    onPlayError(e) {
      console.error('IPTV播放失败', e)
      uni.showToast({ title: '播放失败，请重试', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.iptv-container {
  min-height: 100vh;
  background-color: #000000;
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

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  background-color: #1a1a2e;
}

.category-tab {
  padding: 16rpx 30rpx;
  margin: 10rpx;
  background-color: #333333;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 26rpx;
}

.category-tab.active {
  background-color: #409EFF;
}

.channel-list {
  height: 300rpx;
  background-color: #1a1a2e;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #333333;
}

.channel-name {
  color: #ffffff;
  font-size: 28rpx;
}

.playing-badge {
  color: #409EFF;
  font-size: 24rpx;
}

.channel-item.playing {
  background-color: #2d2d44;
}

.player-wrapper {
  position: relative;
}

.iptv-player {
  width: 100%;
  height: 400rpx;
}

.channel-info {
  padding: 20rpx 30rpx;
  background-color: #1a1a2e;
}

.channel-title {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: bold;
  display: block;
}

.channel-group {
  color: #999999;
  font-size: 24rpx;
  margin-top: 10rpx;
  display: block;
}
</style>
