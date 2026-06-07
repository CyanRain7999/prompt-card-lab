# GitHub Pages + PWA 部署说明

这个包已经加好 PWA 文件：`manifest.webmanifest`、`sw.js`、`icons/`。

## GitHub Pages 部署

1. 在 GitHub 新建仓库，例如 `prompt-card-lab`。
2. 解压本 zip，把文件夹里的所有文件上传到仓库根目录。
3. 进入仓库 `Settings` → `Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 等 GitHub Pages 生成网址。

## 手机安装

- iPhone Safari：打开网址 → 分享 → 添加到主屏幕。
- Android Chrome：打开网址 → 菜单 → 添加到主屏幕 / 安装应用。

## 注意

OC、文件夹、画师串等仍然保存在当前浏览器本地 `localStorage`。电脑和手机不会自动同步。


## 竖屏锁定说明

本版本在 `manifest.webmanifest` 中设置了：

```json
"orientation": "portrait-primary"
```

如果手机上已经安装过旧版本 PWA，系统可能继续使用旧 manifest。更新后请：

1. 删除手机桌面上的旧图标。
2. 用浏览器重新打开 GitHub Pages 地址。
3. 重新“添加到主屏幕 / 安装应用”。

浏览器普通网页模式不能 100% 强制锁定屏幕方向，PWA 安装模式下更稳定。
