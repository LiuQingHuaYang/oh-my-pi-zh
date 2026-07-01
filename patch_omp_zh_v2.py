#!/usr/bin/env python3
"""
oh-my-pi 中文翻译补丁 v2
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
v2 改进：翻译数据集中管理，按文件 + 类别组织，易读易维护

使用方法：
  1. cd oh-my-pi-source
  2. python patch_omp_zh_v2.py

翻译格式：保留英文原文 + 中文标注（双语），或纯中文
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
"""
import os

REPO_DIR = os.path.dirname(os.path.abspath(__file__))

# 检测是在 CI（克隆到 source/ 子目录）还是本地直接运行
_UPSTREAM_BASE = os.path.join(REPO_DIR, "source") if os.path.isdir(os.path.join(REPO_DIR, "source", "packages")) else REPO_DIR
CODING_AGENT_SRC = os.path.join(_UPSTREAM_BASE, "packages", "coding-agent", "src")
TUI_SRC = os.path.join(_UPSTREAM_BASE, "packages", "tui", "src")


# ═══════════════════════════════════════════════════════════════════════════
# 翻译数据 —— 按文件路径组织，每个条目为 (old_string, new_string)
# ═══════════════════════════════════════════════════════════════════════════

# ──────────── 1. settings-schema.ts ────────────
S = os.path.join(CODING_AGENT_SRC, "config", "settings-schema.ts")

# 1a. 设置面板标签页（tabs）- 在 TAB_METADATA 中
S_TABS = []

# 1b. 分组标题（TAB_GROUPS 中的 section headings）
S_GROUPS = [
    ('"Theme"', '"主题"'),
    ('"Status Line"', '"状态栏"'),
    ('"Display"', '"显示"'),
    ('"Images"', '"图片"'),
    ('"Thinking"', '"思考"'),
    ('"Sampling"', '"采样"'),
    ('"Prompt"', '"提示"'),
    ('"Retry & Fallback"', '"重试与回退"'),
    ('"Advisor"', '"顾问"'),
    ('"Vision"', '"视觉"'),
    ('"Input"', '"输入"'),
    ('"Approvals"', '"审批"'),
    ('"Notifications"', '"通知"'),
    ('"Speech"', '"语音"'),
    ('"Collab"', '"协作"'),
    ('"Magic Keywords"', '"魔法关键词"'),
    ('"Startup & Updates"', '"启动与更新"'),
    ('"Power (macOS)"', '"电源 (macOS)"'),
    ('"Agent"', '"代理"'),
    ('"General"', '"通用"'),
    ('"Compaction"', '"压缩"'),
    ('"Rules (TTSR)"', '"规则 (TTSR)"'),
    ('"Experimental"', '"实验性"'),
    ('"Auto-Learn"', '"自动学习"'),
    ('"Reading"', '"阅读"'),
    ('"Read Summaries"', '"读取摘要"'),
    ('"Available Tools"', '"可用工具"'),
    ('"Todos"', '"待办"'),
    ('"Search & Browser"', '"搜索与浏览器"'),
    ('"Output Limits"', '"输出限制"'),
    ('"Execution"', '"执行"'),
    ('"Discovery & MCP"', '"发现与 MCP"'),
    ('"Developer"', '"开发者"'),
    ('"Modes"', '"模式"'),
    ('"Subagents"', '"子代理"'),
    ('"Isolation"', '"隔离"'),
    ('"Commands & Skills"', '"命令与技能"'),
    ('"Services"', '"服务"'),
    ('"Tiny Model"', '"微型模型"'),
    ('"Protocol"', '"协议"'),
    ('"Privacy"', '"隐私"'),
]

