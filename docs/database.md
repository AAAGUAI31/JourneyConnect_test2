# JourneyConnect 数据库设计文档

## 1. 数据库环境

- **云环境 ID**：`cloud1-2gpozl7969199d57`
- **数据库类型**：微信云开发数据库（MongoDB 兼容）

## 2. 集合总览

| 集合名称 | 说明 | 主要操作 |
|----------|------|----------|
| `users` | 用户信息 | 增、查、改 |
| `activities` | 活动信息 | 增、查、删、改 |
| `activity_members` | 活动参与记录 | 增、查 |

## 3. users 集合（用户信息）

### 集合结构

```javascript
{
  _id: "xxxxx",              // 自动生成的唯一标识
  openid: "xxxxx",           // 微信用户唯一标识
  name: "用户名",            // 昵称
  avatar: "cloud://xxx.jpg", // 头像 URL（云存储 fileID）
  wechat: "微信号",          // 联系方式
  signature: "个性签名",     // 个性签名
  verified: false,           // 是否认证（预留字段）
  createdCount: 0,           // 创建的活动数量
  joinedCount: 0,            // 参加的活动数量
  friendsCount: 0,           // 好友数量（预留字段）
  createTime: Date,          // 创建时间
  updateTime: Date           // 最后更新时间
}
```

### 字段说明

| 字段名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| `_id` | string | 记录唯一 ID（自动生成） | 是（自动） |
| `openid` | string | 微信用户唯一标识 | 是 |
| `name` | string | 用户昵称，默认取微信昵称 | 否 |
| `avatar` | string | 头像 URL，支持云存储 fileID | 否 |
| `wechat` | string | 微信号/联系方式 | 否 |
| `signature` | string | 个性签名 | 否 |
| `verified` | boolean | 认证状态（预留） | 否 |
| `createdCount` | number | 创建的活动数 | 否（默认 0） |
| `joinedCount` | number | 参加的活动数 | 否（默认 0） |
| `friendsCount` | number | 好友数（预留） | 否（默认 0） |
| `createTime` | Date | 创建时间 | 否（自动） |
| `updateTime` | Date | 更新时间 | 否（自动） |

### 索引

| 索引字段 | 类型 | 说明 |
|----------|------|------|
| `openid` | 唯一索引 | 保证每个微信用户唯一 |

---

## 4. activities 集合（活动信息）

### 集合结构

```javascript
{
  _id: "xxxxx",                  // 活动唯一 ID
  creatorId: "user_id",         // 创建者用户 ID（指向 users._id）
  title: "周末黄山露营之旅",      // 活动标题
  startDate: "2024-03-15",      // 开始日期
  endDate: "2024-03-17",        // 结束日期
  dateRange: "2024.03.15-03.17",// 格式化日期范围
  location: "安徽·黄山",         // 活动地点
  description: "行程描述...",    // 行程/活动详情
  tags: ["徒步", "露营"],        // 旅行风格标签（数组）
  maxMembers: 8,                // 最大参与人数
  currentMembers: 3,            // 当前参与人数（含创建者）
  contact: "138xxxxx",           // 联系方式
  cover: "cloud://xxx.jpg",     // 封面图片 URL（云存储 fileID）
  status: "报名中",              // 活动状态
  createTime: Date,             // 创建时间
  updateTime: Date              // 更新时间
}
```

### 字段说明

| 字段名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| `_id` | string | 活动唯一 ID | 是（自动） |
| `creatorId` | string | 创建者用户 ID | 是 |
| `title` | string | 活动标题 | 是 |
| `startDate` | string | 开始日期（YYYY-MM-DD） | 是 |
| `endDate` | string | 结束日期（YYYY-MM-DD） | 是 |
| `dateRange` | string | 格式化日期范围显示文本 | 否 |
| `location` | string | 活动地点 | 是 |
| `description` | string | 活动详情/行程描述 | 是 |
| `tags` | array | 旅行风格标签数组 | 是 |
| `maxMembers` | number | 最大参与人数 | 是（默认 8） |
| `currentMembers` | number | 当前参与人数 | 否（默认 1，创建者自动加入） |
| `contact` | string | 发起人联系方式 | 是 |
| `cover` | string | 封面图片 URL | 否 |
| `status` | string | 活动状态 | 否（默认"报名中"） |
| `createTime` | Date | 创建时间 | 否（自动） |
| `updateTime` | Date | 更新时间 | 否（自动） |

### 活动状态枚举

