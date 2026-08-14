import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { Agent, type AgentMessage, type CompactionSummaryMessage, countTokens } from "@oh-my-pi/pi-agent-core";
import { calculateContextTokens, estimateTokens, resolveThresholdTokens } from "@oh-my-pi/pi-agent-core/compaction";
import type { AssistantMessage } from "@oh-my-pi/pi-ai";
import { createMockModel, type MockModel, registerMockApi } from "@oh-my-pi/pi-ai/providers/mock";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import { estimateToolSchemaTokens } from "@oh-my-pi/pi-coding-agent/modes/utils/context-usage";
import { AgentSession } from "@oh-my-pi/pi-coding-agent/session/agent-session";
import { AuthStorage } from "@oh-my-pi/pi-coding-agent/session/auth-storage";
import { SessionManager } from "@oh-my-pi/pi-coding-agent/session/session-manager";
import { TempDir } from "@oh-my-pi/pi-utils";

const CONTEXT_WINDOW = 372_000;
const CACHE_READ_TOKENS = 371_200;
const INPUT_TOKENS = 200;
const OUTPUT_TOKENS = 150;

interface MaintenanceHarness {
	advisor: Agent;
	advisorMock: MockModel;
	settings: Settings;
}

interface AdvisorCompactionSummaryFixture extends CompactionSummaryMessage {
	advisorUsageAnchorStartIndex?: number;
}

