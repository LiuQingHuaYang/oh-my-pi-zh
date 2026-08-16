#!/usr/bin/env bun
/**
 * Publish the Chinese-translated coding-agent to npm as a single package.
 *
 * Why one package: `bundle-dist.ts` does NOT externalize `@oh-my-pi/pi-tui`,
 * so the prepack bundle `dist/cli.js` embeds the Chinese tui code. The
 * published `bin` points at `dist/cli.js` (same as the official release via
 * `publishBin`), so all translations (coding-agent + tui) ship in one tarball.
 *
 * Flow (mirrors scripts/ci-release-publish.ts):
 *   1. Rewrite `packages/coding-agent/package.json` in place:
 *        - name -> @liuqinghuayang/pi-coding-agent
 *        - bin  -> { omp: "dist/cli.js" }
 *        - every `catalog:` dep resolved to the concrete version from the
 *          root workspace catalog (npm cannot resolve `catalog:`)
 *        - repository/homepage/bugs -> the zh fork
 *   2. `bun pm pack` (resolves remaining protocols, runs `prepack` which
 *      regenerates `dist/cli.js`).
 *   3. `npm publish <tarball>` (npm, not `bun publish`, for the same reason
 *      the official flow uses npm).
 *   4. Restore the original manifest.
 *
 * Usage:
 *   bun scripts/publish-zh.ts            # publish for real
 *   bun scripts/publish-zh.ts --dry-run  # pack only, no publish
 *   bun scripts/publish-zh.ts --name @you/pi-coding-agent
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { $ } from "bun";

const repoRoot = path.join(import.meta.dir, "..");
const pkgDir = path.join(repoRoot, "packages", "coding-agent");
const manifestPath = path.join(pkgDir, "package.json");
const rootManifestPath = path.join(repoRoot, "package.json");

const argv = process.argv.slice(2);
const isDryRun = argv.includes("--dry-run");
const nameArg = argv.find(a => a.startsWith("--name="));
const packageName = nameArg ? nameArg.slice("--name=".length) : "@daassw/pi-coding-agent";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
	[key: string]: JsonValue;
}

function resolveDeps(deps: JsonObject | undefined, catalog: JsonObject): JsonObject {
	const out: JsonObject = {};
	for (const [name, spec] of Object.entries(deps ?? {})) {
		out[name] = spec === "catalog:" ? (catalog[name] ?? spec) : spec;
	}
	return out;
}

async function main(): Promise<void> {
	const rootManifest = (await Bun.file(rootManifestPath).json()) as JsonObject;
	const catalog = (rootManifest.workspaces as JsonObject).catalog as JsonObject;
	const manifest = (await Bun.file(manifestPath).json()) as JsonObject;

	const publishManifest: JsonObject = {
		...manifest,
		name: packageName,
		bin: { omp: "dist/cli.js" },
		dependencies: resolveDeps(manifest.dependencies as JsonObject, catalog),
		optionalDependencies: resolveDeps(manifest.optionalDependencies as JsonObject, catalog),
		devDependencies: resolveDeps(manifest.devDependencies as JsonObject, catalog),
		repository: {
			type: "git",
			url: "git+https://github.com/LiuQingHuaYang/oh-my-pi-zh.git",
			directory: "packages/coding-agent",
		},
		homepage: "https://github.com/LiuQingHuaYang/oh-my-pi-zh",
		bugs: { url: "https://github.com/LiuQingHuaYang/oh-my-pi-zh/issues" },
		publishConfig: { access: "public" },
	};

	// Back up the on-repo manifest (points bin at src/cli.ts for source installs).
	const original = await Bun.file(manifestPath).text();
	await Bun.write(manifestPath, `${JSON.stringify(publishManifest, null, "\t")}\n`);

	try {
		console.log(`==> Packing ${packageName} (dry-run=${isDryRun})`);
		// Remove stale tarballs from previous runs so we never publish the
		// wrong (old-name) artifact.
		for (const f of await fs.readdir(pkgDir)) {
			if (f.endsWith(".tgz")) await fs.rm(path.join(pkgDir, f), { force: true });
		}
		await $`bun pm pack`.cwd(pkgDir);

		const tarballs = (await fs.readdir(pkgDir)).filter(f => f.endsWith(".tgz"));
		if (tarballs.length === 0) throw new Error("bun pm pack produced no tarball");
		const tarball = tarballs.sort().at(-1)!;
		console.log(`==> Tarball: ${tarball}`);

		if (isDryRun) {
			console.log("==> Dry run: skipping npm publish");
		} else {
			console.log("==> Publishing with npm...");
			await $`npm publish ${path.join(pkgDir, tarball)} --access public`;
			console.log("==> Published:", packageName);
		}
	} finally {
		await Bun.write(manifestPath, original);
		console.log("==> Restored original package.json");
	}
}

await main();