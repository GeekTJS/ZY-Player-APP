<template>
  <view class="play-container">
    <view class="player-wrapper">
      <video
        v-if="videoUrl && !isOnlinePlay"
        id="videoPlayer"
        :src="videoUrl"
        :controls="true"
        :autoplay="true"
        :show-center-play-btn="true"
        :enable-progress-gesture="true"
        :enable-play-gesture="true"
        :object-fit="'contain'"
        class="video-player"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @timeupdate="onTimeUpdate"
        @error="onError"
        @waiting="onWaiting"
      ></video>
      
      <view v-if="isOnlinePlay" class="iframe-player">
        <web-view :src="onlineUrl"></web-view>
      </view>
      
      <view v-if="!videoUrl && !isOnlinePlay" class="play-placeholder">
        <text class="placeholder-icon">🎬</text>
        <text class="placeholder-text">请选择要播放的视频</text>
        <button @click="goToFilm" class="go-film-btn">去浏览影视</button>
      </view>
    </view>
    
    <view v-if="videoName" class="video-info">
      <text class="video-title">{{ videoName }}</text>
      <text v-if="episodeText" class="video-episode">{{ episodeText }}</text>
    </view>
    
    <view v-if="videoUrl && !isOnlinePlay" class="play-controls">
      <view class="control-btn" @click="playPrev">
        <text>⏮️</text>
        <text class="btn-text">上一集</text>
      </view>
      
      <view class="control-btn" @click="togglePlay">
        <text>{{ isPlaying ? '⏸️' : '▶️' }}</text>
      </view>
      
      <view class="control-btn" @click="playNext">
        <text>⏭️</text>
        <text class="btn-text">下一集</text>
      </view>
    </view>
    
    <view v-if="episodeList.length > 0" class="episode-list">
      <view class="episode-header" @click="showEpisodes = !showEpisodes">
        <text>选集 ({{ episodeList.length }})</text>
        <text>{{ showEpisodes ? '收起' : '展开' }}</text>
      </view>
      <scroll-view v-if="showEpisodes" scroll-x class="episode-scroll">
        <view 
          v-for="(ep, index) in episodeList" 
          :key="index"
          class="episode-item"
          :class="{ active: currentIndex === index }"
          @click="playEpisode(index)"
        >
          <text>{{ getEpisodeName(ep, index) }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { history, star, setting } from '../../lib/storage'

export default {
  data() {
    return {
      videoUrl: '',
      onlineUrl: '',
      isOnlinePlay: false,
      videoName: '',
      episodeList: [],
      currentIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      showEpisodes: false,
      videoContext: null
    }
  },
  computed: {
    ...mapState(['video']),
    episodeText() {
      if (this.episodeList.length > 1) {
        return `第 ${this.currentIndex + 1} 集`
      }
      return ''
    }
  },
  onReady() {
    this.videoContext = uni.createVideoContext('videoPlayer', this)
  },
  onLoad(options) {
    if (options.key && options.id) {
      this.playFromParams(options)
    }
  },
  methods: {
    ...mapMutations(['SET_VIDEO']),
    async playFromParams(options) {
      this.video.key = options.key
      this.video.info.id = options.id
      this.video.info.name = decodeURIComponent(options.name || '')
      this.video.info.index = parseInt(options.index || '0')
      
      await this.loadVideo()
    },
    async loadVideo() {
      if (!this.video.key) return
      
      try {
        uni.showLoading({ title: '加载中...' })
        
        const dbSetting = await setting.find()
        const parseUrl = dbSetting?.defaultParseURL || 'https://jx.xmflv.com/?url='
        
        const videoInfo = await this.fetchVideoDetail()
        this.episodeList = videoInfo.list || []
        this.videoName = videoInfo.name
        
        const playIndex = this.video.info.index || 0
        this.playEpisode(playIndex, parseUrl)
        
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
        console.error(e)
      } finally {
        uni.hideLoading()
      }
    },
    async fetchVideoDetail() {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `${this.videoInfoApi}?ac=detail&ids=${this.video.info.id}`,
          success: (res) => {
            if (res.data && res.data.list && res.data.list.length > 0) {
              const data = res.data.list[0]
              resolve({
                name: data.vod_name,
                list: this.parsePlayList(data.vod_play_url)
              })
            } else {
              reject(new Error('获取详情失败'))
            }
          },
          fail: reject
        })
      })
    },
    parsePlayList(playUrlStr) {
      return playUrlStr.split('#').map(item => {
        const parts = item.split('$')
        return {
          name: parts[0] || '',
          url: parts[1] || ''
        }
      })
    },
    playEpisode(index, parseUrl) {
      if (index < 0 || index >= this.episodeList.length) return
      
      this.currentIndex = index
      const episode = this.episodeList[index]
      
      const isDirectPlay = episode.url.endsWith('.m3u8') || episode.url.endsWith('.mp4')
      
      if (isDirectPlay) {
        this.isOnlinePlay = false
        this.videoUrl = episode.url
      } else {
        this.isOnlinePlay = true
        this.onlineUrl = `${parseUrl}${episode.url}`
      }
      
      this.saveHistory()
    },
    async saveHistory() {
      try {
        const existRecord = await history.find({
          site: this.video.key,
          ids: this.video.info.id
        })
        
        const doc = {
          site: this.video.key,
          ids: this.video.info.id,
          name: this.videoName,
          type: this.video.info.type,
          year: this.video.info.year,
          index: this.currentIndex,
          time: this.currentTime,
          duration: this.duration
        }
        
        if (existRecord) {
          await history.update(existRecord.id, doc)
        } else {
          await history.add(doc)
        }
      } catch (e) {
        console.error('保存历史失败', e)
      }
    },
    playPrev() {
      if (this.currentIndex > 0) {
        this.playEpisode(this.currentIndex - 1)
      } else {
        uni.showToast({ title: '已经是第一集', icon: 'none' })
      }
    },
    playNext() {
      if (this.currentIndex < this.episodeList.length - 1) {
        this.playEpisode(this.currentIndex + 1)
      } else {
        uni.showToast({ title: '已经是最后一集', icon: 'none' })
      }
    },
    togglePlay() {
      if (this.isPlaying) {
        this.videoContext.pause()
      } else {
        this.videoContext.play()
      }
    },
    onPlay() {
      this.isPlaying = true
    },
    onPause() {
      this.isPlaying = false
    },
    onEnded() {
      this.isPlaying = false
      this.playNext()
    },
    onTimeUpdate(e) {
      this.currentTime = e.detail.currentTime
      this.duration = e.detail.duration
    },
    onError(e) {
      console.error('播放错误', e)
      uni.showToast({ title: '播放出错，请重试', icon: 'none' })
    },
    onWaiting() {
      console.log('视频缓冲中...')
    },
    getEpisodeName(ep, index) {
      return ep.name || `第 ${index + 1} 集`
    },
    goToFilm() {
      uni.switchTab({
        url: '/pages/film/film'
      })
    }
  }
}
</script>

