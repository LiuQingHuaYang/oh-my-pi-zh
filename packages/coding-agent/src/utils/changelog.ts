import * as path from "node:path";
import { getLastChangelogVersionPath, isEnoent, logger } from "@oh-my-pi/pi-utils";
import bundledChangelogPath from "../../CHANGELOG.md" with { type: "file" };

export interface ChangelogEntry {
	major: number;
	minor: number;
	patch: number;
	content: string;
}

/** Number of changelog releases shown by automatic and default recent views. */
export const RECENT_CHANGELOG_ENTRY_LIMIT = 3;
/** Maximum Markdown source bytes allowed in automatic startup release notes. */
export const STARTUP_CHANGELOG_MAX_BYTES = 64 * 1024;
/** Hint appended when automatic startup release notes are truncated. */
export const STARTUP_CHANGELOG_FULL_HINT = "Use `/changelog full` to view the complete changelog.";

/** Markdown generated from selected changelog entries and whether it hit a size cap. */
export interface RenderedChangelog {
	markdown: string;
	truncated: boolean;
}

/** Automatic startup changelog decision, including whether the marker should advance. */
export interface StartupChangelogSelection {
	markdown: string | undefined;
	persistCurrentVersion: boolean;
	truncated: boolean;
	selectedEntries: number;
}

/**
 * Parse changelog entries from omp's package asset when available, falling back
 * to the copy embedded in compiled binaries.
 *
 * The embedded fallback keeps standalone binaries self-contained without
 * resolving relative to the host project's cwd, which caused issue #1423.
 */
export function resolveBundledChangelogPath(assetPath: string, moduleUrl: string | URL): string | URL {
	if (path.isAbsolute(assetPath) || path.win32.isAbsolute(assetPath)) return assetPath;
	return new URL(assetPath, moduleUrl);
}

export async function parseChangelog(changelogPath: string | undefined): Promise<ChangelogEntry[]> {
	let content: string | undefined;
	if (changelogPath) {
		try {
			content = await Bun.file(changelogPath).text();
		} catch (error) {
			if (!isEnoent(error)) {
				logger.error(`Warning: Could not parse changelog: ${error}`);
			}
		}
	}
	content ??= await Bun.file(resolveBundledChangelogPath(bundledChangelogPath, import.meta.url)).text();

	return parseChangelogContent(content);
}

function parseChangelogContent(content: string): ChangelogEntry[] {
	const lines = content.split("\n");
	const entries: ChangelogEntry[] = [];

	let currentLines: string[] = [];
	let currentVersion: { major: number; minor: number; patch: number } | null = null;

	for (const line of lines) {
		if (line.startsWith("## ")) {
			if (currentVersion && currentLines.length > 0) {
				entries.push({
					...currentVersion,
					content: currentLines.join("\n").trim(),
				});
			}

			const versionMatch = line.match(/##\s+\[?(\d+)\.(\d+)\.(\d+)\]?/);
			if (versionMatch) {
				currentVersion = {
					major: Number.parseInt(versionMatch[1], 10),
					minor: Number.parseInt(versionMatch[2], 10),
					patch: Number.parseInt(versionMatch[3], 10),
				};
				currentLines = [line];
			} else {
				currentVersion = null;
				currentLines = [];
			}
		} else if (currentVersion) {
			currentLines.push(line);
		}
	}

	if (currentVersion && currentLines.length > 0) {
		entries.push({
			...currentVersion,
			content: currentLines.join("\n").trim(),
		});
	}

	return entries;
}

/**
 * Compare versions. Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: ChangelogEntry, v2: ChangelogEntry): number {
	if (v1.major !== v2.major) return v1.major - v2.major;
	if (v1.minor !== v2.minor) return v1.minor - v2.minor;
	return v1.patch - v2.patch;
}

/**
 * Parse an omp changelog marker version into comparable parts.
 */
export function parseChangelogVersion(version: string | undefined): ChangelogEntry | undefined {
	const match = version?.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) {
		return undefined;
	}

	return {
		major: Number.parseInt(match[1], 10),
		minor: Number.parseInt(match[2], 10),
		patch: Number.parseInt(match[3], 10),
		content: "",
	};
}

