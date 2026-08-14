import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import * as themeModule from "@oh-my-pi/pi-coding-agent/modes/theme/theme";
import { Text } from "@oh-my-pi/pi-tui";

/**
 * Regression for issue #6337: a status message presented while the auto-theme
 * default guess (dark) was active must re-resolve its color when the terminal's
 * appearance reply later switches the active theme to light. The transient
 * status presenters supply the color via `Text.setStyleFn` (evaluated at render
 * time against the live `theme` binding) instead of baking `theme.fg()` into the
 * component, so invalidating on `onThemeChange` re-shapes it.
 */

/** Opening SGR sequence `theme.fg(color, ...)` emits, independent of color mode. */
function fgPrefix(color: "warning"): string {
	const styled = themeModule.theme.fg(color, "\u0001");
	return styled.slice(0, styled.indexOf("\u0001"));
}

describe("lazy status color re-resolves on theme switch", () => {
	beforeEach(async () => {
		themeModule.stopThemeWatcher();
		const dark = await themeModule.getThemeByName("dark");
		if (!dark) throw new Error("Failed to load dark theme for tests");
		themeModule.setThemeInstance(dark);
		vi.restoreAllMocks();
	});

	afterEach(async () => {
		themeModule.stopThemeWatcher();
		const dark = await themeModule.getThemeByName("dark");
		if (dark) themeModule.setThemeInstance(dark);
		vi.restoreAllMocks();
	});

	it("swaps a presented warning from dark-catppuccin to light-catppuccin color", async () => {
		// Auto-theme resolves dark before the appearance reply arrives.
		themeModule.onTerminalAppearanceChange("dark");
		await themeModule.initTheme(false, undefined, undefined, "dark-catppuccin", "light-catppuccin");
		expect(themeModule.getCurrentThemeName()).toBe("dark-catppuccin");

		const darkPrefix = fgPrefix("warning");
		const warning = new Text("Warning: Failed to load extension", 1, 0).setStyleFn(t =>
			themeModule.theme.fg("warning", t),
		);
		expect(warning.render(80).join("")).toContain(darkPrefix);

		// The OSC 11 reply arrives → auto-theme switches to light-catppuccin.
		const switched = Promise.withResolvers<void>();
		const off = themeModule.onThemeChange(() => switched.resolve());
		themeModule.onTerminalAppearanceChange("light");
		await switched.promise;
		off();
		expect(themeModule.getCurrentThemeName()).toBe("light-catppuccin");

		const lightPrefix = fgPrefix("warning");
		expect(lightPrefix).not.toBe(darkPrefix);

		// The onThemeChange handler invalidates + repaints; the warning must now
		// render the light-mode color, not the baked dark one.
		warning.invalidate();
		const out = warning.render(80).join("");
		expect(out).toContain(lightPrefix);
		expect(out).not.toContain(darkPrefix);
	});
});