# 1c. 设置项标签（labels）- 尚未翻译的
S_LABELS = [
    ('label: "Auto Resume"', 'label: "自动恢复"'),
    ('label: "Show Startup Splash"', 'label: "显示启动画面"'),
    ('label: "Check for Updates"', 'label: "检查更新"'),
    ('label: "Marketplace Auto-Update"', 'label: "市场自动更新"'),
    ('label: "Collapse Changelog"', 'label: "折叠更新日志"'),
    ('label: "Enable Advisor"', 'label: "启用顾问"'),
    ('label: "Advisor for Subagents"', 'label: "子代理顾问"'),
    ('label: "Advisor Sync Backlog"', 'label: "顾问同步积压"'),
    ('label: "Advisor Immune Turns"', 'label: "顾问免疫轮次"'),
    ('label: "Prose Only Thinking"', 'label: "纯文本思考摘要"'),
    ('label: "Omit Thinking summaries"', 'label: "省略思考摘要"'),
    ('label: "Loop Guard"', 'label: "循环防护"'),
    ('label: "Loop Guard Scan Prose"', 'label: "循环防护扫描正文"'),
    ('label: "Inline Tool Descriptors"', 'label: "内联工具描述"'),
    ('label: "Include Model in Prompt"', 'label: "在提示中包含模型名"'),
    ('label: "Include Workspace Tree"', 'label: "包含工作区目录树"'),
    ('label: "Personality"', 'label: "人格风格"'),
    ('label: "Min P"', 'label: "Min P"'),
    ('label: "Fast Mode Scope"', 'label: "快速模式范围"'),
    ('label: "Max Retry Delay"', 'label: "最大重试延迟"'),
    ('label: "Retry Model Fallback"', 'label: "重试模型回退"'),
    ('label: "Fallback Revert Policy"', 'label: "回退恢复策略"'),
    ('label: "Interrupt Mode"', 'label: "中断模式"'),
    ('label: "Loop Mode"', 'label: "循环模式"'),
    ('label: "Double-Escape Action"', 'label: "双 Escape 操作"'),
    ('label: "Session Tree Filter"', 'label: "会话树过滤器"'),
    ('label: "Autocomplete Items"', 'label: "自动补全条数"'),
    ('label: "Large Paste Menu"', 'label: "大段粘贴菜单"'),
    ('label: "Completion Notification"', 'label: "完成通知"'),
    ('label: "Ask Timeout"', 'label: "询问超时"'),
    ('label: "Ask Notification"', 'label: "询问通知"'),
    ('label: "Relay URL"', 'label: "中继 URL"'),
    ('label: "Web UI URL"', 'label: "Web UI URL"'),
    ('label: "Display Name"', 'label: "显示名称"'),
    ('label: "Share Server"', 'label: "分享服务器"'),
    ('label: "Share Secret Redaction"', 'label: "分享机密编辑"'),
    ('label: "Speech-to-Text"', 'label: "语音转文字"'),
    ('label: "Speech Model"', 'label: "语音模型"'),
    ('label: "Magic Keywords"', 'label: "魔法关键词"'),
    ('label: "Ultrathink Keyword"', 'label: "Ultrathink 关键词"'),
    ('label: "Orchestrate Keyword"', 'label: "Orchestrate 关键词"'),
    ('label: "Workflow Keyword"', 'label: "Workflow 关键词"'),
    ('label: "Auto-Promote Context"', 'label: "自动提升上下文"'),
    ('label: "Compaction Threshold"', 'label: "压缩阈值"'),
    ('label: "Compaction Token Limit"', 'label: "压缩 Token 限制"'),
    ('label: "Save Handoff Docs"', 'label: "保存交接文档"'),
    ('label: "Remote Compaction"', 'label: "远程压缩"'),
    ('label: "Idle Compaction"', 'label: "空闲压缩"'),
    ('label: "Idle Compaction Threshold"', 'label: "空闲压缩阈值"'),
    ('label: "Idle Compaction Delay"', 'label: "空闲压缩延迟"'),
    ('label: "Supersede Stale Reads"', 'label: "取代过期读取"'),
    ('label: "Elide Uneventful Results"', 'label: "省略无事件结果"'),
    ('label: "Snapcompact System Prompt"', 'label: "Snapcompact 系统提示"'),
    ('label: "Snapcompact Tool Results"', 'label: "Snapcompact 工具结果"'),
    ('label: "Tool Calling Mode"', 'label: "工具调用模式"'),
    ('label: "Snapcompact Shape"', 'label: "Snapcompact 形状"'),
    ('label: "Large Headings (Kitty)"', 'label: "大标题 (Kitty)"'),
    ('label: "Terminal Hyperlinks"', 'label: "终端超链接"'),
    ('label: "Tight Layout"', 'label: "紧凑布局"'),
    ('label: "Smooth Streaming"', 'label: "平滑流式输出"'),
    ('label: "Cache Miss Marker"', 'label: "缓存未命中标记"'),
    ('label: "Show Hardware Cursor"', 'label: "显示硬件光标"'),
    ('label: "Session Accent"', 'label: "会话强调色"'),
    ('label: "Transparent Status Line"', 'label: "透明状态栏"'),
    ('label: "Show Hook Status"', 'label: "显示钩子状态"'),
    ('label: "Auto-Resize Images"', 'label: "自动调整图片大小"'),
    ('label: "Describe Images for Text Models"', 'label: "为文本模型描述图片"'),
    ('label: "Enable Git Integration"', 'label: "启用 Git 集成"'),
    ('label: "Artifact Spill Threshold (KB)"', 'label: "产物溢出阈值 (KB)"'),
    ('label: "Artifact Tail Size (KB)"', 'label: "产物尾部大小 (KB)"'),
    ('label: "Artifact Head Size (KB)"', 'label: "产物头部大小 (KB)"'),
    ('label: "Output Column Cap"', 'label: "输出列限制"'),
    ('label: "Artifact Tail Lines"', 'label: "产物尾部行数"'),
    ('label: "Find"', 'label: "查找文件"'),
    ('label: "Search"', 'label: "搜索内容"'),
    ('label: "AST Grep"', 'label: "AST 搜索"'),
    ('label: "AST Edit"', 'label: "AST 编辑"'),
    ('label: "Debug"', 'label: "调试"'),
    ('label: "Speech Generation"', 'label: "语音生成"'),
    ('label: "Inspect Image"', 'label: "检查图片"'),
    ('label: "Checkpoint/Rewind"', 'label: "检查点/回退"'),
    ('label: "Read URLs"', 'label: "读取 URL"'),
    ('label: "Obsidian Vault"', 'label: "Obsidian 知识库"'),
    ('label: "GitHub CLI"', 'label: "GitHub CLI"'),
    ('label: "Web Search"', 'label: "网络搜索"'),
    ('label: "Browser"', 'label: "浏览器"'),
    ('label: "Todo Reminders"', 'label: "待办提醒"'),
    ('label: "Todo Reminder Limit"', 'label: "待办提醒上限"'),
    ('label: "Create Todos Automatically"', 'label: "自动创建待办"'),
    ('label: "Todo Auto-Clear Delay"', 'label: "待办自动清除延迟"'),
    ('label: "Search Context Before"', 'label: "搜索上文行数"'),
    ('label: "Search Context After"', 'label: "搜索下文行数"'),
    ('label: "Headless Browser"', 'label: "无头浏览器"'),
    ('label: "cmux Browser"', 'label: "cmux 浏览器"'),
    ('label: "Screenshot Directory"', 'label: "截图目录"'),
    ('label: "GitHub View Cache"', 'label: "GitHub 视图缓存"'),
    ('label: "GitHub Cache Soft TTL"', 'label: "GitHub 缓存软 TTL"'),
    ('label: "GitHub Cache Hard TTL"', 'label: "GitHub 缓存硬 TTL"'),
    ('label: "Intent Tracing"', 'label: "意图追踪"'),
    ('label: "Abort On Fabricated Tool Result"', 'label: "伪造结果中止"'),
    ('label: "Max Tool Timeout"', 'label: "工具超时上限"'),
    ('label: "Async Execution"', 'label: "异步执行"'),
    ('label: "Max Poll Time"', 'label: "最大轮询时间"'),
    ('label: "IRC Timeout"', 'label: "IRC 超时"'),
    ('label: "Tool Discovery"', 'label: "工具发现"'),
    ('label: "Essential Tools Override"', 'label: "必备工具覆盖"'),
    ('label: "MCP Project Config"', 'label: "MCP 项目配置"'),
    ('label: "MCP Tool Discovery"', 'label: "MCP 工具发现"'),
    ('label: "MCP Discovery Default Servers"', 'label: "MCP 发现默认服务器"'),
    ('label: "MCP Update Injection"', 'label: "MCP 更新注入"'),
    ('label: "MCP Notification Debounce"', 'label: "MCP 通知防抖"'),
    ('label: "Bash"', 'label: "Bash"'),
    ('label: "Bash Auto-Background"', 'label: "Bash 自动后台"'),
    ('label: "Bash Interceptor"', 'label: "Bash 拦截器"'),
    ('label: "Strip head/tail Pipes"', 'label: "去除 head/tail 管道"'),
    ('label: "Shell Minimizer"', 'label: "Shell 输出压缩"'),
    ('label: "Shell Minimizer Source Outline"', 'label: "源码轮廓模式"'),
    ('label: "Python Eval Backend"', 'label: "Python 评估后端"'),
    ('label: "JavaScript Eval Backend"', 'label: "JavaScript 评估后端"'),
    ('label: "Python Kernel Mode"', 'label: "Python 内核模式"'),
    ('label: "Python Interpreter"', 'label: "Python 解释器"'),
    ('label: "Start in Plan Mode"', 'label: "启动时进入计划模式"'),
    ('label: "Goal Status in Footer"', 'label: "页脚显示目标状态"'),
    ('label: "Goal Continuation Modes"', 'label: "目标继续模式"'),
    ('label: "Isolation Mode"', 'label: "隔离模式"'),
    ('label: "Isolation Merge Strategy"', 'label: "隔离合并策略"'),
    ('label: "Isolation Commit Style"', 'label: "隔离提交风格"'),
    ('label: "Prefer Task Delegation"', 'label: "优先任务委派"'),
    ('label: "Batch Task Calls"', 'label: "批量任务调用"'),
    ('label: "LSP in Subagents"', 'label: "子代理中启用 LSP"'),
    ('label: "Max Task Recursion"', 'label: "最大任务递归"'),
    ('label: "Max Subagent Runtime"', 'label: "子代理最大运行时间"'),
    ('label: "Agent Idle TTL"', 'label: "代理空闲 TTL"'),
    ('label: "Soft Subagent Request Budget"', 'label: "子代理请求软预算"'),
    ('label: "Skill Commands"', 'label: "技能命令"'),
    ('label: "Claude User Commands"', 'label: "Claude 用户命令"'),
    ('label: "Claude Project Commands"', 'label: "Claude 项目命令"'),
    ('label: "OpenCode User Commands"', 'label: "OpenCode 用户命令"'),
    ('label: "OpenCode Project Commands"', 'label: "OpenCode 项目命令"'),
    ('label: "Web Search Provider"', 'label: "网络搜索提供商"'),
    ('label: "Excluded Web Search Providers"', 'label: "排除的搜索提供商"'),
    ('label: "Antigravity Endpoint Mode"', 'label: "Antigravity 端点模式"'),
    ('label: "Image Provider"', 'label: "图片生成提供商"'),
    ('label: "Text-to-Speech Provider"', 'label: "文本转语音提供商"'),
    ('label: "Local TTS Model"', 'label: "本地 TTS 模型"'),
    ('label: "Local TTS Voice"', 'label: "本地 TTS 语音"'),
    ('label: "Speech Vocalization"', 'label: "语音朗读"'),
    ('label: "Speech Vocalization Mode"', 'label: "语音朗读模式"'),
    ('label: "Speech Vocalization Voice"', 'label: "语音朗读音色"'),
    ('label: "Fireworks Tier"', 'label: "Fireworks 等级"'),
    ('label: "Kimi API Format"', 'label: "Kimi API 格式"'),
    ('label: "OpenAI WebSockets"', 'label: "OpenAI WebSocket"'),
    ('label: "Hide Secrets"', 'label: "隐藏机密"'),
    ('label: "Tiny Model Device"', 'label: "微型模型设备"'),
    ('label: "Tiny Model Precision"', 'label: "微型模型精度"'),
    ('label: "Unexpected Stop Model"', 'label: "意外停止检测模型"'),
]

