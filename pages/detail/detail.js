// pages/detail/detail.js
Page({
  data: {
    activityId: null,
    showRegisterDialog: false,
    showEditDialog: false, // 编辑活动弹窗
    activity: {},
    isRegistered: false, // 是否已报名
    isCreator: false, // 是否是创建者
    registerForm: {
      name: '',
      gender: '',
      age: '',
      contact: '',
      intro: ''
    },
    // 编辑活动表单
    editForm: {
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
    styleTags: ['徒步', '露营', '摄影', '美食', '骑行', '潜水', '探险', '轻松游', '文化', '自驾'],
    tagSelected: {}, // 标签选中状态
    gridConfig: {
      width: 300,
      height: 300
    },
    originalActivityData: null // 保存原始活动数据，用于对比
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({
        title: '活动不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    
    this.setData({
      activityId: id
    })
    this.loadActivityDetail(id)
  },

  // 从云数据库加载活动详情
  async loadActivityDetail(id) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })

    try {
      const db = wx.cloud.database()

      // 1. 查询活动基本信息
      const activityRes = await db.collection('activities').doc(id).get()
      
      if (!activityRes.data) {
        throw new Error('活动不存在')
      }

      const activityData = activityRes.data

      // 2. 查询创建者信息
      let creator = {
        name: '未知用户',
        avatar: '/assets/icons/pngtree-default-avatar-image_2238788.jpg',
        wechat: ''
      }
      
      if (activityData.creatorId) {
        try {
          const creatorRes = await db.collection('users').doc(activityData.creatorId).get()
          if (creatorRes.data) {
            creator = {
              name: creatorRes.data.name || '未命名用户',
              avatar: creatorRes.data.avatar || '/assets/icons/pngtree-default-avatar-image_2238788.jpg',
              wechat: creatorRes.data.wechat || activityData.contact || ''
            }
          }
        } catch (error) {
          console.error('查询创建者信息失败:', error)
        }
      }

      // 3. 查询活动成员列表
      const membersRes = await db.collection('activity_members')
        .where({
          activityId: id
        })
        .get()

      // 获取所有成员的用户ID
      const memberUserIds = membersRes.data.map(item => item.userId).filter(id => id)
      
      // 批量查询成员的用户信息
      const members = []
      if (memberUserIds.length > 0) {
        try {
          const usersRes = await db.collection('users')
            .where({
              _id: db.command.in(memberUserIds)
            })
            .get()

          // 创建用户信息映射
          const userMap = {}
          usersRes.data.forEach(user => {
            userMap[user._id] = {
              id: user._id,
              name: user.name || '未命名用户',
              avatar: user.avatar || '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
            }
          })

          // 按照加入时间排序（如果需要的话，可以按 joinTime 排序）
          membersRes.data.forEach(member => {
            if (userMap[member.userId]) {
              members.push(userMap[member.userId])
            }
          })
        } catch (error) {
          console.error('查询成员信息失败:', error)
          // 如果批量查询失败，逐个查询
          for (const member of membersRes.data) {
            try {
              const userRes = await db.collection('users').doc(member.userId).get()
              if (userRes.data) {
                members.push({
                  id: userRes.data._id,
                  name: userRes.data.name || '未命名用户',
                  avatar: userRes.data.avatar || '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
                })
              }
            } catch (err) {
              console.error(`查询用户 ${member.userId} 失败:`, err)
            }
          }
        }
      }

      // 4. 格式化活动数据
      // 处理封面图片：如果有云存储 fileID，直接使用；否则使用默认占位图
      let coverImage = ''
      if (activityData.cover) {
        // 云存储的 fileID 可以直接作为图片源使用
        coverImage = activityData.cover
      } else {
        // 使用本地默认图片作为占位图
        coverImage = '/assets/icons/pngtree-default-avatar-image_2238788.jpg'
      }

      const activity = {
        id: activityData._id,
        title: activityData.title || '未命名活动',
        cover: coverImage,
        dateRange: activityData.dateRange || this.formatDateRange(activityData.startDate, activityData.endDate),
        location: activityData.location || '未设置地点',
        status: activityData.status || '报名中',
        currentMembers: activityData.currentMembers || 1,
        maxMembers: activityData.maxMembers || 8,
        tags: activityData.tags || [],
        description: activityData.description || '',
        creator: creator,
        members: members
      }

      // 5. 检查当前用户是否已报名和是否是创建者
      const userInfo = wx.getStorageSync('userInfo')
      const isRegistered = await this.checkIfRegistered()
      const isCreator = userInfo && userInfo._id === activityData.creatorId

      // 保存原始活动数据，用于编辑
      this.setData({
        activity: activity,
        isRegistered: isRegistered,
        isCreator: isCreator,
        originalActivityData: activityData
      })

      wx.hideLoading()
    } catch (error) {
      console.error('加载活动详情失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: error.message || '加载失败，请重试',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
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

  onShowMembers() {
    wx.showToast({
      title: '查看全部报名人员',
      icon: 'none'
    })
  },

  async onRegister() {
    // 检查登录状态
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

    // 检查是否已报名（创建者可以再次报名以完善信息）
    const isRegistered = await this.checkIfRegistered()
    if (isRegistered && !this.data.isCreator) {
      wx.showToast({
        title: '您已报名此活动',
        icon: 'none'
      })
      return
    }

    // 检查活动是否已满员（创建者不受限制）
    if (!this.data.isCreator && this.data.activity.currentMembers >= this.data.activity.maxMembers) {
      wx.showToast({
        title: '活动已满员',
        icon: 'none'
      })
      return
    }

    // 如果已报名（创建者的情况），尝试加载已有信息
    let formData = {
      name: userInfo.name || '',
      gender: '',
      age: '',
      contact: userInfo.wechat || '',
      intro: ''
    }

    if (isRegistered && this.data.isCreator) {
      try {
        const db = wx.cloud.database()
        const memberRes = await db.collection('activity_members')
          .where({
            activityId: this.data.activityId,
            userId: userInfo._id
          })
          .get()
        
        if (memberRes.data.length > 0) {
          const memberData = memberRes.data[0]
          formData = {
            name: memberData.name || userInfo.name || '',
            gender: memberData.gender || '',
            age: memberData.age || '',
            contact: memberData.contact || userInfo.wechat || '',
            intro: memberData.intro || ''
          }
        }
      } catch (error) {
        console.error('加载报名信息失败:', error)
      }
    }

    // 打开报名弹窗
    this.setData({
      showRegisterDialog: true,
      registerForm: formData
    })
  },

  // 检查用户是否已报名
  async checkIfRegistered() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo || !userInfo._id) {
        return false
      }

      const db = wx.cloud.database()
      const res = await db.collection('activity_members')
        .where({
          activityId: this.data.activityId,
          userId: userInfo._id
        })
        .get()

      return res.data.length > 0
    } catch (error) {
      console.error('检查报名状态失败:', error)
      return false
    }
  },

  onRegisterCancel() {
    this.setData({
      showRegisterDialog: false,
      registerForm: {
        name: '',
        gender: '',
        age: '',
        contact: '',
        intro: ''
      }
    })
  },

  async onRegisterConfirm() {
    const { name, gender, contact } = this.data.registerForm
    if (!name || !gender || !contact) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'none'
      })
      return
    }

    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      this.setData({
        showRegisterDialog: false
      })
      return
    }

    // 检查是否已报名（创建者可以再次报名以完善信息）
    const isRegistered = await this.checkIfRegistered()
    if (isRegistered && !this.data.isCreator) {
      wx.showToast({
        title: '您已报名此活动',
        icon: 'none'
      })
      this.setData({
        showRegisterDialog: false
      })
      return
    }

    // 检查活动是否已满员（创建者不受限制）
    if (!this.data.isCreator && this.data.activity.currentMembers >= this.data.activity.maxMembers) {
      wx.showToast({
        title: '活动已满员',
        icon: 'none'
      })
      this.setData({
        showRegisterDialog: false
      })
      return
    }

    // 提交报名信息
    wx.showLoading({
      title: '提交中...',
      mask: true
    })

    try {
      const db = wx.cloud.database()

      // 检查是否已存在报名记录（创建者可能已经自动加入）
      const existingMember = await db.collection('activity_members')
        .where({
          activityId: this.data.activityId,
          userId: userInfo._id
        })
        .get()

      if (existingMember.data.length > 0) {
        // 如果已存在，更新报名信息（创建者完善信息的情况）
        await db.collection('activity_members').doc(existingMember.data[0]._id).update({
          data: {
            name: name,
            gender: gender,
            age: this.data.registerForm.age || '',
            contact: contact,
            intro: this.data.registerForm.intro || '',
            updateTime: db.serverDate()
          }
        })
      } else {
        // 如果不存在，创建新的报名记录
        await db.collection('activity_members').add({
          data: {
            activityId: this.data.activityId,
            userId: userInfo._id,
            name: name,
            gender: gender,
            age: this.data.registerForm.age || '',
            contact: contact,
            intro: this.data.registerForm.intro || '',
            joinTime: db.serverDate(),
            status: '已加入'
          }
        })

        // 更新活动的当前成员数量（只有新报名时才增加）
        await db.collection('activities').doc(this.data.activityId).update({
          data: {
            currentMembers: db.command.inc(1),
            updateTime: db.serverDate()
          }
        })

        // 更新用户的参加活动数量（只有新报名时才增加）
        await db.collection('users').doc(userInfo._id).update({
          data: {
            joinedCount: db.command.inc(1),
            updateTime: db.serverDate()
          }
        })
      }

      wx.hideLoading()
      wx.showToast({
        title: '报名成功',
        icon: 'success'
      })

      // 关闭弹窗并重置表单
      this.setData({
        showRegisterDialog: false,
        isRegistered: true, // 标记为已报名
        registerForm: {
          name: '',
          gender: '',
          age: '',
          contact: '',
          intro: ''
        }
      })

      // 重新加载活动详情，刷新成员列表
      await this.loadActivityDetail(this.data.activityId)
    } catch (error) {
      console.error('报名失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: error.message || '报名失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
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
  },

  // ========== 编辑活动相关方法 ==========
  
  // 打开编辑活动弹窗
  onEditActivity() {
    if (!this.data.isCreator) {
      wx.showToast({
        title: '只有创建者可以编辑活动',
        icon: 'none'
      })
      return
    }

    const activityData = this.data.originalActivityData
    if (!activityData) {
      wx.showToast({
        title: '活动数据加载中，请稍候',
        icon: 'none'
      })
      return
    }

    // 初始化编辑表单数据
    const tagSelected = {}
    this.data.styleTags.forEach(tag => {
      tagSelected[tag] = activityData.tags && activityData.tags.includes(tag)
    })

    // 处理封面图片
    let coverFiles = []
    if (activityData.cover) {
      coverFiles = [{
        url: activityData.cover,
        path: activityData.cover,
        status: 'done',
        type: 'image'
      }]
    }

    this.setData({
      showEditDialog: true,
      editForm: {
        title: activityData.title || '',
        startDate: activityData.startDate || '',
        endDate: activityData.endDate || '',
        location: activityData.location || '',
        description: activityData.description || '',
        tags: activityData.tags || [],
        maxMembers: activityData.maxMembers || 8,
        contact: activityData.contact || '',
        coverFiles: coverFiles
      },
      tagSelected: tagSelected
    })
  },

  // 关闭编辑弹窗
  onEditCancel() {
    this.setData({
      showEditDialog: false
    })
  },

  // 编辑表单字段变化
  onEditFieldChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`editForm.${field}`]: value
    })
  },

  // 编辑表单日期变化
  onEditStartDateChange(e) {
    this.setData({
      'editForm.startDate': e.detail.value
    })
  },

  onEditEndDateChange(e) {
    this.setData({
      'editForm.endDate': e.detail.value
    })
  },

  // 编辑表单地点选择
  onEditLocationSelect() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'editForm.location': res.address
        })
      },
      fail: (err) => {
        console.error('选择位置失败', err)
      }
    })
  },

  // 编辑表单标签选择
  onEditTagSelect(e) {
    const tag = e.currentTarget.dataset.tag
    const currentTags = [...this.data.editForm.tags]
    const tagSelected = {...this.data.tagSelected}
    const index = currentTags.indexOf(tag)
    
    if (index > -1) {
      currentTags.splice(index, 1)
      tagSelected[tag] = false
    } else {
      currentTags.push(tag)
      tagSelected[tag] = true
    }
    
    this.setData({
      'editForm.tags': currentTags,
      tagSelected: tagSelected
    })
  },

  // 编辑表单人数上限变化
  onEditMaxMembersChange(e) {
    this.setData({
      'editForm.maxMembers': e.detail.value
    })
  },

  // 手动选择图片（备用方案）
  onEditManualChooseImage() {
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
            'editForm.coverFiles': [file]
          }, () => {
            console.log('手动设置文件成功，当前文件数量:', this.data.editForm.coverFiles.length)
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

  // 编辑表单封面变化
  onEditCoverChange(e) {
    console.log('========== onEditCoverChange 事件触发 ==========')
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
    console.log('当前 editForm.coverFiles:', this.data.editForm.coverFiles)
    
    this.setData({
      'editForm.coverFiles': processedFiles
    }, () => {
      console.log('setData 完成后的 editForm.coverFiles:', this.data.editForm.coverFiles)
      console.log('editForm.coverFiles.length:', this.data.editForm.coverFiles.length)
      if (this.data.editForm.coverFiles.length > 0) {
        console.log('第一个文件的 url:', this.data.editForm.coverFiles[0].url)
        console.log('第一个文件的完整对象:', this.data.editForm.coverFiles[0])
      }
      console.log('========== onEditCoverChange 事件结束 ==========')
    })
  },

  // 上传成功事件
  onEditUploadSuccess(e) {
    console.log('========== onEditUploadSuccess 事件触发 ==========')
    console.log('成功事件对象:', e)
    console.log('e.detail:', e.detail)
    this.onEditCoverChange(e)
  },

  // 上传失败事件
  onEditUploadFail(e) {
    console.log('========== onEditUploadFail 事件触发 ==========')
    console.log('失败事件对象:', e)
    console.log('e.detail:', e.detail)
    wx.showToast({
      title: '上传失败',
      icon: 'none'
    })
  },

  // 上传进度事件
  onEditUploadProgress(e) {
    console.log('========== onEditUploadProgress 事件触发 ==========')
    console.log('进度事件对象:', e)
    console.log('e.detail:', e.detail)
  },

  // 删除编辑表单封面
  onEditCoverDelete() {
    console.log('删除封面图片')
    this.setData({
      'editForm.coverFiles': []
    })
  },

  // 上传封面图片到云存储
  async uploadCoverImage(filePath) {
    if (!filePath) {
      return ''
    }

    try {
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const ext = filePath.split('.').pop() || 'jpg'
      const cloudPath = `activities/covers/${timestamp}_${randomStr}.${ext}`

      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })

      return uploadRes.fileID
    } catch (error) {
      console.error('上传封面图片失败:', error)
      throw error
    }
  },

  // 删除云存储中的文件
  async deleteCloudFile(fileID) {
    if (!fileID) {
      return
    }

    try {
      // 检查是否是云存储文件ID（以cloud://开头）
      if (fileID.startsWith('cloud://')) {
        await wx.cloud.deleteFile({
          fileList: [fileID]
        })
        console.log('删除云存储文件成功:', fileID)
      }
    } catch (error) {
      console.error('删除云存储文件失败:', error)
      // 不抛出错误，因为删除失败不应该阻止活动删除
    }
  },

  // 保存编辑
  async onEditConfirm() {
    const { title, startDate, endDate, location, description, tags, maxMembers, contact, coverFiles } = this.data.editForm
    
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

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    try {
      const db = wx.cloud.database()
      const activityData = this.data.originalActivityData
      const oldCover = activityData.cover
      let newCover = oldCover

      // 处理封面图片
      if (coverFiles && coverFiles.length > 0) {
        const file = coverFiles[0]
        // 检查是否是新的本地文件（需要上传）
        const filePath = file.url || file.path || file.tempFilePath || file.filePath
        if (filePath && !filePath.startsWith('cloud://')) {
          // 是新文件，需要上传
          try {
            wx.showLoading({
              title: '上传图片中...',
              mask: true
            })
            newCover = await this.uploadCoverImage(filePath)
            // 删除旧封面
            if (oldCover && oldCover !== newCover) {
              await this.deleteCloudFile(oldCover)
            }
            wx.showLoading({
              title: '保存中...',
              mask: true
            })
          } catch (uploadError) {
            console.error('上传封面图片失败:', uploadError)
            wx.showLoading({
              title: '保存中...',
              mask: true
            })
          }
        } else if (filePath && filePath.startsWith('cloud://')) {
          // 是云存储文件，直接使用
          newCover = filePath
        }
      } else {
        // 没有封面，删除旧封面
        if (oldCover) {
          await this.deleteCloudFile(oldCover)
          newCover = ''
        }
      }

      // 格式化日期范围
      const dateRange = this.formatDateRange(startDate, endDate)

      // 更新活动数据
      await db.collection('activities').doc(this.data.activityId).update({
        data: {
          title: title,
          startDate: startDate,
          endDate: endDate,
          dateRange: dateRange,
          location: location,
          description: description,
          tags: tags,
          maxMembers: maxMembers,
          contact: contact,
          cover: newCover,
          updateTime: db.serverDate()
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 关闭弹窗
      this.setData({
        showEditDialog: false
      })

      // 重新加载活动详情
      await this.loadActivityDetail(this.data.activityId)
    } catch (error) {
      console.error('保存活动失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: error.message || '保存失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 删除活动
  async onDeleteActivity() {
    if (!this.data.isCreator) {
      wx.showToast({
        title: '只有创建者可以删除活动',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除此活动吗？',
      confirmText: '删除',
      confirmColor: '#ff3b30',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          })

          try {
            const db = wx.cloud.database()
            const activityData = this.data.originalActivityData

            // 1. 删除活动封面图片（如果有）
            if (activityData.cover) {
              await this.deleteCloudFile(activityData.cover)
            }

            // 2. 删除活动成员记录
            const membersRes = await db.collection('activity_members')
              .where({
                activityId: this.data.activityId
              })
              .get()

            // 批量删除成员记录
            if (membersRes.data.length > 0) {
              const deletePromises = membersRes.data.map(member => {
                return db.collection('activity_members').doc(member._id).remove()
              })
              await Promise.all(deletePromises)

              // 更新用户的参加活动数量
              const userIds = membersRes.data.map(m => m.userId).filter(id => id)
              const uniqueUserIds = [...new Set(userIds)]
              
              for (const userId of uniqueUserIds) {
                try {
                  await db.collection('users').doc(userId).update({
                    data: {
                      joinedCount: db.command.inc(-1),
                      updateTime: db.serverDate()
                    }
                  })
                } catch (err) {
                  console.error(`更新用户 ${userId} 的参加活动数量失败:`, err)
                }
              }
            }

            // 3. 删除活动记录
            await db.collection('activities').doc(this.data.activityId).remove()

            // 4. 更新创建者的创建活动数量
            const userInfo = wx.getStorageSync('userInfo')
            if (userInfo && userInfo._id) {
              try {
                await db.collection('users').doc(userInfo._id).update({
                  data: {
                    createdCount: db.command.inc(-1),
                    updateTime: db.serverDate()
                  }
                })
              } catch (err) {
                console.error('更新创建者的创建活动数量失败:', err)
              }
            }

            wx.hideLoading()
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })

            // 返回上一页
            setTimeout(() => {
              wx.navigateBack({
                success: () => {
                  // 刷新首页列表
                  const pages = getCurrentPages()
                  const prevPage = pages[pages.length - 1]
                  if (prevPage && prevPage.loadActivities) {
                    prevPage.loadActivities()
                  }
                }
              })
            }, 1500)
          } catch (error) {
            console.error('删除活动失败:', error)
            wx.hideLoading()
            wx.showToast({
              title: error.message || '删除失败，请重试',
              icon: 'none',
              duration: 2000
            })
          }
        }
      }
    })
  }
})

