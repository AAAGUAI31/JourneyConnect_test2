// pages/profile/profile.js
Page({
  data: {
    activeTab: 'created',
    userInfo: null,
    isLoggedIn: false,
    stats: {
      createdCount: 0,
      joinedCount: 0,
      friendsCount: 0
    },
    createdActivities: [
      {
        id: 1,
        title: '周末黄山露营之旅',
        dateRange: '2024.03.15 - 03.17',
        location: '安徽·黄山',
        cover: '',
        currentMembers: 3,
        maxMembers: 8,
        status: '报名中'
      },
      {
        id: 2,
        title: '杭州西湖摄影一日游',
        dateRange: '2024.03.10',
        location: '浙江·杭州',
        cover: '',
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
        cover: '',
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

  async onLoad() {
    this.checkLoginStatus()
    await this.loadUserInfo()
    this.loadActivities()
  },

  async onShow() {
    // 每次显示时刷新数据
    this.checkLoginStatus()
    await this.loadUserInfo()
    this.loadActivities()
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo._id) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      })
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null
      })
    }
  },

  // 从云数据库加载用户信息
  async loadUserInfo() {
    if (!this.data.isLoggedIn) {
      return
    }

    wx.showLoading({
      title: '加载中...',
      mask: true
    })

    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'get'
        }
      })

      if (res.result.success) {
        const userInfo = res.result.user
        this.setData({
          userInfo: userInfo,
          stats: {
            createdCount: userInfo.createdCount || 0,
            joinedCount: userInfo.joinedCount || 0,
            friendsCount: userInfo.friendsCount || 0
          }
        })
        
        // 更新缓存
        wx.setStorageSync('userInfo', userInfo)
        getApp().globalData.userInfo = userInfo
      } else {
        console.error('加载用户信息失败:', res.result.error)
      }
    } catch (error) {
      console.error('加载用户信息异常:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 从云数据库加载活动数据
  async loadActivities() {
    if (!this.data.isLoggedIn || !this.data.userInfo || !this.data.userInfo._id) {
      // 未登录时清空活动列表和统计数据
      this.setData({
        createdActivities: [],
        joinedActivities: [],
        'stats.createdCount': 0,
        'stats.joinedCount': 0
      })
      return
    }

    const userId = this.data.userInfo._id

    try {
      const db = wx.cloud.database()

      // 1. 查询用户发起的活动
      const createdRes = await db.collection('activities')
        .where({
          creatorId: userId
        })
        .orderBy('createTime', 'desc')
        .get()

      // 格式化发起的活动数据
      const createdActivities = createdRes.data.map(activity => {
        // 处理封面图片
        let coverImage = ''
        if (activity.cover) {
          coverImage = activity.cover
        } else {
          coverImage = '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
        }

        // 格式化日期范围
        let dateRange = activity.dateRange || ''
        if (!dateRange && activity.startDate && activity.endDate) {
          dateRange = this.formatDateRange(activity.startDate, activity.endDate)
        }

        // 判断活动状态
        let status = activity.status || '报名中'
        if (activity.currentMembers >= activity.maxMembers && status === '报名中') {
          status = '已满员'
        }

        return {
          id: activity._id,
          title: activity.title || '未命名活动',
          dateRange: dateRange,
          location: activity.location || '未设置地点',
          cover: coverImage,
          currentMembers: activity.currentMembers || 1,
          maxMembers: activity.maxMembers || 8,
          status: status
        }
      })

      // 2. 查询用户参加的活动（通过 activity_members 表）
      const membersRes = await db.collection('activity_members')
        .where({
          userId: userId
        })
        .orderBy('joinTime', 'desc')
        .get()

      // 获取所有参加的活动ID（排除自己创建的活动，避免重复）
      const joinedActivityIds = membersRes.data
        .map(member => member.activityId)
        .filter(id => {
          // 排除自己创建的活动（已在 createdActivities 中显示）
          return !createdRes.data.some(activity => activity._id === id)
        })

      // 批量查询参加的活动详情
      const joinedActivities = []
      if (joinedActivityIds.length > 0) {
        // 分批查询（云数据库单次查询最多20条）
        const batchSize = 20
        for (let i = 0; i < joinedActivityIds.length; i += batchSize) {
          const batchIds = joinedActivityIds.slice(i, i + batchSize)
          const activitiesRes = await db.collection('activities')
            .where({
              _id: db.command.in(batchIds)
            })
            .get()

          // 格式化参加的活动数据
          activitiesRes.data.forEach(activity => {
            // 处理封面图片
            let coverImage = ''
            if (activity.cover) {
              coverImage = activity.cover
            } else {
              coverImage = '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
            }

            // 格式化日期范围
            let dateRange = activity.dateRange || ''
            if (!dateRange && activity.startDate && activity.endDate) {
              dateRange = this.formatDateRange(activity.startDate, activity.endDate)
            }

            // 判断活动状态
            let status = activity.status || '报名中'
            if (activity.currentMembers >= activity.maxMembers && status === '报名中') {
              status = '已满员'
            }

            joinedActivities.push({
              id: activity._id,
              title: activity.title || '未命名活动',
              dateRange: dateRange,
              location: activity.location || '未设置地点',
              cover: coverImage,
              currentMembers: activity.currentMembers || 1,
              maxMembers: activity.maxMembers || 8,
              status: status
            })
          })
        }

        // 按照加入时间排序（需要根据 joinTime 排序）
        joinedActivities.sort((a, b) => {
          const aMember = membersRes.data.find(m => m.activityId === a.id)
          const bMember = membersRes.data.find(m => m.activityId === b.id)
          if (aMember && bMember && aMember.joinTime && bMember.joinTime) {
            return new Date(bMember.joinTime) - new Date(aMember.joinTime)
          }
          return 0
        })
      }

      // 3. 更新活动列表和统计数据
      this.setData({
        createdActivities: createdActivities,
        joinedActivities: joinedActivities,
        'stats.createdCount': createdActivities.length,
        'stats.joinedCount': joinedActivities.length
      })
    } catch (error) {
      console.error('加载活动数据失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      // 发生错误时保持原有数据不变
    }
  },

  // 格式化日期范围
  formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return ''
    }
    if (startDate === endDate) {
      return startDate.replace(/-/g, '.')
    }
    return `${startDate.replace(/-/g, '.')} - ${endDate.replace(/-/g, '.')}`
  },

  onTabChange(e) {
    this.setData({
      activeTab: e.detail.value
    })
  },

  // 内部函数：处理登录逻辑（调用云函数）
  async doLoginWithUserInfo(profileInfo) {
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    try {
      // 首先获取微信登录凭证
      const loginRes = await wx.login()
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      // 调用云函数进行登录/注册
      const cloudRes = await wx.cloud.callFunction({
        name: 'login',
        data: {
          userInfo: {
            nickName: profileInfo.nickName,
            avatarUrl: profileInfo.avatarUrl
          }
        }
      })

      if (cloudRes.result.success) {
        const userInfo = cloudRes.result.user
        
        // 保存到本地缓存
        wx.setStorageSync('userInfo', userInfo)
        getApp().globalData.userInfo = userInfo

        this.setData({
          userInfo: userInfo,
          isLoggedIn: true,
          stats: {
            createdCount: userInfo.createdCount || 0,
            joinedCount: userInfo.joinedCount || 0,
            friendsCount: userInfo.friendsCount || 0
          }
        })

        wx.showToast({
          title: cloudRes.result.isNewUser ? '注册成功' : '登录成功',
          icon: 'success'
        })
        
        return true
      } else {
        throw new Error(cloudRes.result.error || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000
      })
      return false
    } finally {
      wx.hideLoading()
    }
  },

  // 用户登录/注册（点击登录按钮时调用）
  async onLogin() {
    try {
      // 获取用户信息（必须在用户直接点击事件中调用）
      const profileRes = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })

      // 调用内部登录处理函数
      await this.doLoginWithUserInfo(profileRes.userInfo)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      if (error.errMsg && error.errMsg.includes('getUserProfile')) {
        wx.showToast({
          title: '需要授权才能登录',
          icon: 'none',
          duration: 2000
        })
      } else {
        wx.showToast({
          title: error.message || '登录失败',
          icon: 'none',
          duration: 2000
        })
      }
    }
  },

  // 编辑个人信息（点击编辑按钮时调用）
  async onEditProfile() {
    if (!this.data.isLoggedIn || !this.data.userInfo) {
      // 如果未登录，在用户直接点击事件中调用 getUserProfile
      try {
        const profileRes = await wx.getUserProfile({
          desc: '用于完善用户资料'
        })
        
        // 调用内部登录处理函数
        const loginSuccess = await this.doLoginWithUserInfo(profileRes.userInfo)
        
        // 登录成功后，打开编辑对话框
        if (loginSuccess) {
          this.setData({
            showEditDialog: true,
            editForm: {
              signature: this.data.userInfo.signature || '',
              contact: this.data.userInfo.wechat || ''
            }
          })
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        wx.showToast({
          title: '需要授权才能登录',
          icon: 'none',
          duration: 2000
        })
      }
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

  // 保存用户信息到云数据库
  async onSaveProfile() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    try {
      const { signature, contact } = this.data.editForm
      
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'update',
          userData: {
            signature: signature,
            wechat: contact
          }
        }
      })

      if (res.result.success) {
        const updatedUser = res.result.user
        
        // 更新本地缓存
        wx.setStorageSync('userInfo', updatedUser)
        getApp().globalData.userInfo = updatedUser

        this.setData({
          userInfo: updatedUser,
          showEditDialog: false
        })

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } else {
        throw new Error(res.result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
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

