Page({
  data: {
    longitude: 0,
    latitude: 0,
    markers: [],
    mapKey: 'L7BBZ-I76KN-AHYFA-SVSQV-MPKZV-6IF4X'
  },

  onLoad: function() {
    this.getLocation();
  },

  // 分享给好友
  onShareAppMessage: function() {
    return {
      title: '厕即达 - 帮你找到最近的厕所',
      path: '/pages/index/index',
      imageUrl: '/images/icons/PP.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '厕即达 - 帮你找到最近的厕所',
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
          latitude: res.latitude
        });
        that.searchNearbyToilets(res.latitude, res.longitude);
      },
      fail() {
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        });
      }
    });
  },

  searchNearbyToilets: function(latitude, longitude) {
    const that = this;
    // 扩大搜索范围到5公里
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/search',
      data: {
        key: that.data.mapKey,
        keyword: '公厕',
        boundary: `nearby(${latitude},${longitude},5000)`,
        page_size: 20, // 增加返回数量
        orderby: '_distance'
      },
      success(res) {
        if (res.data.status === 0 && res.data.data.length > 0) {
          const toilets = res.data.data.map((item, index) => ({
            id: index + 1,
            latitude: item.location.lat,
            longitude: item.location.lng,
            address: item.address,
            distance: Math.round(item._distance),
            name: item.title,
            type: item.category || '公厕',
            width: 20,
            height: 20
          }));
          
          // 按距离排序
          toilets.sort((a, b) => a.distance - b.distance);

          that.setData({ markers: toilets });
        }
      },
      fail(err) {
        wx.showToast({
          title: '搜索失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  handleToiletTap: function(e) {
    const index = e.currentTarget.dataset.index;
    const toilet = this.data.markers[index];
    
    // 打开导航
    wx.openLocation({
      latitude: toilet.latitude,
      longitude: toilet.longitude,
      name: toilet.name,
      address: toilet.address,
      scale: 18
    });
  },

  openTencentMap: function(toilet) {
    const { latitude, longitude, name } = toilet;
    wx.openLocation({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      name: name,
      address: toilet.address,
      scale: 18
    });
  },

  openAmap: function(toilet) {
    const { latitude, longitude, name } = toilet;
    wx.navigateToMiniProgram({
      appId: 'wxde8ac0a21135c07d',
      path: `route/index?destination=${latitude},${longitude}&destName=${name}&key=您的高德地图key`,
      fail: () => {
        wx.showToast({
          title: '请先安装高德地图',
          icon: 'none'
        });
      }
    });
  }
});