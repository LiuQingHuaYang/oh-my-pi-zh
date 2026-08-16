#!/usr/bin/env python3
"""扫描 v17.3.5 中未翻译的英文 UI 字符串（label/description/title 等）"""
import os
import re
import sys

REPO = os.path.dirname(os.path.abspath(__file__))

# 故意保留英文的专有名词/单位（不翻译）
KEEP_ENGLISH = {
    "Shell", "Unicode", "Nerd Font", "ASCII", "Nerd", "Powerline",
    "Codex", "Fireworks", "External Thinking", "Hide Tool Activity",
    "Git", "OpenAI", "Anthropic", "Google", "Gemini", "Claude", "GPT",
    "KB", "MB", "GB", "API", "HTTP", "HTTPS", "SSH", "JSON", "YAML",
    "TUI", "CLI", "IDE", "LSP", "DAP", "MCP", "RPC", "SDK", "URL", "URI",
    "macOS", "Windows", "Linux", "VS Code", "VSCode", "Bun", "Rust",
    "TypeScript", "JavaScript", "Python", "Node", "npm", "bun",
    "PowerShell", "bash", "zsh", "fish", "cmd", "tmux", "vim", "neovim",
    "Model", "Models", "Provider", "Providers", "Agent", "Agents",
    "Tool", "Tools", "Task", "Tasks", "File", "Files", "Theme", "Themes",
    "Status Line", "Display", "Images", "Thinking", "Sampling", "Prompt",
    "Retry & Fallback", "Advisor", "Vision", "Input", "Approvals",
    "Notifications", "Speech", "Collab", "Magic Keywords",
    "Startup & Updates", "Power (macOS)", "General", "Compaction",
    "Rules (TTSR)", "Experimental", "Auto-Learn", "Reading",
    "Read Summaries", "Available Tools", "Todos", "Search & Browser",
    "Appearance", "Interaction", "Context", "Memory", "Tasks",
    "Providers", "Appearance", "Model", "Interaction", "Context",
    "Memory", "Files", "Shell", "Tools", "Tasks", "Providers",
    "Default", "None", "Auto", "Off", "On", "Yes", "No", "All",
    "Fast", "Normal", "Slow", "High", "Medium", "Low", "Small",
    "Large", "Compact", "Detailed", "Simple", "Standard", "Advanced",
    "Basic", "Custom", "Other", "Unknown", "Error", "Warning", "Info",
    "Success", "Cancel", "Confirm", "Save", "Delete", "Edit", "Add",
    "Remove", "Close", "Open", "Back", "Next", "Done", "Skip",
    "Reset", "Apply", "Submit", "Search", "Filter", "Sort", "Refresh",
    "Copy", "Paste", "Cut", "Select", "Deselect", "Expand", "Collapse",
    "Show", "Hide", "Enable", "Disable", "Enabled", "Disabled",
    "Read-only", "Read Only", "Write", "Execute", "Permission",
    "Permissions", "Allow", "Deny", "Block", "Trust", "Untrusted",
    "Local", "Remote", "Cloud", "Server", "Client", "Host", "Port",
    "Username", "Password", "Token", "Key", "Secret", "Auth",
    "Authentication", "Login", "Logout", "Sign in", "Sign out",
    "Sign up", "Register", "Account", "Profile", "Settings",
    "Preferences", "Configuration", "Config", "Options", "Features",
    "Plugins", "Extensions", "Add-ons", "Modules", "Components",
    "Packages", "Dependencies", "Libraries", "Frameworks", "Runtime",
    "Environment", "Variables", "Arguments", "Parameters", "Flags",
    "Options", "Commands", "Arguments", "Usage", "Help", "Version",
    "About", "License", "Changelog", "Documentation", "Docs", "Guide",
    "Tutorial", "FAQ", "Issues", "Pull Requests", "Releases", "Tags",
    "Branches", "Commits", "History", "Blame", "Diff", "Merge",
    "Rebase", "Stash", "Fetch", "Pull", "Push", "Clone", "Fork",
    "Star", "Watch", "Follow", "Subscribe", "Unsubscribe", "Mute",
    "Pin", "Unpin", "Archive", "Unarchive", "Trash", "Restore",
    "Draft", "Published", "Scheduled", "Queued", "Running", "Pending",
    "Completed", "Failed", "Cancelled", "Skipped", "Blocked", "Retry",
    "Retrying", "Timeout", "Timed out", "Rate limit", "Quota",
    "Usage", "Billing", "Plan", "Tier", "Free", "Pro", "Enterprise",
    "Team", "Organization", "Workspace", "Project", "Repository",
    "Directory", "Folder", "Path", "Root", "Home", "Temp", "Cache",
    "Logs", "Log", "Debug", "Release", "Build", "Compile", "Bundle",
    "Minify", "Optimize", "Lint", "Format", "Test", "Benchmark",
    "Profile", "Trace", "Monitor", "Metrics", "Dashboard", "Report",
    "Summary", "Detail", "Details", "Overview", "Preview", "View",
    "Edit", "Source", "Target", "Destination", "Origin", "Upstream",
    "Downstream", "Main", "Master", "Develop", "Dev", "Staging",
    "Production", "Prod", "Sandbox", "Isolated", "Shared", "Private",
    "Public", "Internal", "External", "Global", "Local", "Session",
    "Thread", "Conversation", "Message", "Messages", "Chat", "Prompt",
    "Response", "Reply", "Answer", "Question", "Request", "Result",
    "Output", "Input", "Stdin", "Stdout", "Stderr", "Exit code",
    "Exit Code", "Signal", "Process", "PID", "Thread", "Worker",
    "Job", "Queue", "Scheduler", "Cron", "Interval", "Frequency",
    "Period", "Duration", "Timeout", "Deadline", "Schedule",
    "Timestamp", "Date", "Time", "Timezone", "UTC", "GMT", "ISO",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    "Sunday", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
    "Spring", "Summer", "Autumn", "Fall", "Winter", "Year", "Month",
    "Week", "Day", "Hour", "Minute", "Second", "Millisecond",
    "Nanosecond", "Microsecond", "Byte", "Bit", "Pixel", "Point",
    "Percent", "Percentage", "Ratio", "Rate", "Speed", "Size",
    "Length", "Width", "Height", "Depth", "Volume", "Weight", "Mass",
    "Temperature", "Pressure", "Voltage", "Current", "Power", "Energy",
    "Force", "Velocity", "Acceleration", "Frequency", "Wavelength",
    "Amplitude", "Phase", "Polarity", "Resistance", "Capacitance",
    "Inductance", "Impedance", "Conductance", "Admittance", "Reactance",
    "Susceptance", "Transconductance", "Gain", "Attenuation", "Noise",
    "Signal-to-noise", "SNR", "Bandwidth", "Throughput", "Latency",
    "Jitter", "Packet loss", "Packet Loss", "Round-trip", "RTT",
    "Ping", "Traceroute", "DNS", "DHCP", "NAT", "VPN", "Proxy",
    "Firewall", "Router", "Switch", "Hub", "Bridge", "Gateway",
    "Modem", "Access point", "Access Point", "Repeater", "Extender",
    "Antenna", "Transceiver", "Transmitter", "Receiver", "Encoder",
    "Decoder", "Codec", "Compression", "Decompression", "Encryption",
    "Decryption", "Hashing", "Checksum", "Signature", "Certificate",
    "Cert", "CA", "TLS", "SSL", "DTLS", "QUIC", "TCP", "UDP", "IP",
    "IPv4", "IPv6", "ICMP", "ARP", "OSPF", "BGP", "RIP", "EIGRP",
    "VLAN", "VXLAN", "GRE", "IPsec", "PPTP", "L2TP", "OpenVPN",
    "WireGuard", "ZeroTier", "Tailscale", "Mesh", "Topology", "Node",
    "Edge", "Leaf", "Spine", "Core", "Access", "Distribution",
    "Aggregation", "Backbone", "Trunk", "Uplink", "Downlink", "Link",
    "Interface", "Port", "Socket", "Endpoint", "Connection", "Session",
    "Stream", "Channel", "Pipe", "Queue", "Buffer", "Cache", "Memory",
    "Storage", "Disk", "SSD", "HDD", "NVMe", "SATA", "USB", "HDMI",
    "DisplayPort", "VGA", "DVI", "Thunderbolt", "Ethernet", "Wi-Fi",
    "Bluetooth", "NFC", "RFID", "GPS", "GNSS", "LTE", "5G", "4G",
    "3G", "2G", "GSM", "CDMA", "UMTS", "HSPA", "EVDO", "WiMAX",
    "Satellite", "Fiber", "Coaxial", "Twisted pair", "Twisted Pair",
    "Shielded", "Unshielded", "Plenum", "Riser", "Patch", "Crossover",
    "Straight-through", "Rollover", "Console", "Management", "Data",
    "Control", "Signaling", "Clock", "Synchronization", "Sync",
    "Async", "Synchronous", "Asynchronous", "Serial", "Parallel",
    "Half-duplex", "Full-duplex", "Simplex", "Multiplexing",
    "Demultiplexing", "Modulation", "Demodulation", "Carrier",
    "Subcarrier", "Pilot", "Guard interval", "Guard Interval",
    "Cyclic prefix", "Cyclic Prefix", "OFDM", "OFDMA", "SC-FDMA",
    "MIMO", "MU-MIMO", "Beamforming", "Spatial multiplexing",
    "Spatial Multiplexing", "Diversity", "Coding", "Interleaving",
    "Scrambling", "Spreading", "Puncturing", "Rate matching",
    "Rate Matching", "HARQ", "ARQ", "FEC", "CRC", "LDPC", "Turbo",
    "Convolutional", "Block", "Stream", "Frame", "Packet", "Datagram",
    "Segment", "Cell", "Slot", "Symbol", "Chip", "Bit", "Byte",
    "Nibble", "Octet", "Word", "Dword", "Qword", "Register", "ALU",
    "FPU", "GPU", "CPU", "RAM", "ROM", "EEPROM", "Flash", "NAND",
    "NOR", "SLC", "MLC", "TLC", "QLC", "3D NAND", "Cache", "L1",
    "L2", "L3", "TLB", "MMU", "DMA", "IRQ", "ISR", "BIOS", "UEFI",
    "EFI", "MBR", "GPT", "FAT", "NTFS", "ext4", "APFS", "HFS+",
    "ZFS", "Btrfs", "XFS", "JFS", "ReiserFS", "SquashFS", "tmpfs",
    "procfs", "sysfs", "devfs", "overlayfs", "FUSE", "NFS", "SMB",
    "CIFS", "AFP", "WebDAV", "iSCSI", "FC", "FCoE", "SAS", "SCSI",
    "IDE", "PATA", "SATA", "eSATA", "mSATA", "M.2", "U.2", "PCIe",
    "PCI", "AGP", "ISA", "EISA", "MCA", "VLB", "AMR", "CNR", "ACR",
    "PCMCIA", "CardBus", "ExpressCard", "CompactFlash", "SD", "SDHC",
    "SDXC", "microSD", "MMC", "eMMC", "UFS", "NVMe", "Optane",
    "3D XPoint", "HBM", "GDDR", "DDR", "SDRAM", "SRAM", "DRAM",
    "EPROM", "PROM", "OTP", "Mask ROM", "Firmware", "Driver",
    "Kernel", "Module", "Daemon", "Service", "Process", "Thread",
    "Task", "Job", "Scheduler", "Dispatcher", "Handler", "Callback",
    "Event", "Signal", "Interrupt", "Exception", "Trap", "Fault",
    "Abort", "Panic", "Crash", "Hang", "Deadlock", "Race", "Leak",
    "Overflow", "Underflow", "Saturation", "Clamp", "Wrap", "Round",
    "Truncate", "Floor", "Ceil", "Abs", "Min", "Max", "Avg", "Sum",
    "Mean", "Median", "Mode", "Variance", "Stddev", "Std dev",
    "Standard deviation", "Standard Deviation", "Correlation",
    "Covariance", "Regression", "Classification", "Clustering",
    "Dimensionality reduction", "Dimensionality Reduction", "PCA",
    "SVD", "Eigenvalue", "Eigenvector", "Matrix", "Vector", "Tensor",
    "Scalar", "Gradient", "Hessian", "Jacobian", "Laplacian",
    "Divergence", "Curl", "Integral", "Derivative", "Limit", "Series",
    "Sequence", "Set", "Group", "Ring", "Field", "Module", "Space",
    "Topology", "Manifold", "Metric", "Norm", "Distance", "Similarity",
    "Kernel", "Feature", "Label", "Sample", "Instance", "Dataset",
    "Training", "Validation", "Testing", "Inference", "Prediction",
    "Accuracy", "Precision", "Recall", "F1", "AUC", "ROC", "PR",
    "Confusion matrix", "Confusion Matrix", "Loss", "Cost", "Objective",
    "Optimizer", "Learning rate", "Learning Rate", "Epoch", "Batch",
    "Mini-batch", "Stochastic", "Gradient descent", "Gradient Descent",
    "Backpropagation", "Forward pass", "Forward Pass", "Backward pass",
    "Backward Pass", "Activation", "ReLU", "Sigmoid", "Tanh", "Softmax",
    "Dropout", "BatchNorm", "LayerNorm", "Attention", "Transformer",
    "Encoder", "Decoder", "Embedding", "Token", "Vocabulary", "Vocab",
    "Context window", "Context Window", "Temperature", "Top-p", "Top-k",
    "Beam search", "Beam Search", "Greedy", "Sampling", "Logits",
    "Logprobs", "Perplexity", "Entropy", "Cross-entropy", "KL",
    "KL divergence", "KL Divergence", "JS divergence", "JS Divergence",
    "Wasserstein", "Earth mover", "Earth Mover", "EMD", "MMD",
    "GAN", "VAE", "Diffusion", "Stable Diffusion", "DALL-E", "Midjourney",
    "Stable", "Beta", "Alpha", "Gamma", "Delta", "Epsilon", "Zeta",
    "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi",
    "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi",
    "Psi", "Omega", "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
    "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu",
    "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi",
    "Chi", "Psi", "Omega",
    # 数字/单位
    "1 KB", "2.5 KB", "5 KB", "10 KB", "20 KB", "30 KB", "50 KB",
    "75 KB", "100 KB", "200 KB", "500 KB", "1 MB", "2 MB", "5 MB",
    "10 MB", "20 MB", "50 MB", "100 MB", "200 MB", "500 MB", "1 GB",
    "2 GB", "5 GB", "10 GB", "20 GB", "50 GB", "100 GB", "200 GB",
    "500 GB", "1 TB", "2 TB", "5 TB", "10 TB", "20 TB", "50 TB",
    "100 TB", "200 TB", "500 TB", "1 PB", "2 PB", "5 PB", "10 PB",
    "20 PB", "50 PB", "100 PB", "200 PB", "500 PB", "1 EB", "2 EB",
    "5 EB", "10 EB", "20 EB", "50 EB", "100 EB", "200 EB", "500 EB",
    "1 ZB", "2 ZB", "5 ZB", "10 ZB", "20 ZB", "50 ZB", "100 ZB",
    "200 ZB", "500 ZB", "1 YB", "2 YB", "5 YB", "10 YB", "20 YB",
    "50 YB", "100 YB", "200 YB", "500 YB",
    "0 轮", "1 轮", "2 轮", "3 轮", "4 轮", "5 轮", "6 轮", "7 轮",
    "8 轮", "9 轮", "10 轮", "1 次重试", "2 次重试", "3 次重试",
    "5 次重试", "10 次重试",
}

