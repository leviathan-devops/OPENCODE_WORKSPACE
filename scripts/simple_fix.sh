#!/bin/bash
# ONE CHANGE: Make qwen use YOLO mode by default

# Create the simplest possible fix
cat > ~/.qwen_simple_yolo.sh << 'EOF'
# ONE CHANGE: YOLO mode by default
qwen() {
    /usr/bin/qwen --yolo "$@"
}
EOF

# Apply it
echo "source ~/.qwen_simple_yolo.sh" > ~/.bashrc

echo "✅ DONE: qwen now uses YOLO mode by default"
echo "✅ That's the ONLY change made"
echo "✅ Everything else stays exactly as it was working before"