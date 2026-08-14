import * as path from "node:path";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { ModelsConfigFile } from "@oh-my-pi/pi-coding-agent/config/models-config";
import { AuthStorage } from "@oh-my-pi/pi-coding-agent/session/auth-storage";
import { YAML } from "bun";

interface HeapSnapshot {
	nodes: number[];
	snapshot: { meta: { node_fields: string[] } };
}

const root = process.argv[2];
const mode = process.argv[3];
if (!root || (mode !== "missing" && mode !== "custom")) {
	throw new Error("Expected an isolated config root and missing|custom mode");
}

const configPath = path.join(root, mode, "models.yml");
if (mode === "custom") {
	await Bun.write(
		configPath,
		YAML.stringify(
			{
				providers: {
					"lazy-models": {
						baseUrl: "https://lazy.example/v1",
						api: "openai-responses",
						auth: "none",
						models: [
							{
								id: "lazy-model",
								reasoning: true,
								thinking: {
									mode: "effort",
									minLevel: "low",
									maxLevel: "high",
									defaultLevel: "medium",
								},
							},
						],
					},
				},
			},
			null,
			2,
		),
	);
}

const authStorage = await AuthStorage.create(":memory:");
try {
	const registry = new ModelRegistry(authStorage, configPath);
	const model =
		mode === "custom" ? registry.find("lazy-models", "lazy-model") : registry.find("anthropic", "claude-sonnet-4-5");
	const firstSchema = mode === "custom" ? ModelsConfigFile.relocate(configPath).schema : undefined;
	const secondSchema =
		mode === "custom" ? ModelsConfigFile.relocate(path.join(root, "second", "models.yml")).schema : undefined;

	Bun.gc(true);
	const snapshot = JSON.parse(Bun.generateHeapSnapshot("v8")) as HeapSnapshot;
	const nodeWidth = snapshot.snapshot.meta.node_fields.length;

	process.stdout.write(
		JSON.stringify({
			retainedHeapNodes: snapshot.nodes.length / nodeWidth,
			schemaIdentityStable: mode === "custom" ? firstSchema === secondSchema : undefined,
			model: model && {
				provider: model.provider,
				id: model.id,
				baseUrl: model.baseUrl,
				api: model.api,
				thinking: model.thinking,
			},
		}),
	);
} finally {
	authStorage.close();
}
