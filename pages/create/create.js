// pages/create/create.js
Page({
  data: {
    styleTags: ['徒步', '露营', '摄影', '美食', '骑行', '潜水', '探险', '轻松游', '文化', '自驾'],
    form: {
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
      tags: [],
      maxMembers: 8,
      contact: '',
      coverFiles: []
    }
  },

  onLoad() {
    // 获取用户联系方式（从用户信息或缓存中获取）
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.wechat) {
      this.setData({
        'form.contact': userInfo.wechat
      })
    }
  },

  onFieldChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`form.${field}`]: value
    })
  },

  onStartDateChange(e) {
    this.setData({
      'form.startDate': e.detail.value
    })
  },

  onEndDateChange(e) {
    this.setData({
      'form.endDate': e.detail.value
    })
  },

  onLocationSelect() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.location': res.address
        })
      },
      fail: (err) => {
        console.error('选择位置失败', err)
      }
    })
  },

  onTagSelect(e) {
    const tag = e.currentTarget.dataset.tag
    const tags = [...this.data.form.tags]
    const index = tags.indexOf(tag)
    
    if (index > -1) {
      tags.splice(index, 1)
    } else {
      tags.push(tag)
    }
    
    this.setData({
      'form.tags': tags
    })
  },

  onMaxMembersChange(e) {
    this.setData({
      'form.maxMembers': e.detail.value
    })
  },

  onCoverChange(e) {
    this.setData({
      'form.coverFiles': e.detail.files
    })
  },

  onSubmit() {
    const { title, startDate, endDate, location, description, tags, maxMembers, contact } = this.data.form
    
    // 验证必填字段
    if (!title) {
      wx.showToast({
        title: '请输入活动标题',
        icon: 'none'
      })
      return
    }
    
    if (!startDate || !endDate) {
      wx.showToast({
        title: '请选择活动时间',
        icon: 'none'
      })
      return
    }
    
    if (!location) {
      wx.showToast({
        title: '请输入活动地点',
        icon: 'none'
      })
      return
    }
    
    if (!description) {
      wx.showToast({
        title: '请输入行程描述',
        icon: 'none'
      })
      return
    }
    
    if (tags.length === 0) {
      wx.showToast({
        title: '请选择至少一个旅行风格',
        icon: 'none'
      })
      return
    }
    
    if (!contact) {
      wx.showToast({
        title: '请输入联系方式',
        icon: 'none'
      })
      return
    }

    // 提交活动
    wx.showLoading({
      title: '发布中...'
    })

    // 模拟 API 调用
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
      
      // 跳转到详情页
      setTimeout(() => {
        wx.navigateBack({
          success: () => {
            // 刷新首页列表
            const pages = getCurrentPages()
            const prevPage = pages[pages.length - 2]
            if (prevPage && prevPage.onLoad) {
              prevPage.onLoad()
            }
          }
        })
      }, 1500)
    }, 1000)
  }
})

