var fs = require('fs');
var qiniu = require('qiniu');
var qiniuHelper = require('./qiniuHelper');

class QiniuStorage {
  
  _handleFile(req, file, cb) {
    var fileName = qiniuHelper.generateUUID();
    qiniuHelper.initQiniu(qiniu);
    qiniuHelper.putReadable(file.stream, file, cb);
  }

  _removeFile(req, file, cb) {
    fs.unlink(file.path, cb);
  }
}

module.exports = ()=> new QiniuStorage();
