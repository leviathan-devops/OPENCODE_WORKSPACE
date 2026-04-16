# Hardware Usage Monitor - Build Specification

## 1. Concept & Vision

**Name**: Hardware Sentinel  
**Tagline**: "See everything. Drain nothing."  

A professional-grade hardware monitoring application that provides real-time visibility into system resource consumption. Designed as an advanced Task Manager replacement with both human-readable UX and machine-parseable output for agent compatibility. The interface feels like a premium system utility—think iStat Menus meets HTOP—with smooth animations, clear data hierarchy, and actionable insights.

**Core Philosophy**: First step in hardware optimization is visibility. You can't fix what you can't see.

---

## 2. Design Language

### Aesthetic Direction
Dark-mode professional utility aesthetic inspired by premium macOS system utilities and modern DevOps dashboards. Deep slate backgrounds with vibrant accent colors for different resource types. Clean data visualization with meaningful color coding.

### Color Palette
```
--bg-primary: #0f1117        /* Deep slate background */
--bg-secondary: #1a1d27       /* Card/panel backgrounds */
--bg-tertiary: #252a38       /* Elevated surfaces */
--border: #2d3348             /* Subtle borders */
--text-primary: #f0f2f5       /* Primary text */
--text-secondary: #8b919e     /* Secondary/muted text */
--text-tertiary: #5c6370      /* Disabled/hint text */

/* Resource Colors - Distinctive and Meaningful */
--color-cpu: #3b82f6          /* Blue - Processing */
--color-memory: #a855f7        /* Purple - Memory/Storage */
--color-gpu: #22c55e          /* Green - GPU/Graphics */
--color-disk: #f59e0b         /* Amber - Storage/Disk */
--color-network: #06b6d4      /* Cyan - Network */
--color-temperature: #ef4444  /* Red - Heat/Warning */
--color-power: #f97316        /* Orange - Power/Energy */

/* Status Colors */
--status-healthy: #22c55e     /* Green */
--status-warning: #f59e0b      /* Amber */
--status-critical: #ef4444     /* Red */
--status-info: #3b82f6        /* Blue */
```

### Typography
```
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace
--font-size-xs: 0.75rem      /* 12px - Labels, hints */
--font-size-sm: 0.875rem     /* 14px - Secondary text */
--font-size-base: 1rem       /* 16px - Body text */
--font-size-lg: 1.125rem     /* 18px - Section headers */
--font-size-xl: 1.5rem       /* 24px - Panel titles */
--font-size-2xl: 2rem        /* 32px - Main dashboard numbers */
```

### Spatial System
```
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px

--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
```

### Motion Philosophy
- **Data updates**: Smooth number transitions (CSS counter animation), 200ms ease-out
- **Panel transitions**: Subtle fade-in on mount, 150ms
- **Hover states**: Quick response 100ms, subtle scale(1.02) on interactive cards
- **Process list**: Virtual scrolling for performance, no animation on rapid updates
- **Alerts**: Pulse animation on critical thresholds, subtle glow effect

---

## 3. Layout & Structure

