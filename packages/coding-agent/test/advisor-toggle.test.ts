import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { Agent, type AgentMessage } from "@oh-my-pi/pi-agent-core";
import type { Model } from "@oh-my-pi/pi-ai";
import * as AIError from "@oh-my-pi/pi-ai/error";
import { createMockModel } from "@oh-my-pi/pi-ai/providers/mock";
import { getBundledModel } from "@oh-my-pi/pi-catalog/models";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import type { ExtensionRunner } from "@oh-my-pi/pi-coding-agent/extensibility/extensions";
import { AgentSession } from "@oh-my-pi/pi-coding-agent/session/agent-session";
import { AgentStorage } from "@oh-my-pi/pi-coding-agent/session/agent-storage";
import { AuthStorage } from "@oh-my-pi/pi-coding-agent/session/auth-storage";
import { SessionManager } from "@oh-my-pi/pi-coding-agent/session/session-manager";
import { getProjectAgentDir, TempDir } from "@oh-my-pi/pi-utils";

describe("AgentSession advisor toggle", () => {
	let sharedDir: TempDir;
	let authStorage: AuthStorage;
	let modelRegistry: ModelRegistry;
	let model: Model;
	let replacementModel: Model;

	beforeAll(async () => {
		sharedDir = TempDir.createSync("@pi-advisor-toggle-shared-");
		authStorage = await AuthStorage.create(path.join(sharedDir.path(), "testauth.db"));
		authStorage.setRuntimeApiKey("anthropic", "test-key");
		authStorage.setRuntimeApiKey("openai", "test-key");
		authStorage.setRuntimeApiKey("openrouter", "test-key");
		modelRegistry = new ModelRegistry(authStorage);
		const bundled = getBundledModel("anthropic", "claude-sonnet-4-5");
		const replacement = getBundledModel("openai", "gpt-4o-mini");
		if (!bundled) throw new Error("Expected built-in anthropic model to exist");
		if (!replacement) throw new Error("Expected built-in OpenAI model to exist");
		model = bundled;
		replacementModel = replacement;
	});

	afterAll(async () => {
		authStorage.close();
		try {
			await sharedDir.remove();
		} catch {}
	});

	let tempDir: TempDir;
	let session: AgentSession;
	let sessionManager: SessionManager;

	beforeEach(async () => {
		tempDir = TempDir.createSync("@pi-advisor-toggle-");
		sessionManager = SessionManager.create(tempDir.path(), tempDir.path());
		const agent = new Agent({
			initialState: {
				model,
				systemPrompt: ["Test"],
				tools: [],
				messages: [],
			},
		});
		const settings = Settings.isolated({ "compaction.enabled": false });
		session = new AgentSession({
			agent,
			sessionManager,
			settings,
			modelRegistry,
			advisorTools: [],
		});
	});

	afterEach(async () => {
		await session.dispose();
		try {
			await tempDir.remove();
		} catch {}
	});

	function appendAdvisorCost(advisor: Agent, cost: number, timestamp: number): void {
		const message: AgentMessage = {
			role: "assistant",
			content: [{ type: "text", text: "reviewed" }],
			api: "anthropic-messages",
			provider: "anthropic",
			model: "claude-sonnet-4-5",
			usage: {
				input: 1,
				output: 1,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 2,
				cost: { input: 0, output: cost, cacheRead: 0, cacheWrite: 0, total: cost },
			},
			stopReason: "stop",
			timestamp,
		};
		advisor.emitExternalEvent({ type: "message_end", message });
	}

	it("starts with advisor disabled", () => {
		expect(session.isAdvisorActive()).toBe(false);
		expect(session.isAdvisorEnabled()).toBe(false);
		expect(session.formatAdvisorStatus()).toBe("Advisor is disabled.");
	});

	it("toggle enables the advisor and runtime", () => {
		session.settings.setModelRole("advisor", "anthropic/claude-sonnet-4-5");
		const active = session.toggleAdvisorEnabled();
		expect(active).toBe(true);
		expect(session.isAdvisorActive()).toBe(true);
		expect(session.isAdvisorEnabled()).toBe(true);
		expect(session.formatAdvisorStatus()).toContain("Advisor is enabled (anthropic/claude-sonnet-4-5)");
	});

	it("explicit enable rebuilds the runtime when the advisor role changes", () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		expect(session.setAdvisorEnabled(true)).toBe(true);
		expect(session.getAdvisorAgent()?.state.model.provider).toBe(model.provider);
		expect(session.getAdvisorAgent()?.state.model.id).toBe(model.id);

		session.settings.setModelRole("advisor", `${replacementModel.provider}/${replacementModel.id}`);
		expect(session.setAdvisorEnabled(true)).toBe(true);

		expect(session.getAdvisorAgent()?.state.model.provider).toBe(replacementModel.provider);
		expect(session.getAdvisorAgent()?.state.model.id).toBe(replacementModel.id);
	});

	it("refreshes the live advisor when the advisor role setting changes", () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		expect(session.setAdvisorEnabled(true)).toBe(true);
		expect(session.getAdvisorAgent()?.state.model.provider).toBe(model.provider);
		expect(session.getAdvisorAgent()?.state.model.id).toBe(model.id);

		session.settings.setModelRole("advisor", `${replacementModel.provider}/${replacementModel.id}`);

		expect(session.getAdvisorAgent()?.state.model.provider).toBe(replacementModel.provider);
		expect(session.getAdvisorAgent()?.state.model.id).toBe(replacementModel.id);
	});

	it("refreshes the live advisor when only the advisor route changes", () => {
		session.settings.setModelRole("advisor", "openrouter/z-ai/glm-4.7@cerebras");
		expect(session.setAdvisorEnabled(true)).toBe(true);
		expect(session.getAdvisorAgent()?.state.model.provider).toBe("openrouter");
		expect(session.getAdvisorAgent()?.state.model.id).toBe("z-ai/glm-4.7");
		expect(
			(session.getAdvisorAgent()?.state.model.compat as { openRouterRouting?: { only?: string[] } } | undefined)
				?.openRouterRouting?.only,
		).toEqual(["cerebras"]);

		session.settings.setModelRole("advisor", "openrouter/z-ai/glm-4.7@fireworks");

		expect(session.getAdvisorAgent()?.state.model.provider).toBe("openrouter");
		expect(session.getAdvisorAgent()?.state.model.id).toBe("z-ai/glm-4.7");
		expect(
			(session.getAdvisorAgent()?.state.model.compat as { openRouterRouting?: { only?: string[] } } | undefined)
				?.openRouterRouting?.only,
		).toEqual(["fireworks"]);
	});

	it("refreshes the live advisor after project model-role reloads", async () => {
		const projectA = path.join(tempDir.path(), "project-a");
		const projectB = path.join(tempDir.path(), "project-b");
		const agentDir = path.join(tempDir.path(), "agent");
		fs.mkdirSync(getProjectAgentDir(projectA), { recursive: true });
		fs.mkdirSync(getProjectAgentDir(projectB), { recursive: true });
		fs.mkdirSync(agentDir, { recursive: true });
		await Bun.write(
			path.join(getProjectAgentDir(projectA), "settings.json"),
			JSON.stringify({ modelRoles: { advisor: `${model.provider}/${model.id}` } }),
		);
		await Bun.write(
			path.join(getProjectAgentDir(projectB), "settings.json"),
			JSON.stringify({ modelRoles: { advisor: `${replacementModel.provider}/${replacementModel.id}` } }),
		);

		const settings = await Settings.loadIsolated({
			cwd: projectA,
			agentDir,
			overrides: { "compaction.enabled": false },
		});
		const customSession = new AgentSession({
			agent: new Agent({
				initialState: {
					model,
					systemPrompt: ["Test"],
					tools: [],
					messages: [],
				},
			}),
			sessionManager: SessionManager.create(tempDir.path(), tempDir.path()),
			settings,
			modelRegistry,
			advisorTools: [],
		});

		try {
			expect(customSession.setAdvisorEnabled(true)).toBe(true);
			expect(customSession.getAdvisorAgent()?.state.model.provider).toBe(model.provider);
			expect(customSession.getAdvisorAgent()?.state.model.id).toBe(model.id);

			await settings.reloadForCwd(projectB);

			expect(customSession.getAdvisorAgent()?.state.model.provider).toBe(replacementModel.provider);
			expect(customSession.getAdvisorAgent()?.state.model.id).toBe(replacementModel.id);
		} finally {
			await customSession.dispose();
			AgentStorage.resetInstance();
		}
	});

	it("keeps explicit enable idempotent when the advisor config is unchanged", () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		expect(session.setAdvisorEnabled(true)).toBe(true);
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to be live");
		const historyMessage: AgentMessage = { role: "user", content: "prior advisor context", timestamp: 1 };
		advisor.state.messages.push(historyMessage);

		expect(session.setAdvisorEnabled(true)).toBe(true);

		expect(session.getAdvisorAgent()).toBe(advisor);
		expect(session.getAdvisorAgent()?.state.messages).toEqual([historyMessage]);
	});

	it("explicit enable overrides default-off setting for the session only", () => {
		session.settings.setModelRole("advisor", "anthropic/claude-sonnet-4-5");
		session.settings.override("advisor.enabled", false);
		const customSession = new AgentSession({
			agent: session.agent,
			sessionManager,
			settings: session.settings,
			modelRegistry,
			advisorTools: [],
		});
		expect(customSession.isAdvisorEnabled()).toBe(false);

		const active = customSession.setAdvisorEnabled(true);

		expect(active).toBe(true);
		expect(customSession.isAdvisorActive()).toBe(true);
		expect(customSession.isAdvisorEnabled()).toBe(true);
		expect(customSession.settings.get("advisor.enabled")).toBe(false);
	});

	it("toggle disables the advisor and runtime", () => {
		session.settings.setModelRole("advisor", "anthropic/claude-sonnet-4-5");
		session.toggleAdvisorEnabled();
		const active = session.toggleAdvisorEnabled();
		expect(active).toBe(false);
		expect(session.isAdvisorActive()).toBe(false);
		expect(session.isAdvisorEnabled()).toBe(false);
	});

	it("setAdvisorEnabled reports inactive when the advisor role resolves to no model", () => {
		// The advisor role falls back to the `slow` priority chain when unset, so an
		// unset role still resolves a model. The inactive-but-enabled path is only
		// reached when the configured advisor model cannot be resolved at all.
		session.settings.setModelRole("advisor", "nonexistent/advisor-model");
		const active = session.setAdvisorEnabled(true);
		expect(active).toBe(false);
		expect(session.isAdvisorActive()).toBe(false);
		expect(session.isAdvisorEnabled()).toBe(true);
		expect(session.formatAdvisorStatus()).toBe(
			"Advisor setting is enabled, but no model is assigned to the 'advisor' role.",
		);
	});

	it("keeps sessions isolated when sharing a Settings instance", async () => {
		const sharedSettings = Settings.isolated({ "compaction.enabled": false });
		sharedSettings.setModelRole("advisor", "anthropic/claude-sonnet-4-5");
		expect(sharedSettings.get("advisor.enabled")).toBe(false);

		const sessionA = new AgentSession({
			agent: session.agent,
			sessionManager,
			settings: sharedSettings,
			modelRegistry,
			advisorTools: [],
		});
		const sessionB = new AgentSession({
			agent: session.agent,
			sessionManager,
			settings: sharedSettings,
			modelRegistry,
			advisorTools: [],
		});

		expect(sessionA.isAdvisorEnabled()).toBe(false);
		expect(sessionB.isAdvisorEnabled()).toBe(false);

		const activeA = sessionA.setAdvisorEnabled(true);
		expect(activeA).toBe(true);
		expect(sessionA.isAdvisorEnabled()).toBe(true);
		expect(sessionA.isAdvisorActive()).toBe(true);

		expect(sessionB.isAdvisorEnabled()).toBe(false);
		expect(sessionB.isAdvisorActive()).toBe(false);
		expect(sessionB.formatAdvisorStatus()).toBe("Advisor is disabled.");

		const activeB = sessionB.toggleAdvisorEnabled();
		expect(activeB).toBe(true);
		expect(sessionB.isAdvisorEnabled()).toBe(true);

		sessionA.setAdvisorEnabled(false);
		expect(sessionA.isAdvisorEnabled()).toBe(false);
		expect(sessionA.isAdvisorActive()).toBe(false);

		expect(sessionB.isAdvisorEnabled()).toBe(true);
		expect(sessionB.isAdvisorActive()).toBe(true);
	});

	it("exposes provider sessionId on live advisor stats", () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();

		const stats = session.getAdvisorStats();
		expect(stats.advisors).toHaveLength(1);
		const sid = stats.advisors[0].sessionId!;
		// Full UUIDv7 — must not contain the display-label "-advisor" suffix
		expect(sid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		expect(sid).not.toContain("-advisor");
	});
	it("retains cumulative advisor cost after the advisor is disabled", () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to exist");

		appendAdvisorCost(advisor, 0.41, 1);
		appendAdvisorCost(advisor, 0.09, 2);

		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
		session.setAdvisorEnabled(false);
		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
	});
	it("retains total advisor cost after the live roster changes", () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to exist");
		appendAdvisorCost(advisor, 0.5, 1);

		expect(session.applyAdvisorConfigs([{ name: "Security" }], undefined)).toBe(1);
		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
		expect(session.formatAdvisorStatus()).toContain("$0.5000");
	});
	it("retains cumulative advisor cost after an in-session history rewrite", async () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to exist");
		appendAdvisorCost(advisor, 0.5, 1);
		sessionManager.appendMessage({
			role: "user",
			content: [
				{ type: "text", text: "look" },
				{ type: "image", data: "iVBORw0KGgo", mimeType: "image/png" },
			],
			timestamp: 2,
		});

		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
		expect(await session.dropImages()).toEqual({ removed: 1 });
		expect(advisor.state.messages).toHaveLength(0);
		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
		expect(session.getAdvisorStats().cost).toBeCloseTo(0.5, 8);
		expect(session.formatAdvisorStatus()).toContain("$0.5000");
	});
	it("retains cumulative advisor cost when reloading the same session", async () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to exist");
		appendAdvisorCost(advisor, 0.5, 1);

		await session.reload();

		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
	});
	it("keeps advisor cost when switching sessions fails after the reset", async () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to exist");
		appendAdvisorCost(advisor, 0.5, 1);
		const previousSessionFile = sessionManager.getSessionFile();
		const targetSessionFile = SessionManager.createEmptySessionFile(tempDir.path());
		const failure = new Error("switch failed after advisor reset");
		vi.spyOn(sessionManager, "getLastModelChangeRole").mockImplementation(() => {
			throw failure;
		});

		await expect(session.switchSession(targetSessionFile)).rejects.toThrow(failure);

		expect(sessionManager.getSessionFile()).toBe(previousSessionFile);
		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
	});
	it("clears advisor cost once a switch to a different session commits", async () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to exist");
		appendAdvisorCost(advisor, 0.5, 1);
		const targetSessionFile = SessionManager.createEmptySessionFile(tempDir.path());

		expect(await session.switchSession(targetSessionFile)).toBe(true);

		expect(session.getAdvisorCost()).toBe(0);
	});
	it("clears cumulative advisor cost for a new session", async () => {
		session.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		session.toggleAdvisorEnabled();
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to exist");
		appendAdvisorCost(advisor, 0.5, 1);

		await session.newSession();

		expect(session.getAdvisorCost()).toBe(0);
	});
	it("clears advisor cost when a branch skips conversation restore", async () => {
		const extensionRunner = {
			hasHandlers: (eventType: string) => eventType === "session_before_branch",
			emit: async () => ({ skipConversationRestore: true }),
		} as unknown as ExtensionRunner;
		const branchDir = TempDir.createSync("@pi-advisor-branch-");
		const branchManager = SessionManager.create(branchDir.path(), branchDir.path());
		const branchSession = new AgentSession({
			agent: new Agent({
				initialState: { model, systemPrompt: ["Test"], tools: [], messages: [] },
			}),
			sessionManager: branchManager,
			settings: Settings.isolated({ "compaction.enabled": false }),
			modelRegistry,
			advisorTools: [],
			extensionRunner,
		});
		try {
			branchSession.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
			branchSession.toggleAdvisorEnabled();
			const advisor = branchSession.getAdvisorAgent();
			if (!advisor) throw new Error("Expected advisor agent to exist");
			const branchPoint = { role: "user" as const, content: "branch point", timestamp: 1 };
			branchManager.appendMessage(branchPoint);
			const entryId = branchManager.getLeafId();
			if (!entryId) throw new Error("Expected a branchable entry");
			branchManager.appendMessage({ role: "user", content: "after the branch point", timestamp: 2 });
			branchSession.agent.replaceMessages(branchManager.buildSessionContext().messages);
			await branchManager.flush();
			appendAdvisorCost(advisor, 0.5, 1);

			expect(await branchSession.branch(entryId)).toMatchObject({ cancelled: false });

			// Restoring would rewind to the branch point; the extension owns that, so both
			// messages stay. Only the spend of the conversation we left must not follow.
			expect(branchSession.messages).toHaveLength(2);
			expect(branchSession.getAdvisorCost()).toBe(0);
		} finally {
			await branchSession.dispose();
			await branchDir.remove().catch(() => {});
		}
	});
	it("clears advisor cost when a branch hook throws after the session changed", async () => {
		const failure = new Error("session_branch handler failed");
		const extensionRunner = {
			hasHandlers: () => false,
			emit: async (event: { type: string }) => {
				if (event.type === "session_branch") throw failure;
				return undefined;
			},
		} as unknown as ExtensionRunner;
		const branchDir = TempDir.createSync("@pi-advisor-branch-fail-");
		const branchManager = SessionManager.create(branchDir.path(), branchDir.path());
		const branchSession = new AgentSession({
			agent: new Agent({
				initialState: { model, systemPrompt: ["Test"], tools: [], messages: [] },
			}),
			sessionManager: branchManager,
			settings: Settings.isolated({ "compaction.enabled": false }),
			modelRegistry,
			advisorTools: [],
			extensionRunner,
		});
		try {
			branchSession.settings.setModelRole("advisor", `${model.provider}/${model.id}`);
			branchSession.toggleAdvisorEnabled();
			const advisor = branchSession.getAdvisorAgent();
			if (!advisor) throw new Error("Expected advisor agent to exist");
			branchManager.appendMessage({ role: "user", content: "branch point", timestamp: 1 });
			const entryId = branchManager.getLeafId();
			if (!entryId) throw new Error("Expected a branchable entry");
			const previousSessionFile = branchManager.getSessionFile();
			await branchManager.flush();
			appendAdvisorCost(advisor, 0.5, 1);

			await expect(branchSession.branch(entryId)).rejects.toThrow(failure);

			// The hook failed only after the branch had already taken over the transcript,
			// so the abandoned conversation's spend must not be billed to the new one.
			expect(branchManager.getSessionFile()).not.toBe(previousSessionFile);
			expect(branchSession.getAdvisorCost()).toBe(0);
		} finally {
			await branchSession.dispose();
			await branchDir.remove().catch(() => {});
		}
	});
	it("marks structurally classified advisor usage limits", async () => {
		const mock = createMockModel({ responses: [{ content: ["primary complete"] }] });
		const primaryAgent = new Agent({
			initialState: {
				model,
				systemPrompt: ["Test"],
				tools: [],
				messages: [],
			},
			streamFn: mock.stream,
		});
		const settings = Settings.isolated({ "compaction.enabled": false });
		settings.setModelRole("advisor", `${model.provider}/${model.id}`);
		const quotaSession = new AgentSession({
			agent: primaryAgent,
			sessionManager: SessionManager.inMemory(),
			settings,
			modelRegistry,
			advisorTools: [],
		});

		try {
			expect(quotaSession.setAdvisorEnabled(true)).toBe(true);
			const advisorAgent = quotaSession.getAdvisorAgent();
			if (!advisorAgent) throw new Error("Expected advisor agent to exist");
			vi.spyOn(advisorAgent, "prompt").mockRejectedValue(
				new AIError.ProviderHttpError("Generic provider failure", 429, { code: "insufficient_quota" }),
			);
			const markUsageLimitReached = vi
				.spyOn(authStorage, "markUsageLimitReached")
				.mockResolvedValue({ switched: false });

			await quotaSession.prompt("Trigger advisor");
			await quotaSession.waitForIdle();

			expect(markUsageLimitReached).toHaveBeenCalledTimes(1);
			expect(markUsageLimitReached.mock.calls[0]?.[0]).toBe(model.provider);
		} finally {
			await quotaSession.dispose();
			vi.restoreAllMocks();
		}
	});
});
