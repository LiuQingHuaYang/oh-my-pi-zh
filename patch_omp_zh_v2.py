#!/usr/bin/env python3
"""
oh-my-pi 中文翻译补丁 v2
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
v2 改进：翻译数据集中管理，按文件 + 类别组织，易读易维护

使用方法：
  1. cd oh-my-pi-source
  2. python patch_omp_zh_v2.py

翻译格式：保留英文原文 + 中文标注（双语），或纯中文
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
"""
import os

REPO_DIR = os.path.dirname(os.path.abspath(__file__))

# 检测是在 CI（克隆到 source/ 子目录）还是本地直接运行
_UPSTREAM_BASE = os.path.join(REPO_DIR, "source") if os.path.isdir(os.path.join(REPO_DIR, "source", "packages")) else REPO_DIR
CODING_AGENT_SRC = os.path.join(_UPSTREAM_BASE, "packages", "coding-agent", "src")
TUI_SRC = os.path.join(_UPSTREAM_BASE, "packages", "tui", "src")