# JourneyConnect 小程序页面说明

## 页面结构

### 1. 首页（活动广场）- `pages/home/`
- **功能**: 展示所有旅行活动，支持搜索、筛选、下拉刷新、上拉加载
- **主要组件**:
  - `t-search`: 搜索框
  - `t-tag`: 旅行风格标签
  - `t-avatar`: 用户头像
  - `t-loading`: 加载状态
  - `t-empty`: 空状态

### 2. 活动详情页 - `pages/detail/`
- **功能**: 显示活动详细信息，支持报名功能
- **主要组件**:
  - `t-tag`: 活动状态标签和风格标签
  - `t-avatar`: 发起人和报名人员头像
  - `t-button`: 报名按钮
  - `t-dialog`: 报名表单弹窗
  - `t-input`: 表单输入框
  - `t-textarea`: 自我介绍输入框
  - `t-radio-group`: 性别选择

### 3. 发起活动页 - `pages/create/`
- **功能**: 创建新的旅行活动
- **主要组件**:
  - `t-input`: 活动标题、地点、联系方式输入
  - `t-textarea`: 行程描述
  - `t-tag`: 旅行风格选择（可多选）
  - `t-stepper`: 人数上限选择器
  - `t-upload`: 封面图上传
  - `t-button`: 发布按钮
  - `picker`: 日期选择器（原生组件）

### 4. 我的主页 - `pages/profile/`
- **功能**: 用户个人信息和活动管理
- **主要组件**:
  - `t-avatar`: 用户头像
  - `t-tag`: 认证标签
  - `t-tabs`: Tab 切换（我发起的活动/我参加的活动）
  - `t-button`: 登录按钮
  - `t-dialog`: 编辑个人信息弹窗

## 使用说明

1. **底部导航栏**: 在 `app.json` 中已配置，包含"首页"和"我的"两个 tab
2. **TDesign 组件**: 所有组件已在各页面的 `json` 文件中引入
3. **数据模拟**: 目前使用模拟数据，需要对接后端 API 时，修改各页面的 `js` 文件中的 `load` 方法
4. **图标**: 底部导航栏图标需要放在 `assets/icons/` 目录下，包括：
   - `home.png` / `home-active.png`
   - `profile.png` / `profile-active.png`

## 下一步

1. 对接后端 API
2. 添加图片上传功能
3. 完善用户登录逻辑
4. 添加活动筛选功能
5. 优化用户体验和错误处理

