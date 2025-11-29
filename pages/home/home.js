// pages/home/home.js
Page({
  data: {
    searchValue: '',
    refreshing: false,
    loading: false,
    activities: []
  },

  onLoad() {
    // 加载活动列表
    this.loadActivities()
  },

  onSearchChange(e) {
    this.setData({
      searchValue: e.detail.value
    })
  },

  onSearch(e) {
    const searchValue = e.detail.value || this.data.searchValue
    this.setData({
      searchValue: searchValue
    })
    // 重新加载活动列表
    this.loadActivities()
  },

  onFilter() {
    wx.showToast({
      title: '筛选功能开发中',
      icon: 'none'
    })
  },

  onRefresh() {
    this.setData({
      refreshing: true
    })
    this.loadActivities().then(() => {
      this.setData({
        refreshing: false
      })
    })
  },

  onLoadMore() {
    if (this.data.loading) return
    this.setData({
      loading: true
    })
    // 加载更多数据
    setTimeout(() => {
      this.setData({
        loading: false
      })
    }, 1000)
  },

  // 从云数据库加载活动列表
  async loadActivities() {
    if (this.data.loading) {
      return Promise.resolve()
    }

    this.setData({
      loading: true
    })

    try {
      const db = wx.cloud.database()
      
      // 构建查询条件
      let query = db.collection('activities')
      
      // 如果有搜索关键词，添加搜索条件
      if (this.data.searchValue) {
        query = query.where({
          $or: [
            { title: db.RegExp({
              regexp: this.data.searchValue,
              options: 'i'
            })},
            { location: db.RegExp({
              regexp: this.data.searchValue,
              options: 'i'
            })}
          ]
        })
      }

      // 查询活动列表，按创建时间倒序排列
      const activitiesRes = await query
        .orderBy('createTime', 'desc')
        .get()

      // 如果没有活动数据，直接返回
      if (activitiesRes.data.length === 0) {
        this.setData({
          activities: [],
          loading: false
        })
        return Promise.resolve()
      }

      // 获取所有创建者ID
      const creatorIds = [...new Set(activitiesRes.data.map(item => item.creatorId).filter(id => id))]
      
      // 创建用户信息映射
      const userMap = {}
      
      // 如果有创建者ID，批量查询创建者信息
      if (creatorIds.length > 0) {
        try {
          const usersRes = await db.collection('users')
            .where({
              _id: db.command.in(creatorIds)
            })
            .get()

          usersRes.data.forEach(user => {
            userMap[user._id] = {
              name: user.name || '未命名用户',
              avatar: user.avatar || '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
            }
          })
        } catch (error) {
          console.error('查询用户信息失败:', error)
          // 如果批量查询失败，逐个查询
          for (const creatorId of creatorIds) {
            try {
              const userRes = await db.collection('users').doc(creatorId).get()
              if (userRes.data) {
                userMap[creatorId] = {
                  name: userRes.data.name || '未命名用户',
                  avatar: userRes.data.avatar || '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
                }
              }
            } catch (err) {
              console.error(`查询用户 ${creatorId} 失败:`, err)
            }
          }
        }
      }

      // 格式化活动数据
      const activities = activitiesRes.data.map(activity => {
        const creator = userMap[activity.creatorId] || {
          name: '未知用户',
          avatar: '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
        }

        // 处理封面图片：如果有云存储 fileID，直接使用；否则使用默认占位图
        let coverImage = ''
        if (activity.cover) {
          // 云存储的 fileID 可以直接作为图片源使用
          coverImage = activity.cover
        } else {
          // 使用本地默认图片作为占位图
          coverImage = '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
        }

        return {
          id: activity._id,
          title: activity.title || '未命名活动',
          dateRange: activity.dateRange || this.formatDateRange(activity.startDate, activity.endDate),
          location: activity.location || '未设置地点',
          cover: coverImage,
          creator: creator,
          currentMembers: activity.currentMembers || 1,
          maxMembers: activity.maxMembers || 8,
          tags: activity.tags || []
        }
      })

      this.setData({
        activities: activities,
        loading: false
      })

      return Promise.resolve()
    } catch (error) {
      console.error('加载活动列表失败:', error)
      this.setData({
        loading: false
      })
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      return Promise.reject(error)
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

  onCreateActivity() {
    wx.navigateTo({
      url: '/pages/create/create'
    })
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})

