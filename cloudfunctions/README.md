# 云开发配置说明
## 后端逻辑

使用云开发中的云函数cloudfunctions实现功能

## 数据库集合配置

需要在微信开发者工具的云开发控制台中创建以下数据库集合：

### 1. users 集合（用户信息表）

**集合名称**: `users`

**字段结构**:
```json
{
  "_id": "自动生成",
  "openid": "用户微信openid",
  "name": "用户昵称",
  "avatar": "用户头像URL",
  "wechat": "微信号",
  "signature": "个人签名",
  "verified": false,
  "createdCount": 0,
  "joinedCount": 0,
  "friendsCount": 0,
  "createTime": "创建时间（服务器时间）",
  "updateTime": "更新时间（服务器时间）"
}
```

**索引配置**:
- `openid`: 唯一索引（Unique）

### 2. activities 集合（活动表）

**集合名称**: `activities`

**字段结构**:
```json
{
  "_id": "活动ID",
  "creatorId": "创建者用户ID",
  "title": "活动标题",
  "dateRange": "日期范围",
  "location": "地点",
  "cover": "封面图URL",
  "currentMembers": 0,
  "maxMembers": 8,
  "status": "报名中/已截止/已出行",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

**索引配置**:
- `creatorId`: 普通索引（Index）

### 3. activity_members 集合（活动成员表）

**集合名称**: `activity_members`

**字段结构**:
```json
{
  "_id": "自动生成",
  "activityId": "活动ID",
  "userId": "用户ID",
  "joinTime": "加入时间",
  "status": "报名状态"
}
```

**索引配置**:
- `activityId`: 普通索引（Index）
- `userId`: 普通索引（Index）

## 云函数部署

### 1. 部署 login 云函数

1. 在微信开发者工具中，右键点击 `cloud/functions/login` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

### 2. 部署 user 云函数

1. 在微信开发者工具中，右键点击 `cloud/functions/user` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

## 云开发环境配置

确保在 `app.js` 中配置了正确的云开发环境ID：

```javascript
wx.cloud.init({
  env: 'cloud1-2gpozl7969199d57',
  traceUser: true
})
```

## 权限设置

### 数据库权限

建议将集合权限设置为：
- **users**: 仅创建者可读写
- **activities**: 所有用户可读，仅创建者可写
- **activity_members**: 所有用户可读，仅创建者可写

### 云函数权限

云函数默认使用管理员权限，可以直接访问数据库，无需额外配置。

## 注意事项

1. 首次使用云开发需要开通云开发服务
2. 确保在 `app.json` 中添加了 `"cloud": true` 配置
3. 云函数需要等待部署完成后才能使用
4. 数据库集合需要在云开发控制台中手动创建
5. 建议为 `openid` 字段创建唯一索引，避免重复注册

