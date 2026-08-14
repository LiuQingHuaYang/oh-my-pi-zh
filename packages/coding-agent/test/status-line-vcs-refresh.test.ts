/**
 * Regression: StatusLineComponent's VCS segment was blank on the first (cold)
 * paint and only appeared after an unrelated re-render (e.g. flipping a
 * statusline setting and back). The async git-status and jj-label fetches
 * filled their caches but never called #onBranchChange, so the resolved value
 * had no way to reach the screen until something else forced a repaint. Worst
 * in a jj workspace, where there is no git branch so the PR / default-branch
 * lookups (which do fire #onBranchChange) never run.
 *
 * Contract: when an async VCS fetch resolves with a value, the component
 * requests a repaint via #onBranchChange. (Post-dispose suppression of the
 * same callback is covered by status-line-dispose-async-leak.test.ts.)
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "bun:test";
import { resetSettingsForTest, Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import type { StatusLineSettings } from "@oh-my-pi/pi-coding-agent/modes/components/status-line";
import { StatusLineComponent } from "@oh-my-pi/pi-coding-agent/modes/components/status-line";
import { initTheme } from "@oh-my-pi/pi-coding-agent/modes/theme/theme";
import type { GitRefHead } from "@oh-my-pi/pi-coding-agent/utils/git";
import * as git from "@oh-my-pi/pi-coding-agent/utils/git";
import * as jj from "@oh-my-pi/pi-coding-agent/utils/jj";
import { getProjectDir, setProjectDir } from "@oh-my-pi/pi-utils";

type GitStatus = { staged: number; unstaged: number; untracked: number };

const originalProjectDir = getProjectDir();

beforeAll(async () => {
	resetSettingsForTest();
	await Settings.init({ inMemory: true });
	await initTheme();
});

afterAll(() => {
	resetSettingsForTest();
	setProjectDir(originalProjectDir);
});

afterEach(() => {
	vi.restoreAllMocks();
});

function makeSession() {
	return {
		state: { messages: [], model: undefined },
		messages: [],
		model: undefined,
		systemPrompt: [],
		agent: { state: { tools: [] } },
		skills: [],
		isStreaming: false,
		isAutoThinking: false,
		autoResolvedThinkingLevel: () => undefined,
		isFastModeActive: () => false,
		isFastModeEnabled: () => false,
		getGoalModeState: () => null,
		getAsyncJobSnapshot: () => ({ running: [] }),
		modelRegistry: { isUsingOAuth: () => false },
		sessionManager: {
			getSessionName: () => "vcs-refresh test",
			getUsageStatistics: () => ({
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				premiumRequests: 0,
				cost: 0,
			}),
		},
	} as unknown as ConstructorParameters<typeof StatusLineComponent>[0];
}

const fakeRefHead: GitRefHead = {
	kind: "ref",
	branchName: "main",
	ref: "refs/heads/main",
	commit: null,
	commonDir: "/fake/.git",
	gitDir: "/fake/.git",
	gitEntryPath: "/fake/.git",
	headPath: "/fake/.git/HEAD",
	repoRoot: "/fake",
	headContent: "ref: refs/heads/main\n",
};

const gitSegment: StatusLineSettings = {
	preset: "custom",
	leftSegments: ["git"],
	rightSegments: ["session_name"],
	separator: "powerline-thin",
	sessionAccent: false,
	transparent: false,
};

describe("StatusLineComponent repaints when an async VCS fetch resolves", () => {
	it("fires #onBranchChange when git status resolves on the cold paint", async () => {
		vi.spyOn(git.head, "resolveSync").mockReturnValue(fakeRefHead);
		vi.spyOn(git.branch, "default").mockReturnValue(Promise.withResolvers<string | null>().promise);
		const status = Promise.withResolvers<GitStatus | null>();
		vi.spyOn(git.status, "summary").mockReturnValue(status.promise);

		const onBranchChange = vi.fn();
		const component = new StatusLineComponent(makeSession());
		component.updateSettings(gitSegment);
		component.watchBranch(onBranchChange);

		component.getTopBorder(80); // cold paint kicks off the git-status fetch
		expect(onBranchChange).not.toHaveBeenCalled();

		status.resolve({ staged: 1, unstaged: 2, untracked: 3 });
		await Promise.resolve();
		await Promise.resolve();

		expect(onBranchChange).toHaveBeenCalled();
		component.dispose();
	});

	it("fires #onBranchChange when the jj label resolves on the cold paint", async () => {
		vi.spyOn(git.head, "resolveSync").mockReturnValue(null); // no git branch -> jj overlay
		vi.spyOn(git.branch, "default").mockReturnValue(Promise.withResolvers<string | null>().promise);
		vi.spyOn(git.status, "summary").mockReturnValue(Promise.withResolvers<GitStatus | null>().promise); // isolate the jj fire
		vi.spyOn(jj.repo, "rootSync").mockReturnValue("/fake/jj/root");
		const label = Promise.withResolvers<string | null>();
		vi.spyOn(jj.workingCopy, "label").mockReturnValue(label.promise);

		const onBranchChange = vi.fn();
		const component = new StatusLineComponent(makeSession());
		component.updateSettings(gitSegment);
		component.watchBranch(onBranchChange);

		component.getTopBorder(80); // cold paint kicks off the jj-label fetch
		expect(onBranchChange).not.toHaveBeenCalled();

		label.resolve("feature-x");
		await Promise.resolve();
		await Promise.resolve();

		expect(onBranchChange).toHaveBeenCalled();
		component.dispose();
	});

	it("fires #onBranchChange when jj status resolves on the cold paint", async () => {
		vi.spyOn(git.head, "resolveSync").mockReturnValue(null); // no git -> jj repo
		vi.spyOn(git.branch, "default").mockReturnValue(Promise.withResolvers<string | null>().promise);
		vi.spyOn(git.status, "summary").mockReturnValue(Promise.withResolvers<GitStatus | null>().promise);
		vi.spyOn(jj.repo, "rootSync").mockReturnValue("/fake/jj/root");
		vi.spyOn(jj.workingCopy, "label").mockReturnValue(Promise.withResolvers<string | null>().promise); // isolate the status fire
		const status = Promise.withResolvers<GitStatus | null>();
		vi.spyOn(jj.status, "summary").mockReturnValue(status.promise);

		const onBranchChange = vi.fn();
		const component = new StatusLineComponent(makeSession());
		component.updateSettings(gitSegment);
		component.watchBranch(onBranchChange);

		component.getTopBorder(80); // cold paint kicks off the jj-status fetch
		expect(onBranchChange).not.toHaveBeenCalled();

		status.resolve({ staged: 0, unstaged: 4, untracked: 1 });
		await Promise.resolve();
		await Promise.resolve();

		expect(onBranchChange).toHaveBeenCalled();
		component.dispose();
	});
});
