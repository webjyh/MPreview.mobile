# MPreview.js
移动端图片预览组件，支持手势缩放，双击放大，缩小

## Demo 预览 (扫一扫)

![图片左右切换](http://7jpp73.com1.z0.glb.clouddn.com/qr_code_left.png)　![图片上下切换](http://7jpp73.com1.z0.glb.clouddn.com/qr_code_top.png)

## 插件说明
1. 插件依赖 [QuoJS](https://github.com/soyjavi/quojs)，一款移动端的手势库。
2. 兼容性  Android 4.4+, iOS 8.0+ 下的自带浏览器测试能过。 
3. 组件只适合`移动端` PC版请移步 [MPreview.PC](https://github.com/webjyh/MPreview)

## 如何使用
```html
<!-- Load MPreview CSS && JS -->
<link rel="stylesheet" type="text/css" href="css/MPreview.mobile.css"/>
<script type="text/javascript" src="js/quo.js"></script>
<script type="text/javascript" src="js/MPreview.mobile.js"></script>

<!-- 用于显示组件的容器 -->
<div class="overlay" id="overlay"></div>

<!-- 初始化 -->
<script type="text/javascript">
MPreview({
    data: ['xxxx/1.jpg', 'xxxx/2.jpg', 'xxxx/3.jpg'],
    wrap: '#overlay',
});
</script>

PS: 如果引用的是 `MPreview.mobile.min.js`，则无需在引用 QuoJS 手势库，因为 `MPreview.mobile.min.js` 打包时一并把 `QuoJS` 打包进来了。
```

## API
```javascript
MPreview({options});
```
#### options  说明
参数名  | 默认值 | 类型 | 参数说明
------- | ------ | ---- | --------
url |  `null` | {String} | 初始化插件时，用于Ajax获取图片数据的地址，如果参数 `data` 存在，则不发送Ajax请求，Ajax发送的为`GET`请求，Ajax需返回`JSON`格式。
data | `null` | {Array} | 存放需要展示的图片数据，如果填写了此参数，Ajax请求则不会发送。`data: ['111.jpg', '2222.jpg', '3333.jpg']`
title | `【浏览】` | {String} | 显示于组件头部的标题内容
params | `{}` | {Object} | Ajax发送到服务器的数据。将自动转换为请求字符串格式。
wrap | `body` | {String} | 指定在哪个容器下显示，支持 `document.querySelector` 的选择器。`如：.class, element, #id, ul > li`;
direction | `top` | {String} | 指定图片按哪个方向切换，`top` 上下切换，`left` 左右切换。
placeholder | `images/placeholder.gif` | {String} | 透明图片占位符的地址
init | `null` | {Function} | 组件在初始化之前所调用的方法
close | `null` | {Function} | 关闭组件时的回调方法
```javascript
//Ajax 须返回如下JSON格式
{
    code: 1,
    imgs: [
        'xxxx.jpg',
        'xxxx.jpg',
        'xxxx.jpg'
    ]
}
```

#### 销毁组件
```javascript
var MP = MPreview({
    data: ['xxxx/1.jpg', 'xxxx/2.jpg', 'xxxx/3.jpg'],
    wrap: '#overlay',
});

//销毁
MP.destroy();
```

## 目录说明
```
MPreview/
├── css/
│   ├── normalize.css          (重置样式)
│   └── MPreview.mobile.css    (插件所需样式)
├── images/
│   ├── MPreview.mobile.loading.gif (加载图片等待动画)
│   └── placeholder.gif             (图片占位符)
├── js/
│   ├── quo.js                 (QuoJS 手势库)
│   ├── MPreview.mobile.js     (组件未压缩源码)
│   └── MPreview.mobile.min.js (组件压缩源码 已包含QuoJS))
├── gulpfile.js                (gulp 打包文件)
└── index.html                 (Demo展示)

PS: 在次强掉 MPreview.mobile.min.js 中已包含 QuoJS 手势库，由打包时候一起打包。如使用压缩版，则不需要在次引用 QuoJS 。
```

## 联系作者
Blog：<http://webjyh.com> 

Weibo：<http://weibo.com/webjyh/>
