<template>
  <view class="film-container">
    <view class="search-bar">
      <input 
        v-model="searchKeyword" 
        placeholder="搜索影视资源..." 
        @confirm="search"
        class="search-input"
      />
      <button @click="search" class="search-btn">搜索</button>
    </view>
    
    <view class="filter-bar">
      <view class="filter-item" @click="showSitePicker = true">
        <text>{{ currentSiteName || '选择数据源' }}</text>
      </view>
      <view class="filter-item" @click="refreshData">
        <text>🔄 刷新</text>
      </view>
    </view>
    
    <view class="content-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      
      <view v-else-if="filmList.length === 0" class="empty">
        <text>暂无数据，请输入关键词搜索</text>
      </view>
      
      <view v-else>
        <view 
          v-for="(item, index) in filmList" 
          :key="index" 
          class="film-item"
          @click="showDetail(item)"
        >
          <image 
            v-if="item.vod_pic" 
            :src="item.vod_pic" 
            class="film-poster"
            mode="aspectFill"
          />
          <view v-else class="film-poster-placeholder">
            <text>🎬</text>
          </view>
          <view class="film-info">
            <text class="film-name">{{ item.vod_name }}</text>
            <text class="film-meta">{{ item.type_name }} | {{ item.vod_year }}</text>
            <text class="film-desc">{{ item.vod_remarks || item.vod_blurb }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view v-if="showSitePicker" class="picker-mask" @click="showSitePicker = false">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text>选择数据源</text>
          <text class="picker-close" @click="showSitePicker = false">×</text>
        </view>
        <scroll-view scroll-y class="picker-list">
          <view 
            v-for="site in sites" 
            :key="site.key"
            class="picker-item"
            :class="{ active: currentSite === site.key }"
            @click="selectSite(site)"
          >
            <text>{{ site.name }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
import { sites, filmCache } from '../../lib/storage'

export default {
  data() {
    return {
      searchKeyword: '',
      filmList: [],
      loading: false,
      sites: [],
      currentSite: '',
      currentSiteName: '',
      showSitePicker: false
    }
  },
  async onLoad() {
    await this.loadSites()
    await this.loadFilmList()
  },
  async onShow() {
    // 每次显示页面时，后台静默更新数据
    this.silentUpdate()
  },
  methods: {
    async loadSites() {
      try {
        this.sites = await sites.findAll({ isActive: true })
        if (this.sites.length === 0) {
          const defaultSite = {
            key: 'yszzq',
            name: '影视站长站',
            api: 'https://www.yszzq.com/api.php/provide/vod',
            isActive: true,
            group: '默认'
          }
          await sites.add(defaultSite)
          this.sites = [defaultSite]
        }
        if (this.sites.length > 0) {
          this.currentSite = this.sites[0].key
          this.currentSiteName = this.sites[0].name
        }
      } catch (e) {
        console.error('加载数据源失败', e)
      }
    },
    
    // 加载影视列表（优先本地缓存，同时后台更新）
    async loadFilmList() {
      this.loading = true
      try {
        // 1. 先尝试从本地缓存加载
        const cachedData = await this.loadFromCache()
        if (cachedData && cachedData.length > 0) {
          this.filmList = cachedData
          console.log('从本地缓存加载数据:', cachedData.length, '条')
        }
        
        // 2. 如果本地没有数据，则从API获取
        if (!cachedData || cachedData.length === 0) {
          await this.fetchFromApi()
        }
      } catch (e) {
        console.error('加载影视列表失败', e)
        uni.showToast({ title: '加载失败，请检查网络', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 从本地缓存加载
    async loadFromCache() {
      try {
        const cacheKey = `film_list_${this.currentSite}`
        const cached = await filmCache.find({ key: cacheKey })
        
        if (cached && cached.data) {
          // 检查缓存是否过期（24小时）
          const now = Date.now()
          const cacheTime = cached.timestamp || 0
          const expireTime = 24 * 60 * 60 * 1000 // 24小时
          
          if (now - cacheTime < expireTime) {
            return cached.data
          } else {
            console.log('缓存已过期')
            return null
          }
        }
        return null
      } catch (e) {
        console.error('读取缓存失败', e)
        return null
      }
    },
    
    // 从API获取数据
    async fetchFromApi() {
      try {
        console.log('从API获取数据...')
        const res = await this.callSiteApi('recent')
        
        if (res && res.length > 0) {
          this.filmList = res
          // 保存到本地缓存
          await this.saveToCache(res)
          console.log('API数据已缓存:', res.length, '条')
        }
      } catch (e) {
        console.error('API请求失败', e)
        throw e
      }
    },
    
    // 保存到本地缓存
    async saveToCache(data) {
      try {
        const cacheKey = `film_list_${this.currentSite}`
        
        // 先删除旧缓存
        const oldCache = await filmCache.find({ key: cacheKey })
        if (oldCache) {
          await filmCache.remove(oldCache.id)
        }
        
        // 保存新缓存（只保存前100条，避免存储过大）
        const cacheData = data.slice(0, 100)
        await filmCache.add({
          key: cacheKey,
          data: cacheData,
          timestamp: Date.now(),
          count: cacheData.length
        })
      } catch (e) {
        console.error('保存缓存失败', e)
      }
    },
    
    // 后台静默更新
    async silentUpdate() {
      try {
        console.log('后台静默更新...')
        const res = await this.callSiteApi('recent')
        
        if (res && res.length > 0) {
          // 检查数据是否有变化
          const hasChanged = JSON.stringify(res.slice(0, 10)) !== JSON.stringify(this.filmList.slice(0, 10))
          
          if (hasChanged) {
            this.filmList = res
            await this.saveToCache(res)
            console.log('数据已更新并缓存')
          } else {
            console.log('数据无变化')
          }
        }
      } catch (e) {
        console.error('静默更新失败', e)
      }
    },
    
    // 手动刷新
    async refreshData() {
      this.loading = true
      uni.showLoading({ title: '刷新中...' })
      
      try {
        await this.fetchFromApi()
        uni.showToast({ title: '刷新成功', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '刷新失败', icon: 'none' })
      } finally {
        this.loading = false
        uni.hideLoading()
      }
    },
    
    selectSite(site) {
      this.currentSite = site.key
      this.currentSiteName = site.name
      this.showSitePicker = false
      this.loadFilmList()
    },
    
    async search() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
        return
      }
      if (!this.currentSite) {
        uni.showToast({ title: '请先选择数据源', icon: 'none' })
        return
      }
      
      this.loading = true
      try {
        const searchResult = await this.callSiteApi('search', {
          keyword: this.searchKeyword
        })
        this.filmList = searchResult || []
      } catch (e) {
        uni.showToast({ title: '搜索失败', icon: 'none' })
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    
    showDetail(item) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${item.vod_id}&key=${this.currentSite}&name=${encodeURIComponent(item.vod_name)}&type=${item.type_name || ''}&year=${item.vod_year || ''}&pic=${encodeURIComponent(item.vod_pic || '')}&des=${encodeURIComponent(item.vod_blurb || item.vod_remarks || '')}`
      })
    },
    
    async callSiteApi(action, params = {}) {
      const site = this.sites.find(s => s.key === this.currentSite)
      if (!site) throw new Error('数据源不存在')
      
      const baseUrl = site.api
      const isXmlApi = baseUrl.includes('/xml/')
      
      return new Promise((resolve, reject) => {
        let url = baseUrl
        if (action === 'search') {
          url = `${url}?ac=detail&wd=${encodeURIComponent(params.keyword)}`
        } else if (action === 'recent') {
          url = `${url}?ac=detail&t=1&h=24&pg=1&pagesize=50`
        } else if (action === 'detail') {
          url = `${url}?ac=detail&ids=${params.id}`
        }
        
        uni.request({
          url,
          timeout: 10000,
          dataType: isXmlApi ? 'text' : 'json',
          success: (res) => {
            let data = res.data
            
            if (isXmlApi && typeof data === 'string') {
              data = this.parseXmlToJson(data)
            }
            
            if (data && data.list) {
              resolve(data.list)
            } else if (data && data.vod) {
              resolve(data.vod)
            } else {
              resolve([])
            }
          },
          fail: reject
        })
      })
    },
    
    parseXmlToJson(xmlString) {
      try {
        const result = {}
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
        
        const vodList = xmlDoc.getElementsByTagName('vod')
        if (vodList.length > 0) {
          const list = []
          for (let i = 0; i < vodList.length; i++) {
            const vod = vodList[i]
            const item = {}
            for (let j = 0; j < vod.childNodes.length; j++) {
              const node = vod.childNodes[j]
              if (node.nodeType === 1) {
                item[node.tagName] = node.textContent
              }
            }
            list.push(item)
          }
          return { list }
        }
        
        return {}
      } catch (e) {
        console.error('XML解析失败', e)
        return {}
      }
    }
  }
}
</script>

<style scoped>
.film-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.search-bar {
  display: flex;
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  background-color: #ffffff;
  border-radius: 10rpx 0 0 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.search-btn {
  width: 160rpx;
  height: 80rpx;
  background-color: #409EFF;
  color: #ffffff;
  border-radius: 0 10rpx 10rpx 0;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-bar {
  display: flex;
  margin-bottom: 20rpx;
  gap: 20rpx;
}

.filter-item {
  padding: 16rpx 30rpx;
  background-color: #ffffff;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.content-list {
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 20rpx;
}

.loading, .empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
}

.film-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.film-poster {
  width: 120rpx;
  height: 160rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
}

.film-poster-placeholder {
  width: 120rpx;
  height: 160rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
}

.film-info {
  flex: 1;
}

.film-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 10rpx;
}

.film-meta {
  font-size: 24rpx;
  color: #999999;
  display: block;
  margin-bottom: 10rpx;
}

.film-desc {
  font-size: 24rpx;
  color: #666666;
  display: block;
}

.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  z-index: 999;
}

.picker-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 70vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 32rpx;
  font-weight: bold;
}

.picker-close {
  font-size: 48rpx;
  color: #999999;
}

.picker-list {
  max-height: 50vh;
}

.picker-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 28rpx;
}

.picker-item.active {
  color: #409EFF;
  font-weight: bold;
}
</style>
