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
    },
    // 标签选中状态映射，用于快速判断标签是否被选中
    tagSelected: {},
    // 上传组件网格配置
    gridConfig: {
      width: 300,
      height: 300
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
    const currentTags = [...this.data.form.tags]
    const tagSelected = {...this.data.tagSelected}
    const index = currentTags.indexOf(tag)
    
    // 如果标签已选中（在数组中），则取消选中（移除）
    // 如果标签未选中（不在数组中），则选中（添加）
    if (index > -1) {
      // 已选中，点击后变成灰色（取消选中）
      currentTags.splice(index, 1)
      tagSelected[tag] = false
    } else {
      // 未选中，点击后变成蓝色（选中）
      currentTags.push(tag)
      tagSelected[tag] = true
    }
    
    this.setData({
      'form.tags': currentTags,
      'tagSelected': tagSelected
    })
  },

  onMaxMembersChange(e) {
    this.setData({
      'form.maxMembers': e.detail.value
    })
  },

  // 手动选择图片（备用方案）
  onManualChooseImage() {
    console.log('手动选择图片触发')
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择图片成功:', res)
        const tempFilePaths = res.tempFilePaths
        if (tempFilePaths && tempFilePaths.length > 0) {
          const file = {
            url: tempFilePaths[0],
            path: tempFilePaths[0],
            tempFilePath: tempFilePaths[0],
            filePath: tempFilePaths[0],
            status: 'done',
            type: 'image'
          }
          console.log('创建的文件对象:', file)
          this.setData({
            'form.coverFiles': [file]
          }, () => {
            console.log('手动设置文件成功，当前文件数量:', this.data.form.coverFiles.length)
          })
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  onCoverChange(e) {
    console.log('========== onCoverChange 事件触发 ==========')
    console.log('完整事件对象 e:', e)
    console.log('e.detail:', e.detail)
    console.log('e.detail.files:', e.detail.files)
    
    // TDesign Upload 组件返回的文件列表
    const files = e.detail.files || []
    console.log('原始文件列表:', files)
    console.log('文件数量:', files.length)
    
    // 详细检查每个文件对象
    if (files.length > 0) {
      files.forEach((file, index) => {
        console.log(`文件 ${index} 详细信息:`)
        console.log('  - 完整对象:', file)
        console.log('  - url:', file.url)
        console.log('  - path:', file.path)
        console.log('  - tempFilePath:', file.tempFilePath)
        console.log('  - filePath:', file.filePath)
        console.log('  - name:', file.name)
        console.log('  - size:', file.size)
        console.log('  - type:', file.type)
        console.log('  - status:', file.status)
        console.log('  - 所有属性:', Object.keys(file))
      })
    }
    
    // 处理文件对象，确保有 url 属性用于预览
    const processedFiles = files.map((file, index) => {
      const processed = { ...file }
      
      // 尝试从多个可能的属性中获取图片路径
      if (!processed.url) {
        processed.url = file.path || file.tempFilePath || file.filePath || file.url || ''
        console.log(`文件 ${index} 使用备用路径:`, processed.url)
      }
      
      // 确保 status 存在
      if (!processed.status) {
        processed.status = 'done'
      }
      
      return processed
    })
    
    console.log('处理后的文件列表:', processedFiles)
    console.log('当前 form.coverFiles:', this.data.form.coverFiles)
    
    this.setData({
      'form.coverFiles': processedFiles
    }, () => {
      console.log('setData 完成后的 form.coverFiles:', this.data.form.coverFiles)
      console.log('form.coverFiles.length:', this.data.form.coverFiles.length)
      if (this.data.form.coverFiles.length > 0) {
        console.log('第一个文件的 url:', this.data.form.coverFiles[0].url)
        console.log('第一个文件的完整对象:', this.data.form.coverFiles[0])
      }
      console.log('========== onCoverChange 事件结束 ==========')
    })
  },

  // 上传成功事件
  onUploadSuccess(e) {
    console.log('========== onUploadSuccess 事件触发 ==========')
    console.log('成功事件对象:', e)
    console.log('e.detail:', e.detail)
    this.onCoverChange(e)
  },

  // 上传失败事件
  onUploadFail(e) {
    console.log('========== onUploadFail 事件触发 ==========')
    console.log('失败事件对象:', e)
    console.log('e.detail:', e.detail)
    wx.showToast({
      title: '上传失败',
      icon: 'none'
    })
  },

  // 上传进度事件
  onUploadProgress(e) {
    console.log('========== onUploadProgress 事件触发 ==========')
    console.log('进度事件对象:', e)
    console.log('e.detail:', e.detail)
  },

  // 删除封面图片
  onCoverDelete() {
    console.log('删除封面图片')
    this.setData({
      'form.coverFiles': []
    })
  },

  // 手动测试：检查当前文件状态
  onTestFileStatus() {
    console.log('========== 手动测试：当前文件状态 ==========')
    console.log('form.coverFiles:', this.data.form.coverFiles)
    console.log('form.coverFiles.length:', this.data.form.coverFiles.length)
    if (this.data.form.coverFiles.length > 0) {
      const file = this.data.form.coverFiles[0]
      console.log('第一个文件完整对象:', file)
      console.log('所有属性:', Object.keys(file))
      console.log('url:', file.url)
      console.log('path:', file.path)
      console.log('tempFilePath:', file.tempFilePath)
      console.log('filePath:', file.filePath)
      
      // 尝试所有可能的路径
      const possiblePaths = [
        file.url,
        file.path,
        file.tempFilePath,
        file.filePath
      ].filter(p => p)
      
      console.log('所有可能的图片路径:', possiblePaths)
      
      wx.showModal({
        title: '文件状态',
        content: `文件数量: ${this.data.form.coverFiles.length}\n` +
                 `url: ${file.url || '无'}\n` +
                 `path: ${file.path || '无'}\n` +
                 `tempFilePath: ${file.tempFilePath || '无'}\n` +
                 `filePath: ${file.filePath || '无'}\n` +
                 `status: ${file.status || '无'}`,
        showCancel: false
      })
    } else {
      console.log('没有文件')
      wx.showToast({
        title: '没有选择文件',
        icon: 'none'
      })
    }
    console.log('========== 手动测试结束 ==========')
  },

  // 上传封面图片到云存储
  async uploadCoverImage(filePath) {
    if (!filePath) {
      return ''
    }

    try {
      // 生成唯一的文件名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      // 获取文件扩展名
      const ext = filePath.split('.').pop() || 'jpg'
      const cloudPath = `activities/covers/${timestamp}_${randomStr}.${ext}`

      // 上传到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })

      console.log('封面图片上传成功:', uploadRes.fileID)
      return uploadRes.fileID
    } catch (error) {
      console.error('上传封面图片失败:', error)
      wx.showToast({
        title: '图片上传失败，请重试',
        icon: 'none'
      })
      throw error
    }
  },

  // 格式化日期范围
  formatDateRange(startDate, endDate) {
    if (startDate === endDate) {
      return startDate.replace(/-/g, '.')
    }
    return `${startDate.replace(/-/g, '.')} - ${endDate.replace(/-/g, '.')}`
  },

  async onSubmit() {
    const { title, startDate, endDate, location, description, tags, maxMembers, contact, coverFiles } = this.data.form
    
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

    // 检查用户登录状态
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/profile/profile'
        })
      }, 1500)
      return
    }

    // 提交活动
    wx.showLoading({
      title: '发布中...',
      mask: true
    })

    try {
      const db = wx.cloud.database()
      
      // 1. 上传封面图片到云存储
      let coverUrl = ''
      if (coverFiles && coverFiles.length > 0) {
        // TDesign Upload 组件的文件对象，url 属性是本地临时文件路径
        const filePath = coverFiles[0].url || coverFiles[0].path
        if (filePath) {
          try {
            // 更新加载提示
            wx.showLoading({
              title: '上传图片中...',
              mask: true
            })
            coverUrl = await this.uploadCoverImage(filePath)
            // 恢复加载提示
            wx.showLoading({
              title: '发布中...',
              mask: true
            })
          } catch (uploadError) {
            // 上传失败，但不阻止活动发布（封面图片为可选）
            console.error('封面图片上传失败，继续发布活动:', uploadError)
            // 恢复加载提示
            wx.showLoading({
              title: '发布中...',
              mask: true
            })
          }
        }
      }

      // 2. 格式化日期范围
      const dateRange = this.formatDateRange(startDate, endDate)

      // 3. 保存活动数据到云数据库
      const activityData = {
        creatorId: userInfo._id,
        title: title,
        startDate: startDate,
        endDate: endDate,
        dateRange: dateRange,
        location: location,
        description: description,
        tags: tags,
        maxMembers: maxMembers,
        currentMembers: 1, // 创建者自动加入
        contact: contact,
        cover: coverUrl,
        status: '报名中',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }

      const addResult = await db.collection('activities').add({
        data: activityData
      })

      // 4. 更新用户的创建活动数量
      await db.collection('users').doc(userInfo._id).update({
        data: {
          createdCount: db.command.inc(1),
          updateTime: db.serverDate()
        }
      })

      // 5. 将创建者添加到活动成员表
      await db.collection('activity_members').add({
        data: {
          activityId: addResult._id,
          userId: userInfo._id,
          joinTime: db.serverDate(),
          status: '已加入'
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
      
      // 跳转回首页并刷新列表
      setTimeout(() => {
        wx.navigateBack({
          success: () => {
            // 刷新首页列表
            const pages = getCurrentPages()
            const prevPage = pages[pages.length - 2]
            if (prevPage && prevPage.loadActivities) {
              prevPage.loadActivities()
            }
          }
        })
      }, 1500)
    } catch (error) {
      console.error('发布活动失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: error.message || '发布失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  }
})

