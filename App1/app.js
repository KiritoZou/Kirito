import TIM from 'tim-wx-sdk';
import TIMUploadPlugin from 'tim-upload-plugin';

App({
  onLaunch: function() {
    // 初始化用户信息
    this.getUserInfo();
    
    // 监听网络状态
    this.listenNetworkStatus();
    
    // 初始化腾讯云 IM SDK
    this.initIM();
  },
  
  getUserInfo: function() {
    // 获取用户信息的逻辑
    // ...
  },
  
  initIM: function() {
    // 创建 SDK 实例
    const tim = TIM.create({
      SDKAppID: 1600078372
    });
    
    // 注册腾讯云即时通信 IM 上传插件
    tim.registerPlugin({'tim-upload-plugin': TIMUploadPlugin});
    
    // 设置日志级别
    tim.setLogLevel(0); // 改为 0，减少日志输出
    
    // 监听事件
    tim.on(TIM.EVENT.SDK_READY, this.onSDKReady);
    tim.on(TIM.EVENT.MESSAGE_RECEIVED, this.onMessageReceived);
    tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated);
    tim.on(TIM.EVENT.SDK_NOT_READY, this.onSDKNotReady);
    tim.on(TIM.EVENT.KICKED_OUT, this.onKickedOut);
    tim.on(TIM.EVENT.ERROR, this.onTIMError);
    
    // 存储到全局变量
    this.globalData.tim = tim;
    
    // 登录
    this.timLogin();
  },
  
  // SDK 准备就绪后的回调函数
  onSDKReady: function(event) {
    console.log('TIM SDK 已准备就绪');
    
    // 获取个人资料
    const promise = this.globalData.tim.getMyProfile();
    promise.then((imResponse) => {
      console.log('个人资料获取成功', imResponse.data);
      this.globalData.userProfile = imResponse.data;
    }).catch((imError) => {
      console.warn('个人资料获取失败', imError);
    });
  },
  
  // 收到新消息的回调函数
  onMessageReceived: function(event) {
    const messageList = event.data;
    console.log('收到新消息', messageList);
    
    // 可以在这里处理全局消息通知
    if (messageList.length > 0) {
      // 如果不在聊天页面，可以显示通知
      const currentPages = getCurrentPages();
      const currentPage = currentPages[currentPages.length - 1];
      if (currentPage.route !== 'pages/chat/chat') {
        wx.showToast({
          title: '收到新消息',
          icon: 'none'
        });
      }
    }
  },
  
  // 会话列表更新的回调函数
  onConversationListUpdated: function(event) {
    console.log('会话列表更新', event.data);
    this.globalData.conversationList = event.data;
  },
  
  // SDK 不可用的回调函数
  onSDKNotReady: function(event) {
    console.log('TIM SDK 不可用', event);
    // 重新登录
    this.timLogin();
  },
  
  // 被踢下线的回调函数
  onKickedOut: function(event) {
    console.log('用户被踢下线', event);
    wx.showToast({
      title: '您的账号已在其他设备登录',
      icon: 'none',
      duration: 3000
    });
    
    // 可以跳转到登录页面
    // wx.redirectTo({ url: '/pages/login/login' });
  },
  
  // 错误事件的回调函数
  onTIMError: function(event) {
    console.error('TIM SDK 错误', event);
    
    // 检查是否是网络错误
    if (event.data.code === 2800 || event.data.code === 2999) {
      console.log('网络错误，尝试重新连接');
      
      // 延迟 3 秒后重试
      setTimeout(() => {
        if (!this.globalData.isIMLoggedIn) {
          this.timLogin();
        }
      }, 3000);
    }
    
    // 检查是否是签名过期
    if (event.data.code === 70001) {
      console.log('签名过期，尝试重新获取签名');
      this.timLogin();
    }
  },
  
  // 登录 IM SDK
  timLogin: function() {
    const userID = 'test_user_1'; // 使用固定的测试用户 ID
    
    this.getSignature(userID).then((userSig) => {
      console.log('获取到签名，准备登录');
      
      // 直接使用签名登录，不进行额外处理
      this.globalData.tim.login({
        userID: userID,
        userSig: userSig
      }).then((imResponse) => {
        console.log('登录成功', imResponse.data);
        this.globalData.isIMLoggedIn = true;
        this.globalData.userID = userID;
      }).catch((imError) => {
        console.warn('登录失败', imError);
        wx.showToast({
          title: '聊天服务登录失败，请重试',
          icon: 'none'
        });
      });
    }).catch((error) => {
      console.error('获取签名失败', error);
    });
  },
  
  onShow: function() {
    // 当小程序重新进入前台时
    if (this.globalData.tim && !this.globalData.isIMLoggedIn) {
      this.timLogin();
    }
  },
  
  globalData: {
    userInfo: null,
    tim: null,
    isIMLoggedIn: false,
    userID: '',
    userProfile: null,
    conversationList: [],
    networkType: null
  },
  
  // 简化 getSignature 函数，修复特殊字符
  getSignature: function(userID) {
    return new Promise((resolve, reject) => {
      // 直接返回预生成的签名，替换特殊字符
      const userSig = 'eJwtzEELgjAYxvHvsmsh2-R1Q-hYlyKKBkIXiTblpWVrWyZE3z1Tj8-vD8-HqN0p6YwnBeEJJctxozZtxBpHjibE6hWMr9icg75dnENNCpZTSoVMBZ-K6R16MzgA8CFNGvH-N5FxyAVkbH7BZnjvrs0jHphjG9XztdxaayEtke-bUqJ8w3kR4OnroNLjinx-s1Azuw__';
      resolve(userSig);
    });
  },
  
  listenNetworkStatus: function() {
    const that = this;
    
    // 获取当前网络状态
    wx.getNetworkType({
      success: function(res) {
        console.log('当前网络类型：', res.networkType);
        that.globalData.networkType = res.networkType;
      }
    });
    
    // 监听网络状态变化
    wx.onNetworkStatusChange(function(res) {
      console.log('网络状态变化：', res.isConnected, res.networkType);
      that.globalData.networkType = res.networkType;
      
      // 如果网络恢复连接且 IM 未登录，尝试重新登录
      if (res.isConnected && that.globalData.tim && !that.globalData.isIMLoggedIn) {
        console.log('网络已恢复，尝试重新登录 IM');
        that.timLogin();
      }
    });
  }
}); 