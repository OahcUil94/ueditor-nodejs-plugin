# ueditor-nodejs-plugin

ueditor编辑器是百度前端团队推出的一个富文本编辑器，但是在文档中，并没有提到关于`Node.js`的使用说明。最近在工作中用到了这个编辑器，并且以`Node.js`作为后端，需要将`ueditor`编辑器中的图片上传到`七牛`上，那就做一下记录（这里使用的上传模块是`multer`）

## 安装ueditor

下载地址：[http://wordonline.bj.bcebos.com/ueditor_release/ueditor1_4_3_3-src.zip](http://wordonline.bj.bcebos.com/ueditor_release/ueditor1_4_3_3-src.zip)(ueditor-1.4.3.3)

## ueditor后端配置

下面介绍一下ueditor后端相关的配置，包括`ueditor第三方插件资源的配置`、`图片上传的配置`、`涂鸦上传的配置`。

### 第三方插件资源的配置

打开ueditor目录的`ueditor.config.js`文件，找到下面的代码：

```javascript
var URL = window.UEDITOR_HOME_URL || getUEBasePath();
```

这里的`URL`变量就是请求第三方插件的基础路径，例如你在页面中这样引入`ueditor`（假设此时页面运行在`http://localhost:1994/`）：

```html
<script src="/plugins/ueditor/ueditor.config.js"></script>
<script src="/plugins/ueditor/ueditor.all.min.js"></script>
<script src="/plugins/ueditor/lang/zh-cn/zh-cn.js"></script>
```

`getUEBasePath()`函数获取到的内容就是`http://localhost:1994/plugins/ueditor/`，ueditor就会在`/plugins/ueditor/`路径下去加载自己需要的css文件，js文件。
当然这里你也可以自己去指定，通过在`window`对象下挂载`UEDITOR_HOME_URL`变量：

```html
<script>
  window.UEDITOR_HOME_URL = 'http://localhost:1994/vendor/ueditor/';
</script>
```

### 图片上传的配置

在`ueditor.config.js`文件，找到下面的代码：

```javascript
// 服务器统一请求接口路径
, serverUrl: URL + "php/controller.php"
```

可以看到源码默认给出的是php的配置，这里的`serverUrl`是与服务端进行数据交互的关键。
假设`serverUrl`配置为`http://localhost:1994/ueditor/ue`，当ueditor加载时，首先会向服务端发送`GET`请求：`http://localhost:1994/ueditor/ue?action=config`，获取与ueditor上传相关的配置文件`config.json`，配置文件的部分内容如下（这里只包含与图片上传相关的配置）：

```javascript
{
  "imageActionName": "uploadimage",
  "imageFieldName": "upfile",
  "imageMaxSize": 2048000,
  "imageAllowFiles": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
  "imageCompressEnable": true,
  "imageCompressBorder": 1600,
  "imageInsertAlign": "none",
  "imageUrlPrefix": "",
  "imagePathFormat": "/ueditor/php/upload/image/{yyyy}{mm}{dd}/{time}{rand:6}",
}
```

> config.json文件可在ueditor源码的net、php、asp、jsp目录下找到

所以，只要确保ueditor请求路径`serverUrl + '?action=config'`能够正确返回配置文件的内容就可以了，如果未返回正确的配置信息，浏览器控制台将会报错：`后台配置项返回格式出错，上传功能将不能正常使用`。

配置文件能够正常加载之后，就可以使用ueditor的上传功能了。上传图片时，ueditor会发送POST，路径是：`serverUrl + '?action=' + imageActionName`，其中`imageActionName`是配置信息返回的，就是上面配置的`uploadimage`，服务端获取图片内容时，也是根据配置信息中`imageFieldName`的值来得到的，相关代码如下：

前端代码：

```javascript
<textarea name="editor" id="editor"></textarea>
<script>
  var ue = UE.getEditor('editor', {serverUrl: 'http://localhost:1994/ueditor/ue'});
</script>
```

后端代码：

```
// index.js:
var express = require('express');
var bodyParser = require('body-parser');
var ueRouter = require('./ue/router');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use('/ueditor', ueRouter);

app.listen(1994);


// ue/router.js
var express = require('express');
var multer = require('multer');
var config = require('./config.json');

var router = express.Router();
var upload = multer({dest: 'uploads/'}).single(config.imageFieldName);

router.get('/ue', (req, res)=> {
  var action = req.query.action;
  if (action === 'config') {
    return res.json(config);
  }
  return res.status(401).send('Permission denied');
});

router.post('/ue', (req, res)=> {
  if (req.query.action !== config.imageActionName) return res.status(401).send('Permission denied');
  upload(req, res, (err)=> {
    if (err) return res.status(500).send(err);
    return res.json({
      state: 'SUCCESS',
      url: '/uploads/' + req.file.filename,
      title: req.file.originalname,
      original: req.file.originalname
    });
  })
});

module.exports = router;
```

关于图片上传成功后，服务端返回给客户端的内容，是ueditor文档中规定好的：[http://fex.baidu.com/ueditor/#dev-request_specification](http://fex.baidu.com/ueditor/#dev-request_specification)，上传图片后返回的格式如下：

```javascript
{
    "state": "SUCCESS",
    "url": "upload/demo.jpg",
    "title": "demo.jpg",
    "original": "demo.jpg"
}
```

### 涂鸦上传的配置

涂鸦其实也是图片上传的一种类型，但是两者是有区别的，点击图片上传，`Content-Type`的类型是`multipart/form-data`，是交由`multer`模块处理的，但是涂鸦上传，`Content-Type`的类型是`application/x-www-form-urlencoded`，数据是`base64`编码后的，是需要经过`bodyParser.urlencoded({extended: true})`，所以与图片上传的代码略有不同：

```
// config.json
{
  "imageActionName": "uploadimage",
  "imageFieldName": "upfile",
  "imageMaxSize": 2048000,
  "imageAllowFiles": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
  "imageCompressEnable": true,
  "imageCompressBorder": 1600,
  "imageInsertAlign": "none",
  "imageUrlPrefix": "",
  "imagePathFormat": "/ueditor/php/upload/image/{yyyy}{mm}{dd}/{time}{rand:6}",
  "scrawlActionName": "uploadScraw",
  "scrawlFieldName": "upfile",
  "scrawlPathFormat": "/ueditor/php/upload/image/{yyyy}{mm}{dd}/{time}{rand:6}",
  "scrawlMaxSize": 2048000,
  "scrawlUrlPrefix": ""
}

// ue/router.js
router.post('/ue', (req, res)=> {
  if (req.query.action !== config.scrawlActionName) return res.status(401).send('Permission denied');
  var imgData = req.body[config.scrawlFieldName];
  var base64Data = imgData.replace(/^data:image\/\w+;base64,/, '');
  var dataBuffer = new Buffer(base64Data, 'base64');
  var filename = Date.now() + '.png';
  require('fs').writeFile('./uploads/' + filename, dataBuffer, (err)=> {
    if (err) return res.status(500).send(err);
    return res.json({
      state: 'SUCCESS',
      url: '/uploads/' + filename,
      title: 'scraw' + Date.now(),
      original: 'scraw' + Date.now()
    });
  });
});
```

如果上传时，出现了如下提示的错误：`413 Payload Too Large`，说明`body-parser`中间件限制了上传的大小，可以修改限制：

```javascript
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '5mb' // prevent 413 Payload Too Large
}));
```

## ueditor前端相关问题整理

### ueditor在chrome浏览器下，表单上传组件打开延迟

1. 源代码目录下的`_src/plugins/simpleupload.js`文件，把其中的`accept="image/*"`替换为`accept="image/jpeg,image/jpg,image/png,image/gif"`(修正单个图片上传)
2. 源代码目录下的`dialogs/image/image.js`文件，把其中的`mimeTypes: 'image/*'`替换为`mimeTypes: 'image/jpeg,image/jpg,image/png,image/gif'`(修正多图上传)

### ueditor在bootstrap3的模态框中显示异常

需要将ueditor的`zIndex`设置为大于`1100`，默认是`900`：

```javascript
var ue = UE.getEditor('editor', {zIndex: 1200});
```

### ueditor在bootstrap3的模态框中无法预览和全屏

在源代码目录下打开`_src/adapter/editor.js`文件，找到如下代码：

```javascript
while (container.tagName != "BODY") {
    var position = baidu.editor.dom.domUtils.getComputedStyle(container, "position");
    nodeStack.push(position);
    container.style.position = "static";
    container = container.parentNode;
}
```

修改为：

```javascript
while (container.tagName != "BODY") {
    var position = baidu.editor.dom.domUtils.getComputedStyle(container, "position");
    nodeStack.push(position);
    container = container.parentNode;

    var isModal = false;
    var classes = $(container).attr('class'); // 依赖了jquery
    if (classes !== undefined) {
        classes = classes.split(' ');
        for (var i = 0; i < classes.length; i++) {
            if (classes[i] == 'modal') isModal = true;
        }
    }
    if (!isModal) container.style.position = 'static';
}

```

> 参考文章：[http://blog.csdn.net/daelly/article/details/47276287](http://blog.csdn.net/daelly/article/details/47276287)

### ueditor的多图上传弹出框，不显示在线管理和百度搜索功能

在源代码目录中打开`dialogs/image/image.html`文件，注释掉以下内容：

```html
<span class="tab" data-content-id="online"><var id="lang_tab_online"></var></span>
<span class="tab" data-content-id="search"><var id="lang_tab_search"></var></span>

<!-- 在线图片 -->
<div id="online" class="panel">
    <div id="imageList"><var id="lang_imgLoading"></var></div>
</div>

<!-- 搜索图片 -->
<div id="search" class="panel">
    <div class="searchBar">
        <input id="searchTxt" class="searchTxt text" type="text" />
        <select id="searchType" class="searchType">
            <option value="&s=4&z=0"></option>
            <option value="&s=1&z=19"></option>
            <option value="&s=2&z=0"></option>
            <option value="&s=3&z=0"></option>
        </select>
        <input id="searchReset" type="button"  />
        <input id="searchBtn" type="button"  />
    </div>
    <div id="searchList" class="searchList"><ul id="searchListUl"></ul></div>
</div>
```