### Application Shell
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Hardware Sentinel              [Search] [⚙️] [─] [□] [×]   │
├───────────────┬─────────────────────────────────────────────────────┤
│               │                                                     │
│   NAVIGATION  │              MAIN CONTENT AREA                       │
│               │                                                     │
│  ○ Dashboard  │   ┌─────────────────────────────────────────────┐  │
│  ○ Processes  │   │                                             │  │
│  ○ GPU        │   │         (Content based on selection)        │  │
│  ○ Memory     │   │                                             │  │
│  ○ Network    │   │                                             │  │
│  ○ Disks      │   └─────────────────────────────────────────────┘  │
│  ○ Temps      │                                                     │
│  ○ Alerts     │                                                     │
│  ○ Settings   │                                                     │
│               │                                                     │
├───────────────┴─────────────────────────────────────────────────────┤
│  [Status Bar: System Status • Last Update: HH:MM:SS • Agent Mode]   │
└─────────────────────────────────────────────────────────────────────┘
```

### Dashboard View (Default)
```
┌─────────────────────────────────────────────────────────────────────┐
│  SYSTEM OVERVIEW                                                     │
├──────────────┬──────────────┬──────────────┬──────────────┬────────┤
│   CPU        │   MEMORY     │   GPU        │   DISK       │ NETWORK│
│   ████░░░░   │   ██████░░░ │   █░░░░░░░░ │   ███░░░░░░ │ ██░░░░│
│   47%        │   68%        │   12%        │   45%        │ 15MB/s │
│   12 cores   │   21.4/31.7GB│   1.5/12GB  │   890GB/2TB │        │
├──────────────┴──────────────┴──────────────┴──────────────┴────────┤
│                                                                     │
│  TOP RESOURCE CONSUMERS                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PID    Name          CPU%    Mem%    GPU%    Status         │   │
│  │ 305532 opencode      44.2    1.1     -       ● Running      │   │
│  │ 3306   vocalinux    18.6    0.2     -       ● Running      │   │
│  │ 253677 llama-server -       -       83.2    ● Running      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TEMPERATURE & POWER                                                │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────┐  │
│  │ CPU: 72°C ████░░░░ │  │ GPU: 56°C ██░░░░░░ │  │ Power: 45W │  │
│  └────────────────────┘  └────────────────────┘  └─────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Process List View
```
┌─────────────────────────────────────────────────────────────────────┐
│  PROCESSES                           [🔍 Search] [⚡ Kill] [📊 Sort]│
│  723 total processes • 3 running • 717 sleeping                     │
├─────────────────────────────────────────────────────────────────────┤
│  PID     │ Name          │ Type     │ CPU% │ Mem%  │ GPU%  │ VRAM  │
│  ────────┼───────────────┼──────────┼──────┼───────┼───────┼───────│
│  305532  │ opencode      │ terminal │ 44.2 │ 1.1   │ -     │ -     │
│  3306    │ vocalinux    │ service  │ 18.6 │ 0.2   │ -     │ -     │
│  253677  │ llama-server │ inference│ -    │ -     │ 83.2  │ 9.7GB │
│  5954    │ collaborator │ terminal │ 5.5  │ 0.3   │ -     │ -     │
│  201478  │ opencode     │ terminal │ 5.3  │ 2.8   │ -     │ -     │
│  ...     │ (virtual scroll)        │      │       │       │       │
└─────────────────────────────────────────────────────────────────────┘
```