<style scoped>
.play-container {
  min-height: 100vh;
  background-color: #000000;
}

.player-wrapper {
  width: 100%;
  background-color: #000000;
}

.video-player {
  width: 100%;
  height: 400rpx;
}

.iframe-player {
  width: 100%;
  height: 400rpx;
}

.play-placeholder {
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.placeholder-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.placeholder-text {
  color: #ffffff;
  font-size: 32rpx;
  margin-bottom: 40rpx;
}

.go-film-btn {
  background-color: #409EFF;
  color: #ffffff;
  border-radius: 40rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
}

.video-info {
  padding: 20rpx 30rpx;
  background-color: #1a1a2e;
}

.video-title {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: bold;
  display: block;
}

.video-episode {
  color: #409EFF;
  font-size: 28rpx;
  margin-top: 10rpx;
  display: block;
}

.play-controls {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 30rpx;
  background-color: #1a1a2e;
  border-top: 1rpx solid #333333;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 60rpx;
}

.btn-text {
  font-size: 24rpx;
  color: #ffffff;
  margin-top: 10rpx;
}

.episode-list {
  background-color: #1a1a2e;
}

.episode-header {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  color: #ffffff;
  font-size: 28rpx;
  border-bottom: 1rpx solid #333333;
}

.episode-scroll {
  white-space: nowrap;
  padding: 20rpx;
}

.episode-item {
  display: inline-block;
  padding: 16rpx 30rpx;
  margin-right: 20rpx;
  background-color: #333333;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 26rpx;
}

.episode-item.active {
  background-color: #409EFF;
}
</style>
