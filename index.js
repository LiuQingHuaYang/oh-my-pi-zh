#!/usr/bin/env node

/**
 * oh-my-pi-zh — 核心补丁引擎
 * 搜索已安装的 oh-my-pi 并应用中文翻译。
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const translations = require("./data");

// ===================================================================
// 查找 oh-my-pi 安装路径
// ===================================================================
function findOmpPaths() {
	const candidates = [];

	// 常见 Bun 全局安装位置
	const bunInstall = process.env.BUN_INSTALL || path.join(os.homedir(), ".bun");
	const globalNodeModules = path.join(bunInstall, "install", "global", "node_modules", "@oh-my-pi");

	if (fs.existsSync(globalNodeModules)) {
		const pkgs = ["pi-coding-agent", "pi-tui"];
		for (const pkg of pkgs) {
			const pkgPath = path.join(globalNodeModules, pkg, "src");
			if (fs.existsSync(pkgPath)) {
				candidates.push(pkgPath);
			}
		}
	}

	// npm 全局安装 (macOS/Linux)
	const npmGlobal = path.join(os.homedir(), "node_modules", "@oh-my-pi");
	if (fs.existsSync(npmGlobal)) {
		const pkgs = ["pi-coding-agent", "pi-tui"];
		for (const pkg of pkgs) {
			const pkgPath = path.join(npmGlobal, pkg, "src");
			if (fs.existsSync(pkgPath)) {
				candidates.push(pkgPath);
			}
		}
	}

	return candidates;
}

// ===================================================================
// 应用翻译
// ===================================================================
function patchFile(filePath, oldStr, newStr) {
	if (!fs.existsSync(filePath)) return false;
	let content = fs.readFileSync(filePath, "utf-8");
	if (content.includes(oldStr)) {
		content = content.replace(oldStr, newStr);
		fs.writeFileSync(filePath, content, "utf-8");
		return true;
	}
	return false;
}

function applyAll(srcPaths) {
	let total = 0;
	const codingAgent = srcPaths.find(p => p.includes("pi-coding-agent"));
	const tuiPath = srcPaths.find(p => p.includes("pi-tui"));

	if (!codingAgent) {
		console.error("❌ 未找到 oh-my-pi 安装路径。请确保已安装：bun install -g @oh-my-pi/pi-coding-agent");
		process.exit(1);
	}

	// flat 所有替换对
	const allPairs = [];

	// Tab labels
	for (const [oldStr, newStr] of translations.tabLabels) {
		allPairs.push({ file: "config/settings-schema.ts", old: oldStr, new: newStr });
	}

	// Common labels
	for (const [oldStr, newStr] of translations.commonLabels) {
		allPairs.push({ file: "config/settings-schema.ts", old: oldStr, new: newStr });
	}

	// Setting labels
	for (const item of translations.settingLabels) {
		allPairs.push({ file: "config/settings-schema.ts", old: `label: ${item.old}`, new: `label: ${item.new}` });
	}

	// Setting descriptions
	for (const [oldStr, newStr] of translations.settingDescriptions) {
		allPairs.push({ file: "config/settings-schema.ts", old: `description: ${oldStr}`, new: `description: ${newStr}` });
	}

	// Tool summaries
	for (const [oldStr, newStr] of translations.toolSummaries) {
		allPairs.push({ file: `tools/${guessToolFile(oldStr)}`, old: `summary = ${oldStr}`, new: `summary = ${newStr}` });
	}

	// Option labels
	for (const [oldStr, newStr] of translations.optionLabels) {
		allPairs.push({ file: "config/settings-schema.ts", old: `label: ${oldStr}`, new: `label: ${newStr}` });
	}

	// Option descriptions
	for (const [oldStr, newStr] of translations.optionDescriptions) {
		allPairs.push({ file: "config/settings-schema.ts", old: `description: ${oldStr}`, new: `description: ${newStr}` });
	}

	// Model roles
	for (const [oldStr, newStr] of translations.modelRoleNames) {
		allPairs.push({ file: "config/model-registry.ts", old: oldStr, new: newStr });
	}

	// Welcome
	for (const [oldStr, newStr] of translations.welcomeTexts) {
		allPairs.push({ file: "modes/components/welcome.ts", old: oldStr, new: newStr });
	}

	// Keybindings
	for (const [oldStr, newStr] of translations.keybindingDescriptions) {
		allPairs.push({ file: "keybindings.ts", old: oldStr, new: newStr, base: tuiPath });
	}

	// Session approval
	for (const [oldStr, newStr] of translations.sessionApproval) {
		allPairs.push({ file: "session/agent-session.ts", old: oldStr, new: newStr });
	}

	// ACP mode labels
	for (const [oldStr, newStr] of translations.acpModeLabels) {
		allPairs.push({ file: "modes/acp/acp-agent.ts", old: oldStr, new: newStr });
	}

	// Settings selector
	for (const [oldStr, newStr] of translations.settingsSelectorLabels) {
		allPairs.push({ file: "modes/components/settings-selector.ts", old: oldStr, new: newStr });
	}

	// 执行替换
	for (const pair of allPairs) {
		const basePath = pair.base || codingAgent;
		const filePath = path.join(basePath, pair.file);
		if (patchFile(filePath, pair.old, pair.new)) {
			total++;
		}
	}

	return total;
}

function guessToolFile(summaryStr) {
	if (summaryStr.includes("Ask the user")) return "ask.ts";
	if (summaryStr.includes("Find files")) return "find.ts";
	if (summaryStr.includes("Search file")) return "search.ts";
	if (summaryStr.includes("Write content")) return "write.ts";
	if (summaryStr.includes("Control a headless")) return "browser.ts";
	if (summaryStr.includes("Execute Python")) return "eval.ts";
	if (summaryStr.includes("Interact with GitHub")) return "gh.ts";
	if (summaryStr.includes("Describe or analyze")) return "inspect-image.ts";
	if (summaryStr.includes("checkpoint") && summaryStr.includes("Create")) return "checkpoint.ts";
	if (summaryStr.includes("Rewind")) return "checkpoint.ts";
	if (summaryStr.includes("AST-aware")) return "ast-edit.ts";
	if (summaryStr.includes("AST patterns")) return "ast-grep.ts";
	return "unknown.ts";
}

// 主函数
function main() {
	const paths = findOmpPaths();
	if (paths.length === 0) {
		console.error("❌ 未找到 @oh-my-pi 安装路径。");
		console.error("   请先安装：bun install -g @oh-my-pi/pi-coding-agent");
		process.exit(1);
	}

	console.log("🔍 找到 oh-my-pi 安装路径：", paths.join(", "));
	const count = applyAll(paths);
	console.log(`✅ 中文翻译补丁应用完成！共替换 ${count} 处。`);
	console.log("   重启 omp 即可生效。");
}

if (require.main === module) {
	main();
}

module.exports = { findOmpPaths, applyAll, patchFile };
