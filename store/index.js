import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    view: 'Film',
    video: {
      key: '',
      info: {
        id: '',
        name: '',
        type: '',
        year: '',
        index: 0,
        time: 0,
        videoFlag: ''
      },
      iptv: null
    },
    detail: {
      show: false,
      key: '',
      info: {}
    },
    share: {
      show: false,
      key: '',
      info: {},
      index: 0
    },
    setting: {
      theme: 'light',
      volume: 0.6,
      forwardTimeInSec: 5,
      defaultParseURL: 'https://jx.xmflv.com/?url=',
      shortcut: false,
      autoChangeSourceWhenIptvStalling: true,
      waitingTimeInSec: 10
    },
    appState: {
      windowIsOnTop: false,
      isMobile: false,
      isTV: false
    },
    detailCache: {},
    editSites: false,
    recommendation: {
      show: false
    }
  },
  getters: {
    getView: state => state.view,
    getVideo: state => state.video,
    getDetail: state => state.detail,
    getShare: state => state.share,
    getSetting: state => state.setting,
    getAppState: state => state.appState,
    getDetailCache: state => state.detailCache,
    getEditSites: state => state.editSites
  },
  mutations: {
    SET_VIEW(state, view) {
      state.view = view
    },
    SET_VIDEO(state, video) {
      state.video = video
    },
    SET_DETAIL(state, detail) {
      state.detail = detail
    },
    SET_SHARE(state, share) {
      state.share = share
    },
    SET_SETTING(state, setting) {
      state.setting = setting
    },
    SET_APPSTATE(state, appState) {
      state.appState = appState
    },
    SET_DetailCache(state, cache) {
      state.detailCache = cache
    },
    SET_EDIT_SITES(state, edit) {
      state.editSites = edit
    },
    SET_RECOMMENDATION(state, rec) {
      state.recommendation = rec
    }
  },
  actions: {
    loadSettings({ commit }) {
      try {
        const settings = uni.getStorageSync('settings')
        if (settings) {
          commit('SET_SETTING', { ...state.setting, ...settings })
        }
      } catch (e) {
        console.error('加载设置失败', e)
      }
    },
    saveSettings({ state }) {
      try {
        uni.setStorageSync('settings', state.setting)
      } catch (e) {
        console.error('保存设置失败', e)
      }
    }
  }
})

export default store
