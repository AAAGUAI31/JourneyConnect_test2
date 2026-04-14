# JourneyConnect 开发指南

## 1. 环境搭建

### 1.1 开发工具

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) - 最新版本
- VS Code 或 WebStorm（推荐）

### 1.2 项目初始化

1. **克隆项目**
   ```bash
   git clone <repository_url>
   cd JourneyConnect_weixin_v1.0/miniprogram-1
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **安装云函数依赖**（每个云函数目录都需要）
   ```bash
   cd cloudfunctions/login
   npm install

   cd ../user
   npm install
   ```

### 1.3 导入项目到微信开发者工具

1. 打开微信开发者工具
2. 点击「导入项目」
3. 选择项目目录
4. 填写 AppID（使用测试号或正式号）
5. 点击「确认」

### 1.4 配置云环境

1. 在微信开发者工具中开启「云开发」
2. 设置云环境 ID：`cloud1-2gpozl7969199d57`
3. 在「云开发」控制台中创建数据库集合：
   - `users`
   - `activities`
   - `activity_members`

---

## 2. 项目配置

### 2.1 配置文件说明

| 文件 | 说明 |
|------|------|
| `project.config.json` | 项目配置（编译类型、编译设置） |
| `project.private.config.json` | 私有配置（会覆盖 project.config.json） |
| `app.json` | 应用配置（页面路由、tabBar、窗口样式） |

### 2.2 私有配置 (project.private.config.json)

```json
{
  "projectname": "JourneyConnect",
  "compileHotReLoad": true,
  "urlCheck": false,
  "setting": {
    "es6": true,
    "postcss": true,
    "minified": true,
    "enhance": true,
    "apiHook": true
  }
}
```

### 2.3 修改 AppID

如需使用自己的 AppID：
1. 在微信公众平台注册小程序
2. 修改 `project.config.json` 中的 `appid` 字段
3. 修改 `app.js` 中 `wx.cloud.init()` 的 `env` 为你的云环境 ID

---

## 3. 开发调试

### 3.1 启动开发模式

1. 在微信开发者工具中打开项目
2. 点击「编译」按钮
3. 即可在模拟器/真机中预览

### 3.2 开启热重载

确保 `project.private.config.json` 中：
```json
{
  "compileHotReLoad": true
}
```

### 3.3 云函数调试

1. 在微信开发者工具中右键点击云函数目录
2. 选择「上传并部署」
3. 部署完成后可在「云开发控制台」查看调用日志

### 3.4 数据库调试

1. 打开「云开发控制台」
2. 进入「数据库」标签
3. 可手动添加/修改/删除数据

### 3.5 真机调试

1. 手机打开微信，扫描开发者工具中的二维码
2. 确保手机和电脑在同一局域网

---

## 4. 目录结构说明

```
pages/                    # 页面目录
├── home/               # 首页（活动列表）
│   ├── home.js         # 页面逻辑
│   ├── home.wxml       # 页面结构
│   ├── home.wxss       # 页面样式
│   └── home.json       # 页面配置
├── detail/             # 活动详情
├── create/             # 创建活动
└── profile/            # 个人主页

cloudfunctions/          # 云函数目录
├── login/              # 登录云函数
│   ├── index.js        # 云函数入口
│   └── package.json    # 依赖配置
└── user/               # 用户云函数

utils/                   # 工具函数
└── util.js             # 通用工具（如 formatTime）
```

---

## 5. 常用开发命令

### 5.1 NPM 命令

```bash
# 安装依赖
npm install

# 构建 npm（小程序需要）
# 在微信开发者工具中：工具 → 构建 npm
```

### 5.2 Git 命令

```bash
# 查看状态
git status

# 添加文件
git add <file>

# 提交
git commit -m "提交信息"

# 推送
git push
```

---

## 6. 注意事项

### 6.1 登录凭证

`wx.login()` 每次调用都会生成新的登录凭证，凭证有效期 5 分钟。不要频繁调用。

### 6.2 用户信息获取

`wx.getUserProfile()` 必须在用户点击事件处理函数中直接调用，不能在异步回调中调用。

### 6.3 云存储路径

云存储路径格式：`activities/covers/${timestamp}_${random}.${ext}`
文件扩展名从原文件获取：`filePath.split('.').pop()`

### 6.4 数据库权限

微信云开发数据库默认只有创建者可读写。如需其他用户可读，需在控制台设置权限或使用云函数操作。

### 6.5 图片显示

云存储的 fileID 可直接作为图片 src 使用，无需转换。

---

## 7. 常见问题

### Q: 云函数部署失败？

**A:** 检查以下几点：
1. 云函数目录中是否有 `package.json`
2. 本地 node_modules 是否安装完整
3. 尝试右键云函数目录 → 「上传并部署（云端安装依赖）」

### Q: 图片上传失败？

**A:** 检查：
1. 图片路径是否正确（本地临时文件路径）
2. 文件是否超过大小限制（单文件最大 10MB）
3. 云存储空间是否充足

### Q: 数据库操作失败？

**A:** 检查：
1. 用户是否已登录（部分操作需要 openid）
2. 数据格式是否正确
3. 是否有权限（云开发控制台查看）

### Q: 如何查看日志？

**A:**
- 前端日志：在微信开发者工具的「调试器」console 中查看
- 云函数日志：在「云开发控制台」→ 「云函数」→ 点击函数名 → 「日志」
