"""
oh-my-pi v18 汉化数据补丁集
涵盖 v18 新增/变更的标签页引言(TAB_LEADS)、新增设置项(Labels/Descriptions/Options)及技能命令等
"""

# ──────────── 1. TAB_LEADS (每个设置页顶部的一句话介绍) ────────────
TAB_LEADS_TRANSLATIONS = [
    (
        '"Theme, composer, status line and how the transcript renders."',
        '"主题、输入框、状态栏以及记录渲染方式。"'
    ),
    (
        '"Thinking, sampling, the system prompt, retries and the helper models."',
        '"思考、采样、系统提示词、重试机制以及辅助模型。"'
    ),
    (
        '"Input, approvals, notifications, speech and what happens at startup."',
        '"输入、审批确认、系统通知、语音以及启动行为。"'
    ),
    (
        '"What the model sees, and when and how the conversation compacts."',
        '"模型可见上下文，以及对话上下文压缩的时机和策略。"'
    ),
    (
        '"What omp remembers across sessions and where it keeps it."',
        '"omp 在跨会话中记忆的内容及其存储位置。"'
    ),
    (
        '"How files are read, summarized and edited, and the language servers."',
        '"文件的读取、摘要与编辑方式，以及语言服务器 (LSP)。"'
    ),
    (
        '"The bash tool and the eval runtimes."',
        '"Bash 终端工具与各语言代码评估运行时。"'
    ),
    (
        '"Which tools the model has, their limits and the external integrations."',
        '"模型所拥有的工具列表、调用配额限制与外部集成。"'
    ),
    (
        '"Modes, subagents, isolation and custom commands."',
        '"运行模式、子代理、执行隔离机制以及自定义命令。"'
    ),
    (
        '"Services, provider protocols, timeouts and privacy."',
        '"模型服务、服务商协议、网络超时以及隐私安全。"'
    ),
]

# ──────────── 2. v18 新增设置项 Labels ────────────
S_LABELS_V18 = [
    ('label: "OTLP Telemetry Export"', 'label: "OTLP 遥测导出"'),
    ('label: "Advisor Review Mode"', 'label: "顾问审查模式"'),
    ('label: "Advisor Review Interval"', 'label: "顾问审查间隔"'),
    ('label: "Advisor Max Notes Per Update"', 'label: "顾问单次最大建议数"'),
    ('label: "Advisor Evict Stale Results"', 'label: "顾问清理过期结果"'),
    ('label: "Serve Images as URLs"', 'label: "将图片作为 URL 服务"'),
    ('label: "Image URL Backends"', 'label: "图片 URL 后端"'),
    ('label: "Image Upload Command"', 'label: "图片上传命令"'),
    ('label: "Image URL Public Base"', 'label: "图片 URL 公共前缀"'),
    ('label: "Image URL Lifetime (hours)"', 'label: "图片 URL 有效期(小时)"'),
    ('label: "Image URL Bind Host"', 'label: "图片 URL 绑定主机"'),
    ('label: "Image URL SSH Target"', 'label: "图片 URL SSH 目标"'),
    ('label: "Image URL SSH Remote Port"', 'label: "图片 URL SSH 远程端口"'),
    ('label: "Web UI Auto Open"', 'label: "Web UI 自动打开"'),
    ('label: "Auto-Learn Max Reminders"', 'label: "自动学习最大提醒数"'),
    ('label: "Auto-Learn Confidence Threshold"', 'label: "自动学习置信度阈值"'),
    ('label: "Plan Mode Auto-Save"', 'label: "计划模式自动保存"'),
    ('label: "Plan Mode Review Prompt"', 'label: "计划模式审查提示词"'),
]

# ──────────── 3. v18 新增选项标签与说明 ────────────
S_OPTIONS_V18 = [
    ('{ value: "0", label: "0 steps", description: "No cooldown." }',
     '{ value: "0", label: "0 步", description: "无冷却。" }'),
    ('{ value: "1", label: "1 step" }', '{ value: "1", label: "1 步" }'),
    ('{ value: "2", label: "2 steps" }', '{ value: "2", label: "2 步" }'),
    ('{ value: "3", label: "3 steps", description: "Default." }',
     '{ value: "3", label: "3 步", description: "默认。" }'),
    ('{ value: "4", label: "4 steps" }', '{ value: "4", label: "4 步" }'),
    ('{ value: "5", label: "5 steps" }', '{ value: "5", label: "5 步" }'),
    ('{ value: "turn", label: "Every turn" }', '{ value: "turn", label: "每轮审查" }'),
    ('{ value: "yield", label: "Agent end" }', '{ value: "yield", label: "运行结束时" }'),
    ('{ value: "1", label: "Every eligible update" }', '{ value: "1", label: "每次符合条件的更新" }'),
    ('{ value: "2", label: "Every 2nd" }', '{ value: "2", label: "每 2 次更新" }'),
    ('{ value: "3", label: "Every 3rd" }', '{ value: "3", label: "每 3 次更新" }'),
    ('{ value: "5", label: "Every 5th" }', '{ value: "5", label: "每 5 次更新" }'),
    ('{ value: "10", label: "Every 10th" }', '{ value: "10", label: "每 10 次更新" }'),
    ('{ value: "1", label: "1 note" }', '{ value: "1", label: "1 条建议" }'),
    ('{ value: "2", label: "2 notes" }', '{ value: "2", label: "2 条建议" }'),
    ('{ value: "3", label: "3 notes" }', '{ value: "3", label: "3 条建议" }'),
    ('{ value: "4", label: "4 notes" }', '{ value: "4", label: "4 条建议" }'),
    ('{ value: "5", label: "5 notes" }', '{ value: "5", label: "5 条建议" }'),
]

