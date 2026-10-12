#!/usr/bin/env python3
"""
oh-my-pi 中文翻译补丁 v3 (适配 v18+ 及历史版本)
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
v3 核心改进：
1. 全面适配上游 v18 架构重构：
   - 动态扫描 packages/coding-agent/src/**/settings*.ts，彻底解决旧版 settings-schema.ts 被拆分导致的汉化失效问题。
   - 适配 packages/tui/src/overlays/settings-defs.ts（Tab 标题、分组标题、Tab 引言）。
   - 适配移动后的组件路径（welcome.ts, settings-selector.ts 等）。
   - 增加 /skills 等 v18 新命令与新设置项字典。
2. 兼容性支持：
   - 自动检测并支持旧版（v16/v17）及最新版（v18+）。
   - 支持命令行传参指定目标源码目录，未传参时自动检测。

使用方法：
  python patch_omp_zh_v3.py [目标源码根目录]
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
"""
import glob
import os
import re
import sys

# Windows 终端编码容错处理
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 导入 v17 与 v18 词库
import translations_v17 as v17
import translations_v18 as v18
import patch_omp_zh_v2 as v2_data

# ──────────── 1. 目标源码目录解析 ────────────
def resolve_target_dir():
    if len(sys.argv) > 1:
        target = os.path.abspath(sys.argv[1])
        if os.path.exists(os.path.join(target, "packages")):
            return target
        print(f"错误: 指定的目录不存在 packages/ 结构: {target}")
        sys.exit(1)

    cwd = os.getcwd()
    if os.path.exists(os.path.join(cwd, "packages", "coding-agent")):
        return cwd

    # 检查当前目录下的 source/（常见于 CI 构建）
    ci_source = os.path.join(cwd, "source")
    if os.path.exists(os.path.join(ci_source, "packages", "coding-agent")):
        return ci_source

    return cwd


REPO_DIR = resolve_target_dir()
CODING_AGENT_SRC = os.path.join(REPO_DIR, "packages", "coding-agent", "src")
TUI_SRC = os.path.join(REPO_DIR, "packages", "tui", "src")


# ──────────── 2. 补丁核心函数 ────────────
def patch(file_path, old_str, new_str):
    """单处文本替换"""
    if not os.path.exists(file_path):
        return 0
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    if old_str not in content:
        return 0
    count = content.count(old_str)
    new_content = content.replace(old_str, new_str)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    return count


def apply_translations(file_path, pairs):
    """对单个文件应用一组字符串替换"""
    if not os.path.exists(file_path):
        return 0
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    total = 0
    for old_str, new_str in pairs:
        if old_str in content:
            total += content.count(old_str)
            content = content.replace(old_str, new_str)

    if total > 0:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
    return total


def apply_description_translations(file_path, pairs):
    """应用 description 替换，兼容跨行与格式变体"""
    if not os.path.exists(file_path):
        return 0
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    total = 0
    for old_str, new_str in pairs:
        m = re.match(r'description:\s*("(?:[^"\\]|\\.)*")', old_str)
        if not m:
            continue
        old_quoted = m.group(1)
        m2 = re.match(r'description:\s*("(?:[^"\\]|\\.)*")', new_str)
        new_quoted = m2.group(1) if m2 else new_str
        pattern = re.compile(r'(description:\s*)' + re.escape(old_quoted))

        def repl(match):
            return match.group(1) + new_quoted

        new_content, n = pattern.subn(repl, content)
        if n > 0:
            content = new_content
            total += n

    if total > 0:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
    return total


