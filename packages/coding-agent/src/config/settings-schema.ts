import { THINKING_EFFORTS } from "@oh-my-pi/pi-ai";
import { DEFAULT_SHARE_URL } from "@oh-my-pi/pi-wire";
import { SHAPE_VARIANT_NAMES } from "@oh-my-pi/snapcompact";
import { DEFAULT_RELAY_URL } from "../collab/protocol";
import { DEFAULT_LIVE_VOICE, LIVE_VOICE_OPTIONS, LIVE_VOICE_VALUES } from "../live/voices";
import { DEFAULT_STT_MODEL_KEY, STT_MODEL_OPTIONS, STT_MODEL_VALUES } from "../stt/models";
import { STT_SUBMIT_TRIGGER_OPTIONS, STT_SUBMIT_TRIGGER_VALUES } from "../stt/submit-trigger";
import { AUTO_THINKING, getConfiguredThinkingLevelMetadata, getThinkingLevelMetadata } from "../thinking";
import {
	TINY_MODEL_DEVICE_DEFAULT,
	TINY_MODEL_DEVICE_SETTING_OPTIONS,
	TINY_MODEL_DEVICE_SETTING_VALUES,
} from "../tiny/device";
import {
	TINY_MODEL_DTYPE_DEFAULT,
	TINY_MODEL_DTYPE_SETTING_OPTIONS,
	TINY_MODEL_DTYPE_SETTING_VALUES,
} from "../tiny/dtype";
import {
	AUTO_THINKING_MODEL_OPTIONS,
	AUTO_THINKING_MODEL_VALUES,
	ONLINE_AUTO_THINKING_MODEL_KEY,
	ONLINE_MEMORY_MODEL_KEY,
	ONLINE_TINY_TITLE_MODEL_KEY,
	TINY_MEMORY_MODEL_OPTIONS,
	TINY_MEMORY_MODEL_VALUES,
	TINY_TITLE_MODEL_OPTIONS,
	TINY_TITLE_MODEL_VALUES,
} from "../tiny/models";
import { IMAGE_PROVIDER_CHOICES, type ImageProvider } from "../tools/image-providers";
import {
	DEFAULT_TTS_LOCAL_MODEL_KEY,
	DEFAULT_TTS_VOICE,
	TTS_LOCAL_MODEL_OPTIONS,
	TTS_LOCAL_MODEL_VALUES,
	TTS_LOCAL_VOICE_OPTIONS,
	TTS_LOCAL_VOICE_VALUES,
} from "../tts/models";
import { EDIT_MODES } from "../utils/edit-mode";
import { SEARCH_PROVIDER_CHOICES, type SearchProviderId } from "../web/search/types";
import {
	SERVICE_TIER_ANTHROPIC_OPTIONS,
	SERVICE_TIER_ANTHROPIC_VALUES,
	SERVICE_TIER_GOOGLE_OPTIONS,
	SERVICE_TIER_GOOGLE_VALUES,
	SERVICE_TIER_INHERIT_OPTIONS,
	SERVICE_TIER_INHERIT_SETTING_VALUES,
	SERVICE_TIER_OPENAI_OPTIONS,
	SERVICE_TIER_OPENAI_VALUES,
} from "./service-tier";

/** Unified settings schema - single source of truth for all settings.
 *
 * Each setting is defined once here with:
 * - Type and default value
 * - Optional UI metadata (label, description, tab, group)
 *
 * UI metadata places the setting in the settings panel: `tab` picks the
 * panel tab, `group` the titled section within it (registered in
 * TAB_GROUPS). Sections render in TAB_GROUPS order; settings within a
 * section keep declaration order.
 *
 * The Settings singleton provides type-safe path-based access:
 *   settings.get("compaction.enabled")  // => boolean
 *   settings.set("theme.dark", "titanium")  // sync, saves in background
 */

// ═══════════════════════════════════════════════════════════════════════════
// Schema Definition Types
// ═══════════════════════════════════════════════════════════════════════════

export type ModelRoleStorage = "global" | "project";

export type SettingTab =
	| "appearance"
	| "model"
	| "interaction"
	| "context"
	| "memory"
	| "files"
	| "shell"
	| "tools"
	| "tasks"
	| "providers";

/** Tab display metadata - icon is resolved via theme.symbol() */
export type TabMetadata = { label: string; icon: `tab.${string}` };

/** Ordered list of tabs for UI rendering */
export const SETTING_TABS: SettingTab[] = [
	"appearance",
	"model",
	"interaction",
	"context",
	"memory",
	"files",
	"shell",
	"tools",
	"tasks",
	"providers",
];

/** Tab display metadata - icon is a symbol key from theme.ts (tab.*) */
export const TAB_METADATA: Record<SettingTab, { label: string; icon: `tab.${string}` }> = {
	appearance: { label: "外观", icon: "tab.appearance" },
	model: { label: "模型", icon: "tab.model" },
	interaction: { label: "交互", icon: "tab.interaction" },
	context: { label: "上下文", icon: "tab.context" },
	memory: { label: "记忆", icon: "tab.memory" },
	files: { label: "文件", icon: "tab.files" },
	shell: { label: "Shell", icon: "tab.shell" },
	tools: { label: "工具", icon: "tab.tools" },
	tasks: { label: "任务", icon: "tab.tasks" },
	providers: { label: "提供商", icon: "tab.providers" },
};

/**
 * Ordered section groups per tab. Settings declare their section via `ui.group`;
 * the settings UI renders groups in this order with a heading row between them.
 * Ungrouped settings render first, before any section heading.
 */
export const TAB_GROUPS: Record<SettingTab, readonly string[]> = {
	appearance: ["主题", "状态栏", "显示", "图片"],
	model: ["思考", "采样", "提示", "重试与回退", "顾问", "预检", "视觉"],
	interaction: [
		"输入",
		"审批",
		"通知",
		"语音",
		"协作",
		"魔法关键词",
		"启动与更新",
		"电源 (macOS)",
		"代理",
		"Git",
	],
	context: ["通用", "压缩", "规则 (TTSR)", "实验性"],
	memory: ["通用", "自动学习", "Mnemopi", "Hindsight"],
	files: ["编辑", "阅读", "读取摘要", "LSP"],
	shell: ["Bash", "评估与运行时"],
	tools: [
		"可用工具",
		"待办",
		"搜索与浏览器",
		"Computer",
		"GitHub",
		"输出限制",
		"执行",
		"发现与 MCP",
		"开发者",
	],
	tasks: ["模式", "子代理", "隔离", "命令与技能"],
	providers: ["服务", "Fireworks", "微型模型", "协议", "超时", "隐私"],
};

/** Status line segment identifiers */
export type StatusLineSegmentId =
	| "pi"
	| "model"
	| "mode"
	| "path"
	| "git"
	| "pr"
	| "subagents"
	| "token_in"
	| "token_out"
	| "token_total"
	| "token_rate"
	| "cost"
	| "context_pct"
	| "context_total"
	| "time_spent"
	| "time"
	| "session"
	| "hostname"
	| "cache_read"
	| "cache_write"
	| "cache_hit"
	| "session_name"
	| "usage"
	| "collab";

/** Submenu choice metadata. */
export type SubmenuOption<V extends string = string> = {
	value: V;
	label: string;
	description?: string;
};

interface UiBase {
	tab: SettingTab;
	/** Section within the tab; must be listed in TAB_GROUPS[tab]. Ungrouped settings render at the top. */
	group?: string;
	label: string;
	description: string;
	/** Condition function name - setting only shown when true */
	condition?: string;
}

interface UiBoolean extends UiBase {}

interface UiEnum<T extends readonly string[]> extends UiBase {
	/** Submenu options. When omitted, the enum renders as an inline toggle derived from `values`. */
	options?: ReadonlyArray<SubmenuOption<T[number]>>;
}

interface UiNumber extends UiBase {
	/** Submenu options. Without options, a numeric setting has no UI representation (intentional hide). */
	options?: ReadonlyArray<SubmenuOption>;
}

interface UiString extends UiBase {
	/** Mask the value in both the settings row and text editor. */
	secret?: boolean;
	/**
	 * Submenu options.
	 *  - Array  → submenu with these choices.
	 *  - "runtime" → submenu populated by the runtime layer (theme registry, etc.).
	 *  - Omitted → renders as a free text input.
	 */
	options?: ReadonlyArray<SubmenuOption> | "runtime";
}

interface UiArray extends UiBase {
	/** Membership choices. Without options, an array setting has no UI representation (config-file only). */
	options?: ReadonlyArray<SubmenuOption>;
	/** Selection order is meaningful; the editor renders positions and supports reordering. */
	ordered?: boolean;
}

/** Wide ui shape exposed to consumers that walk the schema generically. */
export type AnyUiMetadata = UiBase & {
	options?: ReadonlyArray<SubmenuOption> | "runtime";
	secret?: boolean;
	ordered?: boolean;
};

/**
 * Marks a setting whose value is a credential.
 *
 * Lives at the top level rather than inside `ui` so it can also describe a
 * setting the settings panel never shows and therefore cannot carry
 * `ui.secret`. Read it through `isCredential`, which is the single accessor
 * both the CLI and the settings panel consult.
 */
interface CredentialMarker {
	credential?: true;
}

interface BooleanDef extends CredentialMarker {
	type: "boolean";
	default: boolean | undefined;
	ui?: UiBoolean;
}

interface StringDef extends CredentialMarker {
	type: "string";
	default: string | undefined;
	ui?: UiString;
}

interface NumberDef extends CredentialMarker {
	type: "number";
	default: number | undefined;
	ui?: UiNumber;
}

interface EnumDef<T extends readonly string[]> extends CredentialMarker {
	type: "enum";
	values: T;
	default: T[number];
	ui?: UiEnum<T>;
}

interface ArrayDef<T> extends CredentialMarker {
	type: "array";
	default: T[];
	ui?: UiArray;
}

interface RecordDef<T> extends CredentialMarker {
	type: "record";
	default: Record<string, T>;
	ui?: UiBase;
}

type SettingDef =
	| BooleanDef
	| StringDef
	| NumberDef
	| EnumDef<readonly string[]>
	| ArrayDef<unknown>
	| RecordDef<unknown>;

// ═══════════════════════════════════════════════════════════════════════════
// Schema Definition
// ═══════════════════════════════════════════════════════════════════════════

export interface ModelTagDef {
	name: string;
	color?: string;
	/** If true, the role is functional but not shown in the model selector UI. */
	hidden?: boolean;
}

export interface ModelTagsSettings {
	[key: string]: ModelTagDef;
}

// Typed defaults for array/record settings — named constants avoid `as` casts
// under `as const` while still letting SettingValue infer the correct element type.
const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_STRING_RECORD: Record<string, string> = {};
const EMPTY_NUMBER_RECORD: Record<string, number> = {};
const DEFAULT_CYCLE_ORDER: string[] = ["smol", "default", "slow"];
const DEFAULT_TOOL_CALL_LOOP_EXEMPT_TOOLS: string[] = ["hub"];
const EMPTY_MODEL_TAGS_RECORD: ModelTagsSettings = {};
const HINDSIGHT_RECALL_TYPES_DEFAULT: string[] = ["world", "experience"];
export const DEFAULT_BASH_INTERCEPTOR_RULES: BashInterceptorRule[] = [
	{
		pattern: "^\\s*(cat|head|tail|less|more)\\s+",
		tool: "read",
		message: "Use the `read` tool instead of cat/head/tail. It provides better context and handles binary files.",
	},
	{
		pattern: "^\\s*(grep|rg|ripgrep|ag|ack)\\s+",
		tool: "grep",
		message: "Use the `grep` tool instead of grep/rg. It respects .gitignore and provides structured output.",
	},
	{
		pattern: "^\\s*(find|fd|locate)\\s+.*(-name|-iname|-type|--type|-glob)",
		tool: "glob",
		message: "Use the `glob` tool instead of find/fd. It respects .gitignore and is faster for glob patterns.",
	},
	{
		pattern: "^\\s*sed\\s+(-i|--in-place)",
		tool: "edit",
		message: "Use the `edit` tool instead of sed -i. It provides diff preview and fuzzy matching.",
	},
	{
		pattern: "^\\s*perl\\s+.*-[pn]?i",
		tool: "edit",
		message: "Use the `edit` tool instead of perl -i. It provides diff preview and fuzzy matching.",
	},
	{
		pattern: "^\\s*awk\\s+.*-i\\s+inplace",
		tool: "edit",
		message: "Use the `edit` tool instead of awk -i inplace. It provides diff preview and fuzzy matching.",
	},
	{
		// `>` must sit outside quoted regions (so `echo "a -> b"` passes) and be
		// followed by a plausible filename — including `$VAR` targets; `>|`
		// (clobber) counts as a redirect; `>&2`/`2>&1` style fd duplication is
		// not matched. Allowed device sinks are consumed while looking for later
		// real file redirects because the write tool cannot replace shell
		// output/discard targets.
		pattern:
			"^\\s*(echo|printf|cat\\s*<<)\\s+(?:(?:[^\"'>]|\"[^\"]*\"|'[^']*')|(?<!\\|)>{1,2}\\|?\\s*(?:\"/dev/(?:null|tty|stdout|stderr)\"|'/dev/(?:null|tty|stdout|stderr)'|/dev/(?:null|tty|stdout|stderr))(?:[\\s;&|]|$))*(?<!\\|)>{1,2}\\|?\\s*(?!(?:\"/dev/(?:null|tty|stdout|stderr)\"|'/dev/(?:null|tty|stdout|stderr)'|/dev/(?:null|tty|stdout|stderr))(?:[\\s;&|]|$))[$\\w./~\"'-]",
		tool: "write",
		message: "Use the `write` tool instead of echo/cat redirection. It handles encoding and provides confirmation.",
	},
	{
		pattern: "^\\s*nohup\\s+|(?<!&)\\&\\s*$",
		tool: "hub",
		message:
			'Use the `hub` tool (`op:"start"`) instead of nohup or background shell syntax so the process stays observable and managed.',
	},
	{
		pattern:
			"^\\s*(?:(?:bun|npm|pnpm|yarn)\\s+(?:run\\s+)?(?:dev|start)(?:\\s|$)|(?:vite|next\\s+dev|nuxt\\s+dev|nodemon|lldb|gdb|tail\\s+-f)(?:\\s|$)|docker\\s+compose\\s+up(?!.*(?:\\s-d(?:\\s|$)|--detach))(?:\\s|$))",
		tool: "hub",
		message:
			'Use the `hub` tool (`op:"start"`) for services, watchers, and debuggers so other omp instances can observe and control them.',
	},
	{
		pattern:
			"^\\s*(?:(?:bun|npm|pnpm|yarn)\\s+(?:run\\s+)?\\S+|cargo\\s+watch|watchexec|pytest|vitest|jest|tsc)(?:.|\\n)*(?:--watch|-w)(?:\\s|$)",
		tool: "hub",
		message: 'Use the `hub` tool (`op:"start"`) for watch mode so its output, input, and lifecycle stay managed.',
	},
];

