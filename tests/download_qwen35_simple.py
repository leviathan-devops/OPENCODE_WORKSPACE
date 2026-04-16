#!/usr/bin/env python3
"""Download Qwen3.5-9B GGUF model with progress"""
import os
import sys
from huggingface_hub import hf_hub_download

MODEL_DIR = "/home/leviathan/OPENCODE_WORKSPACE/models/gguf"
REPO_ID = "Unsloth/Qwen3.5-9B-GGUF"
FILENAME = "Qwen3.5-9B-Q4_K_M.gguf"

os.makedirs(MODEL_DIR, exist_ok=True)

print(f"Downloading {FILENAME} from {REPO_ID}...")
print(f"Target: {MODEL_DIR}")
print("This will take several minutes (~5.7GB)")

try:
    model_path = hf_hub_download(
        repo_id=REPO_ID,
        filename=FILENAME,
        local_dir=MODEL_DIR,
        local_dir_use_symlinks=False,
    )
    
    size_gb = os.path.getsize(model_path) / (1024**3)
    print(f"\n✅ Download complete!")
    print(f"Saved to: {model_path}")
    print(f"Size: {size_gb:.2f} GB")
except Exception as e:
    print(f"\n❌ Download failed: {e}")
    sys.exit(1)
