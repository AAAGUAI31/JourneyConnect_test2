// cloud/functions/login/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取用户openId
    const openid = wxContext.OPENID
    
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()
    
    // 如果用户不存在，创建新用户
    if (userResult.data.length === 0) {
      const userInfo = event.userInfo || {}
      const newUser = {
        openid: openid,
        name: userInfo.nickName || '未命名用户',
        avatar: userInfo.avatarUrl || '',
        wechat: userInfo.nickName || '',
        signature: '',
        verified: false,
        createdCount: 0,
        joinedCount: 0,
        friendsCount: 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      const addResult = await db.collection('users').add({
        data: newUser
      })
      
      return {
        success: true,
        isNewUser: true,
        user: {
          ...newUser,
          _id: addResult._id
        }
      }
    } else {
      // 用户已存在，更新最后登录时间
      const userId = userResult.data[0]._id
      await db.collection('users').doc(userId).update({
        data: {
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        isNewUser: false,
        user: userResult.data[0]
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