export const SETTINGS_SCHEMA = {
	// ────────────────────────────────────────────────────────────────────────
	// General settings (no UI)
	// ────────────────────────────────────────────────────────────────────────
	setupVersion: { type: "number", default: 0 },

	// Auth broker — credentials proxied through a remote `omp auth-broker serve`
	// host. Hidden from the UI; populate via env vars or hand-edited config.yml.
	// Env (`OMP_AUTH_BROKER_URL` / `OMP_AUTH_BROKER_TOKEN`) takes precedence so
	// per-machine overrides remain trivial.
	"auth.broker.url": { type: "string", default: undefined },
	"auth.broker.token": { type: "string", default: undefined, credential: true },

	autoResume: {
		type: "boolean",
		default: false,
		ui: {
			tab: "interaction",
			group: "启动与更新",
			label: "自动恢复",
			description: "自动恢复当前目录中的最近会话",
		},
	},

	// macOS power assertions (caffeinate flags). No-op on other platforms.
	"power.sleepPrevention": {
		type: "enum",
		values: ["off", "idle", "display", "system"] as const,
		default: "idle",
		ui: {
			tab: "interaction",
			group: "电源 (macOS)",
			label: "睡眠防止",
			description:
				"Prevent macOS sleep during active sessions. Each level is cumulative — it adds the flags of all lower levels. — 防止 macOS 在活动会话期间休眠；每个级别是累积的，会叠加所有更低级别的标志。",
			options: [
				{
					value: "off",
					label: "关闭",
					description: "不阻止任何睡眠",
				},
				{
					value: "idle",
					label: "防止空闲睡眠",
					description: "会话打开时保持系统唤醒 (caffeinate -i)",
				},
				{
					value: "display",
					label: "防止显示器睡眠",
					description: "同时防止显示器空闲休眠 (caffeinate -i -d)",
				},
				{
					value: "system",
					label: "防止系统睡眠",
					description: "同时阻止交流电源下的所有系统休眠并声明用户活跃 (caffeinate -i -d -s -u)",
				},
			],
		},
	},
	"advisor.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "顾问",
			label: "启用顾问",
			description:
				"Pair a second model (assigned to the 'advisor' role) that passively reviews each turn and injects notes. — 配对第二个模型（分配给“顾问”角色），被动审查每一轮并注入笔记。",
		},
	},
	"prewalk.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "预检",
			label: "启用预检",
			description:
				"Start on the active model, then switch to a fast/cheap model (default the 'smol' role) at the first edit/write after the plan nudge's todo list exists — the strong model plans, commits the todos, and starts the implementation before handing off. Overridable per session with --prewalk / --no-prewalk. — 从活动模型开始，在计划提示的待办列表出现后的第一次编辑/写入时切换到快速/廉价模型（默认“smol”角色）；强模型负责规划、提交待办并开始实现后再交接。可通过 --prewalk / --no-prewalk 按会话覆盖。",
		},
	},
	"advisor.subagents": {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "顾问",
			label: "子代理顾问",
			description: "同时在生成的 task/eval 子代理上启用顾问。",
			condition: "advisorEnabled",
		},
	},
	"advisor.syncBacklog": {
		type: "enum",
		values: ["off", "1", "3", "5"] as const,
		default: "off",
		ui: {
			tab: "model",
			group: "顾问",
			label: "顾问同步积压",
			description:
				"Pause the main agent for up to 30 seconds if the advisor falls behind by this many turns. Off disables catch-up delays. — 若顾问落后这么多轮，则暂停主代理最多 30 秒；关闭可禁用追赶延迟。",
			condition: "advisorEnabled",
		},
	},
	"advisor.immuneTurns": {
		type: "number",
		default: 3,
		ui: {
			tab: "model",
			group: "顾问",
			label: "顾问免疫轮次",
			description:
				"After an advisor concern or blocker interrupts, route further concerns/blockers non-interruptingly for this many primary turns. — 在顾问的关注或阻塞中断后，在这么多主轮次内以非中断方式路由后续关注/阻塞。",
			options: [
				{ value: "0", label: "0 轮", description: "允许每个关注/阻塞中断。" },
				{ value: "1", label: "1 轮" },
				{ value: "2", label: "2 轮" },
				{ value: "3", label: "3 轮", description: "默认。" },
				{ value: "4", label: "4 轮" },
				{ value: "5", label: "5 轮" },
			],
			condition: "advisorEnabled",
		},
	},
	shellPath: { type: "string", default: undefined },
	"git.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "Git",
			label: "启用 Git 集成",
			description: "在 TUI 中显示 git 分支、状态和 PR 信息，并监视仓库元数据。",
		},
	},

	extensions: { type: "array", default: EMPTY_STRING_ARRAY },

	enabledModels: { type: "array", default: EMPTY_STRING_ARRAY },

	disabledProviders: { type: "array", default: EMPTY_STRING_ARRAY },

	"providers.maxInFlightRequests": {
		type: "record",
		default: EMPTY_NUMBER_RECORD,
		ui: {
			tab: "providers",
			group: "服务",
			label: "最大并发请求数",
			description:
				'Maximum concurrent LLM requests per provider id (for example "openai" or "anthropic"), shared across local OMP processes with this config root. Omitted providers are unlimited.',
		},
	},

	disabledExtensions: { type: "array", default: EMPTY_STRING_ARRAY },

	modelRoleStorage: {
		type: "enum",
		values: ["global", "project"] as const,
		default: "global",
		ui: {
			tab: "model",
			group: "提示",
			label: "模型角色存储",
			description: "模型选择器角色分配保存的位置",
			options: [
				{
					value: "global",
					label: "全局",
					description: "将角色模型保存在活动配置文件配置中（当前行为）",
				},
				{
					value: "project",
					label: "按项目",
					description: "将项目角色模型保存在 .omp/config.yml 中；缺失的项目角色使用全局默认值",
				},
			],
		},
	},

	modelRoles: { type: "record", default: EMPTY_STRING_RECORD },

	modelTags: { type: "record", default: EMPTY_MODEL_TAGS_RECORD },

	modelProviderOrder: { type: "array", default: EMPTY_STRING_ARRAY },

	cycleOrder: { type: "array", default: DEFAULT_CYCLE_ORDER },

	// ────────────────────────────────────────────────────────────────────────
	// Appearance
	// ────────────────────────────────────────────────────────────────────────

	// Theme
	"theme.dark": {
		type: "string",
		default: "titanium",
		ui: {
			tab: "appearance",
			group: "主题",
			label: "深色主题",
			description: "终端为深色背景时使用的主题",
			options: "runtime",
		},
	},

	"theme.light": {
		type: "string",
		default: "light",
		ui: {
			tab: "appearance",
			group: "主题",
			label: "浅色主题",
			description: "终端为浅色背景时使用的主题",
			options: "runtime",
		},
	},

	symbolPreset: {
		type: "enum",
		values: ["unicode", "nerd", "ascii"] as const,
		default: "unicode",
		ui: {
			tab: "appearance",
			group: "主题",
			label: "符号预设",
			description: "图标和符号的字符集（Unicode、Nerd Font 或 ASCII）",
			options: [
				{ value: "unicode", label: "Unicode", description: "标准符号（默认）" },
				{ value: "nerd", label: "Nerd Font", description: "需要 Nerd Font" },
				{ value: "ascii", label: "ASCII", description: "最大兼容性" },
			],
		},
	},

	colorBlindMode: {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "主题",
			label: "色盲模式",
			description: "使用蓝色代替绿色表示 diff 新增",
		},
	},

	// Status line
	"statusLine.preset": {
		type: "enum",
		values: ["default", "minimal", "compact", "full", "nerd", "ascii", "custom"] as const,
		default: "default",
		ui: {
			tab: "appearance",
			group: "状态栏",
			label: "状态栏预设",
			description: "预构建的状态栏配置",
			options: [
				{ value: "default", label: "默认", description: "模型、路径、Git、上下文、Token、费用" },
				{ value: "minimal", label: "极简", description: "仅路径和 Git" },
				{ value: "compact", label: "紧凑", description: "模型、Git、费用、上下文" },
				{ value: "full", label: "完整", description: "所有段（含时间）" },
				{ value: "nerd", label: "Nerd", description: "最大信息量（Nerd Font 图标）" },
				{ value: "ascii", label: "ASCII", description: "无特殊字符" },
				{ value: "custom", label: "自定义", description: "用户自定义" },
			],
		},
	},

	"statusLine.separator": {
		type: "enum",
		values: ["powerline", "powerline-thin", "slash", "pipe", "block", "none", "ascii"] as const,
		default: "powerline-thin",
		ui: {
			tab: "appearance",
			group: "状态栏",
			label: "状态栏分隔符",
			description: "各段之间分隔符的样式",
			options: [
				{ value: "powerline", label: "Powerline", description: "实心箭头 (Nerd Font)" },
				{ value: "powerline-thin", label: "细箭头", description: "细箭头 (Nerd Font)" },
				{ value: "slash", label: "斜线", description: "正斜杠" },
				{ value: "pipe", label: "竖线", description: "竖线" },
				{ value: "block", label: "方块", description: "实心方块" },
				{ value: "none", label: "无", description: "仅空格" },
				{ value: "ascii", label: "ASCII", description: "大于号" },
			],
		},
	},

	"statusLine.sessionAccent": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "状态栏",
			label: "会话强调色",
			description: "使用会话名称颜色作为编辑器边框和状态栏间隙",
		},
	},

	"statusLine.transparent": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "状态栏",
			label: "透明状态栏",
			description:
				"Use the terminal's default background for the status line instead of the theme's `statusLineBg`. Powerline end caps are dropped because they need a contrasting fill to bridge into the surrounding terminal. — 状态栏使用终端默认背景而非主题的 `statusLineBg`；Powerline 端帽被移除，因为它们需要对比填充来衔接周围终端。",
		},
	},
	"statusLine.compactThinkingLevel": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "状态栏",
			label: "紧凑思考级别",
			description:
				"Show the thinking level as a single icon on the model name instead of a separate ` · <level>` suffix. — 在模型名称上以单个图标显示思考级别，而非单独的 ` · <级别>` 后缀。",
		},
	},
	"tools.artifactSpillThreshold": {
		type: "number",
		default: 50,
		ui: {
			tab: "tools",
			group: "输出限制",
			label: "产物溢出阈值 (KB)",
			description: "超过此大小的工具输出保存为产物；尾部保持内联",
			options: [
				{ value: "1", label: "1 KB", description: "~250 tokens" },
				{ value: "2.5", label: "2.5 KB", description: "~625 tokens" },
				{ value: "5", label: "5 KB", description: "~1.25K tokens" },
				{ value: "10", label: "10 KB", description: "~2.5K tokens" },
				{ value: "20", label: "20 KB", description: "~5K tokens" },
				{ value: "30", label: "30 KB", description: "~7.5K tokens" },
				{ value: "50", label: "50 KB", description: "默认；约 12.5K tokens" },
				{ value: "75", label: "75 KB", description: "~19K tokens" },
				{ value: "100", label: "100 KB", description: "~25K tokens" },
				{ value: "200", label: "200 KB", description: "~50K tokens" },
				{ value: "500", label: "500 KB", description: "~125K tokens" },
				{ value: "1000", label: "1 MB", description: "~250K tokens" },
			],
		},
	},
	"tools.artifactTailBytes": {
		type: "number",
		default: 20,
		ui: {
			tab: "tools",
			group: "输出限制",
			label: "产物尾部大小 (KB)",
			description: "输出溢出到产物时保留的内联尾部内容量",
			options: [
				{ value: "1", label: "1 KB", description: "~250 tokens" },
				{ value: "2.5", label: "2.5 KB", description: "~625 tokens" },
				{ value: "5", label: "5 KB", description: "~1.25K tokens" },
				{ value: "10", label: "10 KB", description: "~2.5K tokens" },
				{ value: "20", label: "20 KB", description: "默认；约 5K tokens" },
				{ value: "50", label: "50 KB", description: "~12.5K tokens" },
				{ value: "100", label: "100 KB", description: "~25K tokens" },
				{ value: "200", label: "200 KB", description: "~50K tokens" },
			],
		},
	},
	"tools.artifactHeadBytes": {
		type: "number",
		default: 20,
		ui: {
			tab: "tools",
			group: "输出限制",
			label: "产物头部大小 (KB)",
			description:
				"Amount of head content kept inline alongside the tail when output spills to artifact (middle elision). 0 disables — keep tail only. — 输出溢出到产物时，与尾部一起保留的内联头部内容量（中间省略）；0 禁用——仅保留尾部。",
			options: [
				{ value: "0", label: "0 KB", description: "禁用；仅尾部截断" },
				{ value: "1", label: "1 KB", description: "~250 tokens" },
				{ value: "2.5", label: "2.5 KB", description: "~625 tokens" },
				{ value: "5", label: "5 KB", description: "~1.25K tokens" },
				{ value: "10", label: "10 KB", description: "~2.5K tokens" },
				{ value: "20", label: "20 KB", description: "默认；约 5K tokens" },
				{ value: "50", label: "50 KB", description: "~12.5K tokens" },
				{ value: "100", label: "100 KB", description: "~25K tokens" },
				{ value: "200", label: "200 KB", description: "~50K tokens" },
			],
		},
	},
	"tools.outputMaxColumns": {
		type: "number",
		default: 768,
		ui: {
			tab: "tools",
			group: "输出限制",
			label: "输出列限制",
			description:
				"Per-line byte cap for streaming tool outputs (bash, python, js eval) and `read`. Lines wider than this are ellipsis-truncated; remaining bytes up to the next newline are dropped. 0 disables. — 流式工具输出（bash、python、js eval）和 `read` 的每行字节上限；超过此宽度的行以省略号截断，到下一个换行符为止的剩余字节被丢弃；0 禁用。",
			options: [
				{ value: "0", label: "关闭", description: "无每行上限" },
				{ value: "256", label: "256", description: "紧凑" },
				{ value: "512", label: "512" },
				{ value: "768", label: "768", description: "默认" },
				{ value: "1024", label: "1024" },
				{ value: "2048", label: "2048" },
				{ value: "4096", label: "4096", description: "宽松" },
			],
		},
	},
	"tools.artifactTailLines": {
		type: "number",
		default: 500,
		ui: {
			tab: "tools",
			group: "输出限制",
			label: "产物尾部行数",
			description: "输出溢出到产物时保留的内联尾部最大行数",
			options: [
				{ value: "50", label: "50 行", description: "~250 tokens" },
				{ value: "100", label: "100 行", description: "~500 tokens" },
				{ value: "250", label: "250 行", description: "~1.25K tokens" },
				{ value: "500", label: "500 行", description: "默认；约 2.5K tokens" },
				{ value: "1000", label: "1000 行", description: "~5K tokens" },
				{ value: "2000", label: "2000 行", description: "~10K tokens" },
				{ value: "5000", label: "5000 行", description: "~25K tokens" },
			],
		},
	},

	"statusLine.showHookStatus": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "状态栏",
			label: "显示钩子状态",
			description: "在状态栏下方显示钩子状态消息",
		},
	},

	"statusLine.leftSegments": { type: "array", default: [] as StatusLineSegmentId[] },

	"statusLine.rightSegments": { type: "array", default: [] as StatusLineSegmentId[] },

	"statusLine.segmentOptions": { type: "record", default: {} as Record<string, unknown> },

	// Images and terminal
	"terminal.showImages": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "图片",
			label: "显示内联图片",
			description: "在终端内联渲染图片",
			condition: "hasImageProtocol",
		},
	},

	"images.autoResize": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "图片",
			label: "自动调整图片大小",
			description: "将大图片调整为最大 2000x2000 以获得更好的模型兼容性",
		},
	},

	"images.blockImages": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "图片",
			label: "屏蔽图片",
			description: "阻止图片发送到 LLM 提供商",
		},
	},

	"images.describeForTextModels": {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "视觉",
			label: "为文本模型描述图片",
			description:
				"When an image is attached to a model without vision support, save it under local:// and inject a description from a vision-capable model instead of dropping it. — 当图片附加到不支持视觉的模型时，将其保存到 local:// 下，并由具备视觉能力的模型注入描述，而不是丢弃它。",
		},
	},

	"tui.maxInlineImageColumns": {
		type: "number",
		default: 100,
		description:
			"Maximum width in terminal columns for inline images (default 100). Set to 0 for unlimited (bounded only by terminal width). — 内联图片的最大终端列宽（默认 100）；设为 0 表示不限（仅受终端宽度限制）。",
	},

	"tui.maxInlineImageRows": {
		type: "number",
		default: 20,
		description:
			"Maximum height in terminal rows for inline images (default 20). Set to 0 to use only the viewport-based limit (60% of terminal height). — 内联图片的最大终端行高（默认 20）；设为 0 仅使用基于视口的限制（终端高度的 60%）。",
	},

	"tui.maxInlineImages": {
		type: "number",
		default: 8,
		description:
			"Maximum number of inline images kept as live terminal graphics (default 8). Older images fall back to a text placeholder via a full redraw once the limit is exceeded. Set to 0 to keep every image (no limit). — 作为实时终端图形保留的内联图片最大数量（默认 8）；超过限制后，较旧的图片通过完全重绘回退为文本占位符；设为 0 保留所有图片（无限制）。",
	},

	"terminal.showProgress": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "原生终端进度",
			description: "Emit OSC 9;4 indeterminate progress while the agent or context maintenance is running. — 在代理或上下文维护运行时发出 OSC 9;4 不确定进度。",
		},
	},

	"tui.textSizing": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "大标题 (Kitty)",
			description:
				"Render Markdown H1 headings at 2x scale using Kitty's OSC 66 text-sizing protocol. Only takes effect on Kitty terminals; ignored everywhere else. Off by default. — 使用 Kitty 的 OSC 66 文本缩放协议以 2 倍比例渲染 Markdown H1 标题；仅对 Kitty 终端生效，其他终端忽略；默认关闭。",
		},
	},

	"tui.renderMermaid": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "渲染 Mermaid 图表",
			description: "将 Mermaid 围栏代码块渲染为 ASCII 图表",
		},
	},

	"tui.titleState": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "终端标题运行状态",
			description:
				"Show the agent run state in the terminal title's separator — an animated spinner while working (a static ':' on Windows), '>' when it's your turn, '!' when the agent is waiting on you. — 在终端标题的分隔符中显示代理运行状态：工作时为动画旋转指示器（Windows 上为静态 ':'），轮到您时为 '>'，代理等待您时为 '!'。",
		},
	},

	"tui.hyperlinks": {
		type: "enum",
		values: ["off", "auto", "always"] as const,
		default: "auto",
		ui: {
			tab: "appearance",
			group: "显示",
			label: "终端超链接",
			description:
				"Wrap paths and URLs in OSC 8 hyperlinks for terminal-native click-to-open (auto: detect support; off: never; always: unconditional). — 将路径和 URL 包装为 OSC 8 超链接以实现终端原生点击打开（auto：检测支持；off：从不；always：无条件）。",
		},
	},
	"tui.tight": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "紧凑布局",
			description: "移除终端输出左右两侧的 1 字符水平内边距",
		},
	},
	"tui.scrollbackRebuild": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "重写回滚",
			description:
				"Erase and replay terminal scrollback when a block's final form replaces its live preview. When off (default), stale preview copies remain in history and the final content is appended below. — 当块的最终形式替换其实时预览时，擦除并重放终端回滚；关闭（默认）时，过期的预览副本保留在历史中，最终内容追加在下方。",
		},
	},

	"display.shimmer": {
		type: "enum",
		values: ["classic", "kitt", "disabled"] as const,
		default: "classic",
		ui: {
			tab: "appearance",
			group: "显示",
			label: "微光动画",
			description: "工作/加载消息的动画样式",
			options: [
				{ value: "classic", label: "经典", description: "余弦波动画" },
				{ value: "kitt", label: "KITT 扫描", description: "Knight Rider 扫描灯" },
				{ value: "disabled", label: "禁用", description: "无动画；静态弱化文本" },
			],
		},
	},

	"display.smoothStreaming": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "平滑流式输出",
			description: "在数据块到达时平滑显示助手文本和流式工具输入",
		},
	},

	"display.showTokenUsage": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "显示 Token 用量",
			description: "在助手消息上显示每轮 token 用量",
		},
	},

	"display.cacheMissMarker": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "缓存未命中标记",
			description: "在请求丢失（未命中）提示缓存的助手轮次上方显示分隔线",
		},
	},

	"display.collapseCompacted": {
		type: "boolean",
		default: true,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "折叠压缩历史",
			description:
				"Collapse pre-compaction history behind the summary divider on the live transcript; disable to keep the full transcript inline with dividers at each compaction point. — 在实时记录中，将压缩前历史折叠到摘要分隔线之后；禁用则保留完整记录内联，并在每个压缩点显示分隔线。",
		},
	},

	showHardwareCursor: {
		type: "boolean",
		default: true, // will be computed based on platform if undefined
		ui: {
			tab: "appearance",
			group: "显示",
			label: "显示硬件光标",
			description: "显示终端光标以支持 IME",
		},
	},

	"tui.imeSafeCursor": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "IME 安全提示布局",
			description: "Move the prompt's bottom border to a separate row so macOS IME preedit cannot displace it. — 将提示的底部边框移到单独一行，以免 macOS IME 预编辑将其挤走。",
		},
	},

	// ────────────────────────────────────────────────────────────────────────
	// Model
	// ────────────────────────────────────────────────────────────────────────

	// Reasoning and prompts
	defaultThinkingLevel: {
		type: "enum",
		values: [...THINKING_EFFORTS, AUTO_THINKING],
		default: "high",
		ui: {
			tab: "model",
			group: "思考",
			label: "思考级别",
			description: "支持思考的模型的推理深度",
			options: [
				getConfiguredThinkingLevelMetadata(AUTO_THINKING),
				...THINKING_EFFORTS.map(getThinkingLevelMetadata),
			],
		},
	},

	hideThinkingBlock: {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "思考",
			label: "隐藏思考块",
			description: "隐藏助手响应中的思考块",
		},
	},
	proseOnlyThinking: {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "思考",
			label: "纯文本思考摘要",
			description: "从思考摘要中省略代码块并用省略号替换",
		},
	},

	omitThinking: {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "思考",
			label: "省略思考摘要",
			description:
				"Instruct upstream providers to completely omit thinking summaries from responses (where supported). — 指示上游提供商在响应中完全省略思考摘要（在支持的情况下）。",
		},
	},

	"model.loopGuard.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "思考",
			label: "循环防护",
			description: "为模型推理和正文启用自动流循环检测",
		},
	},

	"model.loopGuard.checkAssistantContent": {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "思考",
			label: "循环防护扫描正文",
			description: "将循环防护应用于助手正文消息以及思考日志",
		},
	},

	"model.loopGuard.toolCallReminder": {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "思考",
			label: "循环防护工具调用提醒",
			description:
				"When a Gemini reasoning stream emits many consecutive planning headers without calling a tool, interrupt it and inject a reminder to issue a tool call (requires Loop Guard). — 当 Gemini 推理流发出多个连续规划头而未调用工具时，中断它并注入提醒以发出工具调用（需要循环防护）。",
		},
	},

	"model.toolCallLoopGuard.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "思考",
			label: "工具调用循环防护",
			description: "检测跨轮次的连续相同工具调用并注入纠正引导",
		},
	},

	"model.toolCallLoopGuard.threshold": {
		type: "number",
		default: 5,
		ui: {
			tab: "model",
			group: "思考",
			label: "工具调用循环阈值",
			description: "注入纠正引导前所需的连续相同工具调用次数",
		},
	},

	"model.toolCallLoopGuard.exemptTools": {
		type: "array",
		default: DEFAULT_TOOL_CALL_LOOP_EXEMPT_TOOLS,
		ui: {
			tab: "model",
			group: "思考",
			label: "工具调用循环豁免工具",
			description: "可连续重复而不触发跨轮次循环防护的工具名称",
		},
	},

	inlineToolDescriptors: {
		type: "enum",
		values: ["auto", "on", "off"] as const,
		default: "auto",
		ui: {
			tab: "model",
			group: "提示",
			label: "内联工具描述",
			description:
				"Render full tool descriptors in the system prompt and strip top-level/nested descriptions from provider tool schemas so descriptor text is sent once. Auto enables this for Gemini models and disables it otherwise. — 在系统提示中渲染完整工具描述符，并从提供商工具模式中剥离顶层/嵌套描述，使描述文本只发送一次；自动模式对 Gemini 模型启用，其他情况禁用。",
			options: [
				{
					value: "auto",
					label: "自动",
					description: "为 Gemini 模型内联描述符；否则保留在工具模式中",
				},
				{ value: "on", label: "开启", description: "始终在系统提示中内联描述符" },
				{ value: "off", label: "关闭", description: "仅将描述符保留在提供商工具模式中" },
			],
		},
	},

	includeModelInPrompt: {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "提示",
			label: "在提示中包含模型名",
			description: "在系统提示中显示活动模型标识符，以便代理知道当前是哪个模型",
		},
	},

	includeWorkspaceTree: {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "提示",
			label: "包含工作区目录树",
			description:
				"Render the workspace directory tree in the system prompt. WARNING: This can bust prompt caching across sessions when files are modified. — 在系统提示中渲染工作区目录树。警告：文件被修改时，这可能会破坏跨会话的提示缓存。",
		},
	},

	"workspace.additionalDirectories": {
		type: "array",
		default: [] as string[],
		ui: {
			tab: "context",
			group: "通用",
			label: "附加工作区目录",
			description:
				"Extra workspace directories added to every session as additional roots (multi-root workspace). Managed live via /add-dir and /remove-dir. Paths resolve relative to cwd; absolute paths recommended. The agent is told these roots exist and can read/grep/glob them. — 作为附加根目录添加到每个会话的额外工作区目录（多根工作区）；通过 /add-dir 和 /remove-dir 实时管理；路径相对于 cwd 解析，建议使用绝对路径；代理被告知这些根目录存在并可读取/grep/glob。",
		},
	},

	personality: {
		type: "enum",
		values: ["default", "friendly", "pragmatic", "none"] as const,
		default: "default",
		ui: {
			tab: "model",
			group: "提示",
			label: "人格风格",
			description: "渲染到系统提示个性块中的沟通风格",
			options: [
				{
					value: "default",
					label: "默认",
					description: "简洁、证据优先的工程师风格",
				},
				{
					value: "friendly",
					label: "友好",
					description: "温暖、鼓励的协作风格",
				},
				{
					value: "pragmatic",
					label: "务实",
					description: "直接、高效的工程师风格",
				},
				{ value: "none", label: "无", description: "完全省略个性块" },
			],
		},
	},

	// Sampling
	temperature: {
		type: "number",
		default: -1,
		ui: {
			tab: "model",
			group: "采样",
			label: "温度",
			description: "采样温度（0 = 确定性，1 = 创造性，-1 = 提供商默认）",
			options: [
				{ value: "-1", label: "默认", description: "使用提供商默认" },
				{ value: "0", label: "0", description: "确定性" },
				{ value: "0.2", label: "0.2", description: "专注" },
				{ value: "0.5", label: "0.5", description: "平衡" },
				{ value: "0.7", label: "0.7", description: "创造性" },
				{ value: "1", label: "1", description: "最大多样性" },
			],
		},
	},

	topP: {
		type: "number",
		default: -1,
		ui: {
			tab: "model",
			group: "采样",
			label: "Top P",
			description: "核采样截断（0-1，-1 = 提供商默认）",
			options: [
				{ value: "-1", label: "默认", description: "使用提供商默认" },
				{ value: "0.1", label: "0.1", description: "非常专注" },
				{ value: "0.3", label: "0.3", description: "专注" },
				{ value: "0.5", label: "0.5", description: "平衡" },
				{ value: "0.9", label: "0.9", description: "广泛" },
				{ value: "1", label: "1", description: "无核过滤" },
			],
		},
	},

	topK: {
		type: "number",
		default: -1,
		ui: {
			tab: "model",
			group: "采样",
			label: "Top K",
			description: "从 top-K tokens 采样（-1 = 提供商默认）",
			options: [
				{ value: "-1", label: "默认", description: "使用提供商默认" },
				{ value: "1", label: "1", description: "贪婪顶部 token" },
				{ value: "20", label: "20", description: "专注" },
				{ value: "40", label: "40", description: "平衡" },
				{ value: "100", label: "100", description: "广泛" },
			],
		},
	},

	minP: {
		type: "number",
		default: -1,
		ui: {
			tab: "model",
			group: "采样",
			label: "Min P",
			description: "最小概率阈值（0-1，-1 = 提供商默认）",
			options: [
				{ value: "-1", label: "默认", description: "使用提供商默认" },
				{ value: "0.01", label: "0.01", description: "非常宽松" },
				{ value: "0.05", label: "0.05", description: "平衡" },
				{ value: "0.1", label: "0.1", description: "严格" },
			],
		},
	},

	presencePenalty: {
		type: "number",
		default: -1,
		ui: {
			tab: "model",
			group: "采样",
			label: "存在惩罚",
			description: "引入已存在 token 的惩罚（-1 = 提供商默认）",
			options: [
				{ value: "-1", label: "默认", description: "使用提供商默认" },
				{ value: "0", label: "0", description: "无惩罚" },
				{ value: "0.5", label: "0.5", description: "轻度新颖" },
				{ value: "1", label: "1", description: "鼓励新颖" },
				{ value: "2", label: "2", description: "强烈新颖" },
			],
		},
	},

	repetitionPenalty: {
		type: "number",
		default: -1,
		ui: {
			tab: "model",
			group: "采样",
			label: "重复惩罚",
			description: "重复 token 的惩罚（-1 = 提供商默认）",
			options: [
				{ value: "-1", label: "默认", description: "使用提供商默认" },
				{ value: "0.8", label: "0.8", description: "允许重复" },
				{ value: "1", label: "1", description: "无惩罚" },
				{ value: "1.1", label: "1.1", description: "轻度惩罚" },
				{ value: "1.2", label: "1.2", description: "平衡" },
				{ value: "1.5", label: "1.5", description: "强烈惩罚" },
			],
		},
	},

	textVerbosity: {
		type: "enum",
		values: ["low", "medium", "high"] as const,
		default: "medium",
		ui: {
			tab: "model",
			group: "采样",
			label: "文本详细度",
			description: "OpenAI Responses 和 Codex 响应详细度（低、中或高）",
			options: [
				{ value: "low", label: "低", description: "偏好简洁响应" },
				{ value: "medium", label: "中", description: "平衡简洁与详细（默认）" },
				{ value: "high", label: "高", description: "偏好详细响应" },
			],
		},
	},

	"tier.openai": {
		type: "enum",
		values: SERVICE_TIER_OPENAI_VALUES,
		default: "none",
		ui: {
			tab: "model",
			group: "采样",
			label: "服务等级 — OpenAI",
			description:
				"Processing tier for OpenAI / OpenAI-Codex requests, and OpenAI-family models routed via OpenRouter (none = omit). Sent as `service_tier`. — OpenAI / OpenAI-Codex 请求以及经 OpenRouter 路由的 OpenAI 系模型的处理等级（none = 省略）；以 `service_tier` 发送。",
			options: SERVICE_TIER_OPENAI_OPTIONS,
		},
	},

	"tier.anthropic": {
		type: "enum",
		values: SERVICE_TIER_ANTHROPIC_VALUES,
		default: "none",
		ui: {
			tab: "model",
			group: "采样",
			label: "服务等级 — Anthropic",
			description:
				'Processing tier for Claude requests. `priority` realizes fast mode (`speed: "fast"`) on supported direct Anthropic models; ignored on Bedrock/Vertex Claude and via OpenRouter.',
			options: SERVICE_TIER_ANTHROPIC_OPTIONS,
		},
	},

	"tier.google": {
		type: "enum",
		values: SERVICE_TIER_GOOGLE_VALUES,
		default: "none",
		ui: {
			tab: "model",
			group: "采样",
			label: "服务等级 — Google",
			description:
				"Processing tier for Gemini (Google AI Studio + Vertex) requests, and Google-family models routed via OpenRouter (none = omit). Sent as the top-level `serviceTier` field. — Gemini（Google AI Studio + Vertex）请求以及经 OpenRouter 路由的 Google 系模型的处理等级（none = 省略）；以顶层 `serviceTier` 字段发送。",
			options: SERVICE_TIER_GOOGLE_OPTIONS,
		},
	},

	"tier.subagent": {
		type: "enum",
		values: SERVICE_TIER_INHERIT_SETTING_VALUES,
		default: "inherit",
		ui: {
			tab: "model",
			group: "采样",
			label: "服务等级 — 子代理",
			description:
				"Service Tier for spawned task/eval subagents. Inherit = match the main agent's live per-family tiers (tracks /fast); pick a value to apply it to whichever family the subagent's model belongs to. — 生成的 task/eval 子代理的服务等级。Inherit = 匹配主代理实时的各家族等级（跟随 /fast）；选择一个值则应用于子代理模型所属的家族。",
			options: SERVICE_TIER_INHERIT_OPTIONS,
		},
	},

	"tier.advisor": {
		type: "enum",
		values: SERVICE_TIER_INHERIT_SETTING_VALUES,
		default: "none",
		ui: {
			tab: "model",
			group: "采样",
			label: "服务等级 — 顾问",
			description:
				"Service Tier for the advisor model. None = standard processing; Inherit = match the main agent's live per-family tiers; pick a value to apply it to the advisor model's family. — 顾问模型的服务等级。None = 标准处理；Inherit = 匹配主代理实时的各家族等级；选择一个值则应用于顾问模型所属的家族。",
			options: SERVICE_TIER_INHERIT_OPTIONS,
			condition: "advisorEnabled",
		},
	},

	// Retries
	"retry.enabled": { type: "boolean", default: true },

	"retry.maxRetries": {
		type: "number",
		default: 10,
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "重试次数",
			description: "API 错误时的最大重试次数",
			options: [
				{ value: "1", label: "1 次重试" },
				{ value: "2", label: "2 次重试" },
				{ value: "3", label: "3 次重试" },
				{ value: "5", label: "5 次重试" },
				{ value: "10", label: "10 次重试" },
			],
		},
	},

	"retry.baseDelayMs": { type: "number", default: 500 },
	"retry.maxDelayMs": {
		type: "number",
		default: 5 * 60 * 1000,
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "最大重试延迟",
			description:
				"Maximum wait between retries, in ms. When the provider asks us to wait longer than this and no credential or model fallback succeeds, the request fails fast instead of sleeping (e.g. 3-hour Anthropic rate-limit windows). — 重试之间的最大等待毫秒数。当提供商要求等待超过此值且没有凭据或模型回退成功时，请求快速失败而不是休眠（例如 3 小时的 Anthropic 速率限制窗口）。",
		},
	},
	"retry.modelFallback": {
		type: "boolean",
		default: true,
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "重试模型回退",
			description: "允许重试恢复切换到配置的回退模型",
		},
	},
	"retry.usageAwareFallback": {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "用量感知回退",
			description:
				"Use reliable coding-plan quota reports to prefer same-provider accounts, then configured fallback models, before a hard usage limit. Ordinary configured API keys are excluded. — 在硬性用量限制前，使用可靠的编码计划配额报告优先选择同提供商账户，然后是配置的回退模型；普通的已配置 API 密钥被排除。",
		},
	},
	"retry.usageReservePct": {
		type: "number",
		default: 10,
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "保留余量",
			description:
				"Treat a coding-plan model as near its limit below this remaining percentage. Unknown or unmapped usage keeps the primary model. — 当剩余百分比低于此值时，将编码计划模型视为接近其限制；未知或未映射的用量保持主模型。",
			condition: "usageAwareFallbackEnabled",
			options: [
				{ value: "5", label: "5%", description: "仅在几乎耗尽时行动" },
				{ value: "10", label: "10%", description: "平衡的安全余量" },
				{ value: "15", label: "15%", description: "保守" },
				{ value: "20", label: "20%", description: "早期保护" },
				{ value: "25", label: "25%", description: "非常保守" },
			],
		},
	},
	"retry.usageReservePolicy": {
		type: "enum",
		values: ["confirm", "auto", "fail-closed"] as const,
		default: "confirm",
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "保留策略",
			description: "当所有同提供商编码计划账户都在保留余量内时该怎么做。",
			condition: "usageAwareFallbackEnabled",
			options: [
				{
					value: "confirm",
					label: "交互式确认",
					description: "交互式会话保持主模型直到确认；后台代理自动回退",
				},
				{
					value: "auto",
					label: "自动回退",
					description: "始终选择下一个符合条件的已配置回退",
				},
				{
					value: "fail-closed",
					label: "失败关闭",
					description: "不消耗保留配额或选择回退",
				},
			],
		},
	},
	"retry.fallbackChains": {
		type: "record",
		default: {} as Record<string, string[]>,
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "重试回退链",
			description:
				'JSON object mapping model roles, model selectors ("provider/model-id"), or provider wildcards ("provider/*") to ordered fallback selectors, e.g. {"default":["openai/gpt-4o-mini"],"google-antigravity/*":["google/*","google-vertex/*"]}. Model-oriented keys apply whenever that model/provider is active, regardless of role; a "provider/*" entry keeps the failing model\'s id and swaps the provider. An id-prefixed wildcard ("openrouter/google/*") re-prefixes the failing model\'s bare id (google-antigravity/gemini-x -> openrouter/google/gemini-x) and, used as a key, matches only that provider\'s ids under the prefix.',
		},
	},
	"retry.fallbackRevertPolicy": {
		type: "enum",
		values: ["cooldown-expiry", "never"] as const,
		default: "cooldown-expiry",
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "回退恢复策略",
			description: "回退后何时返回主模型",
			options: [
				{
					value: "cooldown-expiry",
					label: "冷却到期",
					description: "抑制窗口结束后返回主模型",
				},
				{ value: "never", label: "永不", description: "保持回退模型直到手动更改" },
			],
		},
	},

	"providers.anthropic.serverSideFallback": {
		type: "boolean",
		default: false,
		ui: {
			tab: "model",
			group: "重试与回退",
			label: "Anthropic 服务端回退 (Fable 5)",
			description:
				"When a Claude Fable 5 / Mythos 5 request is blocked by Anthropic's safety classifier, retry it on Claude Opus 4.8 server-side (Anthropic `server-side-fallback-2026-06-01` beta). Opt-in — leaving this off preserves the pre-fallback behavior for every request. — 当 Claude Fable 5 / Mythos 5 请求被 Anthropic 的安全分类器阻止时，在 Claude Opus 4.8 服务端重试（Anthropic `server-side-fallback-2026-06-01` beta）。选择加入——保持关闭可保留每个请求的回退前行为。",
		},
	},

	// ────────────────────────────────────────────────────────────────────────
	// Interaction
	// ────────────────────────────────────────────────────────────────────────

	// Conversation flow
	steeringMode: {
		type: "enum",
		values: ["all", "one-at-a-time"] as const,
		default: "one-at-a-time",
		ui: {
			tab: "interaction",
			group: "输入",
			label: "转向模式",
			description: "代理工作时如何处理排队消息",
		},
	},

	followUpMode: {
		type: "enum",
		values: ["all", "one-at-a-time"] as const,
		default: "one-at-a-time",
		ui: {
			tab: "interaction",
			group: "输入",
			label: "跟进模式",
			description: "一轮完成后如何排空跟进消息",
		},
	},

	interruptMode: {
		type: "enum",
		values: ["immediate", "wait"] as const,
		default: "immediate",
		ui: {
			tab: "interaction",
			group: "输入",
			label: "中断模式",
			description: "转向消息何时中断工具执行",
		},
	},

	"loop.mode": {
		type: "enum",
		values: ["prompt", "compact", "reset"] as const,
		default: "prompt",
		ui: {
			tab: "interaction",
			group: "输入",
			label: "循环模式",
			description: "在重新提交提示前，/loop 迭代之间会发生什么",
			options: [
				{
					value: "prompt",
					label: "提示",
					description: "将提示作为跟进消息重新提交（当前行为）",
				},
				{
					value: "compact",
					label: "紧凑",
					description: "压缩会话上下文，然后重新提交提示",
				},
				{ value: "reset", label: "重置", description: "启动新会话，然后重新提交提示" },
			],
		},
	},

	// Input and startup
	doubleEscapeAction: {
		type: "enum",
		values: ["branch", "tree", "none"] as const,
		default: "tree",
		ui: {
			tab: "interaction",
			group: "输入",
			label: "双 Escape 操作",
			description: "编辑器为空时按两次 Escape 的操作",
		},
	},

	treeFilterMode: {
		type: "enum",
		values: ["default", "no-tools", "user-only", "labeled-only", "all"] as const,
		default: "default",
		ui: {
			tab: "interaction",
			group: "输入",
			label: "会话树过滤器",
			description: "打开会话树时的默认过滤模式",
		},
	},

	autocompleteMaxVisible: {
		type: "number",
		default: 5,
		ui: {
			tab: "interaction",
			group: "输入",
			label: "自动补全条数",
			description: "自动补全下拉菜单中的最大可见项数（3-20）",
			options: [
				{ value: "3", label: "3 items" },
				{ value: "5", label: "5 items" },
				{ value: "7", label: "7 items" },
				{ value: "10", label: "10 items" },
				{ value: "15", label: "15 items" },
				{ value: "20", label: "20 items" },
			],
		},
	},

	emojiAutocomplete: {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "输入",
			label: "Emoji 自动补全",
			description: "Suggest emojis from `:name:` shortcodes and expand text emoticons like `:D` or `:-)`. — 从 `:name:` 短代码建议 emoji，并展开 `:D` 或 `:-)` 等文本表情符号。",
		},
	},

	"paste.largeMenuThreshold": {
		type: "number",
		default: 100,
		ui: {
			tab: "interaction",
			group: "输入",
			label: "大段粘贴菜单",
			description:
				"When a paste reaches this many lines, offer a menu to wrap it in a code block, wrap it in XML tags, or save it to a file. 0 disables the menu (large pastes still collapse to a [Paste] marker). — 当粘贴达到这么多行时，提供菜单将其包装为代码块、包装为 XML 标签或保存到文件；0 禁用菜单（大粘贴仍折叠为 [Paste] 标记）。",
			options: [
				{ value: "0", label: "关闭" },
				{ value: "100", label: "100 行" },
				{ value: "250", label: "250 行" },
				{ value: "500", label: "500 行" },
				{ value: "1000", label: "1000 行" },
			],
		},
	},

	"startup.quiet": {
		type: "boolean",
		default: false,
		ui: {
			tab: "interaction",
			group: "启动与更新",
			label: "安静启动",
			description: "跳过欢迎屏幕和启动状态消息",
		},
	},

	"startup.showSplash": {
		type: "boolean",
		default: false,
		ui: {
			tab: "interaction",
			group: "启动与更新",
			label: "显示启动画面",
			description:
				"Show the full animated setup splash on normal interactive startup without rerunning setup. Quiet Startup still suppresses it. — 在正常交互式启动时显示完整动画设置启动画面而不重新运行设置；安静启动仍会抑制它。",
		},
	},

	"startup.setupWizard": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "启动与更新",
			label: "设置向导",
			description: "每个设置版本显示一次新添加的引导步骤",
		},
	},

	"startup.checkUpdate": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "启动与更新",
			label: "检查更新",
			description: "启动时检查 omp 更新",
		},
	},

	"marketplace.autoUpdate": {
		type: "enum",
		values: ["off", "notify", "auto"] as const,
		default: "notify",
		ui: {
			tab: "interaction",
			group: "启动与更新",
			label: "市场自动更新",
			description: "启动时检查插件更新",
			options: [
				{ value: "off", label: "关闭", description: "不检查插件更新" },
				{ value: "notify", label: "通知", description: "启动时检查并在有更新时通知" },
				{ value: "auto", label: "自动", description: "启动时检查并自动安装更新" },
			],
		},
	},

	collapseChangelog: {
		type: "boolean",
		default: false,
		ui: {
			tab: "interaction",
			group: "启动与更新",
			label: "折叠更新日志",
			description: "更新后显示精简变更日志",
		},
	},

	"magicKeywords.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "魔法关键词",
			label: "魔法关键词",
			description: "为独立的 ultrathink、orchestrate 和 workflowz 关键字启用隐藏通知",
		},
	},

	"magicKeywords.ultrathink": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "魔法关键词",
			label: "Ultrathink 关键词",
			description: "让独立的 ultrathink 请求最大自动思考并附加其隐藏通知。",
		},
	},

	"magicKeywords.orchestrate": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "魔法关键词",
			label: "Orchestrate 关键词",
			description: "让独立的 orchestrate 附加其隐藏的多代理编排通知。",
		},
	},

	"magicKeywords.workflow": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "魔法关键词",
			label: "Workflow 关键词",
			description: "让独立的 workflowz 附加其隐藏的评估工作流通知。",
		},
	},

	// Notifications
	"completion.notify": {
		type: "enum",
		values: ["on", "off"] as const,
		default: "on",
		ui: {
			tab: "interaction",
			group: "通知",
			label: "完成通知",
			description: "代理完成一轮时通知",
		},
	},

	"error.notify": {
		type: "enum",
		values: ["on", "off"] as const,
		default: "off",
		ui: {
			tab: "interaction",
			group: "通知",
			label: "错误通知",
			description: "代理出错停止时通知",
		},
	},

	"ask.timeout": {
		type: "number",
		default: 0,
		ui: {
			tab: "interaction",
			group: "通知",
			label: "询问超时",
			description: "这么多秒后自动选择推荐的询问选项（0 禁用）",
			options: [
				{ value: "0", label: "禁用" },
				{ value: "15", label: "15 秒" },
				{ value: "30", label: "30 秒" },
				{ value: "60", label: "60 秒" },
				{ value: "120", label: "120 秒" },
			],
		},
	},

	"ask.notify": {
		type: "enum",
		values: ["on", "off"] as const,
		default: "on",
		ui: {
			tab: "interaction",
			group: "通知",
			label: "询问通知",
			description: "询问工具等待输入时通知",
		},
	},

	"recap.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "通知",
			label: "空闲回顾",
			description: "终端空闲后生成当前状态的简要 LLM 回顾",
		},
	},

	"recap.idleSeconds": {
		type: "number",
		default: 240,
		ui: {
			tab: "interaction",
			group: "通知",
			label: "空闲回顾延迟",
			description: "显示回顾前空闲等待的秒数",
			options: [
				{ value: "60", label: "1 分钟" },
				{ value: "120", label: "2 分钟" },
				{ value: "240", label: "4 分钟" },
				{ value: "300", label: "5 分钟" },
				{ value: "600", label: "10 分钟" },
			],
		},
	},

	// Collab
	"collab.relayUrl": {
		type: "string",
		default: DEFAULT_RELAY_URL,
		ui: {
			tab: "interaction",
			group: "协作",
			label: "中继 URL",
			description: "/collab 使用的中继 (wss://host[:port])",
		},
	},

	"collab.webUrl": {
		type: "string",
		default: "",
		ui: {
			tab: "interaction",
			group: "协作",
			label: "Web UI 地址",
			description:
				"Browser UI used by /collab links; empty derives from collab.relayUrl; explicit http:// is localhost-only. — /collab 链接使用的浏览器 UI；为空时从 collab.relayUrl 派生；显式 http:// 仅限 localhost。",
		},
	},

	"collab.displayName": {
		type: "string",
		default: "",
		ui: {
			tab: "interaction",
			group: "协作",
			label: "显示名称",
			description: "向其他协作参与者显示的名称（默认：操作系统用户名）",
		},
	},

	"share.serverUrl": {
		type: "string",
		default: DEFAULT_SHARE_URL,
		ui: {
			tab: "interaction",
			group: "协作",
			label: "分享服务器",
			description:
				"Share viewer/upload base used by /share (encrypted blob upload + viewer; links are <base>/<id>#<key>). — /share 使用的分享查看器/上传基础（加密 blob 上传 + 查看器；链接为 <base>/<id>#<key>）。",
		},
	},

	"share.store": {
		type: "enum",
		values: ["blob", "gist"] as const,
		default: "blob",
		ui: {
			tab: "interaction",
			group: "协作",
			label: "分享存储",
			description: "/share 上传加密会话 blob 的位置",
			options: [
				{
					value: "blob",
					label: "加密 Blob",
					description: "上传到分享服务器（无需 GitHub 账户；避免 gist API 速率限制）",
				},
				{
					value: "gist",
					label: "GitHub Gist",
					description: "推送到私有 gist（需要已认证的 gh），回退到分享服务器",
				},
			],
		},
	},

	"share.redactSecrets": {
		type: "boolean",
		default: true,
		ui: {
			tab: "interaction",
			group: "协作",
			label: "分享机密编辑",
			description: "上传前对 /share 快照运行机密混淆器（使用 secrets.* 配置）",
		},
	},

	// Speech-to-text
	"stt.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "interaction",
			group: "语音",
			label: "语音转文字",
			description: "通过麦克风启用语音转文字输入",
		},
	},

	"stt.language": {
		type: "string",
		default: "en",
	},

	"stt.modelName": {
		type: "enum",
		values: STT_MODEL_VALUES,
		default: DEFAULT_STT_MODEL_KEY,
		ui: {
			tab: "interaction",
			group: "语音",
			label: "语音模型",
			description:
				"Local on-device speech model. Parakeet TDT v3 (sherpa-onnx) is the SoTA default; Whisper base/small/large-v3-turbo tiers (transformers.js) trade size for multilingual coverage. Downloaded on first use. — 本地设备端语音模型。Parakeet TDT v3 (sherpa-onnx) 是 SoTA 默认；Whisper base/small/large-v3-turbo 档位（transformers.js）以大小为代价换取多语言覆盖；首次使用时下载。",
			options: STT_MODEL_OPTIONS,
		},
	},
	"stt.submitTrigger": {
		type: "enum",
		values: STT_SUBMIT_TRIGGER_VALUES,
		default: "never",
		ui: {
			tab: "interaction",
			group: "语音",
			label: "语音转文字提交触发",
			description:
				"Choose when speech dictation automatically submits: Never, Release (2+ words), Release with complete sentence, or When I Say Submit. — 选择语音听写何时自动提交：从不、松开（2+ 词）、松开且句子完整，或当我说出提交时。",
			options: STT_SUBMIT_TRIGGER_OPTIONS,
		},
	},

	// ────────────────────────────────────────────────────────────────────────
	// Context
	// ────────────────────────────────────────────────────────────────────────

	// Context promotion
	"contextPromotion.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "context",
			group: "通用",
			label: "自动提升上下文",
			description: "上下文溢出时提升到更大上下文的模型而不是压缩",
		},
	},

	// Compaction
	"compaction.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "压缩",
			label: "自动压缩",
			description: "上下文过大时自动压缩",
		},
	},

	"compaction.midTurnEnabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "压缩",
			label: "回合中压缩",
			description: "在下一次提供商请求前，在安全的回合中工具循环边界检查阈值",
		},
	},

	"compaction.strategy": {
		type: "enum",
		values: ["context-full", "handoff", "shake", "snapcompact", "off"] as const,
		default: "snapcompact",
		ui: {
			tab: "context",
			group: "压缩",
			label: "压缩策略",
			description:
				"Choose in-place context-full maintenance, auto-handoff, surgical shake (drop heavy content), snapcompact (archive history as dense images), or disable auto maintenance (off). — 选择就地上下文完整维护、自动交接、外科式抖动（丢弃重内容）、快照压缩（将历史归档为密集图像）或禁用自动维护（关闭）。",
			options: [
				{
					value: "context-full",
					label: "上下文完整",
					description: "就地总结并保持当前会话",
				},
				{ value: "handoff", label: "交接", description: "生成交接并在新会话中继续" },
				{
					value: "shake",
					label: "抖动",
					description: "就地丢弃重内容（工具结果 + 大块）；通过产物恢复",
				},
				{
					value: "snapcompact",
					label: "快照压缩",
					description: "将历史归档为模型可读回的密集位图图像；无需 LLM 调用",
				},
				{
					value: "off",
					label: "关闭",
					description: "禁用自动上下文维护（与 Auto-compact 关闭行为相同）",
				},
			],
		},
	},

	"compaction.thresholdPercent": {
		type: "number",
		default: -1,
		ui: {
			tab: "context",
			group: "压缩",
			label: "压缩阈值",
			description: "上下文维护的百分比阈值；设为默认以使用传统的基于保留的行为",
			options: [
				{ value: "default", label: "默认", description: "传统的基于保留的阈值" },
				{ value: "10", label: "10%", description: "极早维护" },
				{ value: "20", label: "20%", description: "很早维护" },
				{ value: "30", label: "30%", description: "早期维护" },
				{ value: "40", label: "40%", description: "中等早期维护" },
				{ value: "50", label: "50%", description: "中点" },
				{ value: "60", label: "60%", description: "中等上下文使用" },
				{ value: "70", label: "70%", description: "平衡" },
				{ value: "75", label: "75%", description: "略激进" },
				{ value: "80", label: "80%", description: "典型阈值" },
				{ value: "85", label: "85%", description: "激进的上下文使用" },
				{ value: "90", label: "90%", description: "非常激进" },
				{ value: "95", label: "95%", description: "接近上下文限制" },
			],
		},
	},
	"compaction.thresholdTokens": {
		type: "number",
		default: -1,
		ui: {
			tab: "context",
			group: "压缩",
			label: "压缩 Token 限制",
			description: "上下文维护的固定 token 限制；设置后覆盖百分比",
			options: [
				{ value: "default", label: "默认", description: "使用基于百分比的阈值" },
				{ value: "25000", label: "25K tokens", description: "200K 窗口的四分之一" },
				{ value: "50000", label: "50K tokens", description: "200K 窗口的一半" },
				{ value: "100000", label: "100K tokens", description: "200K 窗口的一半" },
				{ value: "150000", label: "150K tokens", description: "200K 窗口的四分之三" },
				{ value: "200000", label: "200K tokens", description: "完整标准上下文窗口" },
				{ value: "300000", label: "300K tokens", description: "大上下文窗口" },
				{ value: "500000", label: "500K tokens", description: "超大上下文窗口" },
			],
		},
	},

	"compaction.handoffSaveToDisk": {
		type: "boolean",
		default: false,
		ui: {
			tab: "context",
			group: "压缩",
			label: "保存交接文档",
			description: "为自动交接流程将生成的交接文档保存为 markdown 文件",
		},
	},

	"compaction.remoteEnabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "压缩",
			label: "远程压缩",
			description: "可用时使用远程压缩端点而不是本地总结",
		},
	},

	"compaction.remoteStreamingV2Enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "压缩",
			label: "远程压缩 V2",
			description: "为兼容的远程压缩模型使用 Responses 流式压缩",
		},
	},

	// No default: an unset reserve tells the compaction layer the user never
	// chose one, so small-window recovery may swap in the proportional reserve
	// (see resolveBudgetReserveTokens). A materialized 16384 here would make
	// every session look explicitly configured.
	"compaction.reserveTokens": { type: "number", default: undefined },

	"compaction.keepRecentTokens": { type: "number", default: 20000 },

	"compaction.autoContinue": { type: "boolean", default: true },

	"compaction.remoteEndpoint": { type: "string", default: undefined },

	"compaction.v2RetainedMessageBudget": { type: "number", default: 64000 },

	// Idle compaction
	"compaction.idleEnabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "context",
			group: "压缩",
			label: "空闲压缩",
			description: "token 数超过阈值时在空闲时压缩上下文",
		},
	},

	"compaction.idleThresholdTokens": {
		type: "number",
		default: 200000,
		ui: {
			tab: "context",
			group: "压缩",
			label: "空闲压缩阈值",
			description: "触发空闲压缩的 token 数",
			options: [
				{ value: "100000", label: "100K tokens" },
				{ value: "200000", label: "200K tokens" },
				{ value: "300000", label: "300K tokens" },
				{ value: "400000", label: "400K tokens" },
				{ value: "500000", label: "500K tokens" },
				{ value: "600000", label: "600K tokens" },
				{ value: "700000", label: "700K tokens" },
				{ value: "800000", label: "800K tokens" },
				{ value: "900000", label: "900K tokens" },
			],
		},
	},

	"compaction.idleTimeoutSeconds": {
		type: "number",
		default: 300,
		ui: {
			tab: "context",
			group: "压缩",
			label: "空闲压缩延迟",
			description: "压缩前空闲等待的秒数",
			options: [
				{ value: "60", label: "1 分钟" },
				{ value: "120", label: "2 分钟" },
				{ value: "300", label: "5 分钟" },
				{ value: "600", label: "10 分钟" },
				{ value: "1800", label: "30 分钟" },
				{ value: "3600", label: "1 小时" },
			],
		},
	},

	"compaction.supersedeReads": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "压缩",
			label: "取代过期读取",
			description: "再次读取同一文件时修剪较旧的读取结果（缓存感知，每轮运行）",
		},
	},

	"compaction.dropUseless": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "压缩",
			label: "省略无事件结果",
			description:
				"消耗后修剪被标记为上下文无用的工具结果（无匹配、超时等待）（缓存感知）",
		},
	},

	// Experimental: snapcompact inline imaging (transient, per-request; never persisted)
	"snapcompact.systemPrompt": {
		type: "enum",
		values: ["none", "agents-md", "all"] as const,
		default: "none",
		ui: {
			tab: "context",
			group: "实验性",
			label: "Snapcompact 系统提示",
			description:
				"Experimental: render selected system prompt text as dense PNG image(s) and attach to the first user message (vision models only). Saves tokens; loses prompt caching for imaged text. — 实验性：将选定的系统提示文本渲染为密集 PNG 图像并附加到第一条用户消息（仅视觉模型）；节省 token，但失去图像化文本的提示缓存。",
			options: [
				{ value: "none", label: "无", description: "将系统提示保持为文本。" },
				{
					value: "agents-md",
					label: "AGENTS.md",
					description: "仅在节省 token 时，将已加载的上下文文件指令移到图片。",
				},
				{
					value: "all",
					label: "全部",
					description: "仅在节省 token 时，将完整系统提示移到图片。",
				},
			],
		},
	},

	"snapcompact.toolResults": {
		type: "boolean",
		default: false,
		ui: {
			tab: "context",
			group: "实验性",
			label: "Snapcompact 工具结果",
			description:
				"Experimental: render large historical tool results as dense PNG image(s) instead of text (vision models only). Saves tokens on accumulated read/search output. — 实验性：将大型历史工具结果渲染为密集 PNG 图像而不是文本（仅视觉模型）；在累积的读取/搜索输出上节省 token。",
		},
	},

	"tools.format": {
		type: "enum",
		values: [
			"auto",
			"native",
			"glm",
			"hermes",
			"kimi",
			"xml",
			"anthropic",
			"deepseek",
			"harmony",
			"qwen3",
			"gemini",
			"gemma",
			"minimax",
		] as const,
		default: "auto",
		ui: {
			tab: "context",
			group: "实验性",
			label: "工具调用模式",
			description:
				"Controls how tools are exposed to the model. Auto uses provider-native tool calls unless the selected model is marked as not supporting them, then falls back to the GLM owned dialect. Native forces provider-native tools; the other values force the named owned dialect. Applies on session start. — 控制工具如何暴露给模型。Auto 使用提供商原生工具调用，除非所选模型被标记为不支持，然后回退到 GLM 自有方言；Native 强制提供商原生工具；其他值强制指定的自有方言；在会话开始时生效。",
			options: [
				{
					value: "auto",
					label: "自动",
					description: "除非已知模型不支持，否则使用原生工具调用。",
				},
				{ value: "native", label: "原生", description: "使用提供商原生工具调用。" },
				{ value: "glm", label: "GLM", description: "使用 GLM 风格带内工具调用。" },
				{ value: "hermes", label: "Hermes", description: "使用 Hermes 风格带内工具调用。" },
				{ value: "kimi", label: "Kimi", description: "使用 Kimi 风格带内工具调用。" },
				{ value: "xml", label: "XML", description: "使用通用 XML 带内工具调用。" },
				{ value: "anthropic", label: "Anthropic", description: "使用 Anthropic 风格带内工具调用。" },
				{ value: "deepseek", label: "DeepSeek", description: "使用 DeepSeek 风格带内工具调用。" },
				{ value: "harmony", label: "Harmony", description: "使用 Harmony 风格带内工具调用。" },
				{ value: "qwen3", label: "Qwen3", description: "使用 Qwen3 自有方言。" },
				{ value: "gemini", label: "Gemini", description: "使用 Gemini 自有方言。" },
				{ value: "gemma", label: "Gemma", description: "使用 Gemma 自有方言。" },
				{ value: "minimax", label: "MiniMax", description: "使用 MiniMax 自有方言。" },
			],
		},
	},

	"snapcompact.shape": {
		type: "enum",
		values: ["auto", ...SHAPE_VARIANT_NAMES] as const,
		default: "auto",
		ui: {
			tab: "context",
			group: "实验性",
			label: "Snapcompact 形状",
			description:
				"Frame shape snapcompact prints text with (compaction archive and inline imaging). Auto picks a shape tuned for the current model. — snapcompact 打印文本所用的框架形状（压缩归档和内联成像）；Auto 为当前模型选择调优的形状。",
			options: [
				{
					value: "auto",
					label: "自动",
					description: "为当前模型选择调优的形状，回退到其提供商家族。",
				},
				{
					value: "8x8r-bw",
					label: "8x8 重复，黑色",
					description:
						"unscii square cell, black ink, every line printed twice with the copy on a pale highlight band.",
				},
				{
					value: "8x8r-sent",
					label: "8x8 重复，句色",
					description: "重复网格，在句子边界循环六种色调的墨水。",
				},
				{
					value: "8x8u-bw",
					label: "8x8，黑色",
					description: "普通 unscii 方形单元，单行打印，黑色墨水。",
				},
				{
					value: "8x8u-sent",
					label: "8x8，句色",
					description: "普通 unscii 方形单元，句色墨水。",
				},
				{
					value: "6x6u-bw",
					label: "6x6 密集，黑色",
					description: "unscii squeezed to 6x6 — densest readable cell, fewest frames — in black ink.",
				},
				{
					value: "6x6u-sent",
					label: "6x6 密集，句色",
					description: "最密集单元，句色墨水。",
				},
				{
					value: "5x8-bw",
					label: "5x8 传统，黑色",
					description: "2576px 框架上的原始 X.org 5x8 字形，黑色墨水。",
				},
				{
					value: "5x8-sent",
					label: "5x8 传统，句色",
					description: "原始的 snapcompact 形状（形状表之前的会话渲染此形状）。",
				},
				{
					value: "6x12-dim",
					label: "6x12，停用词变暗",
					description: "X.org 6x12 字形，黑色墨水，功能词变暗为灰色。",
				},
				{
					value: "8x13-bw",
					label: "8x13，黑色",
					description: "X.org 8x13 字形，黑色墨水。",
				},
				{
					value: "8on16-bw",
					label: "8x13 于 16px 间距，黑色",
					description: "8x16 单元上的 8x13 字形（额外行距），黑色墨水。",
				},
				{
					value: "8on22-bw",
					label: "8x13 于 22px 间距（行距），黑色",
					description:
						"8x13 glyphs on an 8x22 cell — extra line spacing so rows don't crowd. Default for OpenAI/Google. — 8x22 单元上的 8x13 字形——额外行距使行不拥挤；OpenAI/Google 的默认。",
				},
				{
					value: "11on16-bw",
					label: "8x13 于 11px 字距（字距调整），黑色",
					description:
						"8x13 glyphs on an 11x16 cell — extra letter spacing so characters don't merge. Default for Anthropic. — 11x16 单元上的 8x13 字形——额外字距使字符不合并；Anthropic 的默认。",
				},
				{
					value: "silver16-bw",
					label: "Silver 16，CJK",
					description: "用于 CJK 和其他非拉丁文本的 16px 网格上的嵌入式 Silver TrueType 字体。",
				},
				{
					value: "doc-8on16-bw",
					label: "文档 8on16，黑色",
					description: "16px 间距上的两列自动换行报纸式 8x13 字形，黑色墨水。",
				},
				{
					value: "doc-8on16-sent",
					label: "文档 8on16，句色",
					description: "双栏文档布局，句色墨水。",
				},
				{
					value: "doc-8on16-sent-dim",
					label: "文档 8on16，句色 + 停用词变暗",
					description: "双栏文档布局，句色墨水，功能词变暗为灰色。",
				},
			],
		},
	},

	// Branch summaries
	"branchSummary.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "context",
			group: "通用",
			label: "分支摘要",
			description: "离开分支时提示总结",
		},
	},

	"branchSummary.reserveTokens": { type: "number", default: 16384 },

	// Memories
	// Legacy local-memory enable flag kept only for back-compat migration.
	// Hidden from UI — users should use `memory.backend` instead.
	"memories.enabled": {
		type: "boolean",
		default: false,
	},

	"memories.maxRolloutsPerStartup": { type: "number", default: 64 },

	"memories.maxRolloutAgeDays": { type: "number", default: 30 },

	"memories.minRolloutIdleHours": { type: "number", default: 12 },

	"memories.threadScanLimit": { type: "number", default: 300 },

	"memories.maxRawMemoriesForGlobal": { type: "number", default: 200 },

	"memories.stage1Concurrency": { type: "number", default: 8 },

	"memories.stage1LeaseSeconds": { type: "number", default: 120 },

	"memories.stage1RetryDelaySeconds": { type: "number", default: 120 },

	"memories.phase2LeaseSeconds": { type: "number", default: 180 },

	"memories.phase2RetryDelaySeconds": { type: "number", default: 180 },

	"memories.phase2HeartbeatSeconds": { type: "number", default: 30 },

	"memories.rolloutPayloadPercent": { type: "number", default: 0.7 },

	"memories.phase1InputTokenLimit": { type: "number", default: 4000 },

	"memories.fallbackTokenLimit": { type: "number", default: 16000 },

	"memories.summaryInjectionTokenLimit": { type: "number", default: 5000 },

	// Memory backend selector — picks between local memories pipeline,
	// Mnemopi local SQLite, Hindsight remote memory, or off. The legacy
	// `memories.enabled` flag is migration input only; see config/settings.ts.
	"memory.backend": {
		type: "enum",
		values: ["off", "local", "hindsight", "mnemopi"] as const,
		default: "off",
		ui: {
			tab: "memory",
			group: "通用",
			label: "记忆后端",
			description: "关闭、本地总结管道、Mnemopi SQLite 或 Hindsight 远程记忆",
			options: [
				{ value: "off", label: "关闭", description: "不运行记忆子系统" },
				{ value: "local", label: "本地", description: "本地滚动总结管道 (memory_summary.md)" },
				{ value: "hindsight", label: "Hindsight", description: "向量化 Hindsight 远程记忆服务" },
				{
					value: "mnemopi",
					label: "Mnemopi",
					description: "带可选嵌入的本地 SQLite 回忆/保留后端",
				},
			],
		},
	},

	// Auto-Learn (experimental): post-stop nudge to capture lessons to memory
	// and mint/enhance isolated managed skills under ~/.omp/agent/managed-skills.
	// Master flag is default-off → zero footprint; sub-flags gate behaviour.
	"autolearn.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "memory",
			group: "自动学习",
			label: "自动学习（实验性）",
			description:
				"代理停止后，提示它将经验教训存入记忆并创建/增强隔离的托管技能",
		},
	},
	"autolearn.autoContinue": {
		type: "boolean",
		default: false,
		ui: {
			tab: "memory",
			group: "自动学习",
			label: "停止时自动捕获",
			description:
				"When on, auto-run one private capture turn at stop (uses extra tokens). When off, only standing auto-learn guidance remains. — 开启时，在停止时自动运行一次私有捕获轮次（消耗额外 token）；关闭时，仅保留常驻的自动学习指导。",
			condition: "autolearnActive",
		},
	},
	// Config-file-only knob (numbers without `options` are hidden from the UI).
	"autolearn.minToolCalls": { type: "number", default: 5 },

	// Mnemopi local SQLite memory backend.
	"mnemopi.dbPath": {
		type: "string",
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 数据库路径",
			description: "可选的 SQLite 数据库路径。默认为代理记忆目录。",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.bank": {
		type: "string",
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 记忆库",
			description: "可选的共享记忆库基础名称。按项目模式从中派生项目本地记忆库。",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.scoping": {
		type: "enum",
		values: ["global", "per-project", "per-project-tagged"] as const,
		default: "per-project",
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 作用域",
			description:
				"global = one shared bank; per-project = isolated bank per cwd; per-project-tagged = project-local writes plus global recall visibility",
			options: [
				{
					value: "global",
					label: "全局",
					description: "每个项目共用一个 Mnemopi 记忆库",
				},
				{
					value: "per-project",
					label: "按项目",
					description: "每个 cwd 基础名称一个项目本地 Mnemopi 记忆库",
				},
				{
					value: "per-project-tagged",
					label: "按项目（带标签）",
					description: "写入项目本地记忆库但合并项目 + 共享回忆结果",
				},
			],
			condition: "mnemopiActive",
		},
	},
	"mnemopi.embeddingVariant": {
		type: "enum",
		values: ["en", "multilingual"] as const,
		default: "en",
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "嵌入变体",
			description:
				"Local embedding model family. en = stronger English model; multilingual = cross-language model. Changing this rebuilds existing memory embeddings on next start. — 本地嵌入模型家族。en = 更强的英语模型；multilingual = 跨语言模型；更改此设置会在下次启动时重建现有记忆嵌入。",
			options: [
				{
					value: "en",
					label: "英语 (bge-base-en-v1.5)",
					description: "BAAI/bge-base-en-v1.5 (768d)，仅英语",
				},
				{
					value: "multilingual",
					label: "多语言 (multilingual-e5-large)",
					description: "intfloat/multilingual-e5-large (1024d), cross-language recall",
				},
			],
			condition: "mnemopiActive",
		},
	},
	"mnemopi.autoRecall": {
		type: "boolean",
		default: true,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 自动回忆",
			description: "将本地记忆回忆到每个会话的第一轮",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.autoRetain": {
		type: "boolean",
		default: true,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 自动保留",
			description: "将完成的会话轮次保留到本地 Mnemopi 记忆",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.polyphonicRecall": {
		type: "boolean",
		default: false,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 多声部回忆",
			description: "启用 4 声部回忆（向量、图、事实、时间）并与倒数排名融合",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.enhancedRecall": {
		type: "boolean",
		default: false,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 增强回忆",
			description: "为重复和相似的回忆查询启用分层查询结果缓存",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.proactiveLinking": {
		type: "boolean",
		default: false,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 主动链接",
			description:
				"存储新记忆时将其摄入情景图，链接到相关实体和记忆",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.noEmbeddings": {
		type: "boolean",
		default: false,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 禁用嵌入",
			description: "强制确定性仅 FTS 回忆而不是向量嵌入",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.embeddingModel": {
		type: "string",
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 嵌入模型",
			description:
				"Advanced: explicit embedding model id that overrides the variant. Leave empty to use mnemopi.embeddingVariant. — 高级：覆盖变体的显式嵌入模型 id；留空以使用 mnemopi.embeddingVariant。",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.embeddingApiUrl": {
		type: "string",
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 嵌入 API 地址",
			description: "传递给 Mnemopi 的可选 OpenAI 兼容嵌入端点",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.embeddingApiKey": {
		type: "string",
		credential: true,
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi 嵌入 API 密钥",
			description: "传递给 Mnemopi 的可选嵌入 API 密钥",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.llmMode": {
		type: "enum",
		values: ["none", "smol", "remote"] as const,
		default: "smol",
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi LLM 模式",
			description:
				"Use no LLM, the online tiny model (the TINY role from /models, else @smol), or a remote OpenAI-compatible endpoint. — 不使用 LLM、使用在线微型模型（来自 /models 的 TINY 角色，否则 @smol），或使用远程 OpenAI 兼容端点。",
			condition: "mnemopiActive",
			options: [
				{ value: "none", label: "无", description: "禁用 Mnemopi 基于 LLM 的提取" },
				{
					value: "smol",
					label: "在线（微型）",
					description: "使用在线微型模型（来自 /models 的 TINY 角色，否则 @smol）",
				},
				{ value: "remote", label: "远程", description: "使用下面的 Mnemopi 远程 LLM 设置" },
			],
		},
	},
	"mnemopi.llmBaseUrl": {
		type: "string",
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi LLM 基础地址",
			description: "用于 Mnemopi 远程模式的可选 OpenAI 兼容 LLM 端点",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.llmApiKey": {
		type: "string",
		credential: true,
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi LLM API 密钥",
			description: "用于 Mnemopi 远程模式的可选 LLM API 密钥",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.llmModel": {
		type: "string",
		default: undefined,
		ui: {
			tab: "memory",
			group: "Mnemopi",
			label: "Mnemopi LLM 模型",
			description: "用于 Mnemopi 远程模式的可选 LLM 模型名称",
			condition: "mnemopiActive",
		},
	},
	"mnemopi.retainEveryNTurns": { type: "number", default: 4 },
	"mnemopi.recallLimit": { type: "number", default: 8 },
	"mnemopi.recallContextTurns": { type: "number", default: 3 },
	"mnemopi.recallMaxQueryChars": { type: "number", default: 4000 },
	"mnemopi.injectionTokenLimit": { type: "number", default: 5000 },
	"mnemopi.debug": { type: "boolean", default: false },

	// Hindsight (https://hindsight.vectorize.io)
	"hindsight.apiUrl": {
		type: "string",
		default: "http://localhost:8888",
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight API 地址",
			description: "Hindsight 服务器 URL（云或自托管）",
			condition: "hindsightActive",
		},
	},

	"hindsight.apiToken": {
		type: "string",
		credential: true,
		default: undefined,
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight API 令牌",
			description: "用于已认证 Hindsight 服务器的 Bearer 令牌",
			condition: "hindsightActive",
		},
	},

	"hindsight.bankId": {
		type: "string",
		default: undefined,
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight 记忆库 ID",
			description: "记忆库标识符（默认：项目名称）",
			condition: "hindsightActive",
		},
	},

	"hindsight.bankIdPrefix": { type: "string", default: undefined },
	"hindsight.scoping": {
		type: "enum",
		values: ["global", "per-project", "per-project-tagged"] as const,
		default: "per-project-tagged",
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight 作用域",
			description:
				"global = one shared bank; per-project = isolated bank per cwd; per-project-tagged = shared bank with project tags so global + project memories merge on recall",
			options: [
				{
					value: "global",
					label: "全局",
					description: "一个共享记忆库——每个项目看到相同的记忆",
				},
				{
					value: "per-project",
					label: "按项目",
					description: "每个 cwd 基础名称一个隔离记忆库——项目无法看到彼此的记忆",
				},
				{
					value: "per-project-tagged",
					label: "按项目（带标签）",
					description:
						"共享记忆库，保留标记为 project:<cwd>。回忆同时呈现项目 + 未标记的全局记忆",
				},
			],
			condition: "hindsightActive",
		},
	},
	"hindsight.bankMission": { type: "string", default: undefined },
	"hindsight.retainMission": { type: "string", default: undefined },

	"hindsight.autoRecall": {
		type: "boolean",
		default: true,
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight 自动回忆",
			description: "在每个会话的第一轮回忆记忆",
			condition: "hindsightActive",
		},
	},
	"hindsight.autoRetain": {
		type: "boolean",
		default: true,
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight 自动保留",
			description: "每 N 轮和会话边界保留记录",
			condition: "hindsightActive",
		},
	},

	"hindsight.retainMode": {
		type: "enum",
		values: ["full-session", "last-turn"] as const,
		default: "full-session",
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight 保留模式",
			description: "full-session = upsert one document per session, last-turn = chunked",
			options: [
				{
					value: "full-session",
					label: "完整会话",
					description: "每个会话更新一个文档（推荐）",
				},
				{ value: "last-turn", label: "最后一轮", description: "按轮次边界切分的分块保留" },
			],
			condition: "hindsightActive",
		},
	},
	"hindsight.retainEveryNTurns": { type: "number", default: 3 },
	"hindsight.retainOverlapTurns": { type: "number", default: 2 },
	"hindsight.retainContext": { type: "string", default: "omp" },

	"hindsight.recallBudget": {
		type: "enum",
		values: ["low", "mid", "high"] as const,
		default: "mid",
	},
	"hindsight.recallMaxTokens": { type: "number", default: 1024 },
	"hindsight.recallContextTurns": { type: "number", default: 1 },
	"hindsight.recallMaxQueryChars": { type: "number", default: 800 },
	"hindsight.recallTypes": { type: "array", default: HINDSIGHT_RECALL_TYPES_DEFAULT },

	"hindsight.debug": { type: "boolean", default: false },

	"hindsight.requestTimeoutMs": { type: "number", default: 30_000 },
	"hindsight.reflectTimeoutMs": { type: "number", default: 120_000 },
	"hindsight.recallTimeoutMs": { type: "number", default: 30_000 },
	"hindsight.retainTimeoutMs": { type: "number", default: 60_000 },

	"hindsight.mentalModelsEnabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight 心智模型",
			description:
				"Read curated reflect summaries (mental models) into developer instructions at boot. Loads existing models on the bank — does not write. Pair with hindsight.mentalModelAutoSeed to also auto-create the built-in seed set. — 启动时将精选的反思摘要（心智模型）读入开发者指令；加载记忆库上已有的模型——不写入；与 hindsight.mentalModelAutoSeed 搭配可同时自动创建内置种子集。",
			condition: "hindsightActive",
		},
	},
	"hindsight.mentalModelAutoSeed": {
		type: "boolean",
		default: true,
		ui: {
			tab: "memory",
			group: "Hindsight",
			label: "Hindsight 心智模型自动播种",
			description:
				"At session start, create any built-in mental models (project-conventions, project-decisions, user-preferences) that do not yet exist on the bank. — 会话开始时，创建记忆库上尚不存在的任何内置心智模型（project-conventions、project-decisions、user-preferences）。",
			condition: "hindsightActive",
		},
	},
	"hindsight.mentalModelRefreshIntervalMs": { type: "number", default: 5 * 60 * 1000 },
	"hindsight.mentalModelMaxRenderChars": { type: "number", default: 16_000 },

	// TTSR
	"ttsr.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "规则 (TTSR)",
			label: "TTSR",
			description: "输出匹配规则模式时中断代理流（时间旅行流规则）",
		},
	},

	"ttsr.contextMode": {
		type: "enum",
		values: ["discard", "keep"] as const,
		default: "discard",
		ui: {
			tab: "context",
			group: "规则 (TTSR)",
			label: "TTSR 上下文模式",
			description: "TTSR 触发时如何处理部分输出",
		},
	},

	"ttsr.interruptMode": {
		type: "enum",
		values: ["never", "prose-only", "tool-only", "always"] as const,
		default: "always",
		ui: {
			tab: "context",
			group: "规则 (TTSR)",
			label: "TTSR 中断模式",
			description: "何时中断流 vs 完成后注入警告",
			options: [
				{ value: "always", label: "always", description: "在正文和工具流上中断" },
				{ value: "prose-only", label: "prose-only", description: "仅在回复/思考匹配时中断" },
				{ value: "tool-only", label: "tool-only", description: "仅在工具调用参数匹配时中断" },
				{ value: "never", label: "never", description: "从不中断；完成后注入警告" },
			],
		},
	},

	"ttsr.repeatMode": {
		type: "enum",
		values: ["once", "after-gap"] as const,
		default: "once",
		ui: {
			tab: "context",
			group: "规则 (TTSR)",
			label: "TTSR 重复模式",
			description: "规则如何重复：每会话一次或在消息间隔后",
		},
	},

	"ttsr.repeatGap": {
		type: "number",
		default: 10,
		ui: {
			tab: "context",
			group: "规则 (TTSR)",
			label: "TTSR 重复间隔",
			description: "规则可再次触发前的消息数",
			options: [
				{ value: "5", label: "5 条消息" },
				{ value: "10", label: "10 条消息" },
				{ value: "15", label: "15 条消息" },
				{ value: "20", label: "20 条消息" },
				{ value: "30", label: "30 条消息" },
			],
		},
	},

	"ttsr.builtinRules": {
		type: "boolean",
		default: true,
		ui: {
			tab: "context",
			group: "规则 (TTSR)",
			label: "内置规则",
			description: "加载代理附带的默认规则（可用 ttsr.disabledRules 单独覆盖）",
		},
	},

	"ttsr.disabledRules": {
		type: "array",
		default: [] as string[],
		ui: {
			tab: "context",
			group: "规则 (TTSR)",
			label: "禁用规则",
			description: "完全忽略的规则名称（适用于捆绑默认值和您自己的规则）",
		},
	},

	// ────────────────────────────────────────────────────────────────────────
	// Editing
	// ────────────────────────────────────────────────────────────────────────

	// Edit tool
	"edit.mode": {
		type: "enum",
		values: EDIT_MODES,
		default: "hashline",
		ui: {
			tab: "files",
			group: "编辑",
			label: "编辑模式",
			description: "选择编辑工具变体（replace、patch、hashline 或 apply_patch）",
		},
	},

	"edit.fuzzyMatch": {
		type: "boolean",
		default: true,
		ui: {
			tab: "files",
			group: "编辑",
			label: "模糊匹配",
			description: "接受空白差异的高置信度模糊匹配",
		},
	},

	"edit.fuzzyThreshold": {
		type: "number",
		default: 0.95,
		ui: {
			tab: "files",
			group: "编辑",
			label: "模糊匹配阈值",
			description: "接受模糊匹配的相似度阈值（0-1）",
			options: [
				{ value: "0.85", label: "0.85", description: "宽松" },
				{ value: "0.90", label: "0.90", description: "中等" },
				{ value: "0.95", label: "0.95", description: "默认" },
				{ value: "0.98", label: "0.98", description: "严格" },
			],
		},
	},

	"edit.streamingAbort": {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "编辑",
			label: "预览失败时中止",
			description: "补丁预览失败时中止流式编辑工具调用",
		},
	},

	"edit.blockAutoGenerated": {
		type: "boolean",
		default: true,
		ui: {
			tab: "files",
			group: "编辑",
			label: "阻止自动生成文件",
			description: "阻止编辑看似自动生成的文件（protoc、sqlc、swagger 等）",
		},
	},

	"edit.enforceSeenLines": {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "编辑",
			label: "强制已见行防护",
			description: "拒绝锚定在先前读取/搜索从未完整显示的行上的编辑",
		},
	},

	readLineNumbers: {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "阅读",
			label: "行号",
			description: "默认在读取工具输出前添加行号",
		},
	},

	"read.defaultLimit": {
		type: "number",
		default: 300,
		ui: {
			tab: "files",
			group: "阅读",
			label: "默认读取限制",
			description: "代理无限制调用读取时返回的默认行数",
			options: [
				{ value: "200", label: "200 行" },
				{ value: "300", label: "300 行" },
				{ value: "500", label: "500 行" },
				{ value: "1000", label: "1000 行" },
				{ value: "5000", label: "5000 行" },
			],
		},
	},

	"read.renderMarkdown": {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "阅读",
			label: "Markdown 预览",
			description: "将 Markdown 读取结果渲染为格式化的终端 Markdown 预览而不是原始源码",
		},
	},

	"read.summarize.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "files",
			group: "读取摘要",
			label: "读取摘要",
			description: "无显式选择器调用读取时返回结构化代码摘要",
		},
	},

	"read.summarize.prose": {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "读取摘要",
			label: "正文摘要",
			description: "为 Markdown 和纯文本读取返回结构化摘要",
		},
	},

	"read.summarize.minBodyLines": {
		type: "number",
		default: 4,
		ui: {
			tab: "files",
			group: "读取摘要",
			label: "读取摘要正文行数",
			description: "读取摘要折叠前的多行正文或字面量最小长度",
		},
	},

	"read.summarize.minCommentLines": {
		type: "number",
		default: 6,
		ui: {
			tab: "files",
			group: "读取摘要",
			label: "读取摘要注释行数",
			description: "读取摘要折叠前的多行块注释最小长度",
		},
	},

	"read.summarize.minTotalLines": {
		type: "number",
		default: 100,
		ui: {
			tab: "files",
			group: "读取摘要",
			label: "读取摘要最小文件长度",
			description: "总行数较少的文件逐字读取而不是结构化总结",
		},
	},

	"read.summarize.unfoldUntil": {
		type: "number",
		default: 50,
		ui: {
			tab: "files",
			group: "读取摘要",
			label: "读取摘要展开目标",
			description:
				"BFS-unfold elidable spans until the summary is at least this many visible lines. 0 keeps only the outermost elisions. — BFS 展开可省略跨度，直到摘要至少达到这么多可见行；0 仅保留最外层的省略。",
		},
	},

	"read.summarize.unfoldLimit": {
		type: "number",
		default: 100,
		ui: {
			tab: "files",
			group: "读取摘要",
			label: "读取摘要展开上限",
			description:
				"Hard ceiling on summary size while BFS-unfolding. An unfold whose revealed lines would exceed this is skipped (that span stays folded) and unfolding continues with the remaining spans. — BFS 展开时摘要大小的硬上限；展开后行数会超过此值的跨度被跳过（该跨度保持折叠），展开继续处理其余跨度。",
		},
	},

	"read.toolResultPreview": {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "阅读",
			label: "内联读取预览",
			description: "在记录中内联渲染读取工具结果而不是摘要行",
		},
	},

	// LSP
	"lsp.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "files",
			group: "LSP",
			label: "LSP",
			description: "启用 lsp 工具进行代码智能（定义、引用、诊断、重命名）",
		},
	},

	"lsp.lazy": {
		type: "boolean",
		default: true,
		ui: {
			tab: "files",
			group: "LSP",
			label: "LSP 延迟启动",
			description:
				"首次使用时启动语言服务器（lsp 工具或编辑匹配的文件类型）而不是在会话启动时",
		},
	},

	"lsp.formatOnWrite": {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "LSP",
			label: "写入时格式化",
			description: "写入后使用 LSP 自动格式化代码文件",
		},
	},

	"lsp.diagnosticsOnWrite": {
		type: "boolean",
		default: true,
		ui: {
			tab: "files",
			group: "LSP",
			label: "写入时诊断",
			description: "写入代码文件后返回 LSP 诊断",
		},
	},

	"lsp.diagnosticsOnEdit": {
		type: "boolean",
		default: false,
		ui: {
			tab: "files",
			group: "LSP",
			label: "编辑时诊断",
			description: "编辑代码文件后返回 LSP 诊断",
		},
	},

	"lsp.diagnosticsDeduplicate": {
		type: "boolean",
		default: true,
		ui: {
			tab: "files",
			group: "LSP",
			label: "诊断去重",
			description: "抑制已为文件显示的编辑后 LSP 诊断；仅呈现新的或更改的",
		},
	},

	"bash.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "shell",
			group: "Bash",
			label: "Bash",
			description: "启用 bash 工具执行 shell 命令",
		},
	},

	"bash.autoBackground.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "shell",
			group: "Bash",
			label: "Bash 自动后台",
			description: "自动将长时间运行的 bash 命令置于后台并稍后交付结果",
		},
	},
	"bash.patterns": {
		type: "array",
		default: [],
		ui: {
			tab: "shell",
			group: "Bash",
			label: "Bash 审批模式",
			description:
				"Ordered bash command approval rules. Each item has match and approval fields; only '*' wildcards are supported. — 有序的 bash 命令审批规则；每项包含 match 和 approval 字段；仅支持 '*' 通配符。",
		},
	},

	// Bash interceptor
	"bashInterceptor.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "shell",
			group: "Bash",
			label: "Bash 拦截器",
			description: "拦截已有专用工具的 shell 命令",
		},
	},
	"bashInterceptor.patterns": { type: "array", default: DEFAULT_BASH_INTERCEPTOR_RULES },

	"bash.direnv": {
		type: "enum",
		values: ["auto", "off"] as const,
		default: "auto",
		ui: {
			tab: "shell",
			group: "Bash",
			label: "direnv Auto-Load",
			description:
				"Auto-load a repo's direnv/devenv `.envrc` into the bash session so devenv tools and env vars are present without manual `direnv exec`. Honors direnv's allow list: an `.envrc` you haven't `direnv allow`ed is never executed. — 自动将仓库的 direnv/devenv `.envrc` 加载到 bash 会话，使 devenv 工具和环境变量无需手动 `direnv exec` 即可使用；遵循 direnv 的允许列表：未 `direnv allow` 的 `.envrc` 永远不会被执行。",
		},
	},
	"bash.direnvLoadTimeoutMs": {
		type: "number",
		default: 30_000,
		ui: {
			tab: "shell",
			group: "Bash",
			label: "direnv Load Timeout (ms)",
			description:
				"Max wait for the first `direnv export` (a cold devenv shell can be slow); on timeout the session runs without the direnv env. — 等待首次 `direnv export` 的最大时间（冷 devenv shell 可能较慢）；超时则会话在无 direnv 环境的情况下运行。",
		},
	},
	// Shell output minimizer
	"shellMinimizer.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "shell",
			group: "Bash",
			label: "Shell 输出压缩",
			description: "压缩冗长的 shell 输出后再返回给代理",
		},
	},
	"shellMinimizer.settingsPath": {
		type: "string",
		default: undefined,
	},
	"shellMinimizer.only": { type: "array", default: EMPTY_STRING_ARRAY },
	"shellMinimizer.except": { type: "array", default: EMPTY_STRING_ARRAY },
	"shellMinimizer.maxCaptureBytes": {
		type: "number",
		default: 4 * 1024 * 1024,
	},
	"shellMinimizer.sourceOutlineLevel": {
		type: "enum",
		values: ["default", "aggressive"] as const,
		default: "default",
		ui: {
			tab: "shell",
			group: "Bash",
			label: "源码轮廓模式",
			description: "cat/read 源文件的源码大纲模式：默认或激进",
		},
	},
	"shellMinimizer.legacyFilters": {
		type: "boolean",
		default: undefined,
	},

	// Eval (per-backend toggles; add more as new backends ship, e.g. eval.ts)
	"eval.py": {
		type: "boolean",
		default: true,
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "Python 评估后端",
			description: "允许将 Python 代码发送到 IPython 内核执行",
		},
	},

	"eval.js": {
		type: "boolean",
		default: true,
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "JavaScript 评估后端",
			description: "允许将 JavaScript 代码发送到进程内运行时执行",
		},
	},

	"eval.rb": {
		type: "boolean",
		default: false,
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "Ruby 评估后端",
			description: "允许 eval 工具将 Ruby 单元分派到持久 Ruby 内核",
		},
	},

	"eval.jl": {
		type: "boolean",
		default: false,
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "Julia 评估后端",
			description: "允许 eval 工具将 Julia 单元分派到持久 Julia 内核",
		},
	},

	// Runtime knobs (consumed by eval backends and the /python slash command)
	"python.kernelMode": {
		type: "enum",
		values: ["session", "per-call"] as const,
		default: "session",
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "Python 内核模式",
			description: "保持 IPython 内核在多次 eval 调用间存活",
		},
	},
	"python.interpreter": {
		type: "string",
		default: "",
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "Python 解释器",
			description:
				"可选的确切 Python 可执行文件路径。设置后跳过自动 Python 运行时发现。",
		},
	},
	"ruby.interpreter": {
		type: "string",
		default: "",
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "Ruby 解释器",
			description:
				"可选的确切 Ruby 可执行文件路径。设置后跳过自动 Ruby 运行时发现。",
		},
	},
	"julia.interpreter": {
		type: "string",
		default: "",
		ui: {
			tab: "shell",
			group: "评估与运行时",
			label: "Julia 解释器",
			description:
				"可选的确切 Julia 可执行文件路径。设置后跳过自动 Julia 运行时发现。",
		},
	},

	// ────────────────────────────────────────────────────────────────────────
	// Tools
	// ────────────────────────────────────────────────────────────────────────

	// Tool approval policies
	"tools.approval": {
		type: "record",
		default: {},
		ui: {
			tab: "interaction",
			group: "审批",
			label: "工具审批策略",
			description:
				"Per-tool approval policies. Set to 'allow' to auto-approve, 'prompt' to require confirmation, or 'deny' to block. Overrides are honored in every approval mode. — 每工具审批策略。设为 'allow' 自动批准，'prompt' 要求确认，或 'deny' 阻止；覆盖在每种审批模式下均生效。",
		},
	},

	// Default tool approval mode (interaction tab, but governs the tool wrapper).
	//   "always-ask" — auto-approves read-tier tools only; prompts for write/exec.
	//   "write"      — auto-approves read and write-tier tools; prompts for exec.
	//   "yolo"       — auto-approves every tier.
	"tools.approvalMode": {
		type: "enum",
		values: ["always-ask", "write", "yolo"] as const,
		default: "yolo",
		ui: {
			tab: "interaction",
			group: "审批",
			label: "工具审批",
			description:
				"Default approval behavior for tool calls. 'Always ask' auto-approves read-only tools only. 'Write' auto-approves read and workspace-write tools. 'Yolo' auto-approves all tiers; user policy may still prompt or block. — 工具调用的默认审批行为。'Always ask' 仅自动批准只读工具；'Write' 自动批准读取和工作区写入工具；'Yolo' 自动批准所有层级；用户策略仍可提示或阻止。",
			options: [
				{
					value: "always-ask",
					label: "始终询问",
					description: "自动批准只读工具；写入和执行工具需要确认。",
				},
				{
					value: "write",
					label: "写入",
					description:
						"自动批准只读和写入工具；bash、eval、browser 和 task 等执行工具需要确认。",
				},
				{
					value: "yolo",
					label: "Yolo",
					description:
						"自动批准读取、写入和执行工具。用户策略仍可要求确认或阻止调用。",
				},
			],
		},
	},

	// Todo tool
	"todo.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "待办",
			description: "启用待办工具进行任务跟踪",
		},
	},

	"todo.reminders": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "待办",
			label: "待办提醒",
			description: "在停止前提醒代理完成待办",
		},
	},

	"todo.remindersMax": {
		type: "number",
		default: 3,
		ui: {
			tab: "tools",
			group: "待办",
			label: "待办提醒上限",
			description: "待办提醒的最大次数",
			options: [
				{ value: "1", label: "1 次" },
				{ value: "2", label: "2 次" },
				{ value: "3", label: "3 次" },
				{ value: "5", label: "5 次" },
			],
		},
	},

	"todo.eager": {
		type: "enum",
		values: ["default", "preferred", "always"] as const,
		default: "default",
		ui: {
			tab: "tools",
			group: "待办",
			label: "自动创建待办",
			description: "第一条消息后推动自动待办列表创建的力度",
			options: [
				{ value: "default", label: "默认", description: "模型决定；无自动待办列表" },
				{
					value: "preferred",
					label: "推荐",
					description: "在第一条消息上建议待办列表（提醒，非强制）",
				},
				{ value: "always", label: "始终", description: "在第一条消息上强制全面的待办列表" },
			],
		},
	},

	// Grep, glob, and AST tools
	"glob.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "Glob",
			description: "启用 glob 工具进行基于通配符的文件查找",
		},
	},

	"grep.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "Grep",
			description: "启用 grep 工具进行正则内容搜索",
		},
	},

	"grep.contextBefore": {
		type: "number",
		default: 1,
		ui: {
			tab: "tools",
			group: "搜索与浏览器",
			label: "Grep 前上下文",
			description: "每个 grep 匹配前的上下文行数",
			options: [
				{ value: "0", label: "0 行" },
				{ value: "1", label: "1 行" },
				{ value: "2", label: "2 行" },
				{ value: "3", label: "3 行" },
				{ value: "5", label: "5 行" },
			],
		},
	},

	"grep.contextAfter": {
		type: "number",
		default: 3,
		ui: {
			tab: "tools",
			group: "搜索与浏览器",
			label: "Grep 后上下文",
			description: "每个 grep 匹配后的上下文行数",
			options: [
				{ value: "0", label: "0 行" },
				{ value: "1", label: "1 行" },
				{ value: "2", label: "2 行" },
				{ value: "3", label: "3 行" },
				{ value: "5", label: "5 行" },
				{ value: "10", label: "10 行" },
			],
		},
	},

	"astGrep.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "AST 搜索",
			description: "启用 AST 结构搜索工具",
		},
	},

	"astEdit.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "AST 编辑",
			description: "启用 AST 结构重写工具",
		},
	},

	// Optional tools

	"debug.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "调试",
			description: "启用基于 DAP 的调试工具",
		},
	},

	"launch.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "启动",
			description: "启用 launch 工具监督共享的长时间运行项目进程",
		},
	},

	"speechgen.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "语音生成",
			description: "启用 tts 工具进行设备端（Kokoro）或 xAI Grok Voice 语音文件合成",
		},
	},
	"generate_image.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "生成图片",
			description:
				"Enable the generate_image tool (text-to-image generation and editing). Exposed as an xd:// device when tools.xdev is on. — 启用 generate_image 工具（文生图生成和编辑）；当 tools.xdev 开启时作为 xd:// 设备暴露。",
		},
	},

	// Legacy boolean kept only for back-compat migration to `inspect_image.mode`
	// (see config/settings.ts). Hidden from UI.
	"inspect_image.enabled": {
		type: "boolean",
		default: false,
	},

	"inspect_image.mode": {
		type: "enum",
		values: ["auto", "on", "off"] as const,
		default: "auto",
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "检查图片",
			description:
				"Controls the inspect_image tool, which delegates image understanding to a vision-capable model. 'auto' exposes it only when the active model lacks native image input; 'on' always exposes it; 'off' never does. — 控制 inspect_image 工具，它将图像理解委托给具备视觉能力的模型；'auto' 仅在活动模型缺乏原生图像输入时暴露；'on' 始终暴露；'off' 从不暴露。",
			options: [
				{ value: "auto", label: "自动（仅限无视觉模型）" },
				{ value: "on", label: "开启" },
				{ value: "off", label: "关闭" },
			],
		},
	},

	"computer.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "计算机",
			description: "为 OpenAI computer use 启用原生主机桌面截图和输入",
		},
	},

	"computer.backend": {
		type: "enum",
		values: ["auto", "native"] as const,
		default: "auto",
		ui: {
			tab: "tools",
			group: "Computer",
			label: "计算机后端",
			description: "选择自动或显式的平台原生桌面捕获和输入",
			options: [
				{ value: "auto", label: "自动" },
				{ value: "native", label: "原生" },
			],
		},
	},

	"computer.display": {
		type: "string",
		default: "all",
		ui: {
			tab: "tools",
			group: "Computer",
			label: "计算机显示器",
			description: "合成所有显示器或选择原生显示器 id",
		},
	},

	"computer.maxWidth": {
		type: "number",
		default: 1920,
		ui: {
			tab: "tools",
			group: "Computer",
			label: "计算机截图宽度",
			description: "最大合成截图宽度（像素）",
		},
	},

	"computer.maxHeight": {
		type: "number",
		default: 1200,
		ui: {
			tab: "tools",
			group: "Computer",
			label: "计算机截图高度",
			description: "最大合成截图高度（像素）",
		},
	},

	"inspect_image.timeoutMs": {
		type: "number",
		default: 300_000,
		ui: {
			tab: "tools",
			group: "执行",
			label: "检查图片超时",
			description:
				"Per-request timeout for the inspect_image vision-model call, in milliseconds. A stalled provider fails fast with a timeout error instead of blocking until manual abort. Set to 0 to disable the timeout. — inspect_image 视觉模型调用的每请求超时毫秒数；停滞的提供商以超时错误快速失败，而不是阻塞到手动中止；设为 0 禁用超时。",
			options: [
				{ value: "0", label: "禁用" },
				{ value: "60000", label: "1 分钟" },
				{ value: "120000", label: "2 分钟" },
				{ value: "180000", label: "3 分钟" },
				{ value: "300000", label: "5 分钟" },
			],
		},
	},

	"checkpoint.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "检查点/回退",
			description: "启用 checkpoint 和 rewind 工具进行上下文检查点",
		},
	},

	// Fetching and browser
	"fetch.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "读取 URL",
			description: "允许读取工具抓取和处理 URL",
		},
	},

	"vault.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "Obsidian 知识库",
			description:
				"Enable the vault:// internal URL for reading and editing Obsidian vault content via the Obsidian CLI. When disabled, vault:// resolution is refused and the vault:// entry is omitted from the system prompt. — 启用 vault:// 内部 URL，通过 Obsidian CLI 读取和编辑 Obsidian 库内容；禁用时拒绝 vault:// 解析，并从系统提示中省略 vault:// 条目。",
		},
	},

	"github.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "GitHub CLI",
			description:
				"Enable the github tool (op-based dispatch for repository, issue, pull request, diff, search, checkout, push, and Actions watch workflows). — 启用 github 工具（基于操作的分派，用于仓库、issue、拉取请求、diff、搜索、检出、推送和 Actions 监视工作流）。",
		},
	},

	"github.cache.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "GitHub",
			label: "GitHub 视图缓存",
			description: "将渲染的 issue/PR 视图输出缓存在 ~/.omp/cache/github-cache.db 中，使重复读取免费",
		},
	},

	"github.cache.softTtlSec": {
		type: "number",
		default: 300,
		ui: {
			tab: "tools",
			group: "GitHub",
			label: "GitHub 缓存软 TTL",
			description:
				"在此窗口内，直接返回缓存的 issue/PR 视图行（秒；默认 5 分钟）",
		},
	},

	"github.cache.hardTtlSec": {
		type: "number",
		default: 604800,
		ui: {
			tab: "tools",
			group: "GitHub",
			label: "GitHub 缓存硬 TTL",
			description:
				"Past the soft TTL the cached row is returned and refreshed in the background; past the hard TTL it is dropped (seconds; default 7 days). — 超过软 TTL 时返回缓存行并在后台刷新；超过硬 TTL 时丢弃（秒；默认 7 天）。",
		},
	},

	"web_search.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "网络搜索",
			description: "启用网络搜索工具",
		},
	},

	"ask.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "询问",
			description: "启用 ask 工具进行交互式用户提问",
		},
	},

	"browser.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "可用工具",
			label: "浏览器",
			description: "启用浏览器自动化工具（Chromium/puppeteer）",
		},
	},

	"browser.headless": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "搜索与浏览器",
			label: "无头浏览器",
			description: "以无头模式启动浏览器",
		},
	},

	"browser.cmux": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "搜索与浏览器",
			label: "cmux 浏览器",
			description:
				"Use cmux WKWebView surfaces for browser automation when a cmux socket is available. Set PI_BROWSER_CMUX=0 or PI_BROWSER_CMUX=1 to override. — 当 cmux socket 可用时，使用 cmux WKWebView 表面进行浏览器自动化；设置 PI_BROWSER_CMUX=0 或 PI_BROWSER_CMUX=1 覆盖。",
		},
	},
	"browser.screenshotDir": {
		type: "string",
		default: undefined,
		ui: {
			tab: "tools",
			group: "搜索与浏览器",
			label: "截图目录",
			description:
				"Directory to save screenshots. If unset, screenshots go to a temp file. Supports ~. Examples: ~/Downloads, ~/Desktop, /sdcard/Download (Android). — 保存截图的目录；未设置时截图保存到临时文件；支持 ~；示例：~/Downloads、~/Desktop、/sdcard/Download (Android)。",
		},
	},

	// Tool execution
	"tools.intentTracing": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "执行",
			label: "意图追踪",
			description: "要求代理在执行前描述工具调用意图",
		},
	},
	"tools.abortOnFabricatedResult": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "执行",
			label: "伪造结果中止",
			description:
				"With in-band tool calls, stop the model immediately when it starts hallucinating a tool result mid-turn. Disable to let the model finish generating and discard the fabricated continuation instead. — 使用带内工具调用时，当模型在回合中途开始幻觉工具结果时立即停止；禁用则让模型完成生成并丢弃虚构的续写。",
		},
	},

	"tools.maxTimeout": {
		type: "number",
		default: 0,
		ui: {
			tab: "tools",
			group: "执行",
			label: "工具超时上限",
			description: "代理可为工具设置的最大超时秒数",
			options: [
				{ value: "0", label: "无限制" },
				{ value: "30", label: "30 秒" },
				{ value: "60", label: "60 秒" },
				{ value: "120", label: "120 秒" },
				{ value: "300", label: "5 分钟" },
				{ value: "600", label: "10 分钟" },
			],
		},
	},

	// Async jobs
	"async.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "执行",
			label: "异步执行",
			description: "启用异步 bash 命令和后台任务执行",
		},
	},

	"async.maxJobs": {
		type: "number",
		default: 100,
	},

	"async.pollWaitDuration": {
		type: "enum",
		values: ["5s", "10s", "30s", "1m", "5m", "smart"] as const,
		default: "smart",
		ui: {
			tab: "tools",
			group: "执行",
			label: "最大轮询时间",
			description:
				"How long a `hub` wait watches background jobs before returning the current state. A fixed value waits that exact duration every time. `smart` adapts: it starts at 5s and lengthens with each back-to-back wait (up to 5m), then resets to 5s after about a minute without waiting. — `hub` 等待在返回当前状态前监视后台作业的时间；固定值每次等待该确切时长；`smart` 自适应：从 5s 开始，每次连续等待都会延长（最多 5m），停止等待约一分钟后重置为 5s。",
			options: [
				{ value: "5s", label: "5 秒" },
				{ value: "10s", label: "10 秒" },
				{ value: "30s", label: "30 秒" },
				{ value: "1m", label: "1 分钟" },
				{ value: "5m", label: "5 分钟" },
				{ value: "smart", label: "智能", description: "默认——自适应 5s→5m，停止轮询时重置" },
			],
		},
	},

	"irc.timeoutMs": {
		type: "number",
		default: 120_000,
		ui: {
			tab: "tools",
			group: "执行",
			label: "IRC 超时",
			description:
				"hub 消息等待（和 send await:true）的默认超时毫秒数；0 禁用超时",
			options: [
				{ value: "0", label: "禁用" },
				{ value: "30000", label: "30 秒" },
				{ value: "60000", label: "1 分钟" },
				{ value: "120000", label: "2 分钟" },
				{ value: "300000", label: "5 分钟" },
			],
		},
	},

	"bash.autoBackground.thresholdMs": {
		type: "number",
		default: 60_000,
	},

	"tools.xdev": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "发现与 MCP",
			label: "xd:// Tools",
			description:
				"Mount rarely-used (discoverable) tools under xd:// device URLs driven via read/write instead of shipping their schemas on every request. Disable to expose every enabled tool top-level. — 将很少使用（可发现）的工具挂载到由 read/write 驱动的 xd:// 设备 URL 下，而不是在每次请求时发送其模式；禁用则将所有启用的工具顶层暴露。",
		},
	},

	"tools.xdevDocs": {
		type: "enum",
		values: ["inline", "builtins", "catalog"] as const,
		default: "builtins",
		ui: {
			tab: "tools",
			group: "发现与 MCP",
			label: "xd:// Prompt Docs",
			description:
				"Choose which mounted-device docs and schemas are inlined in the system prompt. Built-ins keeps core tools inline while MCP and extension tools stay on-demand. — 选择哪些挂载设备的文档和模式内联到系统提示中；Built-ins 保持核心工具内联，而 MCP 和扩展工具保持按需。",
			options: [
				{ value: "inline", label: "所有设备", description: "为每个挂载设备内联文档和模式。" },
				{
					value: "builtins",
					label: "仅内置",
					description: "内联内置文档；按需获取 MCP 和扩展文档。",
				},
				{ value: "catalog", label: "仅目录", description: "列出每个设备；按需获取所有文档。" },
			],
		},
	},

	"tools.xdevInlineDevices": {
		type: "array",
		default: EMPTY_STRING_ARRAY,
		ui: {
			tab: "tools",
			group: "发现与 MCP",
			label: "xd:// Inline Devices",
			description:
				"When xd:// Prompt Docs is Built-ins Only, inline dynamic devices whose names match these glob patterns (for example mcp__context_mode_*). Catalog Only ignores this setting. — 当 xd:// 提示文档为仅内置时，内联名称匹配这些 glob 模式的动态设备（例如 mcp__context_mode_*）；仅目录模式忽略此设置。",
		},
	},

	// MCP
	"mcp.enableProjectConfig": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "发现与 MCP",
			label: "MCP 项目配置",
			description: "从项目根目录加载 .mcp.json/mcp.json",
		},
	},

	"mcp.renderMarkdownResults": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "发现与 MCP",
			label: "MCP Markdown 结果",
			description: "在记录中将非 JSON MCP 文本结果渲染为 Markdown",
		},
	},

	"mcp.notifications": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tools",
			group: "发现与 MCP",
			label: "MCP 更新注入",
			description: "将 MCP 资源更新注入代理对话",
		},
	},

	"mcp.notificationDebounceMs": {
		type: "number",
		default: 500,
		ui: {
			tab: "tools",
			group: "发现与 MCP",
			label: "MCP 通知防抖",
			description:
				"将 MCP 资源更新注入对话前的防抖窗口（毫秒）",
		},
	},

	// ────────────────────────────────────────────────────────────────────────
	// Tasks
	// ────────────────────────────────────────────────────────────────────────

	// Plan mode
	"plan.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "模式",
			label: "计划模式",
			description: "启用只读探索和规划的计划模式",
		},
	},

	"plan.defaultOnStartup": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tasks",
			group: "模式",
			label: "启动时进入计划模式",
			description: "每个新会话开始时自动进入计划模式",
			condition: "planModeEnabled",
		},
	},

	"goal.enabled": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "模式",
			label: "目标模式",
			description: "启用每会话目标模式和隐藏的目标工具",
		},
	},

	"goal.statusInFooter": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "模式",
			label: "页脚显示目标状态",
			description: "在状态栏的目标指示器旁显示 token 预算",
		},
	},

	"goal.continuationModes": {
		type: "array",
		default: ["interactive"],
		ui: {
			tab: "tasks",
			group: "模式",
			label: "目标继续模式",
			description: "活动目标可在轮次间自动继续的运行模式",
		},
	},

	"title.refreshOnReplan": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "模式",
			label: "重新规划时刷新标题",
			description: "待办初始化重新规划后刷新生成的会话标题，除非标题由用户设置",
		},
	},

	// Delegation
	"task.isolation.mode": {
		type: "enum",
		values: [
			"none",
			"auto",
			"apfs",
			"btrfs",
			"zfs",
			"reflink",
			"overlayfs",
			"projfs",
			"block-clone",
			"rcopy",
		] as const,
		default: "none",
		ui: {
			tab: "tasks",
			group: "隔离",
			label: "隔离模式",
			description:
				'Isolation backend for subagents. "auto" lets the native PAL pick the best available backend (CoW-aware filesystems, then overlayfs/ProjFS, then a git worktree / recursive-copy fallback).',
			options: [
				{ value: "none", label: "无", description: "无隔离" },
				{ value: "auto", label: "自动", description: "让 PAL 选择最佳可用后端" },
				{ value: "apfs", label: "APFS", description: "macOS clonefile reflink (APFS)" },
				{ value: "btrfs", label: "btrfs", description: "btrfs subvolume snapshot" },
				{ value: "zfs", label: "ZFS", description: "ZFS 快照 + 克隆" },
				{ value: "reflink", label: "Reflink", description: "Linux FICLONE 逐文件 reflink" },
				{
					value: "overlayfs",
					label: "Overlayfs",
					description: "Linux 内核 overlay（或 fuse-overlayfs 回退）",
				},
				{ value: "projfs", label: "ProjFS", description: "Windows 投影文件系统" },
				{
					value: "block-clone",
					label: "块克隆",
					description: "Windows FSCTL_DUPLICATE_EXTENTS_TO_FILE (NTFS/ReFS)（NTFS/ReFS 文件范围复制）",
				},
				{
					value: "rcopy",
					label: "递归复制",
					description: "git worktree if available, otherwise recursive copy",
				},
			],
		},
	},

	"task.isolation.apply": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "隔离",
			label: "应用隔离更改",
			description:
				"自动将成功的隔离任务更改应用到父检出；禁用则保留补丁或分支产物",
		},
	},

	"task.isolation.merge": {
		type: "enum",
		values: ["patch", "branch"] as const,
		default: "patch",
		ui: {
			tab: "tasks",
			group: "隔离",
			label: "隔离合并策略",
			description: "隔离任务更改如何集成（补丁应用或分支合并）",
			options: [
				{ value: "patch", label: "补丁", description: "合并差异并 git apply" },
				{ value: "branch", label: "分支", description: "每任务提交，使用 --no-ff 合并" },
			],
		},
	},

	"task.isolation.commits": {
		type: "enum",
		values: ["generic", "ai"] as const,
		default: "generic",
		ui: {
			tab: "tasks",
			group: "隔离",
			label: "隔离提交风格",
			description: "嵌套仓库更改的提交消息风格（通用或 AI 生成）",
			options: [
				{ value: "generic", label: "通用", description: "静态提交消息" },
				{ value: "ai", label: "AI", description: "从差异 AI 生成的提交消息" },
			],
		},
	},

	"worktree.base": {
		type: "string",
		default: undefined,
		ui: {
			tab: "tasks",
			group: "隔离",
			label: "工作树基础目录",
			description:
				"Base directory for agent-managed worktrees — task-isolation copies, `github` PR checkouts, and `omp worktree` cleanup all live here. Unset uses ~/.omp/wt. Must be an absolute or ~-relative path; relative paths are ignored. The OMP_WORKTREE_DIR env var overrides this. — 代理管理工作树的基础目录——任务隔离副本、`github` PR 检出和 `omp worktree` 清理都位于此处；未设置使用 ~/.omp/wt；必须是绝对路径或 ~ 相对路径，相对路径被忽略；OMP_WORKTREE_DIR 环境变量覆盖此设置。",
		},
	},

	"task.eager": {
		type: "enum",
		values: ["default", "preferred", "always"] as const,
		default: "default",
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "优先任务委派",
			description: "推动将工作委派给子代理的力度",
			options: [
				{ value: "default", label: "默认", description: "模型决定何时委派" },
				{ value: "preferred", label: "推荐", description: "向系统提示添加委派指导" },
				{ value: "always", label: "始终", description: "提示指导加上首轮委派提醒" },
			],
		},
	},

	"task.batch": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "批量任务调用",
			description:
				"Switch the task tool to its batch shape: one call carries { context, tasks[] } — one subagent per item, with an optional per-item agent (defaulting to the session spawn-policy agent), per-item isolation, and a required shared context prepended to every assignment. With async.enabled=true, each spawn runs as an independent background agent with the normal idle/parked lifecycle; otherwise the call blocks for merged results. Disable to restore the flat single-spawn schema. — 将 task 工具切换到批处理形态：一次调用携带 { context, tasks[] }——每项一个子代理，带可选的每项代理（默认为会话生成策略代理）、每项隔离，以及前置到每个任务分配的必需共享上下文；async.enabled=true 时每个生成作为独立后台代理运行，具有正常的空闲/驻留生命周期；否则调用阻塞以合并结果；禁用则恢复扁平的单生成模式。",
		},
	},

	"task.enableEffort": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "每任务努力",
			description:
				"在任务生成上暴露可选的 effort 参数，允许调用者覆盖每个子代理的思考级别",
		},
	},

	"task.maxConcurrency": {
		type: "number",
		default: 32,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "最大并发任务",
			description: "并发运行的子代理最大数量",
			options: [
				{ value: "0", label: "无限制" },
				{ value: "1", label: "1 个任务" },
				{ value: "2", label: "2 个任务" },
				{ value: "4", label: "4 个任务" },
				{ value: "8", label: "8 个任务" },
				{ value: "16", label: "16 个任务" },
				{ value: "32", label: "32 个任务" },
				{ value: "64", label: "64 个任务" },
			],
		},
	},

	"task.enableLsp": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "子代理中启用 LSP",
			description:
				"Allow subagents spawned via the task tool to use the lsp tool. Off by default to keep subagents cheap; enable when LSP-aware delegation is worth the extra tokens. — 允许通过 task 工具生成的子代理使用 lsp 工具；默认关闭以保持子代理廉价；当 LSP 感知委派值得额外 token 时启用。",
		},
	},

	"task.maxRecursionDepth": {
		type: "number",
		default: 2,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "最大任务递归",
			description: "子代理可生成自己的子代理的深度层级",
			options: [
				{ value: "-1", label: "无限制" },
				{ value: "0", label: "无" },
				{ value: "1", label: "单层" },
				{ value: "2", label: "双层" },
				{ value: "3", label: "三层" },
			],
		},
	},

	"task.maxRuntimeMs": {
		type: "number",
		default: 0,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "子代理最大运行时间",
			description:
				"Hard wall-clock limit per subagent (ms). 0 disables it. Defense-in-depth against provider-side stream hangs that escape the inference-layer watchdog; triggers a normal subagent abort with a 'timed out' reason. — 每个子代理的硬墙钟限制（毫秒）；0 禁用；纵深防御提供商侧流挂起（逃过推理层看门狗）；触发带 'timed out' 原因的普通子代理中止。",
			options: [
				{ value: "0", label: "无限制", description: "默认" },
				{ value: "300000", label: "5 分钟" },
				{ value: "900000", label: "15 分钟" },
				{ value: "1800000", label: "30 分钟" },
				{ value: "3600000", label: "1 小时" },
			],
		},
	},

	"task.agentIdleTtlMs": {
		type: "number",
		default: 420_000,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "代理空闲 TTL",
			description:
				"How long an idle subagent stays live in memory before being parked to disk (ms). Parked agents are revived automatically when messaged or resumed. 0 keeps idle agents live until exit. — 空闲子代理在驻留到磁盘前在内存中保持活跃的时长（毫秒）；驻留的代理在收到消息或恢复时自动唤醒；0 使空闲代理保持活跃直到退出。",
		},
	},

	"task.softRequestBudget": {
		type: "number",
		default: 200,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "子代理请求软预算",
			description:
				"Soft per-subagent request budget (assistant requests per run). Crossing it injects a wrap-up steering notice (see task.softRequestBudgetNotice); at 1.5x the budget the run is force-stopped and the agent must yield its partial findings. 0 disables the guard. Bundled scout/sonic agents use a lower built-in budget. — 每个子代理的软请求预算（每次运行的助手请求数）；超过时注入收尾转向通知（见 task.softRequestBudgetNotice）；达到预算的 1.5 倍时强制停止运行，代理必须交出部分发现；0 禁用防护；捆绑的 scout/sonic 代理使用较低的内置预算。",
			options: [
				{ value: "0", label: "禁用" },
				{ value: "90", label: "90 次请求" },
				{ value: "150", label: "150 次请求" },
				{ value: "200", label: "200 次请求", description: "默认" },
			],
		},
	},

	"task.softRequestBudgetNotice": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "软请求预算通知",
			description:
				"Inject one steering notice when a subagent crosses its soft request budget, asking it to wrap up before the 1.5x forced-yield stop. — 当子代理超过其软请求预算时注入一条转向通知，要求它在 1.5 倍强制让位停止前收尾。",
		},
	},

	"task.maxEffort": {
		type: "enum",
		values: THINKING_EFFORTS,
		default: "max",
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "每次生成最大努力",
			description:
				"Maximum reasoning effort allowed for the task tool's per-spawn effort hint. Lower values prevent callers from escalating subagents above this ceiling; the default preserves the model's full range. — task 工具每生成 effort 提示允许的最大推理努力；较低的值防止调用者将子代理升级到超过此上限；默认保留模型的完整范围。",
			options: THINKING_EFFORTS.map(getThinkingLevelMetadata),
		},
	},

	"task.disabledAgents": {
		type: "array",
		default: [] as string[],
	},

	"task.agentModelOverrides": {
		type: "record",
		default: {} as Record<string, string>,
	},
	"task.agentPrewalk": {
		type: "record",
		default: {} as Record<string, string>,
	},
	"task.prewalk": {
		type: "boolean",
		default: false,
		ui: {
			tab: "tasks",
			group: "子代理",
			label: "通用任务预检",
			description:
				"Arm prewalk for the bundled generic `task` subagent: it starts on its resolved model, plans and begins the implementation, then hands off to the 'smol' role at its first edit/write. Per-agent overrides (task.agentPrewalk, toggled with P in /agents) and user agent `prewalk` frontmatter apply regardless of this toggle. — 为捆绑的通用 `task` 子代理启用预检：它在解析的模型上开始，规划并开始实现，然后在首次编辑/写入时移交给 'smol' 角色；每代理覆盖（task.agentPrewalk，在 /agents 中用 P 切换）和用户代理 `prewalk` frontmatter 无论此开关如何都生效。",
		},
	},

	"tasks.todoClearDelay": {
		type: "number",
		default: 60,
		ui: {
			tab: "tools",
			group: "待办",
			label: "待办自动清除延迟",
			description: "已完成或放弃的待办从待办组件移除前的延迟",
			options: [
				{ value: "0", label: "立即" },
				{ value: "60", label: "1 分钟", description: "默认" },
				{ value: "300", label: "5 分钟" },
				{ value: "900", label: "15 分钟" },
				{ value: "1800", label: "30 分钟" },
				{ value: "3600", label: "1 小时" },
				{ value: "-1", label: "永不" },
			],
		},
	},

	"task.showResolvedModelBadge": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "显示",
			label: "显示已解析模型徽章",
			description: "在任务组件状态栏中显示每个子代理使用的实际模型 ID",
		},
	},

	// Skills
	"skills.enabled": { type: "boolean", default: true },

	"skills.enableSkillCommands": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "命令与技能",
			label: "技能命令",
			description: "将技能注册为 /skill:name 命令",
		},
	},

	"skills.enableCodexUser": { type: "boolean", default: true },

	"skills.enableClaudeUser": { type: "boolean", default: true },

	"skills.enableClaudeProject": { type: "boolean", default: true },

	"skills.enablePiUser": { type: "boolean", default: true },

	"skills.enablePiProject": { type: "boolean", default: true },

	"skills.enableAgentsUser": { type: "boolean", default: true },

	"skills.enableAgentsProject": { type: "boolean", default: true },

	"skills.customDirectories": { type: "array", default: [] as string[] },

	"skills.ignoredSkills": { type: "array", default: [] as string[] },

	"skills.includeSkills": { type: "array", default: [] as string[] },

	// Commands
	"commands.enableClaudeUser": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "命令与技能",
			label: "Claude 用户命令",
			description: "从 ~/.claude/commands/ 加载命令",
		},
	},

	"commands.enableClaudeProject": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "命令与技能",
			label: "Claude 项目命令",
			description: "从 .claude/commands/ 加载命令",
		},
	},

	"commands.enableOpencodeUser": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "命令与技能",
			label: "OpenCode 用户命令",
			description: "从 ~/.config/opencode/commands/ 加载命令",
		},
	},

	"commands.enableOpencodeProject": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tasks",
			group: "命令与技能",
			label: "OpenCode 项目命令",
			description: "从 .opencode/commands/ 加载命令",
		},
	},

	// ────────────────────────────────────────────────────────────────────────
	// Providers
	// ────────────────────────────────────────────────────────────────────────

	// Secret handling
	"secrets.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "providers",
			group: "隐私",
			label: "隐藏机密",
			description: "在发送给 AI 提供商前混淆配置的机密并编辑凭据形状的令牌",
		},
	},

	// Provider selection
	"providers.ollama-cloud.maxConcurrency": {
		type: "number",
		default: 3,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Ollama Cloud 最大并发",
			description:
				"每进程最大并发 Ollama Cloud 子代理运行数；0 禁用提供商特定限制",
		},
	},
	"providers.webSearchOrder": {
		type: "array",
		default: [] as SearchProviderId[],
		ui: {
			tab: "providers",
			group: "服务",
			label: "网络搜索提供商顺序",
			description:
				"web_search 工具的优先提供商；未列出的提供商之后保留其默认顺序",
			options: SEARCH_PROVIDER_CHOICES,
			ordered: true,
		},
	},
	"providers.webSearchExclude": {
		type: "array",
		default: [] as SearchProviderId[],
		ui: {
			tab: "providers",
			group: "服务",
			label: "排除的搜索提供商",
			description: "web_search 绝不应使用的提供商，即使作为回退",
			options: SEARCH_PROVIDER_CHOICES,
		},
	},
	"providers.webSearchGeminiModel": {
		type: "string",
		default: undefined,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Gemini web_search 模型",
			description: "Gemini Google Search grounding 的模型 ID。默认为 gemini-2.5-flash。",
		},
	},
	"providers.antigravityEndpoint": {
		type: "enum",
		values: ["auto", "production", "sandbox"] as const,
		default: "auto",
		ui: {
			tab: "providers",
			group: "服务",
			label: "Antigravity 端点模式",
			description: "google-antigravity 提供商的端点路由策略（chat、search、image、discovery）",
			options: [
				{
					value: "auto",
					label: "自动",
					description: "尝试生产端点，5xx/429 时故障转移到沙箱",
				},
				{
					value: "production",
					label: "仅生产环境",
					description: "仅强制生产端点",
				},
				{
					value: "sandbox",
					label: "仅沙箱",
					description: "仅强制沙箱端点",
				},
			],
		},
	},
	"providers.imageOrder": {
		type: "array",
		default: [] as ImageProvider[],
		ui: {
			tab: "providers",
			group: "服务",
			label: "图片提供商顺序",
			description:
				"图片生成的优先提供商；未列出的提供商遵循活动会话提供商和内置顺序",
			options: IMAGE_PROVIDER_CHOICES,
			ordered: true,
		},
	},
	"providers.fireworksTier": {
		type: "enum",
		values: ["standard", "priority"] as const,
		default: "standard",
		ui: {
			tab: "providers",
			group: "Fireworks",
			label: "Fireworks 等级",
			description:
				'Serving path for Fireworks requests. Priority sends `service_tier: "priority"` for higher reliability during peak traffic at a higher price; Standard omits it. Fast (`-fast`) models ignore this — Fast is its own serving path.',
			options: [
				{ value: "standard", label: "标准", description: "默认服务路径（无 service_tier）" },
				{
					value: "priority",
					label: "优先",
					description: "优先服务路径：更高可靠性，每 token 溢价定价",
				},
			],
		},
	},
	"live.voice": {
		type: "enum",
		values: LIVE_VOICE_VALUES,
		default: DEFAULT_LIVE_VOICE,
		ui: {
			tab: "providers",
			group: "服务",
			label: "实时语音",
			description: "Codex 支持的实时语音会话使用的声音",
			options: LIVE_VOICE_OPTIONS,
		},
	},
	"providers.tts": {
		type: "enum",
		values: ["auto", "local", "xai"] as const,
		default: "auto",
		ui: {
			tab: "providers",
			group: "服务",
			label: "文本转语音提供商",
			description: "tts 工具的后端：本地设备端神经 TTS (Kokoro-82M) 或 xAI Grok Voice",
			options: [
				{
					value: "auto",
					label: "自动",
					description: "优先本地设备端 TTS；存在凭据时将 .mp3 输出路由到 xAI",
				},
				{ value: "local", label: "本地", description: "设备端神经 TTS (Kokoro-82M)；输出为 WAV/PCM16" },
				{
					value: "xai",
					label: "xAI Grok Voice",
					description: "需要 xAI Grok OAuth 或 XAI_API_KEY；MP3 或 WAV",
				},
			],
		},
	},
	"tts.localModel": {
		type: "enum",
		values: TTS_LOCAL_MODEL_VALUES,
		default: DEFAULT_TTS_LOCAL_MODEL_KEY,
		ui: {
			tab: "providers",
			group: "服务",
			label: "本地 TTS 模型",
			description: "本地 TTS 后端使用的设备端神经 TTS 模型 (Kokoro-82M)",
			options: TTS_LOCAL_MODEL_OPTIONS,
		},
	},
	"tts.localVoice": {
		type: "enum",
		values: TTS_LOCAL_VOICE_VALUES,
		default: DEFAULT_TTS_VOICE,
		ui: {
			tab: "providers",
			group: "服务",
			label: "本地 TTS 语音",
			description: "本地 TTS 后端使用的 Kokoro 声音（美式/英式，女声/男声）",
			options: TTS_LOCAL_VOICE_OPTIONS,
		},
	},
	"speech.enabled": {
		type: "boolean",
		default: false,
		ui: {
			tab: "providers",
			group: "服务",
			label: "语音朗读",
			description: "流式输出时通过扬声器朗读助手输出",
		},
	},
	"speech.mode": {
		type: "enum",
		values: ["all", "assistant", "yield"] as const,
		default: "assistant",
		ui: {
			tab: "providers",
			group: "服务",
			label: "语音朗读模式",
			description:
				"朗读内容：all = 助手消息 + 思考；assistant = 仅消息；yield = 仅轮次结束时的最终消息",
			options: [
				{ value: "all", label: "全部（消息 + 思考）" },
				{ value: "assistant", label: "仅助手消息" },
				{ value: "yield", label: "仅最终消息" },
			],
		},
	},
	"speech.enhanced": {
		type: "boolean",
		default: false,
		ui: {
			tab: "providers",
			group: "服务",
			label: "增强语音重写",
			description:
				"Rewrite assistant output into natural spoken prose with the tiny/smol model before synthesis (describes code, drops links and markdown). Falls back to mechanical cleanup on failure. — 在合成前用 tiny/smol 模型将助手输出重写为自然的口语化散文（描述代码、丢弃链接和 markdown）；失败时回退到机械清理。",
		},
	},
	"speech.voice": {
		type: "enum",
		values: TTS_LOCAL_VOICE_VALUES,
		default: DEFAULT_TTS_VOICE,
		ui: {
			tab: "providers",
			group: "服务",
			label: "语音朗读音色",
			description: "朗读助手输出时使用的 Kokoro 声音",
			options: TTS_LOCAL_VOICE_OPTIONS,
		},
	},
	"providers.tinyModel": {
		type: "enum",
		values: TINY_TITLE_MODEL_VALUES,
		default: ONLINE_TINY_TITLE_MODEL_KEY,
		ui: {
			tab: "providers",
			group: "微型模型",
			label: "微型模型",
			description:
				"会话标题模型：默认在线（来自 /models 的 TINY 角色，否则 @smol），或本地设备端模型",
			options: TINY_TITLE_MODEL_OPTIONS,
		},
	},
	"providers.tinyModelDevice": {
		type: "enum",
		values: TINY_MODEL_DEVICE_SETTING_VALUES,
		default: TINY_MODEL_DEVICE_DEFAULT,
		ui: {
			tab: "providers",
			group: "微型模型",
			label: "微型模型设备",
			description:
				"ONNX execution provider for local tiny models (titles + memory). Default uses CPU-only inference. The PI_TINY_DEVICE env var overrides this. — 本地微型模型（标题 + 记忆）的 ONNX 执行提供程序；默认使用仅 CPU 推理；PI_TINY_DEVICE 环境变量覆盖此设置。",
			options: TINY_MODEL_DEVICE_SETTING_OPTIONS,
		},
	},
	"providers.tinyModelDtype": {
		type: "enum",
		values: TINY_MODEL_DTYPE_SETTING_VALUES,
		default: TINY_MODEL_DTYPE_DEFAULT,
		ui: {
			tab: "providers",
			group: "微型模型",
			label: "微型模型精度",
			description:
				"ONNX quantization/precision for local tiny models. Default uses each model's shipped dtype (q4); lower precision is faster, higher is more faithful. The PI_TINY_DTYPE env var overrides this. — 本地微型模型的 ONNX 量化/精度；默认使用每个模型自带的 dtype (q4)；更低精度更快，更高精度更忠实；PI_TINY_DTYPE 环境变量覆盖此设置。",
			options: TINY_MODEL_DTYPE_SETTING_OPTIONS,
		},
	},
	"providers.memoryModel": {
		type: "enum",
		values: TINY_MEMORY_MODEL_VALUES,
		default: ONLINE_MEMORY_MODEL_KEY,
		ui: {
			tab: "memory",
			group: "通用",
			label: "记忆模型",
			description:
				"Mnemopi LLM for fact extraction + consolidation: online (the TINY role from /models, else smol/remote) by default, or a local on-device model. — 用于事实提取 + 整合的 Mnemopi LLM：默认在线（来自 /models 的 TINY 角色，否则 smol/remote），或本地设备端模型。",
			condition: "mnemopiActive",
			options: TINY_MEMORY_MODEL_OPTIONS,
		},
	},

	"providers.autoThinkingModel": {
		type: "enum",
		values: AUTO_THINKING_MODEL_VALUES,
		default: ONLINE_AUTO_THINKING_MODEL_KEY,
		ui: {
			tab: "model",
			group: "思考",
			label: "自动思考模型",
			description:
				"Difficulty classifier for the `auto` thinking level: online (the TINY role from /models, else smol) by default, or a local on-device model. — `auto` 思考级别的难度分类器：默认在线（来自 /models 的 TINY 角色，否则 smol），或本地设备端模型。",
			condition: "autoThinkingActive",
			options: AUTO_THINKING_MODEL_OPTIONS,
		},
	},
	"features.unexpectedStopDetection": {
		type: "boolean",
		default: false,
		ui: {
			tab: "interaction",
			group: "代理",
			label: "检测意外停止",
			description:
				"Use a small model to detect when the assistant says it will continue but stops without tool calls; automatically prompt it to continue. — 使用小模型检测助手何时说会继续但未调用工具就停止；自动提示它继续。",
		},
	},
	"providers.unexpectedStopModel": {
		type: "enum",
		values: TINY_MEMORY_MODEL_VALUES,
		default: ONLINE_MEMORY_MODEL_KEY,
		ui: {
			tab: "providers",
			group: "微型模型",
			label: "意外停止检测模型",
			description:
				"Classifier for unexpected-stop detection: online (the TINY role from /models, else smol) by default, or a local on-device model. — 意外停止检测的分类器：默认在线（来自 /models 的 TINY 角色，否则 smol），或本地设备端模型。",
			condition: "unexpectedStopDetection",
			options: TINY_MEMORY_MODEL_OPTIONS,
		},
	},

	"providers.kimiApiFormat": {
		type: "enum",
		values: ["auto", "openai", "anthropic"] as const,
		default: "auto",
		ui: {
			tab: "providers",
			group: "协议",
			label: "Kimi API 格式",
			description: "Kimi Code 提供商的 API 格式（自动跟随实时模型元数据）",
			options: [
				{ value: "auto", label: "自动", description: "使用模型服务器声明的协议" },
				{ value: "openai", label: "OpenAI", description: "api.kimi.com" },
				{ value: "anthropic", label: "Anthropic", description: "api.moonshot.ai" },
			],
		},
	},

	"providers.openaiWebsockets": {
		type: "enum",
		values: ["auto", "off", "on"] as const,
		default: "auto",
		ui: {
			tab: "providers",
			group: "协议",
			label: "OpenAI WebSocket",
			description: "OpenAI Codex 模型的 WebSocket 策略（auto 使用模型默认，on 强制，off 禁用）",
			options: [
				{ value: "auto", label: "自动", description: "使用模型/提供商默认 WebSocket 行为" },
				{ value: "off", label: "关闭", description: "为 OpenAI Codex 模型禁用 WebSocket" },
				{ value: "on", label: "开启", description: "为 OpenAI Codex 模型强制 WebSocket" },
			],
		},
	},

	"providers.streamFirstEventTimeoutSeconds": {
		type: "number",
		default: -1,
		ui: {
			tab: "providers",
			group: "超时",
			label: "流首事件超时",
			description:
				"等待第一个模型流事件的秒数；-1 使用提供商/环境默认，0 禁用看门狗",
			options: [
				{ value: "-1", label: "自动", description: "使用提供商默认值和 PI_* 超时环境变量" },
				{ value: "0", label: "关闭", description: "禁用首事件超时" },
				{ value: "300", label: "5 分钟" },
				{ value: "600", label: "10 分钟" },
				{ value: "1800", label: "30 分钟" },
			],
		},
	},

	"providers.streamIdleTimeoutSeconds": {
		type: "number",
		default: -1,
		ui: {
			tab: "providers",
			group: "超时",
			label: "流空闲超时",
			description:
				"模型流在事件之间可保持静默的秒数；-1 使用提供商/环境默认，0 禁用看门狗",
			options: [
				{ value: "-1", label: "自动", description: "使用提供商默认值和 PI_* 超时环境变量" },
				{ value: "0", label: "关闭", description: "禁用空闲超时" },
				{ value: "300", label: "5 分钟" },
				{ value: "600", label: "10 分钟" },
				{ value: "1800", label: "30 分钟" },
			],
		},
	},

	"providers.openrouterVariant": {
		type: "enum",
		values: ["default", "nitro", "floor", "online", "exacto"] as const,
		default: "default",
		ui: {
			tab: "providers",
			group: "协议",
			label: "OpenRouter 路由",
			description:
				"追加到 OpenRouter 模型 ID 的默认路由变体后缀（选择器已命名变体时覆盖）",
			options: [
				{ value: "default", label: "默认", description: "无后缀；使用 OpenRouter 默认路由" },
				{ value: "nitro", label: ":nitro", description: "优先吞吐量 / 最低延迟" },
				{ value: "floor", label: ":floor", description: "优先最便宜的可用提供商" },
				{ value: "online", label: ":online", description: "启用 OpenRouter 的 web-search 插件" },
				{
					value: "exacto",
					label: ":exacto",
					description: "精选的高质量提供商（仅对特定模型定义）",
				},
			],
		},
	},
	"providers.fetch": {
		type: "enum",
		values: ["auto", "native", "trafilatura", "lynx", "parallel", "jina"] as const,
		default: "auto",
		ui: {
			tab: "providers",
			group: "服务",
			label: "抓取提供商",
			description: "fetch/read URL 工具的读取器后端优先级",
			options: [
				{
					value: "auto",
					label: "自动",
					description: "优先级：native > trafilatura > lynx > parallel > jina",
				},
				{ value: "native", label: "原生", description: "进程内 HTML→Markdown 转换器（始终可用）" },
				{ value: "trafilatura", label: "Trafilatura", description: "通过 uv/pip 自动安装" },
				{ value: "lynx", label: "Lynx", description: "需要 lynx 系统包" },
				{ value: "parallel", label: "Parallel", description: "需要 PARALLEL_API_KEY" },
				{ value: "jina", label: "Jina", description: "使用 r.jina.ai 读取器（JINA_API_KEY 可选）" },
			],
		},
	},
	// Codex saved rate-limit resets (auto-redeem)
	"codexResets.autoRedeem": {
		type: "enum",
		values: ["unset", "yes", "no"] as const,
		default: "unset" as const,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Codex 自动赎回已保存重置",
			description:
				"When a turn is blocked by the Codex weekly limit on the active account and no other account is available, run the conservative saved-reset check. unset asks before spending the first eligible reset, yes spends eligible resets without prompting, and no disables the check entirely. Requires retries enabled. — 当活动账户的 Codex 周限额阻止一轮且没有其他账户可用时，运行保守的已保存重置检查；unset 在花费第一个符合条件的重置前询问，yes 不提示即花费符合条件的重置，no 完全禁用检查；需要启用重试。",
			options: [
				{
					value: "unset",
					label: "未设置",
					description: "检查资格，然后在花费第一个已保存重置前询问。",
				},
				{ value: "yes", label: "是", description: "不提示即花费符合条件的已保存重置。" },
				{ value: "no", label: "否", description: "不运行已保存重置自动赎回检查。" },
			],
		},
	},
	"codexResets.minBlockedMinutes": {
		type: "number",
		default: 60,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Codex 自动赎回最小阻塞",
			description:
				"Only auto-redeem when the natural weekly reset is at least this many minutes away (don't spend a ~30-day credit to save a short wait). — 仅当自然周重置至少还有这么多分钟时才自动赎回（不要为了节省短暂等待而花费约 30 天的额度）。",
		},
	},
	"codexResets.keepCredits": {
		type: "number",
		default: 0,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Codex 自动赎回保留",
			description: "Never auto-spend below this many saved resets (0 = the last credit may be spent automatically). — 低于这么多已保存重置时绝不自动花费（0 = 最后一个额度可自动花费）。",
		},
	},
	"provider.appendOnlyContext": {
		type: "enum",
		values: ["auto", "on", "off"] as const,
		default: "auto",
		ui: {
			tab: "providers",
			group: "协议",
			label: "仅追加上下文",
			description:
				"Cache system prompt + tool specs and keep an append-only message log so provider prefix caches (DeepSeek, Xiaomi/SGLang, Anthropic) hit at maximum rate. Auto enables for known prefix-cache providers. — 缓存系统提示 + 工具规格并保持仅追加的消息日志，使提供商前缀缓存（DeepSeek、Xiaomi/SGLang、Anthropic）以最大速率命中；Auto 为已知前缀缓存提供商启用。",
			options: [
				{ value: "auto", label: "自动", description: "为已知前缀缓存提供商启用（推荐）" },
				{ value: "on", label: "开启", description: "始终启用仅追加上下文" },
				{ value: "off", label: "关闭", description: "禁用仅追加上下文" },
			],
		},
	},

	// Exa
	"exa.enabled": {
		type: "boolean",
		default: true,
		ui: { tab: "providers", group: "服务", label: "Exa", description: "所有 Exa 搜索工具的总开关" },
	},

	"exa.enableSearch": {
		type: "boolean",
		default: true,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Exa 搜索",
			description: "启用 Exa 基础搜索、深度搜索、代码搜索和爬取工具",
		},
	},

	"exa.searchDelayMs": {
		type: "number",
		default: 1_000,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Exa 搜索延迟",
			description: "Exa 网络搜索请求之间的最小延迟（毫秒）；设为 0 禁用节奏控制",
		},
	},

	"exa.enableResearcher": {
		type: "boolean",
		default: false,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Exa 研究员",
			description: "启用 Exa 研究员工具进行 AI 驱动的深度研究",
		},
	},

	"exa.enableWebsets": {
		type: "boolean",
		default: false,
		ui: {
			tab: "providers",
			group: "服务",
			label: "Exa Websets",
			description: "启用 Exa webset 管理和增强工具",
		},
	},

	// SearXNG
	"searxng.endpoint": {
		type: "string",
		default: undefined,
		ui: {
			tab: "providers",
			group: "服务",
			label: "SearXNG 端点",
			description: "用于网络搜索的自托管 SearXNG 实例的基础 URL",
		},
	},

	"searxng.token": {
		type: "string",
		default: undefined,
		credential: true,
	},

	"searxng.basicUsername": {
		type: "string",
		default: undefined,
	},

	"searxng.basicPassword": {
		type: "string",
		default: undefined,
		credential: true,
	},

	"searxng.categories": {
		type: "string",
		default: undefined,
	},

	"searxng.engines": {
		type: "string",
		default: undefined,
	},

	"searxng.language": {
		type: "string",
		default: undefined,
	},

	"commit.mapReduceEnabled": { type: "boolean", default: true },

	"commit.mapReduceMinFiles": { type: "number", default: 4 },

	"commit.mapReduceMaxFileTokens": { type: "number", default: 50000 },

	"commit.mapReduceTimeoutMs": { type: "number", default: 120000 },

	"commit.mapReduceMaxConcurrency": { type: "number", default: 5 },

	"commit.changelogMaxDiffChars": { type: "number", default: 120000 },

	"dev.autoqa": {
		type: "boolean",
		default: true,
		ui: {
			tab: "tools",
			group: "开发者",
			label: "自动 QA",
			description:
				"Automated tool issue reporting (xd://report_issue). On by default; the first report asks for consent, and denying it disables reporting until re-enabled explicitly. — 自动化工具问题报告 (xd://report_issue)；默认开启；首次报告征求同意，拒绝则禁用报告直到显式重新启用。",
		},
	},

	"dev.autoqaPush.endpoint": {
		type: "string",
		default: "https://qa.omp.sh/v1/grievances" as const,
		ui: {
			tab: "tools",
			group: "开发者",
			label: "自动 QA 推送端点",
			description: "接收 Auto QA JSON 报告的完整 URL（默认 https://qa.omp.sh/v1/grievances）",
		},
	},

	"dev.autoqaPush.token": {
		type: "string",
		default: undefined,
		credential: true,
	},

	/**
	 * User decision on sharing automatic `report_tool_issue` grievances.
	 *
	 *   - `"unset"`  — never asked; the first `report_tool_issue` invocation
	 *                  pops a consent dialog and persists the answer here.
	 *   - `"granted"` — record and (when push is configured) ship grievances.
	 *   - `"denied"`  — silently no-op every `report_tool_issue` call.
	 *
	 * Owned by `packages/coding-agent/src/tools/report-tool-issue.ts` via the
	 * process-global consent handler registered by `InteractiveMode`.
	 *
	 * @default "unset"
	 */
	"dev.autoqaConsent": {
		type: "enum",
		values: ["unset", "granted", "denied"] as const,
		default: "unset" as const,
	},

	"gc.blobs": { type: "boolean", default: true },

	"gc.archive": { type: "boolean", default: true },

	"gc.wal": { type: "boolean", default: true },

	"gc.coldArchiveAfterDays": { type: "number", default: 30 },

	"gc.retainNewestGlobal": { type: "number", default: 20 },

	"gc.retainNewestPerCwd": { type: "number", default: 10 },

	"thinkingBudgets.minimal": { type: "number", default: 1024 },

	"thinkingBudgets.low": { type: "number", default: 2048 },

	"thinkingBudgets.medium": { type: "number", default: 8192 },

	"thinkingBudgets.high": { type: "number", default: 16384 },

	"thinkingBudgets.xhigh": { type: "number", default: 32768 },

	"thinkingBudgets.max": { type: "number", default: 32768 },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Type Inference