def scan_file(path, patterns):
    """扫描文件中的英文 UI 字符串"""
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        content = f.read()
    results = []
    for pat, _name in patterns:
        for m in re.finditer(pat, content):
            val = m.group(1)
            # 排除已翻译（含中文）和故意保留英文的
            if re.search(r'[\u4e00-\u9fff]', val):
                continue
            if val in KEEP_ENGLISH:
                continue
            # 排除纯数字/符号
            if re.fullmatch(r'[\d\s\.,%+\-/\\:;()\[\]{}<>!?@#$^&*_=|~`"\']*', val):
                continue
            results.append((os.path.relpath(path, REPO), pat, val))
    return results

def main():
    patterns = [
        (r'label:\s*"([^"]*)"', "label"),
        (r'description:\s*"([^"]*)"', "description"),
        (r'title:\s*"([^"]*)"', "title"),
        (r'placeholder:\s*"([^"]*)"', "placeholder"),
        (r'heading:\s*"([^"]*)"', "heading"),
        (r'subtitle:\s*"([^"]*)"', "subtitle"),
    ]
    files = [
        os.path.join(REPO, "packages", "coding-agent", "src", "config", "settings-schema.ts"),
        os.path.join(REPO, "packages", "coding-agent", "src", "modes", "components", "welcome.ts"),
        os.path.join(REPO, "packages", "coding-agent", "src", "slash-commands", "builtin-registry.ts"),
        os.path.join(REPO, "packages", "coding-agent", "src", "debug", "index.ts"),
        os.path.join(REPO, "packages", "tui", "src", "keybindings.ts"),
        os.path.join(REPO, "packages", "coding-agent", "src", "config", "model-roles.ts"),
        os.path.join(REPO, "packages", "tui", "src", "components", "settings-list.ts"),
        os.path.join(REPO, "packages", "tui", "src", "components", "select-list.ts"),
    ]
    all_results = []
    for f in files:
        all_results.extend(scan_file(f, patterns))
    
    # 去重
    seen = set()
    unique = []
    for r in all_results:
        key = (r[0], r[2])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    
    out = os.path.join(REPO, "untranslated_scan.txt")
    with open(out, "w", encoding="utf-8") as f:
        f.write(f"未翻译英文 UI 字符串扫描结果（共 {len(unique)} 条）\n")
        f.write("=" * 60 + "\n")
        for path, pat, val in sorted(unique, key=lambda x: (x[0], x[2])):
            f.write(f"[{pat}] {val}\n    @ {path}\n")
    print(f"扫描完成，共 {len(unique)} 条未翻译字符串，结果写入 {out}")
    # 打印前 50 条
    for path, pat, val in sorted(unique, key=lambda x: (x[0], x[2]))[:50]:
        print(f"[{pat}] {val}  @ {os.path.basename(path)}")

if __name__ == "__main__":
    main()