# oh-my-pi-zh 🇨🇳

**Oh My Pi (omp) 中文汉化补丁** — 将终端 AI 编程代理的界面翻译为中文。

![license](https://img.shields.io/github/license/LiuQingHuaYang/oh-my-pi-zh)

---

## 简介

由于 oh-my-pi 从 v16 开始改用**编译二进制**分发，无法直接修改源码。本项目提供两种使用方式：

| 方式 | 适合人群 |
|------|---------|
| **下载预编译二进制** | 不想折腾的普通用户 |
| **从源码构建** | 喜欢 DIY 的动手派 |

---

## 方式一：下载预编译二进制（推荐）

前往 [Releases](https://github.com/LiuQingHuaYang/oh-my-pi-zh/releases) 页面，下载对应平台的最新版本：

| 平台 | 文件名 |
|------|--------|
| Windows x64 | `omp-windows-x64.exe` |
| Linux x64 | `omp-linux-x64` |
| macOS x64 | `omp-darwin-x64` |
| macOS ARM (M1/M2) | `omp-darwin-arm64` |

> 下载后直接运行即可，无需安装任何环境。

---

## 方式二：从源码构建

### 前置要求

- [Bun](https://bun.sh) >= 1.3.14
- Python >= 3.8
- Rust（用于编译原生插件；如已有预编译 `.node` 文件可跳过）

### 步骤

```bash
# 1. 克隆上游源码
git clone https://github.com/can1357/oh-my-pi.git
cd oh-my-pi
bun install

# 2. 下载本项目的补丁脚本
curl -fsSL -o patch_omp_zh_v2.py https://raw.githubusercontent.com/LiuQingHuaYang/oh-my-pi-zh/main/patch_omp_zh_v2.py

# 3. 打汉化补丁
python patch_omp_zh_v2.py

# 4. 编译原生插件（如有预编译文件可跳过）
bun --cwd=packages/natives run build

# 5. 编译中文版二进制
bun --cwd=packages/coding-agent run build

# 6. 产物在 packages/coding-agent/dist/omp
```

---

## 翻译范围

| 区域 | 覆盖内容 |
|------|---------|
| 设置面板 | 全部 10 个标签页的标签、分组标题、选项、描述 |
| 斜杠命令菜单 | `/` 菜单中所有命令和子命令的描述 |
| 欢迎界面 | 欢迎文字、快捷键提示、LSP 服务器等 |
| 调试菜单 | 全部调试项 |
| 键盘快捷键 | 所有快捷键描述 |
| 模型角色 | 模型角色名称 |

**总计约 950+ 处翻译替换**，采用双语格式（保留原文 + 中文标注）。

---

## 工作原理

`patch_omp_zh_v2.py` 是一个 Python 脚本，直接搜索并替换 TypeScript 源码中的 UI 字符串。

```
python patch_omp_zh_v2.py
      ↓
扫描 packages/coding-agent/src/ 和 packages/tui/src/
      ↓
匹配约 950+ 处英文 UI 字符串 → 替换为中文（双语）
      ↓
bun run build → 编译为中文二进制
```

---

## 兼容性

- ✅ 当前测试版本：omp v16.1.10
- ✅ 跨平台：Windows / macOS / Linux
- ✅ 适用于所有编译二进制版本（v16+）
- ⚠️ 上游更新后需重新打补丁再编译

---

## 许可

MIT — 本项目是 [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) 的汉化补丁，如有能力请支持原项目。
