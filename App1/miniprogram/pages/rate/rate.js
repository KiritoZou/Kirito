Page({
  data: {
    longitude: 0,
    latitude: 0,
    toilets: [],
    selectedToilet: null,
    rating: 0,
    ratings: [],
    toilet: null,
    comments: [],
    newComment: ''
  },
  onLoad: function(options) {
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
    const toiletId = parseInt(options.id);
    const toilets = wx.getStorageSync('toilets') || [];
    const toilet = toilets.find(t => t.id === toiletId);
    this.setData({ toilet });
  },
  getNearbyToilets: function(latitude, longitude) {
    // 模拟获取附近厕所数据
    const nearbyToilets = [
      {
        id: 1,
        name: '厕所1',
        address: '地址1',
        distance: '100m',
        ratings: [4, 5, 3]
      },
      {
        id: 2,
        name: '厕所2',
        address: '地址2',
        distance: '200m',
        ratings: [2, 3, 4]
      }
    ];
    // 计算平均评分
    nearbyToilets.forEach(toilet => {
      toilet.averageRating = (toilet.ratings.reduce((a, b) => a + b, 0) / toilet.ratings.length).toFixed(1);
    });
    this.setData({
      toilets: nearbyToilets
    });
  },
  selectToilet: function(e) {
    const toiletId = e.currentTarget.dataset.id;
    const selectedToilet = this.data.toilets.find(toilet => toilet.id === toiletId);
    this.setData({ selectedToilet });
  },
  setRating: function(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },
  submitRating: function() {
    if (this.data.selectedToilet && this.data.rating > 0) {
      // 模拟提交评分数据
      const updatedToilets = this.data.toilets.map(toilet => {
        if (toilet.id === this.data.selectedToilet.id) {
          toilet.ratings.push(this.data.rating);
          toilet.averageRating = (toilet.ratings.reduce((a, b) => a + b, 0) / toilet.ratings.length).toFixed(1);
        }
        return toilet;
      });
      this.setData({ toilets: updatedToilets, selectedToilet: null, rating: 0 });
      wx.showToast({
        title: '评分成功',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '请选择厕所和评分',
        icon: 'none'
      });
    }
    if (this.data.toilet && this.data.rating > 0) {
      const toilets = wx.getStorageSync('toilets') || [];
      const toilet = toilets.find(t => t.id === this.data.toilet.id);
      toilet.ratings.push(this.data.rating);
      wx.setStorageSync('toilets', toilets);
      wx.showToast({
        title: '评分成功',
        icon: 'success'
      });
      this.setData({ rating: 0 });
    } else {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
    }
  },
  bindCommentInput: function(e) {
    this.setData({ newComment: e.detail.value });
  },
  submitComment: function() {
    if (this.data.newComment.trim() !== '') {
      const toilets = wx.getStorageSync('toilets') || [];
      const toilet = toilets.find(t => t.id === this.data.toilet.id);
      toilet.comments.push(this.data.newComment);
      wx.setStorageSync('toilets', toilets);
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      });
      this.setData({ newComment: '', comments: toilet.comments });
    } else {
      wx.showToast({
        title: '请输入评论',
        icon: 'none'
      });
    }
  }
});