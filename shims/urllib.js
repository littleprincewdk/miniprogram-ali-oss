// 模拟 https://github.com/node-modules/urllib

import urlutil from 'url';

function request(url, params = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: urlutil.format(url),
      method: params.method,
      data: params.content,
      header: params.headers,
      success: (res) => {
        const headers = {};
        Object.keys(res.header).forEach((key) => {
          headers[key.toLowerCase()] = res.header[key];
        });

        resolve({
          data: res.data,
          res: {
            status: res.statusCode,
            statusCode: res.statusCode,
            headers,
            statusMessage: 'TODO',
          },
        });
      },
      fail: (e) => {
        reject(e);
      },
    });
  });
}

export default {
  request,
};