### GPU Deep-Dive View
```
┌─────────────────────────────────────────────────────────────────────┐
│  GPU MONITOR                                    [NVIDIA RTX 4080]   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  USAGE                           MEMORY                      │   │
│  │  ████████████░░░░░░░░░░  12%    ██████████████████░░░░░ 83% │   │
│  │  0%              50%       100%  0GB          10GB    12GB │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TEMPERATURE: 56°C ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Normal   │
│  POWER: 24W / 80W   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  30%     │
│  FAN: 35%          ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Normal   │
│                                                                     │
│  GPU PROCESSES                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PID     Name              VRAM      Type     Status         │   │
│  │ 253677  llama-server      9.7GB     CUDA     Running        │   │
│  │ 249208  llama-server      326MB     CUDA     Running        │   │
│  │ 2625    Xorg              4MB       Graphics Running        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  GPU DETAILS                                                        │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────────┐  │
│  │ Driver     │ CUDA Ver    │ Compute    │ Utilization         │  │
│  │ 590.48.01  │ 13.1        │ Default    │ 0% (idle)          │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Responsive Strategy
- **Desktop (>1200px)**: Full layout with sidebar navigation
- **Tablet (768-1200px)**: Collapsible sidebar, stacked cards
- **Mobile (<768px)**: Bottom navigation, single-column layout, swipeable cards

---

## 4. Features & Interactions

### Core Features

#### 4.1 Real-Time Dashboard
- Live updating system overview (1-second refresh rate, configurable)
- Animated progress bars and percentage indicators
- Color-coded status (green/yellow/red based on thresholds)
- Click any card to drill down into detailed view

#### 4.2 Process Manager
- **Sortable columns**: CPU%, Memory%, GPU%, VRAM, PID, Name, Status
- **Filtering**: By type (terminal, service, inference, system), by resource usage (high, medium, low)
- **Search**: Real-time filter by process name or PID
- **Bulk actions**: Select multiple processes, kill selected, kill by pattern
- **Process details**: Click to expand, shows full command line, parent process, start time, elapsed time
- **Agent mode**: JSON export of filtered/processed list for programmatic access

#### 4.3 GPU Monitor
- Per-GPU detail view (multi-GPU support)
- VRAM allocation breakdown by process
- GPU utilization vs memory utilization graphs
- Temperature, power, fan speed gauges
- Historical graph (last 60 data points)
- **Agent mode**: Structured JSON with all metrics

#### 4.4 Memory Analysis
- Physical RAM usage with breakdown (used, cached, buffers, available)
- Swap usage monitoring
- Memory pressure indicator
- Per-process memory consumption (RSS, VSZ)
- Large memory consumer alerts

#### 4.5 Network Monitor
- Active connections with remote endpoints
- Bandwidth usage (upload/download)
- Connection states (ESTABLISHED, LISTEN, TIME_WAIT, etc.)
- Process ownership of connections
- **Agent mode**: Connection table as JSON

#### 4.6 Disk I/O Monitor
- Per-disk read/write speeds
- Disk usage percentage
- Mount points and filesystem types
- I/O wait percentage

#### 4.7 Temperature & Power
- All thermal zones listed with current temps
- CPU, GPU, chipset, VRM temperatures
- Power consumption (total system, GPU specific)
- Fan speeds (if available via hwmon)
- Warning thresholds configurable

#### 4.8 Alerting System
- Configurable thresholds per resource type
- Alert history log
- Desktop notifications (optional)
- **Agent mode**: Alert events as JSON stream

### Interactions

#### Process Kill Flow
1. User selects process(es) in list
2. Clicks "Kill" button
3. Confirmation modal appears with process details
4. User selects signal (SIGTERM default, SIGKILL available)
5. Confirmation dialog: "Are you sure you want to kill [process name]?"
6. On confirm: Process terminated, list refreshes, toast notification
7. On failure: Error toast with reason

#### Search & Filter
1. User types in search box
2. List filters in real-time (debounced 150ms)
3. Matched text highlighted in results
4. Clear button to reset
5. Filter chips for quick type filtering

#### Settings Panel
- Refresh rate: 1s, 2s, 5s, 10s, manual
- Theme: Dark (default), Light (future)
- Temperature unit: Celsius (default), Fahrenheit
- Alert thresholds: Per resource type, sliders
- Agent mode toggle: Enable/disable machine-readable output
- Export settings / Import settings

### Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| Process terminates before kill | Show "Process no longer exists" toast, refresh list |
| Permission denied on kill | Show error toast, suggest running with elevated permissions |
| GPU not detected | Show "No GPU detected" message, hide GPU tab |
| nvidia-smi fails | Show degraded mode with CPU-only metrics, log error |
| Temperature sensors unavailable | Show "N/A" for temp fields, still show other data |
| Very long process names | Truncate with ellipsis, full name on hover tooltip |
| 1000+ processes | Virtual scrolling, lazy-load details |

### Empty States
- **No processes matching filter**: "No processes match your search. Try a different query."
- **No GPU**: "No GPU detected. Hardware Sentinel is running in CPU-only mode."
- **No alerts**: "All systems healthy. No alerts to display."

---

## 5. Component Inventory

### Navigation Sidebar
- **Default**: Dark background, icons + labels, 200px width
- **Hover**: Background lightens to --bg-tertiary, subtle left border accent
- **Active**: Accent color left border, background --bg-tertiary, text --text-primary
- **Collapsed**: Icons only, 64px width, tooltips on hover

### Stat Card
- **Default**: --bg-secondary background, --border border, rounded --radius-lg
- **Hover**: Subtle shadow elevation, border brightens
- **Loading**: Skeleton pulse animation
- **Error**: Red border accent, error icon

### Progress Bar
- **Default**: Track in --bg-tertiary, fill with resource color
- **Animated**: Fill width transitions 200ms ease-out
- **Critical (>90%)**: Pulsing glow effect, --status-critical color

### Process Table Row
- **Default**: Transparent background, bottom border
- **Hover**: Background --bg-tertiary
- **Selected**: Background with 10% accent color, checkbox checked
- **Zombie**: Row text in --status-critical color, "(zombie)" suffix

### Button
- **Primary**: --color-cpu background, white text, --radius-md
- **Hover**: Brightness increase 10%
- **Active**: Scale(0.98), brightness decrease 5%
- **Disabled**: 50% opacity, cursor not-allowed
- **Danger**: --status-critical background

### Modal Dialog
- **Backdrop**: Black 60% opacity, backdrop-filter blur(4px)
- **Container**: --bg-secondary, --radius-xl, max-width 500px
- **Header**: Title left-aligned, close button right
- **Footer**: Action buttons right-aligned, cancel secondary style

### Toast Notification
- **Info**: --status-info left border, info icon
- **Success**: --status-healthy left border, checkmark icon
- **Warning**: --status-warning left border, warning icon
- **Error**: --status-critical left border, X icon
- **Animation**: Slide in from top-right, auto-dismiss after 5s

### Search Input
- **Default**: --bg-tertiary background, --border border, search icon prefix
- **Focus**: Border --color-cpu, subtle glow
- **Filled**: Clear button appears on right
- **With filters**: Filter chips below input

### Gauge (Temperature/Power)
- **Default**: Circular or linear gauge with gradient fill
- **Normal**: --status-healthy color
- **Warning**: --status-warning color
- **Critical**: --status-critical color, pulse animation

### Agent Mode Toggle
- **Default**: Switch with label "Agent Mode"
- **Enabled**: Switch filled --color-cpu, label shows "JSON streaming enabled"
- **Broadcast**: Green dot indicator when actively streaming JSON

---

## 6. Technical Approach

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Electron/Tauri)                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    React/Vue/Svelte UI                       │    │
│  │   Components • State Management • Real-time Updates          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                    │
│                         IPC / WebSocket                             │
│                                │                                    │
├────────────────────────────────┼────────────────────────────────────┤
│                         BACKEND (Rust/Node)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │   System    │  │    GPU      │  │  Network    │  │  Thermal  │ │
│  │   Monitor   │  │   Monitor   │  │   Monitor   │  │  Monitor  │ │
│  │   (sysinfo) │  │  (nvidia)   │  │  (/proc)    │  │  (hwmon)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
│                                │                                    │
│                         Data Aggregator                             │
│                                │                                    │
├────────────────────────────────┼────────────────────────────────────┤
│                      OUTPUT ADAPTERS                                │
│  ┌─────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │    REST API Server      │◄─┴─►│   WebSocket Event Stream    │  │
│  │  (localhost:19842)      │     │   (for real-time updates)   │  │
│  └─────────────────────────┘     └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Runtime**: Electron (for rich UI) or Tauri (for lightweight Rust backend)
- **Frontend**: React 18+ with TypeScript, or SvelteKit
- **State Management**: Zustand (React) or Svelte stores
- **Styling**: Tailwind CSS or CSS Modules with CSS variables
- **Backend Data Collection**:
  - `sysinfo` crate (Rust) for CPU/Memory/Process info
  - `nvidia-smi` wrapper for GPU metrics
  - `procfs` / `/proc` parsing for Linux metrics
  - `hwmon` interface for temperature/fan
- **Real-time**: WebSocket or SSE for live updates
- **Agent API**: Express/Fastify HTTP server on localhost port

### Agent Compatibility Layer

#### REST Endpoints (localhost:19842)
```
GET  /api/system           → Full system summary JSON
GET  /api/processes         → All processes with metrics
GET  /api/processes/:pid    → Single process details
GET  /api/gpu              → GPU metrics and processes
GET  /api/memory           → Memory breakdown
GET  /api/network           → Network connections
GET  /api/disk             → Disk I/O and usage
GET  /api/temperature      → All thermal zones
GET  /api/alerts           → Alert history