S_DESCRIPTIONS = [
    ('description: "Automatically resume the most recent session in the current directory"',
     'description: "自动恢复当前目录中的最近会话"'),
    ('description: "Enable the find tool for glob-based file lookup"', 'description: "启用基于通配符的文件查找工具"'),
    ('description: "Enable the search tool for regex content search"', 'description: "启用正则表达式内容搜索工具"'),
    ('description: "Enable the ast_grep tool for structural AST search"', 'description: "启用 AST 结构搜索工具"'),
    ('description: "Enable the ast_edit tool for structural AST rewrites"', 'description: "启用 AST 结构重写工具"'),
    ('description: "Enable the debug tool for DAP-based debugging"', 'description: "启用基于 DAP 的调试工具"'),
    ('description: "Enable the web_search tool for live web results"', 'description: "启用网络搜索工具"'),
    ('description: "Enable the browser tool for scripted Chromium automation (puppeteer)"',
     'description: "启用浏览器自动化工具（Chromium/puppeteer）"'),
    ('description: "Remind the agent to complete todos before stopping"', 'description: "在停止前提醒代理完成待办"'),
    ('description: "Maximum number of todo reminders before giving up"', 'description: "待办提醒的最大次数"'),
    ('description: "Lines of context before each search match"', 'description: "每个搜索结果前的上下文行数"'),
    ('description: "Lines of context after each search match"', 'description: "每个搜索结果后的上下文行数"'),
    ('description: "Launch browser in headless mode (disable to show browser UI)"', 'description: "以无头模式启动浏览器"'),
    ('description: "Ask the agent to describe the intent of each tool call before executing it"',
     'description: "要求代理在执行前描述工具调用意图"'),
    ('description: "Maximum timeout in seconds the agent can set for any tool (0 = no limit)"',
     'description: "代理可为工具设置的最大超时秒数"'),
    ('description: "Enable async bash commands and background task execution"', 'description: "启用异步 bash 命令和后台任务执行"'),
    ('description: "Enable the bash tool for shell command execution"', 'description: "启用 bash 工具执行 shell 命令"'),
    ('description: "Block shell commands that have dedicated tools"', 'description: "拦截已有专用工具的 shell 命令"'),
    ('description: "Compress verbose shell output (git, npm, cargo, etc.) before returning it to the agent"',
     'description: "压缩冗长的 shell 输出后再返回给代理"'),
    ('description: "Allow the eval tool to dispatch Python cells to the IPython kernel"',
     'description: "允许将 Python 代码发送到 IPython 内核执行"'),
    ('description: "Allow the eval tool to dispatch JavaScript cells to the in-process runtime"',
     'description: "允许将 JavaScript 代码发送到进程内运行时执行"'),
    ('description: "Keep the IPython kernel alive across eval calls or start fresh each time"',
     'description: "保持 IPython 内核在多次 eval 调用间存活"'),
    ('description: "Enable plan mode for read-only exploration and planning before execution"',
     'description: "启用只读探索和规划的计划模式"'),
    ('description: "Enable per-session goal mode and the hidden goal tool"',
     'description: "启用每会话目标模式和隐藏的目标工具"'),
    ('description: "Register skills as /skill:name commands"', 'description: "将技能注册为 /skill:name 命令"'),
    ('description: "Preferred provider for the web_search tool"', 'description: "网络搜索工具的首选提供商"'),
    ('description: "Preferred provider for image generation"', 'description: "图片生成的首选提供商"'),
    ('description: "Obfuscate secrets before sending to AI providers"', 'description: "在发送给 AI 提供商前混淆机密信息"'),
]

