#!/usr/bin/env node

/**
 * oh-my-pi-zh — 中文翻译补丁核心数据
 *
 * 所有替换对：key = 原始英文字符串，value = 双语（英文 + 中文）字符串
 * 注意：某些 label 是 settings-schema 中的 UI 标签，
 *       某些是工具 summary/description，格式统一。
 *
 * 维护说明：
 * - 新增翻译只需在此文件中添加键值对
 * - 运行 `node patch.js` 自动应用到已安装的 omp
 * - 运行 `node unpatch.js` 恢复原始文件（通过重装 omp 实现）
 */

module.exports = {
	version: "1.0.0",
	updated: "2026-06-04",

	// ===================================================================
	// 1. 设置标签页 (TAB_METADATA)
	// ===================================================================
	tabLabels: [
		['"Appearance"', '"外观"'],
		['"Model"', '"模型"'],
		['"Interaction"', '"交互"'],
		['"Context"', '"上下文"'],
		['"Memory"', '"记忆"'],
		['"Editing"', '"编辑"'],
		['"Tools"', '"工具"'],
		['"Tasks"', '"任务"'],
		['"Providers"', '"提供商"'],
	],

	// ===================================================================
	// 2. 通用标签
	// ===================================================================
	commonLabels: [
		['"Default"', '"默认"'],
		['"Off"', '"关闭"'],
		['"On"', '"开启"'],
		['"None"', '"无"'],
		['"Auto"', '"自动"'],
		['"Custom"', '"自定义"'],
		['"Disabled"', '"禁用"'],
		['"Never"', '"从不"'],
		['"Prompt"', '"重新提交提示"'],
		['"Reset"', '"重置"'],
	],

	// ===================================================================
	// 3. 设置项 label（按 tab 分组）
	// ===================================================================
	settingLabels: [

		// ---- Appearance ----
		{ tab: "appearance", old: '"Dark Theme"', new: '"深色主题"' },
		{ tab: "appearance", old: '"Light Theme"', new: '"浅色主题"' },
		{ tab: "appearance", old: '"Symbol Preset"', new: '"图标预设"' },
		{ tab: "appearance", old: '"Color-Blind Mode"', new: '"色盲模式"' },
		{ tab: "appearance", old: '"Status Line Preset"', new: '"状态栏预设"' },
		{ tab: "appearance", old: '"Status Line Separator"', new: '"状态栏分隔符"' },
		{ tab: "appearance", old: '"Session Accent"', new: '"会话主题色"' },
		{ tab: "appearance", old: '"Show Hook Status"', new: '"显示钩子状态"' },
		{ tab: "appearance", old: '"Show Inline Images"', new: '"显示内嵌图片"' },
		{ tab: "appearance", old: '"Auto-Resize Images"', new: '"自动调整图片大小"' },
		{ tab: "appearance", old: '"Block Images"', new: '"拦截图片"' },
		{ tab: "appearance", old: '"Shimmer"', new: '"闪烁动画"' },
		{ tab: "appearance", old: '"Show Token Usage"', new: '"显示 Token 用量"' },
		{ tab: "appearance", old: '"Show Hardware Cursor"', new: '"显示硬件光标"' },
		{ tab: "appearance", old: '"Clear on Shrink"', new: '"内容收缩时清空"' },
		{ tab: "appearance", old: '"Large Headings (Kitty)"', new: '"大标题 (Kitty)"' },
		{ tab: "appearance", old: '"Terminal Hyperlinks"', new: '"终端超链接"' },
		{ tab: "appearance", old: '"Artifact spill threshold (KB)"', new: '"产物溢出阈值 (KB)"' },
		{ tab: "appearance", old: '"Artifact tail size (KB)"', new: '"产物尾部保留 (KB)"' },
		{ tab: "appearance", old: '"Artifact head size (KB)"', new: '"产物头部保留 (KB)"' },
		{ tab: "appearance", old: '"Artifact tail lines"', new: '"产物尾部行数"' },
		{ tab: "appearance", old: '"Output column cap"', new: '"输出列宽上限"' },
		{ tab: "appearance", old: '"Lock Image Ratio"', new: '"锁定图片比例"' },

		// ---- Model ----
		{ tab: "model", old: '"Thinking Level"', new: '"思考深度"' },
		{ tab: "model", old: '"Hide Thinking Blocks"', new: '"隐藏思考过程"' },
		{ tab: "model", old: '"Repeat Tool Descriptions"', new: '"重复工具描述"' },
		{ tab: "model", old: '"Temperature"', new: '"温度"' },
		{ tab: "model", old: '"Top P"', new: '"Top P"' },
		{ tab: "model", old: '"Top K"', new: '"Top K"' },
		{ tab: "model", old: '"Min P"', new: '"Min P"' },
		{ tab: "model", old: '"Presence Penalty"', new: '"存在惩罚"' },
		{ tab: "model", old: '"Repetition Penalty"', new: '"重复惩罚"' },
		{ tab: "model", old: '"Service Tier"', new: '"服务等级"' },
		{ tab: "model", old: '"Retry Attempts"', new: '"重试次数"' },
		{ tab: "model", old: '"Max Retry Delay"', new: '"最大重试延迟"' },
		{ tab: "model", old: '"Fallback Revert Policy"', new: '"回退还原策略"' },

		// ---- Interaction ----
		{ tab: "interaction", old: '"Steering Mode"', new: '"引导模式"' },
		{ tab: "interaction", old: '"Follow-Up Mode"', new: '"追问模式"' },
		{ tab: "interaction", old: '"Interrupt Mode"', new: '"中断模式"' },
		{ tab: "interaction", old: '"Loop Mode"', new: '"循环模式"' },
		{ tab: "interaction", old: '"Double-Escape Action"', new: '"双击 Esc 操作"' },
		{ tab: "interaction", old: '"Session Tree Filter"', new: '"会话树过滤器"' },
		{ tab: "interaction", old: '"Autocomplete Items"', new: '"自动补全条目数"' },
		{ tab: "interaction", old: '"Emoji Autocomplete"', new: '"Emoji 自动补全"' },
		{ tab: "interaction", old: '"Quiet Startup"', new: '"静默启动"' },
		{ tab: "interaction", old: '"Setup Wizard"', new: '"设置向导"' },
		{ tab: "interaction", old: '"Check for Updates"', new: '"检查更新"' },
		{ tab: "interaction", old: '"Collapse Changelog"', new: '"折叠更新日志"' },
		{ tab: "interaction", old: '"Completion Notification"', new: '"完成通知"' },
		{ tab: "interaction", old: '"Ask Timeout"', new: '"询问超时"' },
		{ tab: "interaction", old: '"Ask Notification"', new: '"询问通知"' },
		{ tab: "interaction", old: '"Speech-to-Text"', new: '"语音转文字"' },
		{ tab: "interaction", old: '"Speech Model"', new: '"语音模型"' },

		// ---- Context ----
		{ tab: "context", old: '"Auto-Promote Context"', new: '"自动提升上下文"' },
		{ tab: "context", old: '"Auto-Compact"', new: '"自动压缩"' },
		{ tab: "context", old: '"Compaction Strategy"', new: '"压缩策略"' },
		{ tab: "context", old: '"Compaction Threshold"', new: '"压缩阈值"' },
		{ tab: "context", old: '"Compaction Token Limit"', new: '"压缩 Token 上限"' },
		{ tab: "context", old: '"Save Handoff Docs"', new: '"保存交接文档"' },
		{ tab: "context", old: '"Remote Compaction"', new: '"远程压缩"' },
		{ tab: "context", old: '"Idle Compaction"', new: '"空闲时压缩"' },
		{ tab: "context", old: '"Idle Compaction Threshold"', new: '"空闲压缩阈值"' },
		{ tab: "context", old: '"Idle Compaction Delay"', new: '"空闲压缩延迟"' },
		{ tab: "context", old: '"Branch Summaries"', new: '"分支摘要"' },
		{ tab: "context", old: '"Memory Backend"', new: '"记忆后端"' },
		{ tab: "context", old: '"Local"', new: '"本地"' },
		{ tab: "context", old: '"Hindsight"', new: '"Hindsight"' },
		{ tab: "context", old: '"Mnemopi"', new: '"Mnemopi"' },
		{ tab: "context", old: '"Mnemopi DB Path"', new: '"Mnemopi 数据库路径"' },
		{ tab: "context", old: '"Mnemopi Bank"', new: '"Mnemopi 库"' },
		{ tab: "context", old: '"Mnemopi Scoping"', new: '"Mnemopi 作用域"' },
		{ tab: "context", old: '"Mnemopi Auto Recall"', new: '"Mnemopi 自动回忆"' },
		{ tab: "context", old: '"Mnemopi Auto Retain"', new: '"Mnemopi 自动保留"' },
		{ tab: "context", old: '"Mnemopi Embedding Model"', new: '"Mnemopi 嵌入模型"' },
		{ tab: "context", old: '"Mnemopi LLM Mode"', new: '"Mnemopi LLM 模式"' },
		{ tab: "context", old: '"Hindsight API URL"', new: '"Hindsight API URL"' },
		{ tab: "context", old: '"Hindsight Bank ID"', new: '"Hindsight 库 ID"' },
		{ tab: "context", old: '"Hindsight Auto Recall"', new: '"Hindsight 自动回忆"' },
		{ tab: "context", old: '"Hindsight Auto Retain"', new: '"Hindsight 自动保留"' },
		{ tab: "context", old: '"TTSR"', new: '"时间旅行流规则 (TTSR)"' },
		{ tab: "context", old: '"TTSR Context Mode"', new: '"TTSR 上下文模式"' },
		{ tab: "context", old: '"TTSR Repeat Mode"', new: '"TTSR 重复模式"' },
		{ tab: "context", old: '"Builtin Rules"', new: '"内置规则"' },
		{ tab: "context", old: '"Disabled Rules"', new: '"禁用规则"' },

		// ---- Editing ----
		{ tab: "editing", old: '"Edit Mode"', new: '"Edit Mode（编辑模式）"' },
		{ tab: "editing", old: '"Fuzzy Match"', new: '"Fuzzy Match（模糊匹配）"' },
		{ tab: "editing", old: '"Fuzzy Match Threshold"', new: '"Fuzzy Match Threshold（模糊匹配阈值）"' },
		{ tab: "editing", old: '"Abort on Failed Preview"', new: '"Abort on Failed Preview（预览失败中止）"' },
		{ tab: "editing", old: '"Block Auto-Generated Files"', new: '"Block Auto-Generated Files（拦截自动生成文件）"' },
		{ tab: "editing", old: '"Line Numbers"', new: '"Line Numbers（行号）"' },
		{ tab: "editing", old: '"Hash Lines"', new: '"Hash Lines（哈希行）"' },
		{ tab: "editing", old: '"Default Read Limit"', new: '"Default Read Limit（默认读取行数）"' },
		{ tab: "editing", old: '"Read Summaries"', new: '"Read Summaries（读取摘要）"' },
		{ tab: "editing", old: '"Prose Summaries"', new: '"Prose Summaries（散文摘要）"' },
		{ tab: "editing", old: '"Inline Read Previews"', new: '"Inline Read Previews（行内读取预览）"' },
		{ tab: "editing", old: '"LSP"', new: '"LSP（语言服务器协议）"' },
		{ tab: "editing", old: '"Format on Write"', new: '"Format on Write（写入时格式化）"' },
		{ tab: "editing", old: '"Diagnostics on Write"', new: '"Diagnostics on Write（写入时诊断）"' },
		{ tab: "editing", old: '"Diagnostics on Edit"', new: '"Diagnostics on Edit（编辑时诊断）"' },
		{ tab: "editing", old: '"Bash Interceptor"', new: '"Bash Interceptor（Bash 拦截器）"' },
		{ tab: "editing", old: '"Shell Minimizer"', new: '"Shell Minimizer（Shell 压缩器）"' },
		{ tab: "editing", old: '"Eval: Python backend"', new: '"Eval: Python backend（Python 后端）"' },
		{ tab: "editing", old: '"Eval: JavaScript backend"', new: '"Eval: JavaScript backend（JavaScript 后端）"' },
		{ tab: "editing", old: '"Python Kernel Mode"', new: '"Python Kernel Mode（Python 内核模式）"' },

		// ---- Tasks ----
		{ tab: "tasks", old: '"Plan Mode"', new: '"Plan Mode（计划模式）"' },
		{ tab: "tasks", old: '"Goal Mode"', new: '"Goal Mode（目标模式）"' },
		{ tab: "tasks", old: '"Isolation Mode"', new: '"Isolation Mode（隔离模式）"' },
		{ tab: "tasks", old: '"Prefer Task Delegation"', new: '"Prefer Task Delegation（优先委托任务）"' },
		{ tab: "tasks", old: '"Max Concurrent Tasks"', new: '"Max Concurrent Tasks（最大并发任务数）"' },
		{ tab: "tasks", old: '"Max Task Recursion"', new: '"Max Task Recursion（最大任务递归深度）"' },
		{ tab: "tasks", old: '"Max Subagent Runtime"', new: '"Max Subagent Runtime（最大子代理运行时间）"' },
		{ tab: "tasks", old: '"Skill Commands"', new: '"Skill Commands（技能命令）"' },
	],

	// ===================================================================
	// 4. 设置项 description
	// ===================================================================
	settingDescriptions: [
		// Appearance
		['"Theme used when terminal has dark background"', '"终端为深色背景时使用的主题"'],
		['"Theme used when terminal has light background"', '"终端为浅色背景时使用的主题"'],
		['"Icon/symbol style"', '"图标/符号样式"'],
		['"Pre-built status line configurations"', '"预置的状态栏配置"'],
		['"Style of separators between segments"', '"各段之间的分隔符样式"'],
		['"Standard symbols (default)"', '"标准符号 (默认)"'],
		['"Requires Nerd Font"', '"需要 Nerd Font"'],
		['"Use blue instead of green for diff additions"', '"差异新增用蓝色替代绿色"'],
		['"Display hook status messages below status line"', '"在状态栏下方显示钩子状态消息"'],
		['"Render images inline in terminal"', '"在终端中行内渲染图片"'],
		['"Resize large images to 2000x2000 max for better model compatibility"', '"将大图调整为最大 2000x2000 以获得更好的模型兼容性"'],
		['"Prevent images from being sent to LLM providers"', '"阻止图片发送给 LLM 提供商"'],
		['"Animation style for working/loading messages"', '"工作/加载消息的动画样式"'],
		['"No animation; static muted text"', '"无动画；静态灰显文本"'],
		['"Show per-turn token usage on assistant messages"', '"在助手消息中显示每轮 Token 用量"'],
		['"Show terminal cursor for IME support"', '"显示终端光标以支持输入法"'],
		['"Clear empty rows when content shrinks (may cause flicker)"', '"内容缩小时清除空行 (可能导致闪烁)"'],

		// Model
		['"Reasoning depth for thinking-capable models"', '"具备思考能力的模型的推理深度"'],
		['"Hide thinking blocks in assistant responses"', '"在助手响应中隐藏思考过程"'],
		['"Render full tool descriptions in the system prompt instead of a tool name list"', '"在系统提示中渲染完整工具描述而非工具名称列表"'],
		['"Sampling temperature (0 = deterministic, 1 = creative, -1 = provider default)"', '"采样温度 (0=确定性, 1=创造性, -1=提供商默认)"'],
		['"Maximum retry attempts on API errors"', '"API 错误时的最大重试次数"'],

		// Interaction
		['"Automatically resume the most recent session in the current directory"', '"自动恢复当前目录下最近的会话"'],
		['"Skip welcome screen and startup status messages"', '"跳过欢迎画面和启动状态消息"'],
		['"Max visible items in autocomplete dropdown (3-20)"', '"自动补全下拉框最大可见条目数 (3-20)"'],
		['"Suggest emojis from `:name:` shortcodes and expand text emoticons like `:D` or `:-)`"', '"通过 `:名称:` 短代码建议 Emoji，并展开 `:D` 或 `:-)` 等文本表情"'],

		// Context
		['"Automatically compact context when it gets too large"', '"上下文过大时自动压缩"'],
		['"Summarize in-place and keep the current session"', '"原地摘要并保持当前会话"'],
		['"Generate handoff and continue in a new session"', '"生成交接文档并在新会话中继续"'],
		['"Drop heavy content (tool results + large blocks) in place; recover via artifact"', '"就地丢弃重内容 (工具结果+大块)；通过产物恢复"'],
		['"Disable automatic context maintenance (same behavior as Auto-compact off)"', '"禁用自动上下文维护 (等同于关闭自动压缩)"'],

		// Editing
		['"Select the edit tool variant (replace, patch, hashline, or apply_patch)"', '"Select edit variant / 选择编辑工具变体（替换、补丁、哈希行或应用补丁）"'],
		['"Accept high-confidence fuzzy matches for whitespace differences"', '"Accept fuzzy matches / 接受高置信度的空白差异模糊匹配"'],
		['"Abort streaming edit tool calls when patch preview fails"', '"Abort on preview fail / 补丁预览失败时中止流式编辑工具调用"'],
		['"Prevent editing of files that appear to be auto-generated (protoc, sqlc, swagger, etc.)"', '"Block auto-generated / 阻止编辑看似自动生成的文件"'],
		['"Prepend line numbers to read tool output by default"', '"Show line numbers / 默认在读取工具输出前添加行号"'],
		['"Default number of lines returned when agent calls read without a limit"', '"Default read limit / 代理调用读取时未指定限制的默认返回行数"'],
		['"Return structural code summaries when read is called without an explicit selector"', '"Return code summaries / 未指定选择器时返回结构化代码摘要"'],
		['"Enable the lsp tool for language server protocol"', '"Enable LSP / 启用语言服务器协议的 lsp 工具"'],
		['"Automatically format code files using LSP after writing"', '"Auto-format on write / 写入后使用 LSP 自动格式化代码文件"'],
		['"Block shell commands that have dedicated tools"', '"Block shell with dedicated tools / 拦截有专用工具的 shell 命令"'],
		['"Allow the eval tool to dispatch to the IPython kernel"', '"Python eval backend / 允许 eval 工具调度到 IPython 内核"'],

		// Tasks
		['"Enable plan mode for read-only exploration and planning before execution"', '"Enable plan mode / 启用计划模式以在执行前进行只读探索和规划"'],
		['"Enable per-session goal mode and the hidden goal tool"', '"Enable goal mode / 启用每会话目标模式和隐藏的目标工具"'],
		['"Concurrent limit for subagents"', '"Max concurrent / 子代理的并发限制"'],
		['"How many levels deep subagents can spawn their own subagents"', '"Max recursion / 子代理可以创建自己子代理的深度"'],
	],

	// ===================================================================
	// 5. 工具 summary
	// ===================================================================
	toolSummaries: [
		['"Ask the user a clarifying question"', '"Ask user a question / 向用户提出澄清问题"'],
		['"Find files and directories matching a glob pattern"', '"Find files / 查找匹配 glob 模式的文件和目录"'],
		['"Search file contents using ripgrep (fast text search)"', '"Search file contents / 使用 ripgrep 搜索文件内容"'],
		['"Write content to a file (creates or overwrites)"', '"Write to file / 将内容写入文件（创建或覆盖）"'],
		['"Control a headless browser to navigate and interact with web pages"', '"Control headless browser / 控制无头浏览器浏览和交互网页"'],
		['"Execute Python or JavaScript code in an in-process eval backend"', '"Execute Python/JS code / 在内进程 eval 后端执行 Python 或 JavaScript 代码"'],
		['"Interact with GitHub issues, pull requests, and repositories"', '"Interact with GitHub / 与 GitHub 的 issue、PR 和仓库交互"'],
		['"Describe or analyze an image file"', '"Inspect image / 描述或分析图片文件"'],
		['"Create a git-based checkpoint to save and restore session state"', '"Create git checkpoint / 创建基于 git 的检查点以保存和恢复会话状态"'],
		['"Rewind to a previously created checkpoint"', '"Rewind to checkpoint / 回滚到之前创建的检查点"'],
		['"Perform AST-aware code edits (structural refactoring)"', '"Perform AST-aware code edits / 执行 AST 感知的代码编辑（结构化重构）"'],
		['"Search code with AST patterns (structural grep)"', '"Search code with AST patterns / 用 AST 模式搜索代码（结构化 grep）"'],
	],

	// ===================================================================
	// 6. 设置选项标签
	// ===================================================================
	optionLabels: [
		['"Minimal"', '"极简"'],
		['"Compact"', '"紧凑"'],
		['"Full"', '"完整"'],
		['"Nerd"', '"Nerd Font"'],
		['"ASCII"', '"ASCII"'],
		['"Powerline"', '"Powerline"'],
		['"Thin chevron"', '"细箭头"'],
		['"Slash"', '"斜线"'],
		['"Pipe"', '"竖线"'],
		['"Block"', '"方块"'],
		['"Space only"', '"仅空格"'],
		['"Greater-than signs"', '"大于号"'],
		['"Unicode"', '"Unicode"'],
		['"Nerd Font"', '"Nerd Font"'],
		['"Maximum compatibility"', '"最大兼容性"'],
		['"Classic"', '"经典"'],
		['"KITT Scanner"', '"KITT 扫描"'],
		['"Use provider default"', '"使用提供商默认值"'],
		['"Deterministic"', '"确定性"'],
		['"Focused"', '"聚焦"'],
		['"Creative"', '"创造性"'],
		['"Maximum variety"', '"最大多样性"'],
		['"Strict"', '"严格"'],
		['"No penalty"', '"无惩罚"'],
		['"Allow repetition"', '"允许重复"'],
		['"Context-full"', '"上下文内压缩"'],
		['"Handoff"', '"交接"'],
		['"Shake"', '"抖动清理"'],
		['"Cooldown expiry"', '"冷却到期"'],
	],

	// ===================================================================
	// 7. 选项值描述
	// ===================================================================
	optionDescriptions: [
		['"Don\'t check for plugin updates"', '"不检查插件更新"'],
		['"Check on startup and notify when updates are available"', '"启动时检查，有更新时通知"'],
		['"Check on startup and auto-install updates"', '"启动时检查并自动安装更新"'],
	],

	// ===================================================================
	// 8. 模型角色名称
	// ===================================================================
	modelRoleNames: [
		['name: "Default"', 'name: "默认"'],
		['name: "Fast"', 'name: "快速"'],
		['name: "Thinking"', 'name: "深度思考"'],
		['name: "Vision"', 'name: "视觉"'],
		['name: "Designer"', 'name: "设计师"'],
		['name: "Commit"', 'name: "提交"'],
		['name: "Subtask"', 'name: "子任务"'],
		['name: "Architect"', 'name: "架构师"'],
	],

	// ===================================================================
	// 9. 欢迎界面
	// ===================================================================
	welcomeTexts: [
		['"Welcome back!"', '"欢迎回来！"'],
		['"No recent sessions"', '"无最近的会话"'],
		['"No LSP servers"', '"无 LSP 服务器"'],
		['"Tips"', '"提示"'],
		['"for keyboard shortcuts"', '"查看键盘快捷键"'],
		['"for prompt actions"', '"查看提示操作"'],
		['"for commands"', '"查看命令"'],
		['"to run bash"', '"运行 bash"'],
		['"to run python"', '"运行 python"'],
		['"LSP Servers"', '"LSP 服务器"'],
		['"Recent sessions"', '"最近会话"'],
	],

	// ===================================================================
	// 10. 键盘绑定
	// ===================================================================
	keybindingDescriptions: [
		['"Move cursor up"', '"上移光标"'],
		['"Move cursor down"', '"下移光标"'],
		['"Move cursor left"', '"左移光标"'],
		['"Move cursor right"', '"右移光标"'],
		['"Move cursor word left"', '"向左跳词"'],
		['"Move cursor word right"', '"向右跳词"'],
		['"Move to line start"', '"移动到行首"'],
		['"Move to line end"', '"移动到行尾"'],
		['"Page up"', '"上翻页"'],
		['"Page down"', '"下翻页"'],
		['"Delete word backward"', '"向后删除单词"'],
		['"Delete word forward"', '"向前删除单词"'],
		['"Delete to line start"', '"删除到行首"'],
		['"Delete to line end"', '"删除到行尾"'],
		['"Yank"', '"粘贴"'],
		['"Undo"', '"撤销"'],
		['"Submit input"', '"提交输入"'],
		['"Tab / autocomplete"', '"Tab / 自动补全"'],
		['"Copy selection"', '"复制选中内容"'],
		['"Confirm selection"', '"确认选择"'],
		['"Cancel selection"', '"取消选择"'],
	],

	// ===================================================================
	// 11. 会话审批按钮
	// ===================================================================
	sessionApproval: [
		['"Allow once"', '"允许一次"'],
		['"Always allow"', '"始终允许"'],
		['"Reject"', '"拒绝"'],
		['"Always reject"', '"始终拒绝"'],
	],

	// ===================================================================
	// 12. ACP 模式选择器
	// ===================================================================
	acpModeLabels: [
		['"Mode"', '"模式"'],
		['"Model"', '"模型"'],
		['"Thinking"', '"思考"'],
		['"Off"', '"关闭"'],
		['"Auto"', '"自动"'],
		['"Default"', '"默认"'],
		['"Plan"', '"计划"'],
	],

	// ===================================================================
	// 13. 设置项标签 (settings-selector)
	// ===================================================================
	settingsSelectorLabels: [
		['"Settings"', '"设置"'],
		['"Plugins"', '"插件"'],
	],
};