# ──────────── 4. v18 新增设置项 Descriptions ────────────
S_DESCRIPTIONS_V18 = [
    (
        'description: "Allow OMP to export traces, logs, and metrics using OTEL_* endpoints. Changes take effect on next launch."',
        'description: "允许 OMP 使用 OTEL_* 端点导出跟踪、日志和指标。更改在下次启动时生效。"'
    ),
    (
        'description: "Pause main agent until advisor backlog falls below threshold. Numeric values cap wait at 30 seconds; strict waits for all scheduled reviews without a wall-clock cap. Off disables catch-up delays. Abort, failure, and disposal release waits."',
        'description: "暂停主代理直到顾问积压任务低于阈值。数值选项最多等待 30 秒；strict 严格等待所有已计划的审查，无时间上限。Off 禁用等待延迟。中断、失败和释放时将解除等待。"'
    ),
    (
        'description: "After an advisor concern or blocker interrupts, route further concerns as non-interrupting asides for this many primary turns. Blockers are exempt from the cooldown."',
        'description: "在顾问警告或阻断中断后，在接下来指定的轮次中，后续警告作为非打断侧边提醒输出。阻断性问题不受冷却限制。"'
    ),
    (
        'description: "Default advisor cadence when no WATCHDOG.yml roster is present. turn reviews every main-agent turn; yield reviews once when the agent yields the final turn of a prompt."',
        'description: "未提供 WATCHDOG.yml 时的默认顾问触发节奏。turn 审查主代理的每一轮；yield 仅在提示词最终完成时审查一次。"'
    ),
    (
        'description: "Review every primary update (tool-call round).",',
        'description: "在主代理的每次工具调用更新时进行审查。",'
    ),
    (
        'description: "Review only at final yields (once per run).",',
        'description: "仅在最终完成产出时审查（每次运行一次）。",'
    ),
    (
        'description: "Default advisor cadence when no WATCHDOG.yml roster is present: review every Nth eligible tool-call update. 1 reviews every update, matching legacy behavior."',
        'description: "未指定 WATCHDOG.yml 时的默认顾问频率：每隔 N 次工具调用更新审查一次。1 表示每次都审查，与旧版行为一致。"'
    ),
    (
        'description: "Maximum non-blocker advice notes accepted per advisor prompt update (1–32; UI offers 1–5). Higher caps permit richer reviews; lower caps curb context growth. Excess advice is dropped without interruption."',
        'description: "每次顾问更新所接受的最大非阻断建议条数 (1-32，界面提供 1-5)。更高的上限允许更详细的审查，更低的上限可控制上下文膨胀。超出的建议会被忽略且不打断。"'
    ),
    (
        'description: "Before each review, replace the advisor\'s read/grep/glob output from older reviews with an eviction placeholder. Keeps advisor context lean without erasing turn-to-turn conclusions."',
        'description: "在每次审查前，用驱逐占位符替换旧审查中的 read/grep/glob 输出。在保留轮次结论的同时保持顾问上下文轻量。"'
    ),
    (
        'description: "Publish outgoing images through the configured backend chain and send URL-fetching providers a link instead of raw image bytes."',
        'description: "通过配置的后端链发布传出图片，并向支持 URL 的提供商发送链接而非原始图像字节。"'
    ),
    (
        'description: "Ordered destinations tried when publishing images for provider access. local serves files from the built-in HTTP server; ssh reverse-forwards the local server to a remote host; command invokes a custom upload command."',
        'description: "发布图片时尝试的目标后端顺序。local 使用内置 HTTP 服务；ssh 将本地服务反向转发至远程主机；command 调用自定义上传命令。"'
    ),
]

# ──────────── 5. /skills 命令描述 (builtin-skills.ts) ────────────
SKILLS_SLASH_STRINGS = [
    (
        'description: "Search, install, and update skills from the skills.omp.sh registry"',
        'description: "在 skills.omp.sh 注册表中搜索、安装和更新技能"'
    ),
    (
        'description: "Search the skill registry"',
        'description: "搜索技能注册表"'
    ),
    (
        'description: "Install registry skills"',
        'description: "安装注册表技能"'
    ),
    (
        'description: "List installed registry skills"',
        'description: "列出已安装的注册表技能"'
    ),
    (
        'description: "Update registry skills within their ranges"',
        'description: "更新已安装的技能到版本范围内最新版"'
    ),
]