# 1e. 下拉选项中的 label（子菜单选项）
S_OPTION_LABELS = [
    ('label: "Minimal"', 'label: "极简"'),
    ('label: "Compact"', 'label: "紧凑"'),
    ('label: "Full"', 'label: "完整"'),
    ('label: "Custom"', 'label: "自定义"'),
    ('label: "Powerline"', 'label: "Powerline"'),
    ('label: "Thin chevron"', 'label: "细箭头"'),
    ('label: "Slash"', 'label: "斜线"'),
    ('label: "Pipe"', 'label: "竖线"'),
    ('label: "Block"', 'label: "方块"'),
    ('label: "ASCII"', 'label: "ASCII"'),
    ('label: "Classic"', 'label: "经典"'),
    ('label: "KITT Scanner"', 'label: "KITT 扫描"'),
    ('label: "Friendly"', 'label: "友好"'),
    ('label: "Pragmatic"', 'label: "务实"'),
    ('label: "Flex"', 'label: "弹性"'),
    ('label: "Scale"', 'label: "扩展"'),
    ('label: "Priority"', 'label: "优先"'),
    ('label: "Priority (OpenAI only)"', 'label: "优先 (仅 OpenAI)"'),
    ('label: "Priority (Claude only)"', 'label: "优先 (仅 Claude)"'),
    ('label: "Both"', 'label: "两者"'),
    ('label: "OpenAI only"', 'label: "仅 OpenAI"'),
    ('label: "Claude only"', 'label: "仅 Claude"'),
    ('label: "Context-full"', 'label: "上下文完整"'),
    ('label: "Handoff"', 'label: "交接"'),
    ('label: "Shake"', 'label: "抖动"'),
    ('label: "Snapcompact"', 'label: "快照压缩"'),
    ('label: "Cooldown expiry"', 'label: "冷却到期"'),
    ('label: "Never"', 'label: "永不"'),
    ('label: "Prompt"', 'label: "提示"'),
    ('label: "Reset"', 'label: "重置"'),
    ('label: "Compact"', 'label: "压缩"'),
    ('label: "AGENTS.md"', 'label: "AGENTS.md"'),
    ('label: "All"', 'label: "全部"'),
    ('label: "Native"', 'label: "原生"'),
    ('label: "Notify"', 'label: "通知"'),
    ('label: "Mnemopi"', 'label: "Mnemopi"'),
    ('label: "Hindsight"', 'label: "Hindsight"'),
    ('label: "1 reminder"', 'label: "1 次"'),
    ('label: "2 reminders"', 'label: "2 次"'),
    ('label: "3 reminders"', 'label: "3 次"'),
    ('label: "5 reminders"', 'label: "5 次"'),
    ('label: "Preferred"', 'label: "推荐"'),
    ('label: "Always"', 'label: "始终"'),
    ('label: "Instant"', 'label: "立即"'),
    ('label: "5 seconds"', 'label: "5 秒"'),
    ('label: "10 seconds"', 'label: "10 秒"'),
    ('label: "30 seconds"', 'label: "30 秒"'),
    ('label: "1 minute"', 'label: "1 分钟"'),
    ('label: "5 minutes"', 'label: "5 分钟"'),
    ('label: "Smart"', 'label: "智能"'),
    ('label: "No limit"', 'label: "无限制"'),
    ('label: "60 seconds"', 'label: "60 秒"'),
    ('label: "120 seconds"', 'label: "120 秒"'),
    ('label: "10 minutes"', 'label: "10 分钟"'),
    ('label: "Production Only"', 'label: "仅生产环境"'),
    ('label: "Sandbox Only"', 'label: "仅沙箱"'),
    ('label: "Patch"', 'label: "补丁"'),
    ('label: "Branch"', 'label: "分支"'),
    ('label: "Generic"', 'label: "通用"'),
    ('label: "AI"', 'label: "AI"'),
    ('label: "Unlimited"', 'label: "无限制"'),
    ('label: "Single"', 'label: "单层"'),
    ('label: "Double"', 'label: "双层"'),
    ('label: "Triple"', 'label: "三层"'),
    ('label: "15 minutes"', 'label: "15 分钟"'),
    ('label: "30 minutes"', 'label: "30 分钟"'),
    ('label: "1 hour"', 'label: "1 小时"'),
    ('label: "All (messages + thinking)"', 'label: "全部（消息 + 思考）"'),
    ('label: "Assistant messages"', 'label: "仅助手消息"'),
    ('label: "Final message only"', 'label: "仅最终消息"'),
    ('label: "Standard"', 'label: "标准"'),
    ('label: "OpenAI"', 'label: "OpenAI"'),
    ('label: "Antigravity"', 'label: "Antigravity"'),
    ('label: "xAI Grok Imagine"', 'label: "xAI Grok Imagine"'),
    ('label: "Gemini"', 'label: "Gemini"'),
    ('label: "OpenRouter"', 'label: "OpenRouter"'),
    ('label: "Local"', 'label: "本地"'),
    ('label: "xAI Grok Voice"', 'label: "xAI Grok Voice"'),
]

