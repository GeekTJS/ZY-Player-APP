# GitHub Actions 自动化打包说明

## 📋 配置步骤

### 1. 将项目推送到 GitHub

```bash
# 在 GitHub 创建新仓库后
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/ZY-Player-APP.git
git push -u origin main
```

### 2. 启用 GitHub Actions

推送代码后，进入你的 GitHub 仓库页面：
- 点击 `Actions` 标签
- 可以看到自动创建的工作流
- 点击 `All workflows` 查看所有任务

### 3. 手动触发构建

1. 进入仓库的 `Actions` 页面
2. 点击左侧工作流名称（如 `UniApp Build`）
3. 点击 `Run workflow` 按钮
4. 选择分支并点击 `Run workflow`

### 4. 查看构建产物

构建完成后：
- **H5 版本**：会自动部署到 GitHub Pages
- **微信小程序**：在 `Actions` 页面的 Artifacts 中下载

## 🌐 访问 H5 版本

构建成功后，访问：`https://你的用户名.github.io/ZY-Player-APP/`

## 📱 App 打包说明

由于 App 原生打包需要 DCloud 云服务，建议使用以下方式：

### 方式一：HBuilderX 云打包（推荐）
1. 在 HBuilderX 中打开项目
2. 点击 `发行 → 原生App-云打包`
3. 选择 Android/iOS 平台
4. 等待云端打包完成

### 方式二：本地 CLI 打包
需要在本地配置 Android Studio 环境后使用：
```bash
npm run build:app
```

## ⚠️ 注意事项

1. **微信小程序**需要申请 AppID 才能在微信开发者工具中预览
2. **App 打包**建议使用 HBuilderX 云打包服务
3. **GitHub Pages** 在中国访问可能较慢

## 🔧 自定义配置

如需修改构建流程，编辑 `.github/workflows/build.yml` 文件。
