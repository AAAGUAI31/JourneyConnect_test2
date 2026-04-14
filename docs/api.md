# JourneyConnect 云函数 API 接口文档

## 1. 接口概览

| 云函数 | 功能 | 调用场景 |
|--------|------|----------|
| `login` | 微信登录/注册 | 用户首次登录小程序 |
| `user` | 用户信息管理 | 获取/更新用户信息 |

---

## 2. login 云函数

### 功能说明

处理用户微信登录/注册。根据微信 openid 判断是否为新用户，新用户自动创建用户记录，老用户更新最后登录时间。

### 调用方式

```javascript
wx.cloud.callFunction({
  name: 'login',
  data: {
    userInfo: {
      nickName: '微信昵称',
      avatarUrl: '微信头像 URL'
    }
  }
})
```

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `userInfo` | object | 否 | 用户信息对象 |
| `userInfo.nickName` | string | 否 | 微信昵称 |
| `userInfo.avatarUrl` | string | 否 | 微信头像 URL |

### 响应参数

```javascript
{
  success: true,        // 是否成功
  isNewUser: true,      // 是否为新用户
  user: {               // 用户信息对象
    _id: 'user_id',
    openid: 'openid',
    name: '昵称',
    avatar: '头像 URL',
    wechat: '微信号',
    signature: '个性签名',
    createdCount: 0,
    joinedCount: 0,
    friendsCount: 0
  }
}
```

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `success` | boolean | 请求是否成功 |
| `isNewUser` | boolean | 是否为新注册用户 |
| `user` | object | 用户信息对象 |
| `user._id` | string | 用户 ID（数据库记录 ID） |
| `user.openid` | string | 微信 openid |
| `user.name` | string | 用户昵称 |
| `user.avatar` | string | 头像 URL |
| `user.wechat` | string | 微信号 |
| `user.signature` | string | 个性签名 |
| `user.createdCount` | number | 创建的活动数 |
| `user.joinedCount` | number | 参加的活动数 |

### 错误响应

```javascript
{
  success: false,
  error: '错误信息'
}
```

### 业务逻辑

1. 获取请求中的微信 openid（自动从微信上下文获取）
2. 查询 `users` 集合中是否存在该 openid 的记录
3. **新用户**：创建新用户记录，返回 `isNewUser: true`
4. **老用户**：更新 `updateTime`，返回用户信息

---

## 3. user 云函数

### 功能说明

用户信息管理，支持获取用户信息和更新用户信息。

### 调用方式

```javascript
wx.cloud.callFunction({
  name: 'user',
  data: {
    action: 'get' | 'update',
    userData: { ... }  // 仅 update 时需要
  }
})
```

### action: get（获取用户信息）

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `action` | string | 是 | 操作类型，固定为 `'get'` |

#### 响应参数

```javascript
{
  success: true,
  user: {
    _id: 'user_id',
    openid: 'openid',
    name: '昵称',
    avatar: '头像 URL',
    wechat: '微信号',
    signature: '个性签名',
    createdCount: 5,    // 创建的活动数
    joinedCount: 3     // 参加的活动数
  }
}
```

### action: update（更新用户信息）

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `action` | string | 是 | 操作类型，固定为 `'update'` |
| `userData` | object | 是 | 要更新的字段 |
| `userData.name` | string | 否 | 昵称 |
| `userData.avatar` | string | 否 | 头像 URL |
| `userData.wechat` | string | 否 | 微信号 |
| `userData.signature` | string | 否 | 个性签名 |

#### 响应参数

```javascript
{
  success: true,
  user: { /* 更新后的完整用户对象 */ }
}
```

### 错误响应

```javascript
{
  success: false,
  error: '用户不存在，请先登录'
}
```

---

## 4. 前端直接调用（无需云函数）

部分数据操作直接在客户端通过 `wx.cloud.database()` 调用，无需云函数封装。

### 活动列表查询（首页）

```javascript
const db = wx.cloud.database()
const res = await db.collection('activities')
  .where({ /* 搜索条件 */ })
  .orderBy('createTime', 'desc')
  .get()
```

### 活动详情查询

```javascript
const db = wx.cloud.database()
const res = await db.collection('activities').doc(activityId).get()
```

### 创建活动

```javascript
const db = wx.cloud.database()
const res = await db.collection('activities').add({
  data: {
    creatorId: userInfo._id,
    title: '活动标题',
    // ... 其他字段
  }
})
```

### 活动报名

```javascript
const db = wx.cloud.database()

// 1. 添加报名记录
await db.collection('activity_members').add({
  data: {
    activityId: activityId,
    userId: userId,
    name: name,
    gender: gender,
    // ... 其他字段
  }
})

// 2. 更新活动人数
await db.collection('activities').doc(activityId).update({
  data: {
    currentMembers: db.command.inc(1)
  }
})
```

---

## 5. 云存储 API

### 上传图片

```javascript
const res = await wx.cloud.uploadFile({
  cloudPath: `activities/covers/${timestamp}_${randomStr}.jpg`,
  filePath: tempFilePath  // 本地临时文件路径
})
// 返回 res.fileID（云存储文件 ID）
```

### 删除文件

```javascript
await wx.cloud.deleteFile({
  fileList: ['cloud://xxx.xxx.xxx.jpg']
})
```

---

## 6. 错误码

| 错误信息 | 说明 |
|----------|------|
| `用户不存在，请先登录` | 调用 user 云函数时用户未登录 |
| `不支持的操作` | user 云函数收到了未知的 action 参数 |
| `活动不存在` | 查询的活动 ID 不存在 |

---

## 7. 调用示例

### 完整登录流程

```javascript
// 1. 获取微信登录凭证
const loginRes = await wx.login()
if (!loginRes.code) {
  throw new Error('获取登录凭证失败')
}

// 2. 获取用户信息
const profileRes = await wx.getUserProfile({
  desc: '用于完善用户资料'
})

// 3. 调用登录云函数
const cloudRes = await wx.cloud.callFunction({
  name: 'login',
  data: {
    userInfo: {
      nickName: profileRes.userInfo.nickName,
      avatarUrl: profileRes.userInfo.avatarUrl
    }
  }
})

if (cloudRes.result.success) {
  const userInfo = cloudRes.result.user
  // 保存到本地缓存
  wx.setStorageSync('userInfo', userInfo)
  // 更新全局数据
  getApp().globalData.userInfo = userInfo
}
```

### 更新用户签名

```javascript
const res = await wx.cloud.callFunction({
  name: 'user',
  data: {
    action: 'update',
    userData: {
      signature: '新的签名内容'
    }
  }
})
```