S_OPTION_DESCRIPTIONS = [
    ('description: "Model, path, git, context, tokens, cost"', 'description: "模型、路径、Git、上下文、Token、费用"'),
    ('description: "Path and git only"', 'description: "仅路径和 Git"'),
    ('description: "Model, git, cost, context"', 'description: "模型、Git、费用、上下文"'),
    ('description: "All segments including time"', 'description: "所有段（含时间）"'),
    ('description: "Maximum info with Nerd Font icons"', 'description: "最大信息量（Nerd Font 图标）"'),
    ('description: "No special characters"', 'description: "无特殊字符"'),
    ('description: "User-defined segments"', 'description: "用户自定义"'),
    ('description: "Solid arrows (Nerd Font)"', 'description: "实心箭头 (Nerd Font)"'),
    ('description: "Thin arrows (Nerd Font)"', 'description: "细箭头 (Nerd Font)"'),
    ('description: "Forward slashes"', 'description: "正斜杠"'),
    ('description: "Vertical pipes"', 'description: "竖线"'),
    ('description: "Solid blocks"', 'description: "实心方块"'),
    ('description: "Greater-than signs"', 'description: "大于号"'),
    ('description: "Soft cosine wave sweeping across the text"', 'description: "余弦波动画"'),
    ('description: "Knight Rider 1982 red light bouncing left-right"', 'description: "Knight Rider 扫描灯"'),
    ('description: "Terse, evidence-first engineer; dense, action-oriented replies"',
     'description: "简洁、证据优先的工程师风格"'),
    ('description: "Warm, encouraging collaborator focused on momentum and morale"',
     'description: "温暖、鼓励的协作风格"'),
    ('description: "Direct, efficient engineer focused on clarity and rigor"',
     'description: "直接、高效的工程师风格"'),
]