// ═══════════════════════════════════════════════════════════════════════════

type Schema = typeof SETTINGS_SCHEMA;

/** All valid setting paths */
export type SettingPath = keyof Schema;

/** Infer the value type for a setting path */
export type SettingValue<P extends SettingPath> = Schema[P] extends { type: "boolean"; default: undefined }
	? boolean | undefined
	: Schema[P] extends { type: "boolean" }
		? boolean
		: Schema[P] extends { type: "string" }
			? string | undefined
			: Schema[P] extends { type: "number"; default: undefined }
				? number | undefined
				: Schema[P] extends { type: "number" }
					? number
					: Schema[P] extends { type: "enum"; values: infer V }
						? V extends readonly string[]
							? V[number]
							: never
						: Schema[P] extends { type: "array"; default: infer D }
							? D
							: Schema[P] extends { type: "record"; default: infer D }
								? D
								: never;

/** Get the default value for a setting path */
export function getDefault<P extends SettingPath>(path: P): SettingValue<P> {
	return SETTINGS_SCHEMA[path].default as SettingValue<P>;
}

/** Check if a path has UI metadata (should appear in settings panel) */
export function hasUi(path: SettingPath): boolean {
	return "ui" in SETTINGS_SCHEMA[path];
}

/**
 * Whether a setting holds a credential and must never be printed or exported
 * without an explicit request. Drives both CLI redaction and settings-panel
 * masking, so the two cannot disagree.
 */
