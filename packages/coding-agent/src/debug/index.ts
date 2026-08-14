/**
 * Debug command handler with interactive menu.
 *
 * Provides tools for debugging, bug report generation, and system diagnostics.
 */
import * as fs from "node:fs/promises";
import * as url from "node:url";
import { getWorkProfile } from "@oh-my-pi/pi-natives";
import {
	Container,
	isNotificationSuppressed,
	Loader,
	type OverlayHandle,
	type SelectItem,
	SelectList,
	Spacer,
	TERMINAL,
	type TerminalNotification,
	Text,
} from "@oh-my-pi/pi-tui";
import { getSessionsDir } from "@oh-my-pi/pi-utils";
import { DynamicBorder } from "../modes/components/dynamic-border";
import { TranscriptBlock } from "../modes/components/transcript-container";
import { getSelectListTheme, getSymbolTheme, theme } from "../modes/theme/theme";
import type { InteractiveModeContext } from "../modes/types";
import { formatBytes } from "../tools/render-utils";
import { openPath } from "../utils/open";
import { DebugLogViewerComponent } from "./log-viewer";
import { generateHeapSnapshotData, type ProfilerSession, startCpuProfile } from "./profiler";
import { buildSampleImage, ProtocolProbeComponent } from "./protocol-probe";
import { RawSseViewerComponent } from "./raw-sse";
import { resolveRawSseDebugBuffer } from "./raw-sse-buffer";
import { getRemoteDebugger, type RemoteDebuggerInfo, startRemoteDebuggerServer } from "./remote-debugger";
import { clearArtifactCache, createDebugLogSource, createReportBundle, getArtifactCacheStats } from "./report-bundle";
import { collectSystemInfo, formatSystemInfo } from "./system-info";
import { collectTerminalState, formatTerminalState } from "./terminal-info";

/** Debug menu options */
const DEBUG_MENU_ITEMS: SelectItem[] = [
	{ value: "open-artifacts", label: "打开：产物文件夹", description: "在文件管理器中打开会话产物" },
	{ value: "performance", label: "报告：性能问题", description: "分析 CPU、复现、打包" },
	{ value: "work", label: "分析：工作调度", description: "打开最近 30 秒火焰图" },
	{ value: "dump", label: "报告：转储会话", description: "立即创建报告包" },
	{ value: "memory", label: "报告：内存问题", description: "堆快照 + 打包" },
	{ value: "logs", label: "查看：最近日志", description: "显示最近 50 条日志" },
	{ value: "system", label: "查看：系统信息", description: "显示环境详情" },
	{ value: "terminal", label: "查看：终端状态", description: "子协议、几何、回滚策略" },
	{
		value: "protocols",
		label: "测试：终端协议",
		description: "样式、链接、文本大小、图形、通知",
	},
	{ value: "raw-sse", label: "查看：原始 SSE 流", description: "显示实时提供商 SSE 帧" },
	{
		value: "remote-debugger",
		label: "启动：JS 远程调试器",
		description: "暴露 JavaScriptCore 检查器套接字（实验性）",
	},
	{
		value: "transcript",
		label: "导出：TUI 对话记录",
		description: "将可见 TUI 对话写入临时 txt",
	},
	{ value: "clear-cache", label: "清除：产物缓存", description: "移除旧的会话产物" },
];

const formatFileHyperlink = (path: string): string => {
	const fileUrl = url.pathToFileURL(path).href;
	return `\x1b]8;;${fileUrl}\x07${path}\x1b]8;;\x07`;
};

/**
 * Debug selector component.
 */
export class DebugSelectorComponent extends Container {
	#selectList: SelectList;

