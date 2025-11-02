// pages/detail/detail.js
Page({
  data: {
    activityId: null,
    showRegisterDialog: false,
    activity: {},
    registerForm: {
      name: '',
      gender: '',
      age: '',
      contact: '',
      intro: ''
    }
  },

  onLoad(options) {
    const id = options.id || 1
    this.setData({
      activityId: id
    })
    this.loadActivityDetail(id)
  },

  loadActivityDetail(id) {
    // 模拟数据，实际应该从 API 获取
    const activities = {
      1: {
        id: 1,
        title: '周末黄山露营之旅',
        cover: 'https://via.placeholder.com/750x512/4F46E5/ffffff?text=黄山露营',
        dateRange: '2024年3月15日 - 3月17日（3天2夜）',
        location: '安徽省黄山市·黄山风景区',
        status: '报名中',
        currentMembers: 3,
        maxMembers: 8,
        tags: ['徒步', '露营', '探险', '摄影'],
        schedule: [
          {
            day: 1,
            date: '3月15日',
            content: '上午集合出发，中午到达黄山脚下，下午开始登山。晚上在山顶露营，观赏日落和星空。'
          },
          {
            day: 2,
            date: '3月16日',
            content: '早起看日出，全天游览黄山主要景点，包括迎客松、光明顶等。晚上继续露营。'
          },
          {
            day: 3,
            date: '3月17日',
            content: '继续游览，下午下山，结束愉快的旅程。'
          }
        ],
        creator: {
          name: '张三',
          avatar: 'https://via.placeholder.com/120x120/0052D9/ffffff?text=张',
          wechat: 'zhangsan_123'
        },
        members: [
          {
            id: 1,
            name: '李四',
            avatar: 'https://via.placeholder.com/96x96/EF4444/ffffff?text=李',
            age: 25,
            gender: '男'
          },
          {
            id: 2,
            name: '王五',
            avatar: 'https://via.placeholder.com/96x96/10B981/ffffff?text=王',
            age: 28,
            gender: '女'
          },
          {
            id: 3,
            name: '赵六',
            avatar: 'https://via.placeholder.com/96x96/8B5CF6/ffffff?text=赵',
            age: 23,
            gender: '女'
          }
        ]
      }
    }

    this.setData({
      activity: activities[id] || activities[1]
    })
  },

  onShowMembers() {
    wx.showToast({
      title: '查看全部报名人员',
      icon: 'none'
    })
  },

  onRegister() {
    // 检查登录状态
    this.setData({
      showRegisterDialog: true
    })
  },

  onRegisterCancel() {
    this.setData({
      showRegisterDialog: false
    })
  },

  onRegisterConfirm() {
    const { name, gender, contact } = this.data.registerForm
    if (!name || !gender || !contact) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'none'
      })
      return
    }

    // 提交报名信息
    wx.showLoading({
      title: '提交中...'
    })

    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '报名成功',
        icon: 'success'
      })
      this.setData({
        showRegisterDialog: false,
        'activity.currentMembers': this.data.activity.currentMembers + 1
      })
    }, 1000)
  },

  onFormChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`registerForm.${field}`]: value
    })
  },

  onGenderChange(e) {
    this.setData({
      'registerForm.gender': e.detail.value
    })
  }
})