# ──────────── 2. welcome.ts ────────────
W = os.path.join(CODING_AGENT_SRC, "modes", "components", "welcome.ts")
W_STRINGS = [
    ('" for keyboard shortcuts"', '" 查看快捷键"'),
    ('" for prompt actions"', '" 执行提示操作"'),
    ('" for commands"', '" 查看命令"'),
    ('" to run bash"', '" 运行 bash"'),
    ('" to run python"', '" 运行 python"'),
    ('"No LSP servers"', '"无 LSP 服务器"'),
    ('"Please use nerdfont 😭."', '"请使用 Nerd Font 😭。"'),
]


# ──────────── 3. builtin-registry.ts ────────────
B = os.path.join(CODING_AGENT_SRC, "slash-commands", "builtin-registry.ts")
B_STRINGS = [
    ('"Open provider setup"', '"Open provider setup / 打开提供商设置"'),
    ('"Configure sign-in and web search providers"', '"配置登录和网络搜索提供商"'),
    ('"Toggle loop mode. While enabled, the next prompt you send re-submits after every yield..."',
     '"Toggle loop mode / 切换循环模式"'),
    ('"Toggle priority service tier..."', '"Toggle priority tier / 切换优先服务等级"'),
    ('"Toggle the advisor..."', '"Toggle advisor / 切换顾问"'),
    ('"Copy the advisor\'s transcript to clipboard"', '"Copy advisor transcript / 复制顾问记录"'),
    ('"Export session to HTML file"', '"Export to HTML / 导出为 HTML"'),
    ('"Copy session transcript to clipboard..."', '"Copy transcript / 复制会话记录"'),
    ('"Share session via an encrypted link..."', '"Share via link / 通过加密链接分享"'),
    ('"Share this session live via a relay"', '"Collab share / 实时协作分享"'),
    ('"disabled in settings"', '"设置中已禁用"'),
    ('"plan mode inactive"', '"计划模式未激活"'),
    ('"on (OpenAI only)"', '"开启 (仅 OpenAI)"'),
    ('"on (Claude only)"', '"开启 (仅 Claude)"'),
    ('"No Codex accounts found. Use /login to add one."', '"未找到 Codex 账号。使用 /login 添加。"'),
    ('"Saved Codex rate-limit resets:"', '"已保存的 Codex 速率限制重置："'),
    ('"Watch from another terminal:"', '"从另一终端观看："'),
    ('"Join from another terminal:"', '"从另一终端加入："'),
    ('"or any web browser:"', '"或在任意浏览器中："'),
    ('"Re-open the plan review for the latest plan (plan mode only)"',
     '"重新打开最近计划的审查（仅计划模式）"'),
    ('"Toggle loop mode. While enabled, the next prompt you send re-submits after every yield. Esc cancels the current iteration; /loop again to disable."',
     '"切换循环模式 / Toggle loop mode"'),
    ('"Switch model for this session"', '"为当前会话切换模型"'),
    ('"Switch model for this session (same as alt+p)"', '"切换模型（同 alt+p）"'),
    ('"Toggle priority service tier (OpenAI service_tier=priority, Anthropic speed=fast)"',
     '"切换优先服务等级 / Toggle priority tier"'),
    ('"Toggle the advisor (a second model that reviews each turn and injects notes)"',
     '"切换顾问（第二模型审查每轮对话）/ Toggle advisor"'),
    ('"Share session via an encrypted link (secret gist or share server)"',
     '"通过加密链接分享会话 / Share via link"'),
    ('"Join a shared collab session"', '"加入一个协作会话"'),
    ('"Leave the collab session"', '"离开协作会话"'),
    ('"Toggle browser headless vs visible mode"', '"切换浏览器无头/可见模式"'),
    ('"Pick text or code from the conversation to copy"', '"选择要复制的对话文本或代码"'),
    ('"View or modify the agent\'s todo list"', '"查看或修改待办列表"'),
    ('"Session management commands"', '"会话管理命令"'),
    ('"Launch the local stats dashboard"', '"启动本地统计面板"'),
    ('"Interview and refine a goal before enabling goal mode"', '"在启用目标模式前访谈和优化目标"'),
    ('"Show estimated context usage breakdown"', '"显示估计的上下文用量明细"'),
    ('"Open Extension Control Center dashboard"', '"打开扩展控制中心"'),
    ('"Open Agent Control Center dashboard"', '"打开代理控制中心"'),
    ('"Create a new branch from a previous message"', '"从历史消息创建新分支"'),
    ('"Create a new fork from a previous message"', '"从历史消息创建新分支（fork）"'),
    ('"Navigate session tree (switch branches)"', '"导航会话树（切换分支）"'),
    ('"Login with OAuth provider"', '"使用 OAuth 提供商登录"'),
    ('"Logout from OAuth provider"', '"登出 OAuth 提供商"'),
    ('"Manage MCP servers (add, list, remove, test)"', '"管理 MCP 服务器（添加、列出、移除、测试）"'),
    ('"Manage SSH hosts (add, list, remove)"', '"管理 SSH 主机（添加、列出、移除）"'),
    ('"Start a new session"', '"开始新会话"'),
    ('"Reset provider stream state without changing the local transcript"', '"重置提供商流状态（不改变本地对话记录）"'),
    ('"Delete the current session and start a new one"', '"删除当前会话并开始新会话"'),
    ('"Manually compact the session context"', '"手动压缩会话上下文"'),
    ('"Set or replace the goal"', '"设置或替换目标"'),
    ('"Show current goal details"', '"显示当前目标详情"'),
    ('"Pause the current goal"', '"暂停当前目标"'),
    ('"Resume a paused goal"', '"恢复已暂停的目标"'),
    ('"Drop the current goal"', '"放弃当前目标"'),
    ('"Adjust the token budget"', '"调整 Token 预算"'),
    ('"Enable fast mode"', '"启用快速模式"'),
    ('"Disable fast mode"', '"禁用快速模式"'),
    ('"Show fast mode status"', '"显示快速模式状态"'),
    ('"Enable the advisor"', '"启用顾问"'),
    ('"Disable the advisor"', '"禁用顾问"'),
    ('"Show advisor status"', '"显示顾问状态"'),
    ('"Share a read-only link (guests can watch, not prompt)"', '"分享只读链接（客人可观看，不可提示）"'),
    ('"Show link + participants"', '"显示链接和参与者"'),
    ('"Stop sharing"', '"停止分享"'),
    ('"Switch to headless mode"', '"切换到无头模式"'),
    ('"Switch to visible mode"', '"切换到可见模式"'),
    ('"Delete current session and return to selector"', '"删除当前会话并返回选择器"'),
    ('"Add a new MCP server"', '"添加新 MCP 服务器"'),
    ('"List all configured MCP servers"', '"列出所有配置的 MCP 服务器"'),
    ('"Remove an MCP server"', '"移除 MCP 服务器"'),
    ('"Test connection to a server"', '"测试与服务器的连接"'),
    ('"Reauthorize OAuth for a server"', '"重新授权服务器的 OAuth"'),
    ('"Remove OAuth auth from a server"', '"移除服务器的 OAuth 授权"'),
    ('"Enable an MCP server"', '"启用 MCP 服务器"'),
    ('"Disable an MCP server"', '"禁用 MCP 服务器"'),
    ('"Search Smithery registry and deploy an MCP server"', '"搜索 Smithery 注册表并部署 MCP 服务器"'),
    ('"Login to Smithery and cache API key"', '"登录 Smithery 并缓存 API 密钥"'),
    ('"Remove cached Smithery API key"', '"移除缓存的 Smithery API 密钥"'),
    ('"Reconnect to a specific MCP server"', '"重新连接到指定 MCP 服务器"'),
    ('"Force reload MCP runtime tools"', '"强制重载 MCP 运行时工具"'),
    ('"List available resources from connected servers"', '"列出已连接服务器的可用资源"'),
    ('"List available prompts from connected servers"', '"列出已连接服务器的可用提示"'),
    ('"Show notification capabilities and subscriptions"', '"显示通知能力和订阅"'),
    ('"Show help message"', '"显示帮助信息"'),
    ('"Add an SSH host"', '"添加 SSH 主机"'),
    ('"List all configured SSH hosts"', '"列出所有配置的 SSH 主机"'),
    ('"Remove an SSH host"', '"移除 SSH 主机"'),
    ('"Open todos in $EDITOR (Markdown round-trip)"', '"在编辑器中打开待办（Markdown 往返）"'),
    ('"Copy todos as Markdown to clipboard"', '"将待办作为 Markdown 复制到剪贴板"'),
    ('"Write todos as Markdown to a file (default: TODO.md)"', '"将待办写入 Markdown 文件（默认：TODO.md）"'),
    ('"Replace todos from a Markdown file (default: TODO.md)"', '"从 Markdown 文件替换待办（默认：TODO.md）"'),
    ('"Append a task; phase fuzzy-matched or auto-created"', '"追加任务；阶段模糊匹配或自动创建"'),
    ('"Mark task in_progress (fuzzy-matched)"', '"标记任务进行中（模糊匹配）"'),
    ('"Mark task/phase/all completed (fuzzy-matched)"', '"标记任务/阶段/全部完成（模糊匹配）"'),
    ('"Mark task/phase/all abandoned (fuzzy-matched)"', '"标记任务/阶段/全部放弃（模糊匹配）"'),
    ('"Remove task/phase/all (fuzzy-matched)"', '"移除任务/阶段/全部（模糊匹配）"'),
]


