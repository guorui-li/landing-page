# EduProf AI - 定制化AI教育工具落地页

专业的 AI 教育工具展示页面，集成动态 Orb 背景动效。

## 🚀 快速启动

```bash
# 启动开发服务器
python3 -m http.server 8080

# 访问主页
open http://localhost:8080/index.html
```

## 📁 项目结构

```
landing-page/
├── index.html              # 主页面
├── orb-controls.html       # Orb 控制面板
├── test-hover.html         # 悬停效果测试
├── css/                    # 样式文件
│   ├── style.css          # 主样式
│   └── components/        # 组件样式
├── js/
│   └── orb-simple.js      # Orb 动效组件
├── images/                # 图片资源
└── README.md              # 项目说明
```

## 🎨 核心特性

- ✨ **动态 Orb 背景** - WebGL 渲染的 3D 球体
- 🖱️ **高灵敏度交互** - 0.1秒延迟触发
- 🎨 **自定义色调** - 266° 蓝紫色调
- 📱 **响应式设计** - 移动端适配
- ⚡ **高性能渲染** - 60fps 流畅动画

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **动效**: WebGL + GLSL Shaders
- **交互**: 高灵敏度鼠标悬停
- **设计**: 暗色主题 + 现代UI

## 📱 页面说明

1. **index.html** - 主落地页，完整的 EduProf AI 介绍
2. **orb-controls.html** - 实时调整 Orb 参数
3. **test-hover.html** - 悬停效果调试页面

## 🎯 Orb 参数

- **色调**: 266° (蓝紫色)
- **悬停强度**: 3.91
- **触发延迟**: 0.1 秒
- **旋转效果**: 开启
- **强制悬停**: 关闭

## 🔧 自定义

通过 `orb-controls.html` 可以实时调整：
- 色调 (Hue Shift)
- 悬停强度 (Hover Intensity)  
- 旋转开关 (Rotate On Hover)
- 强制悬停 (Force Hover State)

## 📖 使用说明

### 基本用法

```javascript
const orb = new SimpleOrb(container, {
  hue: 266,                  // 色调
  hoverIntensity: 3.91,      // 悬停强度
  rotateOnHover: true,       // 旋转效果
  forceHoverState: false     // 强制悬停
});
```

### 预设效果

- **当前设置**: 266° 蓝紫色，高强度
- **默认**: 标准效果
- **宁静**: 低强度，无旋转
- **动态**: 中等强度，有旋转
- **极致**: 超高强度效果

## 🚀 部署

项目为纯静态文件，可直接部署到任何 Web 服务器：

```bash
# 上传所有文件到服务器
# 确保 index.html 为入口文件
# 无需特殊配置
```

## 📄 许可证

MIT License

---

*项目已优化，结构简洁，功能完整。*