POST /api/process/:pid/kill → Kill process (SIGTERM default)
POST /api/process/:pid/kill?signal=SIGKILL → Kill with signal

WS   /api/stream           → Real-time metrics WebSocket
```

#### JSON Response Format
```json
{
  "timestamp": "2026-04-03T15:30:00.000Z",
  "agent_mode": true,
  "data": {
    "system": {
      "hostname": "LeviathanLocal",
      "os": "Linux 6.x.x",
      "uptime": 78945,
      "cpu": {
        "model": "AMD Ryzen 9 7950X",
        "cores": 16,
        "threads": 32,
        "usage_percent": 47.2,
        "temperature": null
      },
      "memory": {
        "total_bytes": 34058366976,
        "used_bytes": 22970697728,
        "available_bytes": 11087669248,
        "cached_bytes": 8243,
        "swap_total_bytes": 8589934592,
        "swap_used_bytes": 8589934592
      },
      "gpu": {
        "available": true,
        "device": "NVIDIA GeForce RTX 4080",
        "vram_total_bytes": 12884901888,
        "vram_used_bytes": 10737418240,
        "utilization_percent": 0,
        "temperature": 56,
        "power_watts": 24,
        "fan_percent": 35
      }
    },
    "processes": [
      {
        "pid": 305532,
        "name": "opencode",
        "command": "/home/leviathan/.npm-global/lib/node_modules/opencode-ai/bin/.opencode attach http://localhost:19842",
        "cpu_percent": 44.2,
        "memory_percent": 1.1,
        "gpu_percent": null,
        "vram_bytes": null,
        "status": "running",
        "parent_pid": 2361,
        "start_time": "2026-04-02T22:27:00.000Z",
        "tty": null,
        "type": "terminal"
      }
    ],
    "alerts": []
  }
}
```

### File Structure
```
hardware-sentinel/
├── src/
│   ├── main/                    # Electron main process / Tauri backend
│   │   ├── index.ts            # Entry point
│   │   ├── monitors/
│   │   │   ├── system.ts       # CPU, Memory, Process monitoring
│   │   │   ├── gpu.ts          # NVIDIA GPU monitoring
│   │   │   ├── network.ts      # Network connections
│   │   │   ├── disk.ts         # Disk I/O
│   │   │   └── thermal.ts      # Temperature sensors
│   │   ├── api/
│   │   │   ├── rest.ts         # Express/Fastify REST server
│   │   │   └── websocket.ts    # WebSocket handler
│   │   └── services/
│   │       ├── aggregator.ts   # Data collection coordination
│   │       └── notifier.ts     # Alert notifications
│   ├── renderer/               # Frontend application
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── ProcessList/
│   │   │   ├── GPUMonitor/
│   │   │   ├── MemoryView/
│   │   │   ├── NetworkView/
│   │   │   ├── DiskView/
│   │   │   ├── ThermalView/
│   │   │   ├── Alerts/
│   │   │   └── Settings/
│   │   ├── hooks/
│   │   │   ├── useSystemMetrics.ts
│   │   │   ├── useAgentMode.ts
│   │   │   └── useWebSocket.ts
│   │   ├── stores/
│   │   │   └── metricsStore.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── preload/
│   │   └── index.ts            # Preload script for IPC
│   └── shared/
│       └── types.ts            # Shared TypeScript interfaces
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts (or webpack.config.js)
├── tailwind.config.js
├── electron-builder.yml (or tauri.conf.json)
├── SPEC.md
└── README.md
```

### Data Collection Intervals
| Metric | Default Interval | Configurable |
|--------|------------------|--------------|
| CPU Usage | 1s | Yes (500ms-10s) |
| Memory | 1s | Yes |
| GPU | 2s | Yes |
| GPU Processes | 2s | Yes |
| Network | 5s | Yes |
| Disk I/O | 5s | Yes |
| Temperature | 5s | Yes |
| Process List | 2s | Yes |

### Performance Considerations
- **Virtual scrolling** for process list (react-virtual, vue-virtual-scroller, or svelte-virtual-list)
- **Debounced search** to avoid excessive filtering
- **RequestAnimationFrame** for smooth gauge animations
- **Web Workers** for heavy data parsing (if needed)
- **Efficient state updates** - only re-render changed components

### Security
- API only accessible from localhost (not network exposed)
- No elevated privileges required for basic monitoring
- Kill operations require confirmation
- Sensitive data (API keys, tokens) not exposed in process list

---

## 7. Agent Integration Protocol

### Starting the Monitor
```bash
# Start Hardware Sentinel in background
hardware-sentinel &