# ──────────── 5. debug/index.ts ────────────
D = os.path.join(CODING_AGENT_SRC, "debug", "index.ts")
D_STRINGS = [
    ('label: "Profile: work scheduling"', 'label: "分析：工作调度"'),
    ('label: "Report: dump session"', 'label: "报告：转储会话"'),
    ('label: "Report: memory issue"', 'label: "报告：内存问题"'),
    ('label: "Test: terminal protocols"', 'label: "测试：终端协议"'),
    ('label: "View: raw SSE stream"', 'label: "查看：原始 SSE 流"'),
    ('label: "Start: JS remote debugger"', 'label: "启动：JS 远程调试器"'),
    ('label: "Export: TUI transcript"', 'label: "导出：TUI 对话记录"'),
    ('description: "Open session artifacts in file manager"', 'description: "在文件管理器中打开会话产物"'),
    ('description: "Profile CPU, reproduce, then bundle"', 'description: "分析 CPU、复现、打包"'),
    ('description: "Open flamegraph of last 30s"', 'description: "打开最近 30 秒火焰图"'),
    ('description: "Create report bundle immediately"', 'description: "立即创建报告包"'),
    ('description: "Heap snapshot + bundle"', 'description: "堆快照 + 打包"'),
    ('description: "Show last 50 log entries"', 'description: "显示最近 50 条日志"'),
    ('description: "Show environment details"', 'description: "显示环境详情"'),
    ('description: "Remove old session artifacts"', 'description: "移除旧的会话产物"'),
]


