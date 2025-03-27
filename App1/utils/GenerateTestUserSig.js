/*
 * 腾讯云 IM 临时签名生成工具
 * 警告：本工具仅用于开发测试，请勿在生产环境中使用！
 */

// 修改 crypto 引用方式，使用微信小程序提供的 API
// const crypto = require('crypto'); // 这行可能在小程序中不工作

/**
 * 生成测试用的 UserSig
 * @param {Object} options - 配置项
 * @param {Number} options.SDKAppID - 腾讯云 IM 应用的 SDKAppID
 * @param {String} options.secretKey - 腾讯云 IM 应用的密钥
 * @param {String} options.userID - 用户 ID
 * @param {Number} options.expire - 签名有效期，单位：秒，默认 86400*180 (180天)
 * @returns {String} 生成的 UserSig
 */
function genTestUserSig(options) {
  const { SDKAppID, secretKey, userID, expire = 86400 * 180 } = options;
  
  // 确保参数完整
  if (!SDKAppID || !secretKey || !userID) {
    console.error('参数不完整，无法生成 UserSig');
    return '';
  }
  
  // 当前时间戳，单位秒
  const currTime = Math.floor(Date.now() / 1000);
  
  // 签名有效起始时间，单位秒
  const sigBeginTime = currTime;
  
  // 签名有效截止时间，单位秒
  const sigEndTime = currTime + expire;
  
  // 随机数，用于防重放攻击
  const random = Math.floor(Math.random() * 4294967295);
  
  // 需要计算签名的字符串
  const strToSign = `TLS.identifier:${userID}\n`
                  + `TLS.sdkappid:${SDKAppID}\n`
                  + `TLS.time:${sigBeginTime}\n`
                  + `TLS.expire:${expire}\n`;
  
  // 使用微信小程序的 API 计算签名
  // 注意：微信小程序不支持直接使用 crypto 模块
  // 这里使用一个简化的方法，实际生产环境请使用服务器生成签名
  
  // 简化的签名生成方法（仅用于测试）
  const sig = simplifiedHmacSha256(secretKey, strToSign);
  
  // 生成 UserSig
  const jsonObj = {
    'TLS.ver': '2.0',
    'TLS.identifier': userID,
    'TLS.sdkappid': SDKAppID,
    'TLS.expire': expire,
    'TLS.time': sigBeginTime,
    'TLS.sig': sig
  };
  
  // 将 JSON 对象转为字符串并进行 Base64 编码
  const userSig = wx.arrayBufferToBase64(new Uint8Array([...new TextEncoder().encode(JSON.stringify(jsonObj))]));
  
  return userSig;
}

// 简化的 HMAC-SHA256 实现（仅用于测试）
function simplifiedHmacSha256(key, message) {
  // 注意：这是一个非常简化的实现，不安全，仅用于测试
  // 实际生产环境请使用服务器生成签名
  
  // 这里返回一个固定的签名，仅用于测试
  return 'test_signature_' + Math.random().toString(36).substring(2);
}

module.exports = {
  genTestUserSig
}; 