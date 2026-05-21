# wuxuefan1207-art.github.io

personal website for sophie wu

## 个人网站维护说明

这是一个不依赖构建工具的静态个人网站，适合长期维护文字、摄影作品和剪辑视频。

## 直接预览

双击 `index.html` 即可在浏览器里打开。

## 更新个人信息

编辑 `content/site-content.js` 里的 `profile`：

- `name`：你的名字
- `tagline`：站点副标题
- `intro`：首页开场文字
- `about`：关于段落
- `facts`：所在地、关注方向、联系方式等

## 添加文字

在 `content/site-content.js` 的 `writing` 数组里新增一项：

```js
{
  title: "文章标题",
  date: "2026-05-21",
  category: "随笔",
  excerpt: "文章摘要",
  url: "文章链接或本地页面路径"
}
```

## 添加摄影作品

1. 把图片放进 `assets/photos/`。
2. 在 `photos` 数组里新增一项：

```js
{
  title: "照片标题",
  date: "2026-05-21",
  category: "城市",
  location: "Shanghai",
  description: "照片说明，会显示在大图弹窗里",
  src: "assets/photos/photo-name.jpg"
}
```

## 添加视频

1. 把视频缩略图放进 `assets/thumbnails/`，视频文件可放进 `assets/videos/`。
2. 在 `videos` 数组里新增一项：

```js
{
  title: "视频标题",
  date: "2026-05-21",
  description: "视频简介",
  url: "assets/videos/video-name.mp4",
  thumb: "assets/thumbnails/video-cover.jpg"
}
```

也可以把 `url` 换成 Bilibili、YouTube、Vimeo 等外部链接。

## 更新并发布

每次修改内容或样式后，在项目目录里提交并推送：

```powershell
git add .
git commit -m "Update website"
git push
```

如果当前终端还没有识别 `git`，可以临时使用完整路径：

```powershell
& "D:\Tool\Git\cmd\git.exe" add .
& "D:\Tool\Git\cmd\git.exe" commit -m "Update website"
& "D:\Tool\Git\cmd\git.exe" push
```

## 当前交互

- 摄影作品点击后会打开大图弹窗。
- 视频作品点击后会打开播放弹窗。
- 导航会根据页面滚动位置自动高亮。
- 首页最新更新会按 `date` 自动排序。

## 推荐目录

```text
assets/
  photos/
  thumbnails/
  videos/
content/
  site-content.js
index.html
script.js
styles.css
README.md
```