	constructor(
		private ctx: InteractiveModeContext,
		onDone: () => void,
	) {
		super();

		// Title
		this.addChild(new DynamicBorder());
		this.addChild(new Text(theme.bold(theme.fg("accent", "Debug Tools")), 1, 0));
		this.addChild(new Spacer(1));

		// Select list
		this.#selectList = new SelectList(DEBUG_MENU_ITEMS, 7, getSelectListTheme());

		this.#selectList.onSelect = item => {
			onDone();
			void this.#handleSelection(item.value);
		};

		this.#selectList.onCancel = () => {
			onDone();
		};

		this.addChild(this.#selectList);
		this.addChild(new DynamicBorder());
	}

	handleInput(keyData: string): void {
		this.#selectList.handleInput(keyData);
	}

	async #handleSelection(value: string): Promise<void> {
		switch (value) {
			case "open-artifacts":
				await this.#handleOpenArtifacts();
				break;
			case "performance":
				await this.#handlePerformanceReport();
				break;
			case "work":
				await this.#handleWorkReport();
				break;
			case "dump":
				await this.#handleDumpReport();
				break;
			case "memory":
				await this.#handleMemoryReport();
				break;
			case "logs":
				await this.#handleViewLogs();
				break;
			case "raw-sse":
				await this.#handleViewRawSse();
				break;
			case "remote-debugger":
				await this.#handleStartRemoteDebugger();
				break;
			case "system":
				await this.#handleViewSystemInfo();
				break;
			case "terminal":
				await this.#handleViewTerminalState();
				break;
			case "protocols":
				await this.#handleViewProtocols();
				break;
			case "transcript":
				await this.#handleTranscriptExport();
				break;
			case "clear-cache":
				await this.#handleClearCache();
				break;
		}
	}

	async #handlePerformanceReport(): Promise<void> {
		// Start profiling
		let session: ProfilerSession;
		try {
			session = await startCpuProfile();
		} catch (err) {
			this.ctx.showError(`Failed to start profiler: ${err instanceof Error ? err.message : String(err)}`);
			return;
		}

		// Show message and wait for keypress
		const block = new TranscriptBlock();
		block.addChild(new Text(theme.fg("accent", `${theme.status.info} CPU profiling started`), 1, 0));
		block.addChild(new Spacer(1));
		block.addChild(
			new Text(theme.fg("muted", "Reproduce the performance issue, then press Enter to stop profiling."), 1, 0),
		);
		this.ctx.present(block);

		// Wait for Enter keypress
		const { promise, resolve } = Promise.withResolvers<void>();
		const originalOnEscape = this.ctx.editor.onEscape;
		const originalOnSubmit = this.ctx.editor.onSubmit;

		this.ctx.editor.onSubmit = () => {
			this.ctx.editor.onEscape = originalOnEscape;
			this.ctx.editor.onSubmit = originalOnSubmit;
			resolve();
		};

		this.ctx.editor.onEscape = () => {
			this.ctx.editor.onEscape = originalOnEscape;
			this.ctx.editor.onSubmit = originalOnSubmit;
			resolve();
		};

		await promise;

		// Stop profiling and create report
		const loader = new Loader(
			this.ctx.ui,
			spinner => theme.fg("accent", spinner),
			text => theme.fg("muted", text),
			"Generating report...",
			getSymbolTheme().spinnerFrames,
		);
		this.ctx.statusContainer.addChild(loader);
		this.ctx.ui.requestRender();

		try {
			const cpuProfile = await session.stop();
			const workProfile = getWorkProfile(30);
			const result = await createReportBundle({
				sessionFile: this.ctx.sessionManager.getSessionFile(),
				settings: this.#getResolvedSettings(),
				rawSseText: this.#getRawSseText(),
				cpuProfile,
				workProfile,
			});

			loader.stop();
			this.ctx.statusContainer.clear();

			const block = new TranscriptBlock();
			block.addChild(new Text(theme.fg("success", `+ Performance report saved`), 1, 0));
			block.addChild(new Text(theme.fg("dim", formatFileHyperlink(result.path)), 1, 0));
			block.addChild(new Text(theme.fg("dim", `Files: ${result.files.length}`), 1, 0));
			this.ctx.present(block);
		} catch (err) {
			loader.stop();
			this.ctx.statusContainer.clear();
			this.ctx.showError(`Failed to create report: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	async #handleWorkReport(): Promise<void> {
		try {
			const workProfile = getWorkProfile(30);

			if (!workProfile.svg) {
				this.ctx.showWarning(`No work profile data (${workProfile.sampleCount} samples)`);
				return;
			}

			// Write SVG to temp file and open in browser
			const tmpPath = `/tmp/work-profile-${Date.now()}.svg`;
			await Bun.write(tmpPath, workProfile.svg);

			openPath(tmpPath);

			this.ctx.present([
				new Spacer(1),
				new Text(theme.fg("dim", `Opened flamegraph (${workProfile.sampleCount} samples)`), 1, 0),
			]);
		} catch (err) {
			this.ctx.showError(`Failed to open profile: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	async #handleDumpReport(): Promise<void> {
		const loader = new Loader(
			this.ctx.ui,
			spinner => theme.fg("accent", spinner),
			text => theme.fg("muted", text),
			"Creating report bundle...",
			getSymbolTheme().spinnerFrames,
		);
		this.ctx.statusContainer.addChild(loader);
		this.ctx.ui.requestRender();

		try {
			const result = await createReportBundle({
				sessionFile: this.ctx.sessionManager.getSessionFile(),
				settings: this.#getResolvedSettings(),
				rawSseText: this.#getRawSseText(),
			});

			loader.stop();
			this.ctx.statusContainer.clear();

			const block = new TranscriptBlock();
			block.addChild(new Text(theme.fg("success", `+ Report bundle saved`), 1, 0));
			block.addChild(new Text(theme.fg("dim", formatFileHyperlink(result.path)), 1, 0));
			block.addChild(new Text(theme.fg("dim", `Files: ${result.files.length}`), 1, 0));
			this.ctx.present(block);
		} catch (err) {
			loader.stop();
			this.ctx.statusContainer.clear();
			this.ctx.showError(`Failed to create report: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	async #handleMemoryReport(): Promise<void> {
		const loader = new Loader(
			this.ctx.ui,
			spinner => theme.fg("accent", spinner),
			text => theme.fg("muted", text),
			"Generating heap snapshot...",
			getSymbolTheme().spinnerFrames,
		);
		this.ctx.statusContainer.addChild(loader);
		this.ctx.ui.requestRender();

		try {
			const heapSnapshot = generateHeapSnapshotData();
			loader.setText("Creating report bundle...");

			const result = await createReportBundle({
				sessionFile: this.ctx.sessionManager.getSessionFile(),
				settings: this.#getResolvedSettings(),
				rawSseText: this.#getRawSseText(),
				heapSnapshot,
			});

			loader.stop();
			this.ctx.statusContainer.clear();

			const block = new TranscriptBlock();
			block.addChild(new Text(theme.fg("success", `+ Memory report saved`), 1, 0));
			block.addChild(new Text(theme.fg("dim", formatFileHyperlink(result.path)), 1, 0));
			block.addChild(new Text(theme.fg("dim", `Files: ${result.files.length}`), 1, 0));
			this.ctx.present(block);
		} catch (err) {
			loader.stop();
			this.ctx.statusContainer.clear();
			this.ctx.showError(`Failed to create report: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	async #handleViewLogs(): Promise<void> {
		try {
			const logSource = await createDebugLogSource();
			const logs = await logSource.getInitialText();
			if (!logs && !logSource.hasOlderLogs()) {
				this.ctx.showWarning("No log entries found for today.");
				return;
			}

			let overlay: OverlayHandle | undefined;
			const close = (): void => {
				overlay?.hide();
				overlay = undefined;
				void this.ctx.showDebugSelector();
			};
			const viewer = new DebugLogViewerComponent({
				logs,
				terminalRows: this.ctx.ui.terminal.rows,
				onExit: close,
				onStatus: message => this.ctx.showStatus(message, { dim: true }),
				onError: message => this.ctx.showError(message),
				onUpdate: () => this.ctx.ui.requestRender(),
				logSource,
			});

			overlay = this.ctx.ui.showOverlay(viewer, {
				anchor: "top-left",
				width: "100%",
				maxHeight: "100%",
				margin: 0,
				fullscreen: true,
			});
			this.ctx.ui.setFocus(viewer);
		} catch (err) {
			this.ctx.showError(`Failed to read logs: ${err instanceof Error ? err.message : String(err)}`);
		}

		this.ctx.ui.requestRender();
	}

	async #handleViewRawSse(): Promise<void> {
		let overlay: OverlayHandle | undefined;
		let viewer: RawSseViewerComponent | undefined;
		const close = (): void => {
			viewer?.dispose();
			overlay?.hide();
			overlay = undefined;
			void this.ctx.showDebugSelector();
		};
		viewer = new RawSseViewerComponent({
			buffer: resolveRawSseDebugBuffer(this.ctx.session),
			terminalRows: this.ctx.ui.terminal.rows,
			onExit: close,
			onStatus: message => this.ctx.showStatus(message, { dim: true }),
			onUpdate: () => this.ctx.ui.requestRender(),
		});

		overlay = this.ctx.ui.showOverlay(viewer, {
			anchor: "top-left",
			width: "100%",
			maxHeight: "100%",
			margin: 0,
			fullscreen: true,
		});
		this.ctx.ui.setFocus(viewer);
		this.ctx.ui.requestRender();
	}

	async #handleStartRemoteDebugger(): Promise<void> {
		const existing = getRemoteDebugger();
		let info: RemoteDebuggerInfo;
		try {
			info = existing ?? (await startRemoteDebuggerServer());
		} catch (err) {
			this.ctx.showError(`Failed to start remote debugger: ${err instanceof Error ? err.message : String(err)}`);
			return;
		}

		const block = new TranscriptBlock();
		block.addChild(
			new Text(
				theme.fg(
					"success",
					`${theme.status.success} JavaScriptCore remote inspector ${existing ? "already running" : "started"}`,
				),
				1,
				0,
			),
		);
		block.addChild(new Text(theme.fg("dim", `Listening on ${info.host}:${info.port}`), 1, 0));
		block.addChild(
			new Text(
				theme.fg(
					"muted",
					"Experimental WebKit RemoteInspectorServer socket (Bun marks it untested on macOS). One-way for this process — there is no stop. Attach a compatible WebKit/Safari Web Inspector client.",
				),
				1,
				0,
			),
		);
		this.ctx.present(block);
	}

	async #handleViewSystemInfo(): Promise<void> {
		try {
			const info = await collectSystemInfo();
			const formatted = formatSystemInfo(info);

			const block = new TranscriptBlock();
			block.addChild(new DynamicBorder());
			block.addChild(new Text(formatted, 1, 0));
			block.addChild(new DynamicBorder());
			this.ctx.present(block);
		} catch (err) {
			this.ctx.showError(`Failed to collect system info: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	async #handleViewTerminalState(): Promise<void> {
		const info = collectTerminalState({
			columns: this.ctx.ui.terminal.columns,
			rows: this.ctx.ui.terminal.rows,
			synchronizedOutput: this.ctx.ui.synchronizedOutput,
		});
		const formatted = formatTerminalState(info);

		const block = new TranscriptBlock();
		block.addChild(new DynamicBorder());
		block.addChild(new Text(formatted, 1, 0));
		block.addChild(new DynamicBorder());
		this.ctx.present(block);
	}

	async #handleViewProtocols(): Promise<void> {
		// Fire the desktop notification as a real side effect, then render a
		// panel that samples every other special protocol and reports the
		// notification outcome.
		const suppressed = isNotificationSuppressed();
		if (!suppressed) {
			const sessionName = this.ctx.sessionManager.getSessionName();
			const notification: TerminalNotification = {
				title: sessionName || "Oh My Pi",
				body: "Terminal protocol test",
				type: "test",
				actions: "focus",
			};
			TERMINAL.sendNotification(notification);
		}

		this.ctx.present([
			new Spacer(1),
			new ProtocolProbeComponent({
				image: buildSampleImage(),
				imageBudget: this.ctx.ui.imageBudget,
				notificationSuppressed: suppressed,
			}),
		]);
	}

	async #handleTranscriptExport(): Promise<void> {
		await this.ctx.handleDebugTranscriptCommand();
	}
	async #handleOpenArtifacts(): Promise<void> {
		const sessionFile = this.ctx.sessionManager.getSessionFile();
		if (!sessionFile) {
			this.ctx.showWarning("No active session file.");
			return;
		}

		const artifactsDir = sessionFile.slice(0, -6);

		try {
			const stat = await fs.stat(artifactsDir);
			if (!stat.isDirectory()) {
				this.ctx.showWarning("Artifact folder does not exist yet.");
				return;
			}
		} catch {
			this.ctx.showWarning("Artifact folder does not exist yet.");
			return;
		}

		openPath(artifactsDir);
		this.ctx.showStatus(`Opened: ${artifactsDir}`);
	}

	async #handleClearCache(): Promise<void> {
		const sessionsDir = getSessionsDir();

		// Get stats first
		const stats = await getArtifactCacheStats(sessionsDir);

		if (stats.count === 0) {
			this.ctx.showStatus("Artifact cache is empty.");
			return;
		}

		const sizeStr = formatBytes(stats.totalSize);
		const oldestStr = stats.oldestDate ? stats.oldestDate.toLocaleDateString() : "unknown";

		// Show confirmation
		const confirmed = await this.ctx.showHookConfirm(
			"Clear Artifact Cache",
			`Found ${stats.count} artifact files (${sizeStr})\nOldest: ${oldestStr}\n\nRemove artifacts older than 30 days?`,
		);

		if (!confirmed) {
			this.ctx.showStatus("Cache clear cancelled.");
			return;
		}

		// Clear cache
		const loader = new Loader(
			this.ctx.ui,
			spinner => theme.fg("accent", spinner),
			text => theme.fg("muted", text),
			"Clearing artifact cache...",
			getSymbolTheme().spinnerFrames,
		);
		this.ctx.statusContainer.addChild(loader);
		this.ctx.ui.requestRender();

		try {
			const result = await clearArtifactCache(sessionsDir, 30);

			loader.stop();
			this.ctx.statusContainer.clear();

			this.ctx.present([
				new Spacer(1),
				new Text(theme.fg("success", `- Cleared ${result.removed} artifact directories`), 1, 0),
			]);
		} catch (err) {
			loader.stop();
			this.ctx.statusContainer.clear();
			this.ctx.showError(`Failed to clear cache: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	#getRawSseText(): string | undefined {
		const rawSseText = resolveRawSseDebugBuffer(this.ctx.session).toRawText();
		return rawSseText.trim().length > 0 ? rawSseText : undefined;
	}

	#getResolvedSettings(): Record<string, unknown> {
		// Extract key settings for the report
		return {
			model: this.ctx.session.model?.id,
			thinkingLevel: this.ctx.session.thinkingLevel,
			planModeEnabled: this.ctx.planModeEnabled,
			toolOutputExpanded: this.ctx.toolOutputExpanded,
			hideThinkingBlock: this.ctx.hideThinkingBlock,
		};
	}
}

/**
 * Show the debug selector.
 */
export function showDebugSelector(ctx: InteractiveModeContext, done: () => void): DebugSelectorComponent {
	const selector = new DebugSelectorComponent(ctx, done);
	return selector;
}
