Page({
  data: {
    longitude: 0,
    latitude: 0,
    connected: false,
    showAuthModal: false
  },

  onLoad: function() {
    this.getLocation();
  },

  // 分享给好友
  onShareAppMessage: function() {
    return {
      title: '三急觅厕 - 帮你找到最近的厕所',
      path: '/pages/index/index',
      imageUrl: '/images/icons/PP.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '三急觅厕 - 帮你找到最近的厕所',
      query: '',
      imageUrl: '/images/icons/PP.png'
    }
  },

  getLocation: function() {
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude,
          connected: true
        });
      },
      fail() {
        wx.showModal({
          title: '提示',
          content: '需要获取您的地理位置，请确认授权',
          success(res) {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },

  handleAuthConfirm: function() {
    this.setData({
      showAuthModal: false
    });
    wx.openSetting();
  },

  handleAuthCancel: function() {
    this.setData({
      showAuthModal: false
    });
  },

  startSearch: function() {
    wx.navigateTo({
      url: '/pages/second/second'
    });
  },

  navToNearby: function() {
    wx.navigateTo({
      url: '/pages/nearby/nearby'
    });
  },
  regionChange: function(e) {
    console.log('region change', e);
  },

  mapTap: function(e) {
    console.log('map tap', e);
  }
});
