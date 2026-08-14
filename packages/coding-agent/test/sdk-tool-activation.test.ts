import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getBundledModel } from "@oh-my-pi/pi-catalog/models";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import type { MCPManager } from "@oh-my-pi/pi-coding-agent/mcp/manager";
import {
	type CreateAgentSessionOptions,
	type CustomTool,
	createAgentSession,
	discoverAuthStorage,
	type ExtensionFactory,
} from "@oh-my-pi/pi-coding-agent/sdk";
import { SessionManager } from "@oh-my-pi/pi-coding-agent/session/session-manager";
import { VIBE_TOOL_NAMES } from "@oh-my-pi/pi-coding-agent/tools/vibe";
import { logger, removeSyncWithRetries, Snowflake } from "@oh-my-pi/pi-utils";
import { type } from "arktype";

const toolActivationExtension: ExtensionFactory = pi => {
	pi.registerTool({
		name: "default_inactive_tool",
		label: "Default Inactive Tool",
		description: "Tool hidden from the initial active set unless explicitly requested.",
		parameters: type({}),
		defaultInactive: true,
		async execute() {
			return { content: [{ type: "text", text: "inactive" }] };
		},
	});
	pi.registerTool({
		name: "default_active_tool",
		label: "Default Active Tool",
		description: "Tool included in the initial active set.",
		parameters: type({}),
		async execute() {
			return { content: [{ type: "text", text: "active" }] };
		},
	});
};

const sdkCustomTool = {
	name: "sdk_custom_tool",
	label: "SDK Custom Tool",
	description: "SDK-provided custom tool used to verify activation boundaries.",
	parameters: type({}),
	async execute() {
		return { content: [{ type: "text", text: "sdk custom" }] };
	},
} satisfies CustomTool;

