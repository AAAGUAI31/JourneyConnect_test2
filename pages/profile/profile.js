// pages/profile/profile.js
Page({
  data: {
    activeTab: 'created',
    userInfo: {
      name: '张三',
      avatar: 'https://via.placeholder.com/160x160/0052D9/ffffff?text=张',
      wechat: 'zhangsan_123',
      signature: '热爱旅行，寻找志同道合的旅伴',
      verified: true
    },
    stats: {
      createdCount: 5,
      joinedCount: 12,
      friendsCount: 23
    },
    createdActivities: [
      {
        id: 1,
        title: '周末黄山露营之旅',
        dateRange: '2024.03.15 - 03.17',
        location: '安徽·黄山',
        cover: 'https://via.placeholder.com/160x160/4F46E5/ffffff?text=活动',
        currentMembers: 3,
        maxMembers: 8,
        status: '报名中'
      },
      {
        id: 2,
        title: '杭州西湖摄影一日游',
        dateRange: '2024.03.10',
        location: '浙江·杭州',
        cover: 'https://via.placeholder.com/160x160/10B981/ffffff?text=活动',
        currentMembers: 10,
        maxMembers: 10,
        status: '已出行'
      }
    ],
    joinedActivities: [
      {
        id: 3,
        title: '云南大理洱海环湖骑行',
        dateRange: '2024.03.25 - 03.28',
        location: '云南·大理',
        cover: 'https://via.placeholder.com/160x160/F59E0B/ffffff?text=活动',
        currentMembers: 7,
        maxMembers: 12,
        status: '报名中'
      }
    ],
    showEditDialog: false,
    editForm: {
      signature: '',
      contact: ''
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadActivities()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadUserInfo()
    this.loadActivities()
  },

  loadUserInfo() {
    // 从缓存或 API 获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          ...userInfo
        }
      })
    }
  },

  loadActivities() {
    // 加载活动数据
    // 实际应该从 API 获取
  },

  onTabChange(e) {
    this.setData({
      activeTab: e.detail.value
    })
  },

  onLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = {
          name: res.userInfo.nickName,
          avatar: res.userInfo.avatarUrl,
          wechat: res.userInfo.nickName,
          signature: ''
        }
        wx.setStorageSync('userInfo', userInfo)
        this.setData({
          userInfo
        })
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('获取用户信息失败', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    })
  },

  onEditProfile() {
    if (!this.data.userInfo.name) {
      this.onLogin()
      return
    }
    
    this.setData({
      showEditDialog: true,
      editForm: {
        signature: this.data.userInfo.signature || '',
        contact: this.data.userInfo.wechat || ''
      }
    })
  },

  onCancelEdit() {
    this.setData({
      showEditDialog: false
    })
  },

  onSaveProfile() {
    const { signature, contact } = this.data.editForm
    const userInfo = {
      ...this.data.userInfo,
      signature,
      wechat: contact
    }
    
    wx.setStorageSync('userInfo', userInfo)
    this.setData({
      userInfo,
      showEditDialog: false
    })
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  onEditFormChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`editForm.${field}`]: value
    })
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})