# ──────────── 3. 主执行流程 ────────────
def main():
    print("=" * 65)
    print("  oh-my-pi 中文翻译补丁 v3 (支持 v18+ & 历史版本)")
    print("=" * 65)
    print(f"目标源码根目录: {REPO_DIR}")

    if not os.path.exists(CODING_AGENT_SRC):
        print(f"错误：未找到 coding-agent 源码目录：{CODING_AGENT_SRC}")
        sys.exit(1)

    grand_total = 0

    # ─────────────────────────────────────────────────────────────
    # A. 设置模块 (Settings) 汉化
    # ─────────────────────────────────────────────────────────────
    print("\n[1/6] 正在处理设置项 (Settings)...")

    # 收集所有潜在的 settings ts 文件
    settings_files = []
    # 旧版集中文件
    legacy_s = os.path.join(CODING_AGENT_SRC, "config", "settings-schema.ts")
    if os.path.exists(legacy_s):
        settings_files.append(legacy_s)

    # v18 拆分后的所有模块 settings*.ts
    for root, _, files in os.walk(CODING_AGENT_SRC):
        for f in files:
            if "settings" in f and f.endswith(".ts"):
                full_p = os.path.join(root, f)
                if full_p not in settings_files:
                    settings_files.append(full_p)

    # 聚合所有 Label / Description / Option 翻译对
    all_labels = (
        v2_data.S_LABELS +
        v17.S_LABELS_V17_1 +
        v17.S_LABELS_V17_2 +
        v17.S_LABELS_V17_3 +
        v18.S_LABELS_V18
    )

    all_options = (
        v2_data.S_OPTION_LABELS +
        v2_data.S_OPTION_DESCRIPTIONS +
        v18.S_OPTIONS_V18
    )

    all_descriptions = (
        v2_data.S_DESCRIPTIONS +
        v17.S_DESCRIPTIONS_V17_1 +
        v17.S_DESCRIPTIONS_V17_2 +
        v17.S_DESCRIPTIONS_V17_3 +
        v17.S_DESCRIPTIONS_V17_4 +
        v17.S_DESCRIPTIONS_V17_5 +
        v17.S_DESCRIPTIONS_V17_6 +
        v18.S_DESCRIPTIONS_V18
    )

    settings_replaced = 0
    for sf in settings_files:
        c1 = apply_translations(sf, all_labels)
        c2 = apply_translations(sf, all_options)
        c3 = apply_description_translations(sf, all_descriptions)
        cnt = c1 + c2 + c3
        if cnt > 0:
            settings_replaced += cnt
            rel = os.path.relpath(sf, REPO_DIR)
            # print(f"  - {rel}: 替换 {cnt} 处")

    grand_total += settings_replaced
    print(f"  [OK] 设置项处理完成，在 {len(settings_files)} 个文件中替换 {settings_replaced} 处")

    # ─────────────────────────────────────────────────────────────
    # B. 设置面板 UI 框架 (Settings UI / Definitions)
    # ─────────────────────────────────────────────────────────────
    print("\n[2/6] 正在处理设置面板框架与分类定义...")
    defs_total = 0

    # 1. 尝试新版 settings-defs.ts
    defs_file = os.path.join(TUI_SRC, "overlays", "settings-defs.ts")
    if os.path.exists(defs_file):
        defs_total += apply_translations(defs_file, v2_data.S_TABS)
        defs_total += apply_translations(defs_file, v2_data.S_GROUPS)
        defs_total += apply_translations(defs_file, v18.TAB_LEADS_TRANSLATIONS)

    # 2. 如果存在旧版 settings-schema.ts，也补上 Tabs/Groups
    if os.path.exists(legacy_s):
        defs_total += apply_translations(legacy_s, v2_data.S_TABS)
        defs_total += apply_translations(legacy_s, v2_data.S_GROUPS)

    grand_total += defs_total
    print(f"  [OK] 设置框架定义替换 {defs_total} 处")

    # ─────────────────────────────────────────────────────────────
    # C. 斜杠命令 (/ Slash Commands)
    # ─────────────────────────────────────────────────────────────
    print("\n[3/6] 正在处理斜杠命令菜单与描述...")
    cmd_total = 0
    slash_dir = os.path.join(CODING_AGENT_SRC, "slash-commands")
    slash_files = glob.glob(os.path.join(slash_dir, "builtin-*.ts"))
    # 同时包含旧版可能的文件
    legacy_b = os.path.join(slash_dir, "builtin-registry.ts")
    if legacy_b not in slash_files and os.path.exists(legacy_b):
        slash_files.append(legacy_b)

    for cf in slash_files:
        c = apply_translations(cf, v2_data.CMD_STRINGS)
        # v18 新增 skills 命令
        c += apply_translations(cf, v18.SKILLS_SLASH_STRINGS)
        # 兼容旧版全量 B_STRINGS
        c += apply_translations(cf, v2_data.B_STRINGS)
        cmd_total += c

    grand_total += cmd_total
    print(f"  [OK] 斜杠命令处理完成，在 {len(slash_files)} 个文件中替换 {cmd_total} 处")

    # ─────────────────────────────────────────────────────────────
    # D. TUI 核心组件 (Settings List, Select List, Keybindings)
    # ─────────────────────────────────────────────────────────────
    print("\n[4/6] 正在处理 TUI 交互列表与快捷键...")
    tui_total = 0

    sl_file = os.path.join(TUI_SRC, "components", "settings-list.ts")
    tui_total += apply_translations(sl_file, v2_data.SL_STRINGS)

    sc_file = os.path.join(TUI_SRC, "components", "select-list.ts")
    tui_total += apply_translations(sc_file, v2_data.SC_STRINGS)

    kb_file = os.path.join(TUI_SRC, "keybindings.ts")
    tui_total += apply_translations(kb_file, v2_data.K_STRINGS)

    grand_total += tui_total
    print(f"  [OK] TUI 组件替换 {tui_total} 处")

    # ─────────────────────────────────────────────────────────────
    # E. 欢迎页与设置选择器 (Welcome & Settings Selector)
    # ─────────────────────────────────────────────────────────────
    print("\n[5/6] 正在处理欢迎屏与设置选择器...")
    ws_total = 0

    # 欢迎页（适配新旧两处路径）
    welcome_paths = [
        os.path.join(TUI_SRC, "prompt", "welcome.ts"),
        os.path.join(CODING_AGENT_SRC, "modes", "components", "welcome.ts"),
    ]
    for wp in welcome_paths:
        ws_total += apply_translations(wp, v2_data.W_STRINGS)

    # 设置选择器（适配新旧两处路径）
    selector_paths = [
        os.path.join(TUI_SRC, "overlays", "settings-selector.ts"),
        os.path.join(CODING_AGENT_SRC, "modes", "components", "settings-selector.ts"),
    ]
    for sp in selector_paths:
        ws_total += apply_translations(sp, v2_data.SS_STRINGS)

    grand_total += ws_total
    print(f"  [OK] 欢迎屏与选择器替换 {ws_total} 处")

    # ─────────────────────────────────────────────────────────────
    # F. 调试与模型角色 (Debug & Model Roles)
    # ─────────────────────────────────────────────────────────────
    print("\n[6/6] 正在处理调试命令与模型角色...")
    dm_total = 0

    debug_file = os.path.join(CODING_AGENT_SRC, "debug", "index.ts")
    dm_total += apply_translations(debug_file, v2_data.D_STRINGS)

    roles_file = os.path.join(CODING_AGENT_SRC, "config", "model-roles.ts")
    dm_total += apply_translations(roles_file, v2_data.M_STRINGS)

    grand_total += dm_total
    print(f"  [OK] 调试与模型角色替换 {dm_total} 处")

    print("\n" + "=" * 65)
    print(f"[完成] 中文翻译补丁 v3 应用完成！总共替换 {grand_total} 处。")
    print("=" * 65)


if __name__ == "__main__":
    main()
