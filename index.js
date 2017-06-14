var express = require('express');
var router = express.Router();
var multer = require('multer');
var config = require('./config').qiniu;
var qiniuStorage = require('./qiniuStorage');
var upload = multer({
  storage: qiniuStorage()
});

router.post('/ueditor/ue', upload.single('upfile'), (req, res, next)=> {
  return res.json({
    state: 'SUCCESS',
    url: config.uploadUrl + req.file.key,
    title: req.file.originalname,
    original: req.file.originalname
  });
});
module.exports = router;