describe("createAgentSession defaultInactive tool activation", () => {
	const tempDirs: string[] = [];

	// Built once and shared by every session. `ModelRegistry` eagerly loads all
	// bundled + cached models and `discoverAuthStorage` opens the auth DB — the
	// dominant (~50ms) slice of a cold boot, and identical for every test here.
	// Injecting it drops each per-test boot to the ~4ms of activation-specific work
	// these tests vary, and skips the background model refresh the SDK would
	// otherwise start when it builds its own registry.
	let modelRegistry!: ModelRegistry;
	let registryAuthDir: string;

	const makeTempDir = (): string => {
		const tempDir = path.join(os.tmpdir(), `pi-sdk-tool-activation-${Snowflake.next()}`);
		tempDirs.push(tempDir);
		fs.mkdirSync(tempDir, { recursive: true });
		return tempDir;
	};

	beforeAll(async () => {
		registryAuthDir = path.join(os.tmpdir(), `pi-sdk-tool-activation-auth-${Snowflake.next()}`);
		fs.mkdirSync(registryAuthDir, { recursive: true });
		modelRegistry = new ModelRegistry(await discoverAuthStorage(registryAuthDir));
	});

	// Shared options for every session. `rules: []` and `workspaceTree` short-circuit
	// the two slow startup scans (rule discovery + native workspace walk, ~100ms each)
	// that are irrelevant to tool activation: these tests assert only which tools are
	// registered/active and that tool names appear in the system prompt. The shared
	// `modelRegistry` is injected here; each call still returns fresh
	// `settings`/`sessionManager` instances to keep tests isolated.
	const baseOptions = (tempDir: string): CreateAgentSessionOptions => ({
		cwd: tempDir,
		agentDir: tempDir,
		modelRegistry,
		sessionManager: SessionManager.inMemory(),
		settings: Settings.isolated(),
		model: getBundledModel("openai", "gpt-4o-mini"),
		disableExtensionDiscovery: true,
		skills: [],
		contextFiles: [],
		promptTemplates: [],
		slashCommands: [],
		enableMCP: false,
		enableLsp: false,
		rules: [],
		workspaceTree: { rootPath: tempDir, rendered: "", truncated: false, totalLines: 0, agentsMdFiles: [] },
	});

	afterEach(() => {
		for (const tempDir of tempDirs.splice(0)) {
			removeSyncWithRetries(tempDir);
		}

		vi.restoreAllMocks();
	});

	afterAll(() => {
		removeSyncWithRetries(registryAuthDir);
	});

	it("excludes defaultInactive extension tools from the initial active set unless explicitly requested", async () => {
		const tempDir = makeTempDir();

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			extensions: [toolActivationExtension],
		});

		try {
			expect(session.getAllToolNames()).toEqual(
				expect.arrayContaining(["default_active_tool", "default_inactive_tool"]),
			);
			// Discoverable extension tools mount as xd:// devices, not top-level active tools.
			const deviceNames = session.getXdevToolEntries().map(entry => entry.name);
			expect(deviceNames).toContain("default_active_tool");
			expect(session.getActiveToolNames()).not.toContain("default_active_tool");
			expect(deviceNames).not.toContain("default_inactive_tool");
			expect(session.getActiveToolNames()).not.toContain("default_inactive_tool");
			expect(session.systemPrompt.join("\n")).toContain("default_active_tool");
			expect(session.systemPrompt.join("\n")).not.toContain("default_inactive_tool");
		} finally {
			await session.dispose();
		}
	});

	it("forwards built-in and external xd:// devices to Cursor provider contexts", async () => {
		const tempDir = makeTempDir();
		const cursorModel = getBundledModel("cursor", "composer-1.5");
		if (!cursorModel) throw new Error("expected bundled Cursor model");
		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			model: cursorModel,
		});
		const externalMcpTool: CustomTool = {
			name: "mcp__fixture_report",
			label: "fixture/report",
			description: "Report a fixture result.",
			parameters: type({}),
			strict: true,
			mcpServerName: "fixture",
			mcpToolName: "report",
			async execute() {
				return { content: [{ type: "text", text: "reported" }] };
			},
		};

		try {
			await session.refreshMCPTools([externalMcpTool]);
			const deviceNames = session.getXdevToolEntries().map(entry => entry.name);
			expect(deviceNames).toEqual(expect.arrayContaining(["ast_edit", "mcp__fixture_report"]));
			expect(session.getActiveToolNames()).not.toContain("mcp__fixture_report");

			const context = await session.agent.buildSideRequestContext([]);
			const providerToolNames = context.tools?.map(tool => tool.name);
			expect(providerToolNames).toEqual(expect.arrayContaining(["ast_edit", "mcp__fixture_report"]));
		} finally {
			await session.dispose();
		}
	});

	it("allows explicitly requested defaultInactive extension tools into the initial active set", async () => {
		const tempDir = makeTempDir();

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			extensions: [toolActivationExtension],
			toolNames: ["read", "default_inactive_tool"],
		});

		try {
			expect(session.getActiveToolNames()).toEqual(
				expect.arrayContaining(["read", "default_inactive_tool", "write"]),
			);
			expect(session.getActiveToolNames()).not.toContain("default_active_tool");
			expect(session.getXdevToolEntries().map(entry => entry.name)).toContain("default_active_tool");
			expect(session.getXdevToolEntries().map(entry => entry.name)).not.toContain("default_inactive_tool");
			expect(session.systemPrompt.join("\n")).toContain("default_inactive_tool");
		} finally {
			await session.dispose();
		}
	});

	it("activates the yield tool when requireYieldTool is set and toolNames is explicit", async () => {
		// Regression for #1408: plan-mode subagents pass an explicit `toolNames` list
		// (e.g. `["read", "grep", "glob", "lsp", "web_search"]`). Without this
		// invariant, `yield` ended up registered but not active, and the model
		// could not satisfy the idle-reminder contract that demands a `yield` call.
		const tempDir = makeTempDir();

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			requireYieldTool: true,
			toolNames: ["read", "grep", "glob", "web_search"],
		});

		try {
			expect(session.getActiveToolNames()).toContain("yield");
		} finally {
			await session.dispose();
		}
	});

	it("normalizes legacy builtin toolNames before selecting the active SDK tools", async () => {
		const tempDir = makeTempDir();

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			toolNames: ["read", "search", "find"],
		});

		try {
			const activeToolNames = session.getActiveToolNames();

			expect(activeToolNames).toContain("read");
			expect(activeToolNames).toContain("grep");
			expect(activeToolNames).toContain("glob");
			expect(activeToolNames).not.toContain("search");
			expect(activeToolNames).not.toContain("find");
		} finally {
			await session.dispose();
		}
	});

	it("keeps the write tool registered for plan mode even when no deferrable tool is requested", async () => {
		// Regression for #1428 (adapted to the xd://propose device): plan mode
		// submits its finalized plan by writing the chosen slug/title to
		// xd://propose, dispatched through the plan-proposal handler
		// (interactive-mode.ts: `setPlanProposalHandler`). With an explicit
		// read-only `toolNames` (e.g. `read`, `search`, `find`, `web_search`)
		// the registry has no `write` and no `deferrable` tool; dropping it would
		// silently activate plan mode with no way to submit the plan.
		const tempDir = makeTempDir();

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			toolNames: ["read", "grep", "glob", "web_search"],
		});

		try {
			expect(session.getToolByName("write")).toBeDefined();
		} finally {
			await session.dispose();
		}
	});

	it("does not force write into the registry when neither a deferrable tool nor plan mode needs it", async () => {
		const tempDir = makeTempDir();

		const settings = Settings.isolated();
		settings.set("plan.enabled", false);

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			settings,
			toolNames: ["read", "grep", "glob", "web_search"],
		});

		try {
			expect(session.getToolByName("write")).toBeUndefined();
		} finally {
			await session.dispose();
		}
	});

	it("does not activate write merely because plan mode is available", async () => {
		const tempDir = makeTempDir();
		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			toolNames: ["read"],
		});

		try {
			await session.setActiveToolsByName(["read"]);
			expect(session.getActiveToolNames()).not.toContain("write");
		} finally {
			await session.dispose();
		}
	});

	it("preserves write explicitly selected by a runtime caller", async () => {
		const tempDir = makeTempDir();
		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			toolNames: ["read"],
		});

		try {
			await session.setActiveToolsByName(["read", "write"]);
			await session.refreshMCPTools([]);
			expect(session.getActiveToolNames()).toContain("write");
		} finally {
			await session.dispose();
		}
	});
	it("registers vibe tools only during explicit vibe activation and exposes parent Todo bookkeeping", async () => {
		const tempDir = makeTempDir();
		const { session } = await createAgentSession(baseOptions(tempDir));
		const previousActiveToolNames = session.getActiveToolNames();

		try {
			for (const name of VIBE_TOOL_NAMES) {
				expect(session.getToolByName(name)).toBeUndefined();
			}

			await session.activateVibeTools(["read", "todo"]);
			const todo = session.getToolByName("todo");
			if (!todo) throw new Error("Expected real Todo tool");
			expect(session.getActiveToolNames()).toContain("todo");
			for (const name of VIBE_TOOL_NAMES) {
				expect(session.getToolByName(name)).toBeDefined();
				expect(session.getActiveToolNames()).toContain(name);
			}

			await todo.execute("vibe-todo-init", {
				op: "init",
				list: [{ phase: "Work", items: ["Worker change"] }],
			});
			await todo.execute("vibe-todo-done", { op: "done", task: "Worker change" });
			expect(session.getTodoPhases()).toMatchObject([
				{
					name: "Work",
					tasks: [{ content: "Worker change", status: "completed" }],
				},
			]);

			await session.deactivateVibeTools(previousActiveToolNames);
			for (const name of VIBE_TOOL_NAMES) {
				expect(session.getToolByName(name)).toBeUndefined();
			}
			expect(session.getActiveToolNames()).toEqual(previousActiveToolNames);
		} finally {
			await session.dispose();
		}
	});

	it("rehydrates completed parent Todo work from persisted session history", async () => {
		const tempDir = makeTempDir();
		const sessionManager = SessionManager.create(tempDir, tempDir);
		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			sessionManager,
		});

		try {
			await session.activateVibeTools(["read", "todo"]);
			const todo = session.getToolByName("todo");
			if (!todo) throw new Error("Expected real Todo tool");
			const init = await todo.execute("vibe-todo-init", {
				op: "init",
				list: [{ phase: "Worker flow", items: ["Reconcile worker result"] }],
			});
			const done = await todo.execute("vibe-todo-done", { op: "done", task: "Reconcile worker result" });
			for (const [toolCallId, result] of [
				["vibe-todo-init", init],
				["vibe-todo-done", done],
			] as const) {
				sessionManager.appendMessage({
					role: "toolResult",
					toolCallId,
					toolName: "todo",
					content: result.content,
					details: result.details,
					isError: result.isError === true,
					timestamp: Date.now(),
				});
			}
			await sessionManager.ensureOnDisk();
			const sessionFile = session.sessionFile;
			if (!sessionFile) throw new Error("Expected persisted session file");

			session.setTodoPhases([]);
			expect(session.getTodoPhases()).toEqual([]);
			expect(await session.switchSession(sessionFile)).toBe(true);
			expect(session.getTodoPhases()).toMatchObject([
				{
					name: "Worker flow",
					tasks: [{ content: "Reconcile worker result", status: "completed" }],
				},
			]);
		} finally {
			await session.dispose();
		}
	});

	it("does not register the xAI TTS tool unless enabled", async () => {
		const tempDir = makeTempDir();

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
		});

		try {
			expect(session.getToolByName("tts")).toBeUndefined();
			expect(session.getAllToolNames()).not.toContain("tts");
			expect(session.getActiveToolNames()).not.toContain("tts");
		} finally {
			await session.dispose();
		}
	});

	it("registers the xAI TTS tool when enabled", async () => {
		const tempDir = makeTempDir();

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			settings: Settings.isolated({ "speechgen.enabled": true }),
		});

		try {
			expect(session.getToolByName("tts")).toBeDefined();
			// tts is a discoverable custom tool → mounted as an xd:// device, not top-level.
			expect(session.getXdevToolEntries().map(entry => entry.name)).toContain("tts");
			expect(session.getActiveToolNames()).not.toContain("tts");
		} finally {
			await session.dispose();
		}
	});

	it("keeps the stable MCP tool-name collision winner during SDK startup and warns", async () => {
		const tempDir = makeTempDir();
		const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
		const createMcpTool = (serverName: string, label: string): CustomTool => ({
			name: "mcp__foo_bar_lookup",
			label,
			description: `Lookup from ${serverName}`,
			parameters: type({}),
			mcpServerName: serverName,
			mcpToolName: "lookup",
			async execute() {
				return { content: [{ type: "text", text: serverName }] };
			},
		});

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			customTools: [createMcpTool("foo.bar", "foo.bar/lookup"), createMcpTool("foo_bar", "foo_bar/lookup")],
		});

		try {
			expect(session.getToolByName("mcp__foo_bar_lookup")?.label).toBe("foo.bar/lookup");
			expect(warn).toHaveBeenCalledWith("MCP tool name collision; keeping stable winner", {
				name: "mcp__foo_bar_lookup",
				keptServer: "foo.bar",
				keptTool: "lookup",
				ignoredServer: "foo_bar",
				ignoredTool: "lookup",
			});
		} finally {
			await session.dispose();
		}
	});

	it("keeps restricted host tool lists isolated from configured custom capabilities", async () => {
		const restrictedDir = makeTempDir();
		const normalDir = makeTempDir();
		const configuredSettings = () =>
			Settings.isolated({
				"providers.imageOrder": ["openai"],
				"generate_image.enabled": true,
				"speechgen.enabled": true,
				"memory.backend": "hindsight",
				"autolearn.enabled": true,
			});

		const inheritedManager = {
			getServerInstructions: () => new Map([["private-server", "must not reach restricted child"]]),
		} as unknown as MCPManager;

		const { session: restricted } = await createAgentSession({
			...baseOptions(restrictedDir),
			settings: configuredSettings(),
			extensions: [toolActivationExtension],
			customTools: [sdkCustomTool],
			toolNames: ["read", "lsp", "hub"],
			requireYieldTool: true,
			restrictToolNames: true,
			enableMCP: true,
			mcpManager: inheritedManager,
			enableLsp: true,
			enableIrc: true,
		});

		try {
			expect(restricted.getAllToolNames()).toEqual(["read", "yield"]);
			expect(restricted.getActiveToolNames()).toEqual(["read", "yield"]);
			for (const name of [
				"generate_image",
				"tts",
				"recall",
				"retain",
				"reflect",
				"learn",
				"manage_skill",
				"default_active_tool",
				"default_inactive_tool",
				"sdk_custom_tool",
				"lsp",
				"hub",
			]) {
				expect(restricted.getToolByName(name)).toBeUndefined();
			}
			expect(restricted.getXdevToolEntries()).toEqual([]);
			expect(restricted.systemPrompt.join("\n")).not.toContain("private-server");
			expect(restricted.systemPrompt.join("\n")).not.toContain("MCP Server Instructions");
		} finally {
			await restricted.dispose();
		}

		const { session: normal } = await createAgentSession({
			...baseOptions(normalDir),
			settings: configuredSettings(),
			extensions: [toolActivationExtension],
			customTools: [sdkCustomTool],
			toolNames: ["read", "generate_image"],
			requireYieldTool: true,
			restrictToolNames: false,
		});

		try {
			const activeToolNames = normal.getActiveToolNames();
			expect(activeToolNames).toEqual(
				expect.arrayContaining(["read", "yield", "generate_image", "learn", "manage_skill", "write"]),
			);
			for (const name of ["tts", "default_active_tool", "sdk_custom_tool"]) {
				expect(activeToolNames).not.toContain(name);
			}
			expect(normal.getXdevToolEntries().map(entry => entry.name)).toEqual(
				expect.arrayContaining(["tts", "default_active_tool", "sdk_custom_tool"]),
			);
			expect(normal.getAllToolNames()).toEqual(
				expect.arrayContaining([
					"generate_image",
					"read",
					"yield",
					"tts",
					"default_active_tool",
					"sdk_custom_tool",
					"recall",
					"retain",
					"reflect",
				]),
			);
		} finally {
			await normal.dispose();
		}
	});

	it("renders report-issue guidance only for unrestricted sessions", async () => {
		const normalDir = makeTempDir();
		const restrictedDir = makeTempDir();
		const { session: normal } = await createAgentSession({
			...baseOptions(normalDir),
			settings: Settings.isolated({ "dev.autoqa": true }),
		});
		const { session: restricted } = await createAgentSession({
			...baseOptions(restrictedDir),
			settings: Settings.isolated({ "dev.autoqa": true }),
			toolNames: ["read"],
			restrictToolNames: true,
		});

		try {
			expect(normal.systemPrompt.join("\n")).toContain("xd://report_issue");
			expect(restricted.systemPrompt.join("\n")).not.toContain("xd://report_issue");
		} finally {
			await Promise.all([normal.dispose(), restricted.dispose()]);
		}
	});

	it("ignores an inherited MCP manager when MCP is disabled", async () => {
		const tempDir = makeTempDir();
		const inheritedManager = {
			getServerInstructions: () => new Map([["private-server", "must not reach restricted child"]]),
		} as unknown as MCPManager;

		const { session } = await createAgentSession({
			...baseOptions(tempDir),
			enableMCP: false,
			mcpManager: inheritedManager,
		});

		try {
			expect(session.systemPrompt.join("\n")).not.toContain("private-server");
			expect(session.systemPrompt.join("\n")).not.toContain("MCP Server Instructions");
		} finally {
			await session.dispose();
		}
	});
});
