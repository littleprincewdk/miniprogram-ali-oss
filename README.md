# [ali-oss](https://github.com/ali-sdk/ali-oss) for miniprogram

api基本和`ali-oss`(`v6.11.2`)保持一致, 主要做了以下改动：

- 所有`Buffer`类型的参数替换为`ArrayBuffer`

## 使用

```bash
$ yarn add miniprogram-ali-oss
```

当前实现的api有：

- [Object Operations](https://github.com/ali-sdk/ali-oss#object-operations)
  - [.initMultipartUpload](https://github.com/ali-sdk/ali-oss#initmultipartuploadname-options)
  - [.uploadPart](https://github.com/ali-sdk/ali-oss#uploadpartname-uploadid-partno-file-start-end-options)
  - [.completeMultipartUpload](https://github.com/ali-sdk/ali-oss#completemultipartuploadname-uploadid-parts-options)
  - [.multipartUpload](#multipartuploadname-file-options)
  - [.abortMultipartUpload](https://github.com/ali-sdk/ali-oss#abortmultipartuploadname-uploadid-options)
  
如需其他请联系。

## 运行示例

微信开发者工具（`1.03.2006302`以上）导入项目即可查看示例，首次运行需要执行下【工具】->【构建npm】
