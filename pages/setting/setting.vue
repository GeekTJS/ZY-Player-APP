<template>
  <view class="setting-container">
    <scroll-view scroll-y class="setting-list">
      <view class="setting-section">
        <text class="section-title">外观设置</text>
        
        <view class="setting-item">
          <text class="setting-label">主题</text>
          <picker :value="themeIndex" :range="themeOptions" @change="onThemeChange">
            <view class="picker-value">
              <text>{{ themeOptions[themeIndex] }}</text>
            </view>
          </picker>
        </view>
      </view>
      
      <view class="setting-section">
        <text class="section-title">播放设置</text>
        
        <view class="setting-item">
          <text class="setting-label">默认解析接口</text>
          <input 
            v-model="settings.defaultParseURL" 
            class="setting-input" 
            placeholder="输入解析接口URL"
            @blur="saveSetting"
          />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">快进/快退时间(秒)</text>
          <input 
            v-model.number="settings.forwardTimeInSec" 
            type="number" 
            class="setting-input" 
            @blur="saveSetting"
          />
        </view>
        
        <view class="setting-item switch-item" @click="toggleSetting('autoChangeSourceWhenIptvStalling')">
          <text class="setting-label">IPTV卡顿自动换源</text>
          <switch :checked="settings.autoChangeSourceWhenIptvStalling" color="#409EFF" />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">IPTV等待时间(秒)</text>
          <input 
            v-model.number="settings.waitingTimeInSec" 
            type="number" 
            class="setting-input" 
            @blur="saveSetting"
          />
        </view>
      </view>
      
      <view class="setting-section">
        <text class="section-title">数据管理</text>
        
        <view class="setting-action">
          <button @click="exportData" class="action-btn">导出数据</button>
          <button @click="importData" class="action-btn">导入数据</button>
        </view>
        
        <view class="setting-action">
          <button @click="clearAllData" class="action-btn danger">清空所有数据</button>
        </view>
      </view>
      
      <view class="setting-section">
        <text class="section-title">关于</text>
        
        <view class="setting-item">
          <text class="setting-label">版本</text>
          <text class="setting-value">1.0.0</text>
        </view>
        
        <view class="setting-item">
          <text class="setting-label">GitHub</text>
          <text class="setting-value link" @click="openGitHub">Hunlongyu/ZY-Player</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { setting, history, star, sites, channelList } from '../../lib/storage'

export default {
  data() {
    return {
      settings: {
        theme: 'light',
        defaultParseURL: 'https://jx.xmflv.com/?url=',
        forwardTimeInSec: 5,
        autoChangeSourceWhenIptvStalling: true,
        waitingTimeInSec: 10
      },
      themeOptions: ['浅色', '深色', '绿色', '粉色'],
      themeIndex: 0
    }
  },
  async onLoad() {
    await this.loadSettings()
  },
  methods: {
    async loadSettings() {
      try {
        const dbSetting = await setting.find()
        if (dbSetting) {
          this.settings = { ...this.settings, ...dbSetting }
          const themes = ['light', 'dark', 'green', 'pink']
          this.themeIndex = themes.indexOf(this.settings.theme) || 0
        }
      } catch (e) {
        console.error('加载设置失败', e)
      }
    },
    async saveSetting() {
      try {
        const existSetting = await setting.find()
        if (existSetting) {
          await setting.update(existSetting.id, this.settings)
        } else {
          await setting.add(this.settings)
        }
        uni.showToast({ title: '已保存', icon: 'success', duration: 1000 })
      } catch (e) {
        console.error('保存设置失败', e)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },
    onThemeChange(e) {
      this.themeIndex = e.detail.value
      const themes = ['light', 'dark', 'green', 'pink']
      this.settings.theme = themes[this.themeIndex]
      this.saveSetting()
    },
    toggleSetting(key) {
      this.settings[key] = !this.settings[key]
      this.saveSetting()
    },
    async exportData() {
      try {
        const data = {
          history: await history.all(),
          star: await star.all(),
          sites: await sites.all(),
          channelList: await channelList.all(),
          setting: this.settings
        }
        
        const jsonStr = JSON.stringify(data, null, 2)
        
        // #ifdef APP-PLUS
        const fileName = `zy_player_backup_${Date.now()}.json`
        plus.io.requestFileSystem(plus.io.PUBLIC_DOCUMENTS, (fs) => {
          fs.root.getFile(fileName, { create: true }, (fileEntry) => {
            fileEntry.createWriter((writer) => {
              writer.write(jsonStr)
              uni.showToast({ title: '导出成功', icon: 'success' })
            })
          })
        })
        // #endif
        
        // #ifndef APP-PLUS
        uni.setClipboardData({
          data: jsonStr,
          success: () => {
            uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
          }
        })
        // #endif
      } catch (e) {
        console.error('导出数据失败', e)
        uni.showToast({ title: '导出失败', icon: 'none' })
      }
    },
    async importData() {
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['json'],
        success: async (res) => {
          try {
            const filePath = res.tempFiles[0].path
            // #ifdef APP-PLUS
            plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
              entry.file((file) => {
                const reader = new plus.io.FileReader()
                reader.onloadend = async (e) => {
                  const data = JSON.parse(e.target.result)
                  await this.restoreData(data)
                }
                reader.readAsText(file)
              })
            })
            // #endif
          } catch (e) {
            console.error('导入数据失败', e)
            uni.showToast({ title: '导入失败', icon: 'none' })
          }
        }
      })
    },
    async restoreData(data) {
      if (data.history) {
        await history.clear()
        await history.bulkAdd(data.history)
      }
      if (data.star) {
        await star.clear()
        await star.bulkAdd(data.star)
      }
      if (data.sites) {
        await sites.clear()
        await sites.bulkAdd(data.sites)
      }
      if (data.channelList) {
        await channelList.clear()
        await channelList.bulkAdd(data.channelList)
      }
      if (data.setting) {
        this.settings = { ...this.settings, ...data.setting }
        await this.saveSetting()
      }
      uni.showToast({ title: '导入成功', icon: 'success' })
    },
    async clearAllData() {
      uni.showModal({
        title: '警告',
        content: '此操作将清空所有数据，确定要继续吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await history.clear()
              await star.clear()
              uni.showToast({ title: '已清空', icon: 'success' })
            } catch (e) {
              uni.showToast({ title: '清空失败', icon: 'none' })
            }
          }
        }
      })
    },
    openGitHub() {
      // #ifdef APP-PLUS
      plus.runtime.openURL('https://github.com/Hunlongyu/ZY-Player')
      // #endif
      // #ifndef APP-PLUS
      uni.setClipboardData({
        data: 'https://github.com/Hunlongyu/ZY-Player'
      })
      // #endif
    }
  }
}
</script>

<style scoped>
.setting-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.setting-list {
  height: calc(100vh - 40rpx);
}

.setting-section {
  background-color: #ffffff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.section-title {
  display: block;
  padding: 20rpx 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #409EFF;
  background-color: #f0f8ff;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.switch-item {
  justify-content: space-between;
}

.setting-label {
  font-size: 28rpx;
  color: #333333;
}

.setting-value {
  font-size: 28rpx;
  color: #999999;
}

.setting-value.link {
  color: #409EFF;
}

.setting-input {
  width: 400rpx;
  height: 60rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  text-align: right;
}

.picker-value {
  padding: 10rpx 20rpx;
  background-color: #f5f5f5;
  border-radius: 10rpx;
  font-size: 26rpx;
}

.setting-action {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
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

.action-btn.danger {
  background-color: #ff4757;
}
</style>
