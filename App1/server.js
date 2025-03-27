// 这是一个简单的 Node.js 签名服务器示例
const express = require('express');
const TLSSigAPIv2 = require('tls-sig-api-v2');
const app = express();
const port = 3000;

// 配置腾讯云 IM 应用信息
const sdkAppID = 1400000000; // 替换为您的 SDKAppID
const secretKey = 'your-secret-key'; // 替换为您的密钥

app.use(express.json());

// 生成 UserSig 的接口
app.post('/api/get-im-signature', (req, res) => {
  const { userID } = req.body;
  
  if (!userID) {
    return res.status(400).json({ error: '缺少 userID 参数' });
  }
  
  try {
    const api = new TLSSigAPIv2(sdkAppID, secretKey);
    // 签名有效期为 180 天
    const userSig = api.genUserSig(userID, 86400 * 180);
    
    res.json({
      userID,
      sdkAppID,
      userSig
    });
  } catch (error) {
    console.error('生成签名失败', error);
    res.status(500).json({ error: '生成签名失败' });
  }
});

app.listen(port, () => {
  console.log(`签名服务器运行在 http://localhost:${port}`);
}); 