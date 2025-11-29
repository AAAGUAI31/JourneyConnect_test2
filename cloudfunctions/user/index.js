// cloud/functions/user/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    const { action, userData } = event
    
    // 查找用户
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在，请先登录'
      }
    }
    
    const userId = userResult.data[0]._id
    
    switch (action) {
      case 'update':
        // 更新用户信息
        const updateData = {
          updateTime: db.serverDate()
        }
        
        if (userData.name !== undefined) updateData.name = userData.name
        if (userData.avatar !== undefined) updateData.avatar = userData.avatar
        if (userData.wechat !== undefined) updateData.wechat = userData.wechat
        if (userData.signature !== undefined) updateData.signature = userData.signature
        
        await db.collection('users').doc(userId).update({
          data: updateData
        })
        
        // 获取更新后的用户信息
        const updatedUser = await db.collection('users').doc(userId).get()
        
        return {
          success: true,
          user: updatedUser.data
        }
        
      case 'get':
        // 获取用户信息
        const userInfo = await db.collection('users').doc(userId).get()
        
        // 统计用户创建和参与的活动数量
        const createdCount = await db.collection('activities').where({
          creatorId: userId
        }).count()
        
        const joinedCount = await db.collection('activity_members').where({
          userId: userId
        }).count()
        
        return {
          success: true,
          user: {
            ...userInfo.data,
            createdCount: createdCount.total,
            joinedCount: joinedCount.total
          }
        }
        
      default:
        return {
          success: false,
          error: '不支持的操作'
        }
    }
  } catch (error) {
    console.error('用户操作失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

