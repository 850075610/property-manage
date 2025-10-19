# 物业管理系统

一个完整的物业管理系统，包含收费功能，支持房产管理、单元管理、租客管理、账单管理和收款记录。

## 功能特性

### 核心功能
- **房产管理**: 添加、编辑、删除房产信息
- **单元管理**: 管理每个房产下的单元，包括租金和状态
- **租客管理**: 管理租客信息，包括入住记录
- **账单管理**: 创建各种类型的账单（房租、水电费、维修费等）
- **收款管理**: 记录收款信息，支持多种支付方式
- **数据统计**: 实时显示系统关键指标

### 收费功能
- 支持多种账单类型（房租、水电费、维修费、其他）
- 自动计算待收款项
- 支持多种支付方式（现金、银行转账、微信支付、支付宝）
- 自动生成交易ID
- 账单状态自动更新

### 用户界面
- 响应式设计，支持移动端
- 直观的仪表板显示关键数据
- 清晰的表格展示
- 模态框表单操作
- 实时状态指示器

## 技术栈

### 后端
- **Node.js**: 运行环境
- **Express.js**: Web框架
- **SQLite3**: 数据库
- **CORS**: 跨域支持

### 前端
- **HTML5**: 结构
- **CSS3**: 样式
- **JavaScript**: 交互逻辑
- **响应式设计**: 适配不同设备

## 安装和运行

### 前提条件
- Node.js (v14 或更高版本)
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd propertyManage
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动应用**
   ```bash
   npm start
   ```

4. **开发模式（支持热重载）**
   ```bash
   npm run dev
   ```

### 访问应用
- 打开浏览器访问 `http://localhost:3000`
- 系统会自动创建数据库文件 `property_management.db`

## 数据库结构

### 主要表结构

1. **properties** - 房产表
   - id: 主键
   - name: 房产名称
   - address: 地址
   - total_units: 总单元数
   - created_at: 创建时间

2. **units** - 单元表
   - id: 主键
   - property_id: 房产ID（外键）
   - unit_number: 单元号
   - rent_amount: 租金金额
   - status: 状态（vacant/occupied）

3. **tenants** - 租客表
   - id: 主键
   - unit_id: 单元ID（外键）
   - name: 姓名
   - phone: 电话
   - email: 邮箱
   - move_in_date: 入住日期
   - move_out_date: 退房日期

4. **bills** - 账单表
   - id: 主键
   - tenant_id: 租客ID（外键）
   - type: 账单类型
   - amount: 金额
   - due_date: 到期日
   - status: 状态（pending/paid）
   - description: 描述

5. **payments** - 收款表
   - id: 主键
   - bill_id: 账单ID（外键）
   - tenant_id: 租客ID（外键）
   - amount: 金额
   - payment_date: 收款日期
   - payment_method: 支付方式
   - transaction_id: 交易ID

## API 接口

### 房产管理
- `GET /api/properties` - 获取所有房产
- `POST /api/properties` - 添加房产

### 单元管理
- `GET /api/units` - 获取所有单元
- `GET /api/units?property_id=X` - 获取指定房产的单元
- `POST /api/units` - 添加单元

### 租客管理
- `GET /api/tenants` - 获取所有租客
- `GET /api/tenants?unit_id=X` - 获取指定单元的租客
- `POST /api/tenants` - 添加租客

### 账单管理
- `GET /api/bills` - 获取所有账单
- `GET /api/bills?tenant_id=X` - 获取指定租客的账单
- `GET /api/bills?status=X` - 获取指定状态的账单
- `POST /api/bills` - 创建账单

### 收款管理
- `GET /api/payments` - 获取所有收款记录
- `GET /api/payments?tenant_id=X` - 获取指定租客的收款记录
- `POST /api/payments` - 添加收款记录

### 统计数据
- `GET /api/dashboard` - 获取仪表板统计数据

## 使用说明

### 基本操作流程

1. **添加房产**
   - 进入"房产管理"页面
   - 点击"添加房产"按钮
   - 填写房产信息并提交

2. **添加单元**
   - 进入"单元管理"页面
   - 点击"添加单元"按钮
   - 选择房产并填写单元信息

3. **添加租客**
   - 进入"租客管理"页面
   - 点击"添加租客"按钮
   - 选择空置单元并填写租客信息

4. **创建账单**
   - 进入"收费管理"页面
   - 点击"创建账单"按钮
   - 选择租客并填写账单信息

5. **登记收款**
   - 进入"收款记录"页面
   - 点击"登记收款"按钮
   - 选择租客和账单，填写收款信息

### 收费功能详解

#### 账单类型
- **房租**: 月度房租费用
- **水电费**: 水电等公共事业费
- **维修费**: 维修相关费用
- **其他**: 其他费用类型

#### 支付方式
- **现金**: 现金支付
- **银行转账**: 银行转账
- **微信支付**: 微信支付
- **支付宝**: 支付宝支付

#### 自动化功能
- 创建租客时自动更新单元状态
- 登记收款时自动更新账单状态
- 自动生成交易ID
- 实时统计待收款项

## 扩展功能

系统设计支持以下扩展：

1. **用户管理**: 添加用户角色和权限管理
2. **报表生成**: 添加详细的财务报表
3. **通知系统**: 邮件/短信提醒功能
4. **文件管理**: 合同、收据等文件上传
5. **多语言支持**: 国际化功能
6. **数据导出**: Excel/CSV格式导出
7. **移动端应用**: 专门的移动端界面

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 确保SQLite3正确安装
   - 检查文件权限

2. **端口占用**
   - 更改 `server.js` 中的PORT变量
   - 或使用 `PORT=3001 npm start` 指定端口

3. **前端无法连接后端**
   - 检查CORS设置
   - 确认API端点正确

### 日志查看
- 后端日志直接输出到控制台
- 浏览器开发者工具查看前端错误

## 开发说明

### 代码结构
```
propertyManage/
├── server.js              # 后端服务器
├── package.json           # 项目配置
├── public/                # 前端文件
│   ├── index.html        # 主页面
│   ├── style.css         # 样式文件
│   └── script.js         # 前端逻辑
├── property_management.db # 数据库文件（自动创建）
└── README.md             # 说明文档
```

### 开发模式
```bash
npm run dev
```
使用nodemon实现代码热重载

### 数据库重置
删除 `property_management.db` 文件重启服务器即可

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。
