import OSS from 'miniprogram-ali-oss';

Page({
  data: {
    filepath: '',
    progress: 0,
  },

  async onLoad() {
    const res = await this.fetchStsToken();
    this.object = res.data.qid;
    this.createOSS(res.data);
  },

  fetchStsToken() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://192.168.11.50:8987/video/sts_voucher',
        method: 'POST',
        success: (res) => {
          if (res.data.ret === 1) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        },
        fail: reject,
      });
    });
  },

  createOSS(options) {
    this.client = new OSS({
      accessKeyId: options.accessKey,
      accessKeySecret: options.secretKey,
      bucket: options.bucket,
      endpoint: options.endpoint,
      stsToken: options.securityToken,
    });
  },

  upload() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: async (res) => {
        this.setData({
          filepath: res.thumbTempFilePath,
        });

        const result = await this.client.multipartUpload(this.object, res.tempFilePath, {
          progress: (p) => {
            this.setData({
              progress: p * 100,
            });
          },
        });
        console.log('上传完成', result);
        wx.showToast({
          title: '上传完成',
        });
      },
    });
  },
});
