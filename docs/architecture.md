# JourneyConnect 技术架构文档

## 1. 技术栈概览

| 分类 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 微信小程序原生 | WXML + WXSS + JavaScript |
| UI 组件库 | TDesign Miniprogram | 腾讯开源的微信小程序 UI 组件库 |
| 后端服务 | 微信云开发 | 云函数 + 云数据库 + 云存储 |
| 云函数运行时 | Node.js (wx-server-sdk) | 微信云函数运行环境 |
| 图片存储 | 微信云存储 | 活动封面图等文件存储 |

## 2. 项目结构

```
JourneyConnect/
├── app.js                      # 应用入口
├── app.json                    # 全局配置（页面路由、tabBar）
├── app.wxss                    # 全局样式
├── package.json                # NPM 依赖配置
├── project.config.json         # 微信开发者工具项目配置
├── project.private.config.json # 私有配置（覆盖 project.config.json）
├── sitemap.json                # SEO 站点地图
│
├── assets/                     # 静态资源
│   └── icons/                  # 图标资源
│       ├── home.png
│       ├── home-active.png
│       ├── profile.png
│       ├── profile-active.png
│       └── pngtree-default-avatar-image_2238788.jpg
│
├── cloudfunctions/             # 云函数目录（后端）
│   ├── login/                  # 登录云函数
│   │   ├── index.js
│   │   └── package.json
│   ├── user/                   # 用户管理云函数
│   │   ├── index.js
│   │   └── package.json
│   └── success/                # 成功回调云函数
│       └── index.js
│
├── docs/                       # 项目文档
│   ├── README.md               # 文档索引
│   ├── prd.md                  # 产品需求文档
│   ├── architecture.md         # 本文档
│   ├── database.md             # 数据库设计
│   ├── api.md                  # API 接口文档
│   └── guide.md                # 开发指南
│
├── miniprogram_npm/            # 微信小程序 npm 包（tdesign-miniprogram）
│
├── pages/                      # 页面目录
│   ├── home/                   # 首页（活动广场）
│   │   ├── home.js
│   │   ├── home.wxml
│   │   ├── home.wxss
│   │   └── home.json
│   ├── detail/                 # 活动详情页
│   │   ├── detail.js
│   │   ├── detail.wxml
│   │   ├── detail.wxss
│   │   └── detail.json
│   ├── create/                 # 创建活动页
│   │   ├── create.js
│   │   ├── create.wxml
│   │   ├── create.wxss
│   │   └── create.json
│   ├── profile/                # 个人主页
│   │   ├── profile.js
│   │   ├── profile.wxml
│   │   ├── profile.wxss
│   │   └── profile.json
│   ├── index/                  # 备用页面
│   └── logs/                   # 日志页面（微信默认）
│
├── prototype/                  # 设计原型（HTML）
│
└── utils/                      # 工具函数
    └── util.js                 # 通用工具（如 formatTime）
```

## 3. 全局配置 (app.json)

### 页面路由

```json
{
  "pages": [
    "pages/home/home",
    "pages/detail/detail",
    "pages/create/create",
    "pages/profile/profile"
  ]
}
```

### TabBar 配置

```json
{
  "tabBar": {
    "list": [
      { "pagePath": "pages/home/home", "text": "首页" },
      { "pagePath": "pages/profile/profile", "text": "我的" }
    ]
  }
}
```

### 云开发配置

```json
{
  "cloud": true,
  "componentFramework": "glass-easel"
}
```

## 4. 应用入口 (app.js)

```javascript
App({
  onLaunch() {
    // 初始化微信云环境
    wx.cloud.init({
      env: 'cloud1-2gpozl7969199d57',
      traceUser: true
    })
    // 检查登录状态
    this.checkLoginStatus()
  },
  globalData: {
    userInfo: null  // 全局用户信息
  }
})
```

## 5. 页面说明

| 页面 | 路径 | 功能 | 是否需要登录 |
|------|------|------|-------------|
| 首页 | `/pages/home/home` | 浏览活动、搜索、筛选 | 否 |
| 活动详情 | `/pages/detail/detail` | 查看活动详情、报名 | 是（报名时） |
| 创建活动 | `/pages/create/create` | 发布新活动 | 是 |
| 个人主页 | `/pages/profile/profile` | 登录、个人信息、我发起的/参加的活动 | 否（查看受限） |

## 6. 云开发架构

### 架构图

```
┌─────────────────┐     ┌─────────────────┐
│   微信小程序     │────▶│   微信云开发     │
│  (前端界面)      │     │   (后端服务)     │
└─────────────────┘     └─────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  云函数      │     │  云数据库    │     │  云存储      │
    │ (业务逻辑)   │     │ (数据存储)   │     │ (文件存储)   │
    └─────────────┘     └─────────────┘     └─────────────┘
```

### 数据库集合

| 集合 | 说明 |
|------|------|
| `users` | 用户信息 |
| `activities` | 活动信息 |
| `activity_members` | 活动参与记录 |

详见 [database.md](database.md)

### 云函数

| 云函数 | 功能 |
|--------|------|
| `login` | 微信登录/注册 |
| `user` | 用户信息获取/更新 |

详见 [api.md](api.md)

## 7. 组件使用

项目使用 [TDesign Miniprogram](https://tdesign.tencent.com/miniprogram/getting-started) 组件库：

```json
{
  "dependencies": {
    "tdesign-miniprogram": "^1.11.0"
  }
}
```

常用组件：
- `t-search` - 搜索框
- `t-tag` - 标签
- `t-avatar` - 头像
- `t-button` - 按钮
- `t-dialog` - 对话框
- `t-picker` - 选择器
- `t-upload` - 文件上传
- `t-tabs` - 标签页
- `t-cell` - 单元格

## 8. 安全机制

- **用户认证**：通过微信 openid 识别用户
- **登录验证**：敏感操作（创建活动、报名）需先登录
- **权限控制**：只有活动创建者可编辑/删除活动
- **数据隔离**：用户只能操作自己的数据

## 9. 性能优化

- **云存储图片**：封面图存储在云端，直接使用 fileID 显示
- **批量查询**：用户信息批量查询减少数据库请求
- **懒加载**：配置 `lazyCodeLoading: "requiredComponents"`
- **本地缓存**：用户信息缓存到 Storage 减少加载时间
