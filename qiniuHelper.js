var qiniu = require('qiniu');
var config = require('./config').qiniu;

module.exports.initQiniu(qiniu) = (qiniu)=> {
  qiniu.conf.ACCESS_KEY = config.ACCESS_KEY;
  qiniu.conf.SECRET_KEY = config.SECRET_KEY;
};

module.exports.putReadable = (readableStream, fileName, callback)=> {
  var uploadKey = uptoken(config.bucket, fileName);
  var extra = new qiniu.io.PutExtra();

  qiniu.io.putReadable(uploadKey, fileName, readableStream, extra, (err, ret)=> {
    if (err) return callback && callback(err);
    return callback && callback(null, ret);
  });

  function uptoken(bucket, key) {
    var putPolicy = new qiniu.rs.PutPolicy(bucket + ':' + key);
    return putPolicy.token();
  }
};

module.exports.generateUUID = (length)=> {
  var id = '';
  length = length || 32;
  while (length--)
    id += (Math.random() * 16 | 0) % 2 ? (Math.random() * 16 | 0)
      .toString(16) : (Math.random() * 16 | 0)
      .toString(16)
      .toUpperCase();
  return id.toLowerCase();
};
