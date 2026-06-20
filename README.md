# oh-my-pi-zh 🇨🇳

**Oh My Pi (omp) 中文翻译补丁** — 将终端 AI 编程代理的界面翻译为中英双语。

![version](https://img.shields.io/npm/v/oh-my-pi-zh)
![license](https://img.shields.io/npm/l/oh-my-pi-zh)

---

## 安装

确保你已经安装了 [oh-my-pi](https://github.com/can1357/oh-my-pi)：

```bash
bun install -g @oh-my-pi/pi-coding-agent
```

然后安装中文补丁：

```bash
# 方式一：通过 npm 全局安装（推荐）
npm install -g oh-my-pi-zh

# 方式二：通过 npx 直接运行
npx oh-my-pi-zh
```

## 使用

### 应用补丁

安装后会自动执行补丁。也可手动运行：

```bash
omp-zh-patch
# 或
npx oh-my-pi-zh
```

### 恢复英文

```bash
omp-zh-unpatch
# 或
npx oh-my-pi-zh-unpatch
```

## 效果

补丁采用**双语格式**，保留原文的同时标注中文翻译：

```
Settings tab:     外观 | 模型 | 交互 | 上下文 | 记忆 | 编辑 | 工具 | 任务 | 提供商
Slash commands:   /settings    Open settings / 打开设置菜单
                  /plan        Toggle plan mode / 切换计划模式
                  /model       Select model / 选择模型
Tool list:        Find         Find files / 查找匹配 glob 模式的文件和目录
                  Search       Search file contents / 使用 ripgrep 搜索文件内容
Debug menu:       View: terminal state（查看终端状态）
Keyboard:         上移光标 | 删除单词 | 提交输入
```

## 翻译范围

| 区域 | 文件 | 条目数 |
|------|------|--------|
| 设置界面标签 | `settings-schema.ts` | ~350 |
| 设置选项值 | `settings-schema.ts` | ~80 |
| 斜杠命令描述 | `builtin-registry.ts` | 126 |
| 工具摘要 | `tools/*.ts` | 21 |
| 调试菜单 | `debug/index.ts` | 24 |
| 欢迎界面 | `welcome.ts` | 11 |
| 模型角色 | `model-registry.ts` | 8 |
| 键盘绑定 | `keybindings.ts` | 31 |
| 会话审批 | `agent-session.ts` | 4 |
| MCP 向导 | `mcp-add-wizard.ts` | 40+ |

## 工作原理

补丁直接修改 `@oh-my-pi` 包的 TypeScript 源文件。由于 Bun 直接运行 `.ts` 文件，修改即时生效，无需编译。

> **注意：** `omp.cmd` 版本使用 TypeScript 源码运行，补丁可以正常工作。新版本改用编译后的二进制文件分发，此补丁方式不再适用。

## 兼容性

- 支持 oh-my-pi **v15.9.1 (omp.cmd)** 及更早版本
- ⚠️ **不兼容** 后续使用编译版本的 oh-my-pi（新版本改用编译后的二进制文件，无法直接修改源码）
- 跨平台：Windows / macOS / Linux

## 更新

当 oh-my-pi 升级后，补丁会被覆盖。重新运行即可：

```bash
bun install -g @oh-my-pi/pi-coding-agent   # 升级 omp
omp-zh-patch                                 # 重新打补丁
```

## 许可

MIT