export function isCredential(path: SettingPath): boolean {
	const def = SETTINGS_SCHEMA[path];
	if ("credential" in def && def.credential === true) return true;
	// `ui.secret` predates this marker and still means "never display". Reading
	// both here keeps ONE accessor, so the two spellings cannot produce
	// different behaviour on different surfaces.
	return getUi(path)?.secret === true;
}

/** Get UI metadata for a path (undefined if no UI) */
export function getUi(path: SettingPath): AnyUiMetadata | undefined {
	const def = SETTINGS_SCHEMA[path];
	return "ui" in def ? (def.ui as AnyUiMetadata) : undefined;
}

/** Get all paths for a specific tab */
export function getPathsForTab(tab: SettingTab): SettingPath[] {
	return (Object.keys(SETTINGS_SCHEMA) as SettingPath[]).filter(path => {
		const ui = getUi(path);
		return ui?.tab === tab;
	});
}

/** Get the type of a setting */
export function getType(path: SettingPath): SettingDef["type"] {
	return SETTINGS_SCHEMA[path].type;
}

/** Get enum values for an enum setting */
export function getEnumValues(path: SettingPath): readonly string[] | undefined {
	const def = SETTINGS_SCHEMA[path];
	return "values" in def ? (def.values as readonly string[]) : undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// Derived Types from Schema
// ═══════════════════════════════════════════════════════════════════════════

/** Status line preset - derived from schema */
export type StatusLinePreset = SettingValue<"statusLine.preset">;

/** Status line separator style - derived from schema */
export type StatusLineSeparatorStyle = SettingValue<"statusLine.separator">;

/** Tree selector filter mode - derived from schema */
export type TreeFilterMode = SettingValue<"treeFilterMode">;

/** Personality preset - derived from schema */
export type Personality = SettingValue<"personality">;

// ═══════════════════════════════════════════════════════════════════════════
// Typed Group Definitions
// ═══════════════════════════════════════════════════════════════════════════

export interface CompactionSettings {
	enabled: boolean;
	strategy: "context-full" | "handoff" | "shake" | "snapcompact" | "off";
	thresholdPercent: number;
	thresholdTokens: number;
	reserveTokens: number | undefined;
	keepRecentTokens: number;
	midTurnEnabled: boolean;
	handoffSaveToDisk: boolean;
	autoContinue: boolean;
	remoteEnabled: boolean;
	remoteEndpoint: string | undefined;
	remoteStreamingV2Enabled: boolean;
	v2RetainedMessageBudget: number;
	idleEnabled: boolean;
	idleThresholdTokens: number;
	idleTimeoutSeconds: number;
	supersedeReads: boolean;
	dropUseless: boolean;
}

export interface RecapSettings {
	enabled: boolean;
	idleSeconds: number;
}

export interface TitleSettings {
	refreshOnReplan: boolean;
}

export interface ContextPromotionSettings {
	enabled: boolean;
}
export interface RetrySettings {
	enabled: boolean;
	maxRetries: number;
	baseDelayMs: number;
	maxDelayMs: number;
	modelFallback: boolean;
	usageAwareFallback: boolean;
	usageReservePct: number;
	usageReservePolicy: "confirm" | "auto" | "fail-closed";
}

export interface MemoriesSettings {
	enabled: boolean;
	maxRolloutsPerStartup: number;
	maxRolloutAgeDays: number;
	minRolloutIdleHours: number;
	threadScanLimit: number;
	maxRawMemoriesForGlobal: number;
	stage1Concurrency: number;
	stage1LeaseSeconds: number;
	stage1RetryDelaySeconds: number;
	phase2LeaseSeconds: number;
	phase2RetryDelaySeconds: number;
	phase2HeartbeatSeconds: number;
	rolloutPayloadPercent: number;
	fallbackTokenLimit: number;
	summaryInjectionTokenLimit: number;
}

export interface TodoCompletionSettings {
	enabled: boolean;
	maxReminders: number;
}

export interface BranchSummarySettings {
	enabled: boolean;
	reserveTokens: number;
}

export interface SkillsSettings {
	enabled?: boolean;
	enableSkillCommands?: boolean;
	enableCodexUser?: boolean;
	enableClaudeUser?: boolean;
	enableClaudeProject?: boolean;
	enablePiUser?: boolean;
	enablePiProject?: boolean;
	enableAgentsUser?: boolean;
	enableAgentsProject?: boolean;
	customDirectories?: string[];
	ignoredSkills?: string[];
	includeSkills?: string[];
	disabledExtensions?: string[];
}

export interface CommitSettings {
	mapReduceEnabled: boolean;
	mapReduceMinFiles: number;
	mapReduceMaxFileTokens: number;
	mapReduceTimeoutMs: number;
	mapReduceMaxConcurrency: number;
	changelogMaxDiffChars: number;
}

export interface TtsrSettings {
	enabled: boolean;
	contextMode: "discard" | "keep";
	interruptMode: "never" | "prose-only" | "tool-only" | "always";
	repeatMode: "once" | "after-gap";
	repeatGap: number;
	/** Bucketing-only (read by bucketRules, not the TtsrManager). */
	builtinRules?: boolean;
	/** Bucketing-only (read by bucketRules, not the TtsrManager). */
	disabledRules?: string[];
}

export interface ExaSettings {
	enabled: boolean;
	enableSearch: boolean;
	searchDelayMs: number;
	enableResearcher: boolean;
	enableWebsets: boolean;
}

export interface StatusLineSettings {
	preset: StatusLinePreset;
	separator: StatusLineSeparatorStyle;
	showHookStatus: boolean;
	leftSegments: StatusLineSegmentId[];
	rightSegments: StatusLineSegmentId[];
	segmentOptions: Record<string, unknown>;
}

export interface ThinkingBudgetsSettings {
	minimal: number;
	low: number;
	medium: number;
	high: number;
	xhigh: number;
	max: number;
}

export interface SttSettings {
	enabled: boolean;
	language: string | undefined;
	modelName: string;
	streaming: boolean;
}

export interface BashInterceptorRule {
	pattern: string;
	flags?: string;
	tool: string;
	message: string;
	allowSubcommands?: string[];
}

export interface ShellMinimizerSettings {
	enabled: boolean;
	settingsPath: string | undefined;
	only: string[];
	except: string[];
	maxCaptureBytes: number;
	sourceOutlineLevel: "default" | "aggressive";
	legacyFilters: boolean | undefined;
}
export type CodexAutoRedeemMode = "unset" | "yes" | "no";

export interface CodexResetsSettings {
	autoRedeem: CodexAutoRedeemMode;
	minBlockedMinutes: number;
	keepCredits: number;
}

export interface GcSettings {
	blobs: boolean;
	archive: boolean;
	wal: boolean;
	coldArchiveAfterDays: number;
	retainNewestGlobal: number;
	retainNewestPerCwd: number;
}

/** Map group prefix -> typed settings interface */
export interface GroupTypeMap {
	compaction: CompactionSettings;
	recap: RecapSettings;
	title: TitleSettings;
	contextPromotion: ContextPromotionSettings;
	retry: RetrySettings;
	memories: MemoriesSettings;
	branchSummary: BranchSummarySettings;
	skills: SkillsSettings;
	commit: CommitSettings;
	ttsr: TtsrSettings;
	exa: ExaSettings;
	statusLine: StatusLineSettings;
	thinkingBudgets: ThinkingBudgetsSettings;
	stt: SttSettings;
	modelRoles: Record<string, string>;
	modelTags: ModelTagsSettings;
	cycleOrder: string[];
	shellMinimizer: ShellMinimizerSettings;
	codexResets: CodexResetsSettings;
	gc: GcSettings;
}

export type GroupPrefix = keyof GroupTypeMap;