describe("AgentSession advisor context maintenance", () => {
	let tempDir: TempDir;
	let authStorage: AuthStorage;
	let session: AgentSession;

	beforeEach(async () => {
		tempDir = TempDir.createSync("@pi-advisor-context-maintenance-");
		authStorage = await AuthStorage.create(tempDir.join("auth.db"));
		authStorage.setRuntimeApiKey("anthropic", "test-key");
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await session?.dispose();
		authStorage.close();
		await tempDir.remove();
	});

	function createHarness(): MaintenanceHarness {
		const primaryMock = createMockModel({
			provider: "anthropic",
			responses: [{ content: ["primary complete"] }],
		});
		const advisorMock = createMockModel({
			provider: "anthropic",
			contextWindow: CONTEXT_WINDOW,
			responses: [{ content: ["advisor reviewed current update"] }],
		});
		const modelRegistry = new ModelRegistry(authStorage, tempDir.join("models.yml"));
		const settings = Settings.isolated({
			"advisor.syncBacklog": "1",
			"compaction.enabled": true,
			"compaction.strategy": "context-full",
			"contextPromotion.enabled": false,
		});
		const agent = new Agent({
			getApiKey: () => "test-key",
			initialState: { model: primaryMock, systemPrompt: [], tools: [] },
			streamFn: primaryMock.stream,
		});
		session = new AgentSession({
			agent,
			sessionManager: SessionManager.inMemory(),
			settings,
			modelRegistry,
			advisorTools: [],
			advisorStreamFn: advisorMock.stream,
		});
		settings.setModelRole("advisor", "anthropic/claude-sonnet-4-5");
		expect(session.setAdvisorEnabled(true)).toBe(true);
		const advisor = session.getAdvisorAgent();
		if (!advisor) throw new Error("Expected advisor agent to be active");
		advisor.setModel(advisorMock);

		// Keep maintenance on the no-summary recovery branch without blocking the
		// primary prompt's own credential preflight.
		vi.spyOn(modelRegistry, "getApiKey").mockImplementation(async model =>
			model === primaryMock ? "test-key" : undefined,
		);
		return { advisor, advisorMock, settings };
	}

	function usageAnchor(advisorMock: MockModel, timestamp: number, cost = 0): AssistantMessage {
		return {
			role: "assistant",
			content: [{ type: "text", text: "prior advisor output" }],
			api: advisorMock.api,
			provider: advisorMock.provider,
			model: advisorMock.id,
			usage: {
				input: INPUT_TOKENS,
				output: OUTPUT_TOKENS,
				cacheRead: CACHE_READ_TOKENS,
				cacheWrite: 0,
				totalTokens: CACHE_READ_TOKENS + INPUT_TOKENS + OUTPUT_TOKENS,
				cost: { input: 0, output: cost, cacheRead: 0, cacheWrite: 0, total: cost },
			},
			stopReason: "stop",
			timestamp,
		};
	}

	function compactionSummary(timestamp: number): AdvisorCompactionSummaryFixture {
		return {
			role: "compactionSummary",
			summary: "bounded advisor summary",
			tokensBefore: CACHE_READ_TOKENS + INPUT_TOKENS + OUTPUT_TOKENS,
			timestamp,
			// `[summary, retained]` is the compacted array; index 2 is the first
			// position eligible for a newly appended provider-usage anchor.
			advisorUsageAnchorStartIndex: 2,
		};
	}

	it("maintains a 371,200-token cached advisor context before the 372,000-token window", async () => {
		const { advisor, advisorMock, settings } = createHarness();
		const anchor = usageAnchor(advisorMock, Date.now() - 1_000, 0.5);
		advisor.emitExternalEvent({ type: "message_end", message: anchor });
		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);

		await session.prompt("small current update");

		expect(advisorMock.calls).toHaveLength(1);
		const advisorCall = advisorMock.calls[0];
		const update = advisorCall.context.messages.find(message => message.role === "user");
		if (!update) throw new Error("Expected the advisor's incremental update");
		const threshold = resolveThresholdTokens(CONTEXT_WINDOW, settings.getGroup("compaction"));
		const providerAndUpdateTokens = calculateContextTokens(anchor.usage) + estimateTokens(update as AgentMessage);
		expect(calculateContextTokens(anchor.usage)).toBe(CACHE_READ_TOKENS + INPUT_TOKENS + OUTPUT_TOKENS);
		expect(providerAndUpdateTokens).toBeGreaterThan(threshold);

		// Provider usage triggers maintenance, but recovery sends only the bounded
		// current update into the reset advisor context.
		expect(JSON.stringify(advisorCall.context.messages)).toContain("small current update");
		expect(JSON.stringify(advisor.state.messages)).not.toContain("prior advisor output");
		expect(session.getAdvisorCost()).toBeCloseTo(0.5, 8);
	});

	it("includes advisor system prompt and tool schemas in the local maintenance floor", async () => {
		const { advisor, advisorMock, settings } = createHarness();
		const seed: AgentMessage = { role: "user", content: "small stored advisor message", timestamp: 1 };
		advisor.state.messages.push(seed);
		const storedTokens = estimateTokens(seed, { excludeEncryptedReasoning: true });
		const fixedPrefixTokens = countTokens(advisor.state.systemPrompt) + estimateToolSchemaTokens(advisor.state.tools);
		const threshold = storedTokens + Math.floor(fixedPrefixTokens / 2);
		settings.set("compaction.thresholdTokens", threshold);

		await session.prompt("tiny local-floor update");

		const advisorCall = advisorMock.calls[0];
		const update = advisorCall.context.messages.find(message => message.role === "user");
		if (!update) throw new Error("Expected the advisor's incremental update");
		const messagesOnlyTokens = storedTokens + estimateTokens(update as AgentMessage);
		expect(messagesOnlyTokens).toBeLessThan(threshold);
		expect(messagesOnlyTokens + fixedPrefixTokens).toBeGreaterThan(threshold);
		expect(JSON.stringify(advisor.state.messages)).not.toContain("small stored advisor message");
	});

	it("ignores retained provider usage that predates the latest advisor compaction", async () => {
		const { advisor, advisorMock } = createHarness();
		const compactedAt = Date.now();
		const summary = compactionSummary(compactedAt);
		const retained = usageAnchor(advisorMock, compactedAt);
		retained.content = [{ type: "text", text: "retained pre-compaction output" }];
		advisor.state.messages.push(summary, retained);

		await session.prompt("post-compaction update");

		expect(advisorMock.calls).toHaveLength(1);
		const sentContext = JSON.stringify(advisorMock.calls[0].context.messages);
		expect(sentContext).toContain("retained pre-compaction output");
		expect(sentContext).toContain("post-compaction update");
	});

	it("accepts equal-timestamp usage appended after the explicit compaction boundary", async () => {
		const { advisor, advisorMock } = createHarness();
		const compactedAt = Date.now();
		const summary = compactionSummary(compactedAt);
		const retained = usageAnchor(advisorMock, compactedAt);
		retained.content = [{ type: "text", text: "retained pre-compaction output" }];
		const fresh = usageAnchor(advisorMock, compactedAt);
		fresh.content = [{ type: "text", text: "fresh post-compaction output" }];
		advisor.state.messages.push(summary, retained, fresh);

		await session.prompt("equal-timestamp post-compaction update");

		expect(advisorMock.calls).toHaveLength(1);
		const sentContext = JSON.stringify(advisorMock.calls[0].context.messages);
		expect(sentContext).toContain("equal-timestamp post-compaction update");
		expect(sentContext).not.toContain("retained pre-compaction output");
		expect(sentContext).not.toContain("fresh post-compaction output");
	});

	it("forwards the advisor session metadata to overflow compaction requests", async () => {
		// Regression for #6625 review: advisor overflow compaction issues a direct
		// `compact(...)` request that bypasses the advisor `Agent`, so the metadata
		// resolver installed on the agent never runs for it. The direct call must
		// still emit the advisor's `metadata.user_id` session identity.
		// The advisor model is the first compaction candidate; registering the mock
		// API lets the compaction one-shot's `completeSimple` route to it so the
		// summarization request actually reaches the mock (and its recorded calls).
		registerMockApi();
		const primaryMock = createMockModel({
			provider: "anthropic",
			responses: [{ content: ["primary complete"] }],
		});
		const advisorMock = createMockModel({
			provider: "anthropic",
			contextWindow: CONTEXT_WINDOW,
			handler: () => ({ content: ["bounded advisor summary"] }),
		});
		const modelRegistry = new ModelRegistry(authStorage, tempDir.join("models.yml"));
		const settings = Settings.isolated({
			"advisor.syncBacklog": "1",
			"compaction.enabled": true,
			"compaction.strategy": "context-full",
			"contextPromotion.enabled": false,
		});
		const agent = new Agent({
			getApiKey: () => "test-key",
			initialState: { model: primaryMock, systemPrompt: [], tools: [] },
			streamFn: primaryMock.stream,
		});
		session = new AgentSession({
			agent,
			sessionManager: SessionManager.inMemory(),
			settings,
			modelRegistry,
			advisorTools: [],
			advisorStreamFn: advisorMock.stream,
		});
		settings.setModelRole("advisor", "anthropic/claude-sonnet-4-5");
		expect(session.setAdvisorEnabled(true)).toBe(true);
		const advisor = session.getAdvisorAgent();
		if (!advisor?.sessionId) throw new Error("Expected advisor agent with a provider session id");
		advisor.setModel(advisorMock);
		// Unlike the recovery-branch harness, the advisor holds usable credentials
		// so maintenance runs the LLM summarization compaction path.
		vi.spyOn(modelRegistry, "getApiKey").mockResolvedValue("test-key");

		// Two accumulated turns so compaction has older history to summarize while
		// retaining the most recent one (a single message would be fully retained,
		// making compaction a no-op).
		advisor.state.messages.push(
			usageAnchor(advisorMock, Date.now() - 2_000),
			usageAnchor(advisorMock, Date.now() - 1_000),
		);

		await session.prompt("small current update");

		// A summarization compaction one-shot actually ran (its prompt wraps the
		// conversation in <conversation> tags).
		const compactionCalls = advisorMock.calls.filter(call =>
			JSON.stringify(call.context.messages).includes("<conversation>"),
		);
		expect(compactionCalls.length).toBeGreaterThan(0);

		// Every advisor request — the compaction one-shot and the advisor turn —
		// carries the advisor's own provider session id via metadata.user_id.
		for (const call of advisorMock.calls) {
			const userId = call.options?.metadata?.user_id;
			if (typeof userId !== "string") throw new Error("Expected advisor metadata.user_id");
			expect((JSON.parse(userId) as { session_id?: string }).session_id).toBe(advisor.sessionId);
		}
	});
});
