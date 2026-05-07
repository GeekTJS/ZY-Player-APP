<template>
  <view class="detail-container">
    <view class="detail-header">
      <image 
        v-if="detail.pic" 
        :src="detail.pic" 
        class="detail-poster"
        mode="aspectFill"
      />
      <view v-else class="detail-poster-placeholder">
        <text class="poster-icon">🎬</text>
      </view>
      
      <view class="detail-info">
        <text class="detail-name">{{ detail.name }}</text>
        <text class="detail-meta">{{ detail.type }} | {{ detail.year }}</text>
        <text class="detail-meta">{{ detail.area }} | {{ detail.lang }}</text>
        <text class="detail-actor" v-if="detail.actor">主演: {{ detail.actor }}</text>
        <text class="detail-director" v-if="detail.director">导演: {{ detail.director }}</text>
      </view>
    </view>
    
    <view class="detail-section">
      <text class="section-title">简介</text>
      <text class="detail-des">{{ detail.des }}</text>
    </view>
    
    <view class="detail-section">
      <text class="section-title">选集</text>
      <scroll-view scroll-y class="episode-list">
        <view 
          v-for="(ep, index) in episodeList" 
          :key="index"
          class="episode-item"
          @click="playEpisode(index)"
        >
          <text>{{ getEpisodeName(ep, index) }}</text>
        </view>
      </scroll-view>
    </view>
    
    <view class="action-bar">
      <button @click="toggleStar" class="action-btn" :class="{ starred: isStarred }">
        {{ isStarred ? '取消收藏' : '收藏' }}
      </button>
      <button @click="shareItem" class="action-btn">
        分享
      </button>
    </view>
  </view>
</template>

<script>
import { star, sites } from '../../lib/storage'

export default {
  data() {
    return {
      detail: {},
      episodeList: [],
      isStarred: false,
      siteApiUrl: ''
    }
  },
  async onLoad(options) {
    await this.loadDetail(options)
  },
  methods: {
    async loadDetail(options) {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const site = await sites.find({ key: options.key })
        if (site) {
          this.siteApiUrl = site.api
        }
        
        this.detail = {
          id: options.id,
          key: options.key,
          name: decodeURIComponent(options.name || ''),
          type: options.type || '',
          year: options.year || '',
          area: options.area || '',
          lang: options.lang || '',
          actor: options.actor || '',
          director: options.director || '',
          des: decodeURIComponent(options.des || ''),
          pic: decodeURIComponent(options.pic || '')
        }
        
        await this.fetchEpisodeList()
        await this.checkStarStatus()
        
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
        console.error(e)
      } finally {
        uni.hideLoading()
      }
    },
    async fetchEpisodeList() {
      const res = await new Promise((resolve, reject) => {
        uni.request({
          url: `${this.siteApiUrl}?ac=detail&ids=${this.detail.id}`,
          success: resolve,
          fail: reject
        })
      })
      
      if (res.data && res.data.list && res.data.list.length > 0) {
        const data = res.data.list[0]
        this.detail = {
          ...this.detail,
          name: data.vod_name,
          type: data.type_name,
          year: data.vod_year,
          area: data.vod_area,
          lang: data.vod_lang,
          actor: data.vod_actor,
          director: data.vod_director,
          des: data.vod_content,
          pic: data.vod_pic
        }
        this.episodeList = this.parsePlayList(data.vod_play_url)
      }
    },
    parsePlayList(playUrlStr) {
      if (!playUrlStr) return []
      return playUrlStr.split('#').map(item => {
        const parts = item.split('$')
        return {
          name: parts[0] || '',
          url: parts[1] || ''
        }
      })
    },
    async checkStarStatus() {
      const exist = await star.find({
        key: this.detail.key,
        ids: this.detail.id
      })
      this.isStarred = !!exist
    },
    async toggleStar() {
      try {
        if (this.isStarred) {
          const exist = await star.find({
            key: this.detail.key,
            ids: this.detail.id
          })
          await star.remove(exist.id)
          this.isStarred = false
          uni.showToast({ title: '已取消收藏', icon: 'success' })
        } else {
          await star.add({
            key: this.detail.key,
            ids: this.detail.id,
            name: this.detail.name,
            detail: this.detail,
            index: 0
          })
          this.isStarred = true
          uni.showToast({ title: '收藏成功', icon: 'success' })
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    playEpisode(index) {
      uni.navigateTo({
        url: `/pages/play/play?key=${this.detail.key}&id=${this.detail.id}&name=${encodeURIComponent(this.detail.name)}&index=${index}`
      })
    },
    getEpisodeName(ep, index) {
      return ep.name || `第 ${index + 1} 集`
    },
    shareItem() {
      uni.showToast({ title: '分享功能开发中', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.detail-header {
  display: flex;
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.detail-poster {
  width: 200rpx;
  height: 280rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
}

.detail-poster-placeholder {
  width: 200rpx;
  height: 280rpx;
  border-radius: 10rpx;
  background-color: #f0f0f0;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.poster-icon {
  font-size: 80rpx;
}

.detail-info {
  flex: 1;
}

.detail-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 15rpx;
}

.detail-meta {
  font-size: 24rpx;
  color: #999999;
  display: block;
  margin-bottom: 10rpx;
}

.detail-actor, .detail-director {
  font-size: 24rpx;
  color: #666666;
  display: block;
  margin-bottom: 10rpx;
}

.detail-section {
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 20rpx;
}

.detail-des {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.episode-list {
  max-height: 600rpx;
}

.episode-item {
  display: inline-block;
  padding: 16rpx 30rpx;
  margin: 10rpx;
  background-color: #f5f5f5;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #333333;
}

.action-bar {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  background-color: #409EFF;
  color: #ffffff;
  border-radius: 10rpx;
}

.action-btn.starred {
  background-color: #ff9800;
}
</style>
