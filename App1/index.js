/**
 * 微信小程序聊天 WebSocket 服务器
 * 功能：
 * 1. 建立 WebSocket 连接
 * 2. 处理用户加入/离开聊天
 * 3. 转发聊天消息
 * 4. 心跳检测
 */

// 引入必要的模块
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// 配置服务器端口
const PORT = process.env.PORT || 8080;

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 简单的 HTTP 响应，用于健康检查
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket 服务器正在运行\n');
});

// 创建 WebSocket 服务器，将其附加到 HTTP 服务器
const wss = new WebSocket.Server({ server });

// 存储所有连接的客户端
const clients = new Map();

// 存储聊天室信息
const chatRooms = new Map();

// 当有新的 WebSocket 连接时
wss.on('connection', (ws, req) => {
  // 为每个连接生成唯一 ID
  const clientId = uuidv4();
  
  // 记录客户端连接信息
  const clientInfo = {
    id: clientId,
    ws: ws,
    isAlive: true,
    rooms: new Set() // 用户加入的聊天室
  };
  
  console.log(`新客户端连接: ${clientId}`);
  clients.set(clientId, clientInfo);
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId,
    message: '连接成功'
  }));
  
  // 处理接收到的消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`收到来自 ${clientId} 的消息:`, data);
      
      // 根据消息类型处理
      switch (data.type) {
        case 'heartbeat':
          // 处理心跳消息
          handleHeartbeat(clientInfo);
          break;
          
        case 'join':
          // 处理加入聊天室
          handleJoinRoom(clientInfo, data);
          break;
          
        case 'leave':
          // 处理离开聊天室
          handleLeaveRoom(clientInfo, data);
          break;
          
        case 'chat':
          // 处理聊天消息
          handleChatMessage(clientInfo, data);
          break;
          
        default:
          console.log(`未知消息类型: ${data.type}`);
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
    }
  });
  
  // 处理连接关闭
  ws.on('close', () => {
    console.log(`客户端断开连接: ${clientId}`);
    
    // 从所有聊天室中移除该用户
    for (const roomId of clientInfo.rooms) {
      leaveRoom(clientInfo, roomId);
    }
    
    // 从客户端列表中移除
    clients.delete(clientId);
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error(`客户端 ${clientId} 发生错误:`, error);
  });
  
  // 设置 ping 超时处理
  ws.on('pong', () => {
    clientInfo.isAlive = true;
  });
});

/**
 * 处理心跳消息
 * @param {Object} client - 客户端信息
 */
function handleHeartbeat(client) {
  client.isAlive = true;
  client.ws.send(JSON.stringify({
    type: 'heartbeat',
    timestamp: Date.now()
  }));
}

/**
 * 处理加入聊天室
 * @param {Object} client - 客户端信息
 * @param {Object} data - 消息数据
 */
function handleJoinRoom(client, data) {
  const { conversationId, userId, userName } = data;
  
  if (!conversationId) {
    sendErrorToClient(client, '缺少会话ID');
    return;
  }
  
  // 获取或创建聊天室
  if (!chatRooms.has(conversationId)) {
    chatRooms.set(conversationId, new Set());
  }
  
  const room = chatRooms.get(conversationId);
  room.add(client.id);
  client.rooms.add(conversationId);
  
  console.log(`客户端 ${client.id} 加入聊天室 ${conversationId}`);
  
  // 通知聊天室中的所有用户
  broadcastToRoom(conversationId, {
    type: 'system',
    conversationId: conversationId,
    content: `${userName || '用户'} 加入了聊天`,
    timestamp: Date.now()
  }, client.id); // 不发送给自己
  
  // 确认加入成功
  client.ws.send(JSON.stringify({
    type: 'joined',
    conversationId: conversationId,
    timestamp: Date.now()
  }));
}

/**
 * 处理离开聊天室
 * @param {Object} client - 客户端信息
 * @param {Object} data - 消息数据
 */
function handleLeaveRoom(client, data) {
  const { conversationId, userName } = data;
  
  if (!conversationId) {
    sendErrorToClient(client, '缺少会话ID');
    return;
  }
  
  leaveRoom(client, conversationId);
  
  // 确认离开成功
  client.ws.send(JSON.stringify({
    type: 'left',
    conversationId: conversationId,
    timestamp: Date.now()
  }));
}

/**
 * 从聊天室中移除用户
 * @param {Object} client - 客户端信息
 * @param {string} roomId - 聊天室ID
 */
function leaveRoom(client, roomId) {
  if (chatRooms.has(roomId)) {
    const room = chatRooms.get(roomId);
    room.delete(client.id);
    client.rooms.delete(roomId);
    
    console.log(`客户端 ${client.id} 离开聊天室 ${roomId}`);
    
    // 通知聊天室中的其他用户
    broadcastToRoom(roomId, {
      type: 'system',
      conversationId: roomId,
      content: `用户离开了聊天`,
      timestamp: Date.now()
    });
    
    // 如果聊天室为空，删除它
    if (room.size === 0) {
      chatRooms.delete(roomId);
      console.log(`聊天室 ${roomId} 已删除`);
    }
  }
}

/**
 * 处理聊天消息
 * @param {Object} client - 客户端信息
 * @param {Object} data - 消息数据
 */
function handleChatMessage(client, data) {
  const { conversationId, content, senderId, senderName } = data;
  
  if (!conversationId || !content) {
    sendErrorToClient(client, '消息格式不正确');
    return;
  }
  
  // 检查用户是否在聊天室中
  if (!client.rooms.has(conversationId)) {
    sendErrorToClient(client, '您不在该聊天室中');
    return;
  }
  
  // 构建消息对象
  const message = {
    type: 'chat',
    conversationId: conversationId,
    content: content,
    senderId: senderId || client.id,
    senderName: senderName || '匿名用户',
    timestamp: Date.now()
  };
  
  // 广播消息到聊天室
  broadcastToRoom(conversationId, message);
  
  // 确认消息已发送
  client.ws.send(JSON.stringify({
    type: 'sent',
    messageId: data.messageId || Date.now(),
    timestamp: Date.now()
  }));
}

/**
 * 向聊天室广播消息
 * @param {string} roomId - 聊天室ID
 * @param {Object} message - 消息对象
 * @param {string} [excludeClientId] - 要排除的客户端ID
 */
function broadcastToRoom(roomId, message, excludeClientId = null) {
  if (!chatRooms.has(roomId)) return;
  
  const room = chatRooms.get(roomId);
  const messageStr = JSON.stringify(message);
  
  for (const clientId of room) {
    if (excludeClientId && clientId === excludeClientId) continue;
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  }
}

/**
 * 向客户端发送错误消息
 * @param {Object} client - 客户端信息
 * @param {string} errorMessage - 错误消息
 */
function sendErrorToClient(client, errorMessage) {
  client.ws.send(JSON.stringify({
    type: 'error',
    message: errorMessage,
    timestamp: Date.now()
  }));
}

// 设置定时检查客户端连接状态
const interval = setInterval(() => {
  for (const [clientId, client] of clients.entries()) {
    if (!client.isAlive) {
      console.log(`客户端 ${clientId} 心跳超时，断开连接`);
      client.ws.terminate();
      continue;
    }
    
    client.isAlive = false;
    client.ws.ping();
  }
}, 30000); // 每30秒检查一次

// 当服务器关闭时清理定时器
wss.on('close', () => {
  clearInterval(interval);
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`WebSocket 服务器已启动，监听端口 ${PORT}`);
}); 