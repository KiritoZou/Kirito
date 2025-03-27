// app.js
App({
  onLaunch: function () {
    // 初始化 WebSocket 连接
    this.connectWebSocket();
  },

  connectWebSocket: function() {
    try {
      // 建立 WebSocket 连接
      wx.connectSocket({
        url: 'wss://example.com/socket', // 您的 WebSocket 服务器地址
        header: {
          'content-type': 'application/json'
        },
        protocols: ['protocol1'], // 可选，子协议数组
        success(res) {
          console.log('WebSocket 连接成功');
        },
        fail(err) {
          console.error('WebSocket 连接失败', err);
        }
      });

      // 监听 WebSocket 连接打开事件
      wx.onSocketOpen(function(res) {
        console.log('WebSocket 已连接');
        
        // 连接成功后可以发送数据
        wx.sendSocketMessage({
          data: JSON.stringify({type: 'login', data: {userId: 'user123'}}),
          success() {
            console.log('消息发送成功');
          }
        });
      });

      // 监听接收消息事件
      wx.onSocketMessage(function(res) {
        console.log('收到服务器消息：', res.data);
        // 处理接收到的消息
        const message = JSON.parse(res.data);
        // 根据消息类型进行不同处理
      });

      // 监听 WebSocket 错误事件
      wx.onSocketError(function(res) {
        console.error('WebSocket 发生错误：', res);
      });

      // 监听 WebSocket 关闭事件
      wx.onSocketClose(function(res) {
        console.log('WebSocket 已关闭');
      });
    } catch (error) {
      console.error('初始化 WebSocket 失败:', error);
    }
  },

  globalData: {}
});

// 关闭连接（在需要时调用）
function closeSocket() {
  wx.closeSocket({
    success(res) {
      console.log('WebSocket 已关闭');
    }
  });
}
