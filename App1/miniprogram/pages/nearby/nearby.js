const QQMapWX = require('./utils/qqmap-wx-jssdk1.1.js');

Page({
  data: {
    longitude: 0,
    latitude: 0,
    toilets: [],
    markers: []
  },
  onLoad: function() {
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
        // 获取附近厕所信息
        that.getNearbyToilets(res.latitude, res.longitude);
      }
    });
  },
  getNearbyToilets: function(latitude, longitude) {
    const that = this;
    const map = new QQMapWX({
      key: 'L7BBZ-I76KN-AHYFA-SVSQV-MPKZV-6IF4X'
    });
    map.search({
      keyword: '厕所',
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function(res) {
        const toilets = res.data.map((item, index) => ({
          id: index + 1,
          name: item.title,
          address: item.address,
          distance: item._distance.toFixed(0) + 'm',
          latitude: item.location.lat,
          longitude: item.location.lng,
          ratings: []
        }));
        that.setData({
          toilets: toilets,
          markers: toilets.map(toilet => ({
            id: toilet.id,
            latitude: toilet.latitude,
            longitude: toilet.longitude,
            name: toilet.name,
            address: toilet.address
          }))
        });
      },
      fail: function() {
        wx.showToast({
          title: '获取厕所信息失败',
          icon: 'none'
        });
      }
    });
  },
  markFavorite: function(e) {
    const toiletId = e.currentTarget.dataset.id;
    const favoriteToilets = wx.getStorageSync('favoriteToilets') || [];
    if (!favoriteToilets.includes(toiletId)) {
      favoriteToilets.push(toiletId);
      wx.setStorageSync('favoriteToilets', favoriteToilets);
      wx.showToast({
        title: '标记成功',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '已标记',
        icon: 'none'
      });
    }
  },
  rateToilet: function(e) {
    const toiletId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/rate/rate?id=${toiletId}`
    });
  }
});