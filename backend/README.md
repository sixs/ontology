# 化工本体标准构建系统 - 后端

## 项目概述

本项目是一个化工领域本体标准构建系统的后端服务，基于Python Flask框架开发。系统支持OWL本体文件的解析、可视化展示、版本管理以及JSON-LD与OWL格式之间的相互转换。

## 目录结构

```
backend/
├── api.py          # API接口定义
├── app.py          # 应用入口
├── convert.py      # 数据格式转换工具
├── models.py       # 数据模型定义
├── parsers.py      # 本体解析器
├── visualization.py # 可视化生成工具
├── requirements.txt # 项目依赖
└── data/           # 示例数据
    ├── RTO-V4.json # JSON-LD格式示例
    └── RTO-V4.owl  # OWL格式示例
```

## 功能特性

### 1. 本体解析
- 支持OWL格式本体文件解析
- 提取类、属性、个体和层次结构信息
- 使用owlready2库进行本体处理

### 2. 可视化展示
- 将本体结构转换为图形化网络图
- 支持类节点、属性节点和限制节点的可视化
- 使用pyvis库生成交互式网络图

### 3. 数据格式转换
- JSON-LD与OWL格式相互转换
- 支持RDF三元组处理
- 使用rdflib库进行数据处理

### 4. 版本管理
- 本体版本的增删改查
- 可视化数据的自动更新
- 支持多种格式导出

## 技术栈

- **Flask**: Web框架
- **rdflib**: RDF数据处理库
- **owlready2**: OWL本体处理库
- **pyvis**: 网络图可视化库
- **python-dotenv**: 环境变量加载库

## 环境变量配置

后端服务使用`python-dotenv`库从`backend/.env`文件加载环境变量配置。主要配置项包括：

- `BACKEND_PORT`: 后端服务端口号，默认为5000

要使用自定义配置，请复制`.env.example`文件为`.env`并修改相应配置项。
- **SQLite**: 默认数据库（可通过配置更改）

## 安装与部署

### 环境要求

- Python 3.8+
- pip包管理器

### 安装步骤

1. 克隆项目代码
   ```bash
   git clone <repository-url>
   cd ontology/backend
   ```

2. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

3. 设置环境变量（可选）
   ```bash
   export BACKEND_PORT=5000
   ```

4. 运行应用
   ```bash
   python app.py
   ```

应用将在 `http://localhost:5000` 启动。

## API接口

### 版本管理接口

- `GET /api/versions` - 获取版本列表
- `GET /api/versions/<id>` - 获取版本详情
- `POST /api/versions` - 创建新版本
- `PUT /api/versions/<id>` - 更新版本
- `DELETE /api/versions/<id>` - 删除版本
- `GET /api/versions/<id>/download` - 下载版本文件
- `GET /api/download/<id>` - 下载指定格式文件

### 可视化接口

- `POST /api/visualize` - 生成本体可视化

### 数据转换接口

- 系统内部支持JSON-LD与OWL格式相互转换

## 数据模型

系统使用SQLite数据库存储本体版本信息，主要包含以下字段：
- `id`: 版本唯一标识
- `name`: 版本名称
- `description`: 版本描述
- `ontology_data`: 本体数据内容
- `graph`: 可视化图数据
- `tree`: 层级结构数据
- `table`: 表格形式数据
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 示例数据

项目包含RTO-V4示例本体，涵盖化工领域的化学物质、反应机理、设备和工艺等核心概念。

## 开发指南

### 代码结构说明

- `app.py`: 应用入口文件，负责初始化Flask应用
- `api.py`: 定义所有RESTful API接口
- `models.py`: 定义数据模型和数据库操作
- `parsers.py`: 实现OWL本体解析功能
- `visualization.py`: 实现本体可视化生成功能
- `convert.py`: 实现JSON-LD与OWL格式转换功能

### 添加新功能

1. 在`api.py`中添加新的API接口
2. 如需数据持久化，在`models.py`中扩展数据模型
3. 实现具体业务逻辑
4. 更新README文档

## 许可证

本项目采用MIT许可证。

## 联系方式

如有问题，请联系项目维护者。