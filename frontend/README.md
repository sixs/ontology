# 化工本体标准构建系统 - 前端

这是一个基于React、TypeScript和Webpack构建的前端应用程序，用于化工本体标准的构建和管理。

## 项目结构

```
frontend/
├── dist/                  # 构建输出目录
├── src/                   # 源代码目录
│   ├── components/        # React组件
│   ├── services/          # API服务
│   ├── App.css            # 主样式文件
│   ├── App.tsx            # 主应用组件
│   └── index.tsx          # 应用入口
├── package.json           # 项目依赖和脚本
├── tsconfig.json          # TypeScript配置
└── webpack.config.js      # Webpack配置
```

## 技术栈

- React 18
- TypeScript
- Webpack 5
- CSS Modules
- Axios (用于HTTP请求)

## 环境变量配置

前端环境变量通过`frontend/webpack.config.js`中的`DefinePlugin`进行配置，不再使用`.env`文件。主要配置项包括：

- `process.env.REACT_APP_BACKEND_API_URL`: 后端API地址
- `process.env.REACT_APP_AI_ASSISTANT_URL`: AI助手地址

## 主要功能

1. **本体编辑器** - 支持源码编辑和可视化展示
2. **文件管理器** - 管理本体版本
3. **多种可视化模式** - 图谱视图、树形视图、表格视图
4. **AI聊天面板** - 与AI助手交互
5. **版本控制** - 创建、编辑、删除和下载本体版本

## 组件说明

### 主要组件

- `App.tsx` - 主应用组件，协调各功能模块
- `Editor.tsx` - 本体编辑器，支持源码编辑和多种可视化模式
- `FileExplorer.tsx` - 文件资源管理器，管理本体版本
- `Sidebar.tsx` - 侧边栏导航
- `ChatPanel.tsx` - AI聊天面板
- `GraphView.tsx` - 图谱可视化视图
- `TreeViewer.tsx` - 树形结构可视化视图
- `TableView.tsx` - 表格形式可视化视图
- `CustomModal.tsx` - 自定义模态框组件

### 服务

- `api.ts` - 与后端API交互的服务
- `notification.ts` - 通知服务

## 安装和运行

### 环境要求

- Node.js (推荐使用LTS版本)
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm start
```

这将在开发模式下启动应用，默认访问地址为 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist` 目录。

## 配置

### 环境变量

项目使用 dotenv-webpack 插件支持环境变量配置。可以在项目根目录创建 `.env` 文件来配置环境变量：

```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_FRONTEND_PORT=3000
```

### TypeScript 配置

TypeScript 配置位于 `tsconfig.json` 文件中。

### Webpack 配置

Webpack 配置位于 `webpack.config.js` 文件中。

## 开发指南

### 添加新组件

1. 在 `src/components` 目录下创建新的组件文件
2. 在需要使用该组件的地方导入并使用

### 添加新页面

1. 创建新的页面组件
2. 在 `App.tsx` 中添加相应的路由和状态管理

### 样式

全局样式定义在 `src/App.css` 中，组件局部样式可以在组件文件中使用 CSS Modules 或直接编写CSS。

## 注意事项

1. 本项目使用了严格的TypeScript配置，确保类型安全
2. 所有组件都应遵循React最佳实践
3. 样式修改时请注意保持整体设计风格的一致性