/**
 * Get entries newer than lastVersion.
 */
export function getNewEntries(entries: ChangelogEntry[], lastVersion: string): ChangelogEntry[] {
	const parsedLastVersion = parseChangelogVersion(lastVersion);
	if (!parsedLastVersion) {
		return [];
	}

	return entries.filter(entry => compareVersions(entry, parsedLastVersion) > 0);
}

/**
 * Render changelog entries oldest-first by default and optionally cap the Markdown source size.
 */
export function renderChangelogEntries(
	entries: ChangelogEntry[],
	options: { maxBytes?: number; truncationHint?: string; oldestFirst?: boolean } = {},
): RenderedChangelog {
	const orderedEntries = options.oldestFirst === false ? entries : [...entries].reverse();
	const markdown = orderedEntries.map(entry => entry.content).join("\n\n");
	if (options.maxBytes === undefined || Buffer.byteLength(markdown) <= options.maxBytes) {
		return { markdown, truncated: false };
	}

	const suffix = `\n\n…\n\n${options.truncationHint ?? STARTUP_CHANGELOG_FULL_HINT}`;
	let low = 0;
	let high = markdown.length;
	while (low < high) {
		const middle = Math.floor((low + high + 1) / 2);
		if (Buffer.byteLength(markdown.slice(0, middle) + suffix) <= options.maxBytes) {
			low = middle;
		} else {
			high = middle - 1;
		}
	}

	return { markdown: markdown.slice(0, low) + suffix, truncated: true };
}

/**
 * Select bounded release notes for interactive startup.
 */
export function selectStartupChangelog(
	entries: ChangelogEntry[],
	lastVersion: string | undefined,
	currentVersion: string,
): StartupChangelogSelection {
	const parsedLastVersion = parseChangelogVersion(lastVersion);
	if (!parsedLastVersion) {
		return { markdown: undefined, persistCurrentVersion: true, truncated: false, selectedEntries: 0 };
	}
	const markerVersion = lastVersion ?? "";
	if (markerVersion === currentVersion) {
		return { markdown: undefined, persistCurrentVersion: false, truncated: false, selectedEntries: 0 };
	}

	const newEntries = getNewEntries(entries, markerVersion).slice(0, RECENT_CHANGELOG_ENTRY_LIMIT);
	if (newEntries.length === 0) {
		return { markdown: undefined, persistCurrentVersion: false, truncated: false, selectedEntries: 0 };
	}

	const rendered = renderChangelogEntries(newEntries, {
		maxBytes: STARTUP_CHANGELOG_MAX_BYTES,
		truncationHint: STARTUP_CHANGELOG_FULL_HINT,
		oldestFirst: false,
	});
	return {
		markdown: rendered.markdown,
		persistCurrentVersion: true,
		truncated: rendered.truncated,
		selectedEntries: newEntries.length,
	};
}

// Re-export getChangelogPath from paths.ts for convenience
export { getChangelogPath } from "../config";

/**
 * Last omp version whose changelog the user has seen. Stored as a plain-text
 * marker file (`~/.omp/agent/last-changelog-version`) rather than in
 * `config.yml`, so version bumps never dirty user-tracked config files.
 */
export async function readLastChangelogVersion(agentDir?: string): Promise<string | undefined> {
	try {
		const value = (await Bun.file(getLastChangelogVersionPath(agentDir)).text()).trim();
		return value || undefined;
	} catch (error) {
		if (!isEnoent(error)) {
			logger.warn("Failed to read last-changelog-version marker", { error: String(error) });
		}
		return undefined;
	}
}

/** Persist the last-seen changelog version marker. Best-effort: failures are logged, never thrown. */
export async function writeLastChangelogVersion(version: string, agentDir?: string): Promise<void> {
	try {
		await Bun.write(getLastChangelogVersionPath(agentDir), version);
	} catch (error) {
		logger.warn("Failed to persist last-changelog-version marker", { error: String(error) });
	}
}