# ──────────── 6. keybindings.ts ────────────
K = os.path.join(TUI_SRC, "keybindings.ts")
K_STRINGS = [
    ('description: "Move cursor word left"', 'description: "向左移动一个词"'),
    ('description: "Move cursor word right"', 'description: "向右移动一个词"'),
    ('description: "Move to line start"', 'description: "移动到行首"'),
    ('description: "Move to line end"', 'description: "移动到行尾"'),
    ('description: "Jump forward to character"', 'description: "向前跳转到字符"'),
    ('description: "Jump backward to character"', 'description: "向后跳转到字符"'),
    ('description: "Page up"', 'description: "上翻页"'),
    ('description: "Page down"', 'description: "下翻页"'),
    ('description: "Delete character backward"', 'description: "向后删除字符"'),
    ('description: "Delete character forward"', 'description: "向前删除字符"'),
    ('description: "Delete word backward"', 'description: "向后删除词"'),
    ('description: "Delete word forward"', 'description: "向前删除词"'),
    ('description: "Delete to line start"', 'description: "删除到行首"'),
    ('description: "Delete to line end"', 'description: "删除到行尾"'),
    ('description: "Yank"', 'description: "粘贴"'),
    ('description: "Yank pop"', 'description: "循环粘贴"'),
    ('description: "Insert newline"', 'description: "插入换行"'),
    ('description: "Tab / autocomplete"', 'description: "Tab / 自动补全"'),
    ('description: "Move selection up"', 'description: "上移选择"'),
    ('description: "Move selection down"', 'description: "下移选择"'),
    ('description: "Selection page up"', 'description: "选择区上翻页"'),
    ('description: "Selection page down"', 'description: "选择区下翻页"'),
    ('description: "Confirm selection"', 'description: "确认选择"'),
    ('description: "Cancel selection"', 'description: "取消选择"'),
]


# ──────────── 7. model-roles.ts ────────────
M = os.path.join(CODING_AGENT_SRC, "config", "model-roles.ts")
M_STRINGS = [
    ('name: "Default"', 'name: "默认"'),
    ('name: "Fast"', 'name: "快速"'),
    ('name: "Thinking"', 'name: "深度思考"'),
    ('name: "Vision"', 'name: "视觉"'),
    ('name: "Architect"', 'name: "架构师"'),
    ('name: "Designer"', 'name: "设计师"'),
    ('name: "Commit"', 'name: "提交"'),
    ('name: "Title"', 'name: "标题"'),
    ('name: "Subtask"', 'name: "子任务"'),
    ('name: "Advisor"', 'name: "顾问"'),
]


# ═══════════════════════════════════════════════════════════════════════════
# 补丁引擎
# ═══════════════════════════════════════════════════════════════════════════

def patch(fpath, old_str, new_str):
    """对单个文件执行单处替换，返回 1 表示成功，0 表示未匹配。"""
    if not os.path.exists(fpath):
        return 0
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    count = content.count(old_str)
    if count == 0:
        return 0
    content = content.replace(old_str, new_str)
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    return count


def apply_translations(file_path, groups):
    """对某个文件应用一组翻译替换，返回总替换次数。"""
    if not os.path.exists(file_path):
        return 0
    total = 0
    for old_str, new_str in groups:
        count = patch(file_path, old_str, new_str)
        if count > 0:
            total += count
    return total


def main():
    grand_total = 0

    print("=" * 60)
    print("oh-my-pi 中文翻译补丁 v2")
    print("=" * 60)

    if not os.path.exists(CODING_AGENT_SRC):
        print(f"⚠ 未找到 oh-my-pi 源码目录：{CODING_AGENT_SRC}")
        print("   请确认脚本放在 oh-my-pi 源码仓库根目录。")
        return

    grand_total += apply_translations(S, S_GROUPS)
    grand_total += apply_translations(S, S_LABELS)
    grand_total += apply_translations(S, S_OPTION_LABELS)
    grand_total += apply_translations(S, S_OPTION_DESCRIPTIONS)
    grand_total += apply_translations(S, S_DESCRIPTIONS)
    grand_total += apply_translations(S, S_TABS)
    grand_total += apply_translations(W, W_STRINGS)
    grand_total += apply_translations(B, B_STRINGS)
    grand_total += apply_translations(D, D_STRINGS)
    grand_total += apply_translations(K, K_STRINGS)
    grand_total += apply_translations(M, M_STRINGS)

    print(f"\n{'=' * 60}")
    print(f"✅ 中文翻译补丁 v2 完成！共替换 {grand_total} 处。")
    print(f"   重启 omp 即可生效。")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