# Or start with agent mode enabled (JSON streaming)
hardware-sentinel --agent-mode --port 19842
```

### Agent Query Examples
```bash
# Get full system summary
curl http://localhost:19842/api/system | jq .

# Get all processes sorted by CPU
curl http://localhost:19842/api/processes?sort=cpu_desc | jq .

# Get GPU information
curl http://localhost:19842/api/gpu | jq .

# Kill a runaway process
curl -X POST http://localhost:19842/api/process/305532/kill

# Stream real-time updates
ws://localhost:19842/api/stream
```

### Agent Mode Response Stream (WebSocket)
```json
{"type":"metrics","timestamp":"2026-04-03T15:30:01.000Z","cpu":47.2,"memory":68.3,"gpu":{"utilization":0,"vram_used":10737418240}}
{"type":"metrics","timestamp":"2026-04-03T15:30:02.000Z","cpu":48.1,"memory":68.1,"gpu":{"utilization":0,"vram_used":10737418240}}
{"type":"alert","timestamp":"2026-04-03T15:30:05.000Z","severity":"warning","resource":"memory","value":92.3,"threshold":90,"message":"Memory usage exceeds 90%"}
{"type":"metrics","timestamp":"2026-04-03T15:30:03.000Z","cpu":45.5,"memory":69.0,"gpu":{"utilization":83.2,"vram_used":110imil81034240}}
```

---

## 8. Milestones & Implementation Order

### Phase 1: Core Foundation
- [ ] Project scaffolding (Electron/Tauri setup)
- [ ] Basic system metrics collection (CPU, Memory)
- [ ] Process list with sorting
- [ ] Dark theme UI shell and navigation

### Phase 2: GPU & Temperature
- [ ] NVIDIA GPU detection and metrics (nvidia-smi integration)
- [ ] GPU process mapping
- [ ] Temperature sensor reading
- [ ] Thermal view with gauges

### Phase 3: Network & Storage
- [ ] Network connection list
- [ ] Bandwidth monitoring
- [ ] Disk usage and I/O
- [ ] Network and Disk views

### Phase 4: Polish & Agent Mode
- [ ] REST API server (localhost:19842)
- [ ] WebSocket real-time streaming
- [ ] Alerting system
- [ ] Settings panel
- [ ] Agent mode JSON output

### Phase 5: Advanced Features
- [ ] Historical graphs
- [ ] Custom alerts with desktop notifications
- [ ] Export/Import settings
- [ ] Virtual scrolling optimization
- [ ] Documentation and README

---

## 9. Open Questions / Future Considerations

1. **Multi-GPU Support**: Initial version assumes single NVIDIA GPU. Future: AMD GPU support via rocm-smi, Intel GPU via oneAPI.
2. **Windows/macOS**: Linux-first implementation. Future: Cross-platform builds.
3. **Remote Monitoring**: Current design is localhost-only. Future: Optional SSH tunnel or agent relay.
4. **Historical Data**: No persistent storage in initial version. Future: SQLite/InfluxDB for trends.
5. **Automatic Actions**: Currently read-only. Future: Auto-restart services, auto-kill runaway processes.
6. **Battery Monitoring**: Not implemented (desktop workstation assumed). Future: Laptop battery health.
7. **Container Awareness**: Don't show containers vs processes clearly. Future: Docker/containerd integration.
