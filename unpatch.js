#!/usr/bin/env node
/**
 * oh-my-pi-zh — 恢复原始英文界面
 *
 * 原理：通过 bun 重装 @oh-my-pi/pi-coding-agent 来恢复原始文件。
 * 相当于执行：bun install -g @oh-my-pi/pi-coding-agent
 */
const { execSync } = require("child_process");

console.log("🔄 正在恢复原始英文界面...");
console.log("   执行：bun install -g @oh-my-pi/pi-coding-agent");

try {
	execSync("bun install -g @oh-my-pi/pi-coding-agent", { stdio: "inherit" });
	console.log("✅ 已恢复原始版本。重启 omp 即可看到英文界面。");
} catch (err) {
	console.error("❌ 恢复失败：", err.message);
	console.error("   请手动执行：bun install -g @oh-my-pi/pi-coding-agent");
	process.exit(1);
}
