import { expect, test } from "bun:test";
import * as path from "node:path";
import { TempDir } from "@oh-my-pi/pi-utils";

interface ProbeResult {
	retainedHeapNodes: number;
	schemaIdentityStable?: boolean;
	model?: {
		provider: string;
		id: string;
		baseUrl: string;
		api: string;
		thinking?: unknown;
	};
}

const probePath = path.join(import.meta.dir, "fixtures", "models-config-validator-construction-probe.ts");

async function runProbe(root: string, mode: "missing" | "custom"): Promise<ProbeResult> {
	const proc = Bun.spawn([process.execPath, probePath, root, mode], {
		cwd: path.join(import.meta.dir, "../../.."),
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	expect(exitCode, stderr).toBe(0);
	return JSON.parse(stdout) as ProbeResult;
}

test("models config validation resources are retained only for a custom config", async () => {
	const tempDir = TempDir.createSync("@models-config-validator-");
	try {
		const missing = await runProbe(tempDir.path(), "missing");
		const custom = await runProbe(tempDir.path(), "custom");

		expect(missing.model).toMatchObject({
			provider: "anthropic",
			id: "claude-sonnet-4-5",
			baseUrl: "https://api.anthropic.com",
			api: "anthropic-messages",
		});
		expect(custom.model).toEqual({
			provider: "lazy-models",
			id: "lazy-model",
			baseUrl: "https://lazy.example/v1",
			api: "openai-responses",
			thinking: {
				mode: "effort",
				efforts: ["low", "medium", "high"],
				defaultLevel: "medium",
			},
		});
		expect(custom.schemaIdentityStable).toBe(true);
		expect(
			custom.retainedHeapNodes - missing.retainedHeapNodes,
			"custom config validation should retain its schema bundle",
		).toBeGreaterThan(15_000);
	} finally {
		await tempDir.remove().catch(() => {});
	}
});