| 状态值 | 说明 |
|--------|------|
| `报名中` | 活动开放报名 |
| `已满员` | 参与人数达到上限 |
| `已截止` | 活动已截止报名 |
| `已出行` | 活动已开始/结束 |

### 标签枚举（styleTags）

| 标签 | 说明 |
|------|------|
| 徒步 | 徒步旅行 |
| 露营 | 露营活动 |
| 摄影 | 摄影采风 |
| 美食 | 美食之旅 |
| 骑行 | 骑行活动 |
| 潜水 | 潜水/水上活动 |
| 探险 | 探险类活动 |
| 轻松游 | 休闲度假 |
| 文化 | 文化体验 |
| 自驾 | 自驾游 |

### 索引

| 索引字段 | 类型 | 说明 |
|----------|------|------|
| `creatorId` | 普通索引 | 查询某用户创建的活动 |
| `createTime` | 倒序索引 | 按时间排序 |

---

## 5. activity_members 集合（活动参与记录）

### 集合结构

```javascript
{
  _id: "xxxxx",            // 记录唯一 ID
  activityId: "activity_id", // 活动 ID（指向 activities._id）
  userId: "user_id",       // 用户 ID（指向 users._id）
  name: "报名者姓名",        // 报名填写的姓名
  gender: "男",            // 性别
  age: "25",               // 年龄（可选）
  contact: "138xxxxx",     // 联系方式
  intro: "自我介绍...",     // 简短自我介绍
  joinTime: Date,          // 报名时间
  status: "已加入",         // 参与状态
  updateTime: Date         // 更新时间
}
```

### 字段说明

| 字段名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| `_id` | string | 记录唯一 ID | 是（自动） |
| `activityId` | string | 活动 ID | 是 |
| `userId` | string | 用户 ID | 是 |
| `name` | string | 报名者姓名 | 是 |
| `gender` | string | 性别 | 是 |
| `age` | string | 年龄 | 否 |
| `contact` | string | 联系方式 | 是 |
| `intro` | string | 自我介绍 | 否 |
| `joinTime` | Date | 报名时间 | 否（自动） |
| `status` | string | 参与状态 | 否（默认"已加入"） |
| `updateTime` | Date | 更新时间 | 否（自动） |

### 索引

| 索引字段 | 类型 | 说明 |
|----------|------|------|
| `activityId` | 普通索引 | 查询某活动的所有参与者 |
| `userId` | 普通索引 | 查询某用户参与的所有活动 |
| `joinTime` | 倒序索引 | 按报名时间排序 |

---

## 6. 数据关系图

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   users     │       │   activities     │       │ activity_members│
├─────────────┤       ├─────────────────┤       ├─────────────────┤
│ _id         │◀──┐   │ _id             │◀──┐   │ _id             │
│ openid      │   │   │ creatorId      │   │   │ activityId      │
│ name        │   │   │ title          │   │   │ userId          │
│ avatar      │   │   │ startDate      │   │   │ name            │
│ ...         │   └───│ ...            │   │   │ gender          │
└─────────────┘       └─────────────────┘   │   │ ...             │
                              │             └───│ joinTime        │
                              │                 └─────────────────┘
                              │                         ▲
                              │                         │
                              └─────────────────────────┘
                              (creatorId + member.userId → users._id)
```

## 7. 数据操作示例

### 创建用户（login 云函数）

```javascript
// 首次登录时创建用户记录
const newUser = {
  openid: openid,
  name: '未命名用户',
  avatar: '',
  wechat: '',
  signature: '',
  verified: false,
  createdCount: 0,
  joinedCount: 0,
  friendsCount: 0,
  createTime: db.serverDate(),
  updateTime: db.serverDate()
}
await db.collection('users').add({ data: newUser })
```

### 创建活动（create.js）

```javascript
// 发布新活动
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
  currentMembers: 1,  // 创建者自动加入
  contact: contact,
  cover: coverUrl,
  status: '报名中',
  createTime: db.serverDate(),
  updateTime: db.serverDate()
}
const addResult = await db.collection('activities').add({ data: activityData })
```

### 报名活动（detail.js）

```javascript
// 用户报名活动
await db.collection('activity_members').add({
  data: {
    activityId: activityId,
    userId: userId,
    name: name,
    gender: gender,
    age: age,
    contact: contact,
    intro: intro,
    joinTime: db.serverDate(),
    status: '已加入'
  }
})

// 更新活动当前人数
await db.collection('activities').doc(activityId).update({
  data: {
    currentMembers: db.command.inc(1)
  }
})
```
