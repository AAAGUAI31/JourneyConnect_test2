// pages/home/home.js
Page({
  data: {
    searchValue: '',
    refreshing: false,
    loading: false,
    activities: [
      {
        id: 1,
        title: '周末黄山露营之旅',
        dateRange: '2024.03.15 - 03.17',
        location: '安徽·黄山',
        cover: 'https://via.placeholder.com/160x160/4F46E5/ffffff?text=活动',
        creator: {
          name: '张三',
          avatar: 'https://via.placeholder.com/40x40/0052D9/ffffff?text=张'
        },
        currentMembers: 3,
        maxMembers: 8,
        tags: ['徒步', '露营']
      },
      {
        id: 2,
        title: '杭州西湖摄影一日游',
        dateRange: '2024.03.20',
        location: '浙江·杭州',
        cover: 'https://via.placeholder.com/160x160/10B981/ffffff?text=活动',
        creator: {
          name: '李四',
          avatar: 'https://via.placeholder.com/40x40/EF4444/ffffff?text=李'
        },
        currentMembers: 5,
        maxMembers: 10,
        tags: ['摄影', '轻松游']
      },
      {
        id: 3,
        title: '云南大理洱海环湖骑行',
        dateRange: '2024.03.25 - 03.28',
        location: '云南·大理',
        cover: 'https://via.placeholder.com/160x160/F59E0B/ffffff?text=活动',
        creator: {
          name: '王五',
          avatar: 'https://via.placeholder.com/40x40/8B5CF6/ffffff?text=王'
        },
        currentMembers: 7,
        maxMembers: 12,
        tags: ['骑行', '探险']
      },
      {
        id: 4,
        title: '上海外滩夜景美食探索',
        dateRange: '2024.03.18',
        location: '上海·黄浦区',
        cover: 'https://via.placeholder.com/160x160/EC4899/ffffff?text=活动',
        creator: {
          name: '赵六',
          avatar: 'https://via.placeholder.com/40x40/14B8A6/ffffff?text=赵'
        },
        currentMembers: 2,
        maxMembers: 6,
        tags: ['美食', '文化']
      }
    ]
  },

  onLoad() {
    // 加载活动列表
    this.loadActivities()
  },

  onSearchChange(e) {
    this.setData({
      searchValue: e.detail.value
    })
  },

  onSearch(e) {
    console.log('搜索:', e.detail.value)
    // 实现搜索逻辑
    this.loadActivities()
  },

  onFilter() {
    wx.showToast({
      title: '筛选功能开发中',
      icon: 'none'
    })
  },

  onRefresh() {
    this.setData({
      refreshing: true
    })
    this.loadActivities().then(() => {
      this.setData({
        refreshing: false
      })
    })
  },

  onLoadMore() {
    if (this.data.loading) return
    this.setData({
      loading: true
    })
    // 加载更多数据
    setTimeout(() => {
      this.setData({
        loading: false
      })
    }, 1000)
  },

  loadActivities() {
    return new Promise((resolve) => {
      // 模拟 API 调用
      setTimeout(() => {
        resolve()
      }, 500)
    })
  },

  onCreateActivity() {
    wx.navigateTo({
      url: '/pages/create/create'
    })
  },

  onActivityTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})

