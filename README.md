# 化工本体标准构建系统

## 项目概述

本项目是一个化工领域本体标准构建系统，分为前端和后端两个部分。

## 目录结构

```
.
├── backend/     # 后端服务
├── frontend/    # 前端界面
└── README.md    # 项目根目录说明
```

## 配置说明

### 后端配置
后端服务使用`python-dotenv`库从`backend/.env`文件加载环境变量配置。

### 前端配置
前端不再使用`.env`文件，环境变量通过`frontend/webpack.config.js`中的`DefinePlugin`进行配置。

## 文档导航

- [后端README](./backend/README.md) - 包含后端服务的详细说明
- [前端README](./frontend/README.md) - 包含前端界面的详细说明

请分别查看前后端的README文件以获取更详细的信息。