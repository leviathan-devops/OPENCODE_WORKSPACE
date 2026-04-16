#!/usr/bin/env python3
"""Download Qwen3.5-9B GGUF model"""
from huggingface_hub import hf_hub_download

print("Downloading Qwen3.5-9B GGUF (Q4_K_M quantization)...")
print("This may take a while depending on your internet connection.")

model_path = hf_hub_download(
    repo_id="Unsloth/Qwen3.5-9B-GGUF",
    filename="Qwen3.5-9B-Q4_K_M.gguf",
    local_dir="/home/leviathan/OPENCODE_WORKSPACE/models/gguf",
    local_dir_use_symlinks=False,
)

print(f"Model downloaded to: {model_path}")

import os
size = os.path.getsize(model_path) / (1024**3)
print(f"Model size: {size:.2f} GB")
