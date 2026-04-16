export const FRAMEWORK_CONVENTIONS = {
    "next.js": {
        patterns: ["next.config.js", "next.config.ts", "pages/", "app/", "src/app/"],
        testPattern: "*.test.tsx",
        buildCommand: "npm run build",
        conventions: [
            "Use 'use client' directive for client components",
            "API routes go in 'app/api/' or 'pages/api/'",
            "Use Server Components by default, opt into 'use client'",
            "Environment variables: NEXT_PUBLIC_ prefix for client",
        ],
    },
    "react": {
        patterns: ["package.json:\"react\"", "src/index.(js|tsx)", "components/", "jsx", "tsx"],
        testPattern: "*.test.tsx",
        buildCommand: "npm run build",
        conventions: [
            "Functional components with hooks",
            "Prop types or TypeScript interfaces",
            "Co-locate styles with components",
        ],
    },
    "vue": {
        patterns: ["vue.config.js", "src/main.ts", "src/App.vue", ".vue files"],
        testPattern: "*.spec.ts",
        buildCommand: "npm run build",
        conventions: [
            "Single File Components with <template>, <script>, <style>",
            "Composition API with <script setup>",
            "Pinia for state management",
        ],
    },
    "svelte": {
        patterns: ["svelte.config.js", "src/main.ts", "src/App.svelte", ".svelte files"],
        testPattern: "*.test.ts",
        buildCommand: "npm run build",
        conventions: [
            "Reactive declarations with $:",
            "Stores for cross-component state",
            "SvelteKit for routing",
        ],
    },
    "python": {
        patterns: ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile", "__init__.py"],
        testPattern: "test_*.py",
        buildCommand: "pip install -e .",
        conventions: [
            "Use virtual environments",
            "Type hints for function signatures",
            "pytest for testing",
        ],
    },
    "django": {
        patterns: ["manage.py", "settings.py", "wsgi.py", "migrations/"],
        testPattern: "tests.py",
        buildCommand: "python manage.py check",
        conventions: [
            "MTV pattern (Model-Template-View)",
            "Use Django ORM",
            "Migrations for schema changes",
        ],
    },
    "fastapi": {
        patterns: ["main.py", "requirements.txt", "app/__init__.py"],
        testPattern: "test_*.py",
        buildCommand: "uvicorn main:app --reload",
        conventions: [
            "Pydantic for request/response models",
            "Dependency injection with FastAPI",
            "Auto-generated OpenAPI docs at /docs",
        ],
    },
    "go": {
        patterns: ["go.mod", "main.go", "*.go:not^test_"],
        testPattern: "*_test.go",
        buildCommand: "go build ./...",
        conventions: [
            "Standard layout: cmd/, pkg/, internal/",
            "go fmt for formatting",
            "Error handling with return values",
        ],
    },
    "rust": {
        patterns: ["Cargo.toml", "src/main.rs", "src/lib.rs"],
        testPattern: "src/**/*test*.rs",
        buildCommand: "cargo build",
        conventions: [
            "Match on Result types",
            "Use ? operator for error propagation",
            "Clippy for linting",
        ],
    },
    "golang-service": {
        patterns: ["go.mod", "cmd/", "internal/", "api/"],
        testPattern: "*_test.go",
        buildCommand: "go build ./...",
        conventions: [
            "Standard Go project layout",
            "Internal packages for private code",
            "cmd/ for binaries",
        ],
    },
    "kubernetes": {
        patterns: ["Dockerfile", "kubernetes/", "k8s/", "*.yaml", "*.yml"],
        testPattern: "*.test.yaml",
        buildCommand: "kubectl apply --dry-run",
        conventions: [
            "Declarative configurations",
            "Separate dev/staging/prod configs",
            "Use ConfigMaps and Secrets",
        ],
    },
    "docker": {
        patterns: ["Dockerfile", "docker-compose.yml", ".dockerignore"],
        testPattern: "Dockerfile.test",
        buildCommand: "docker build .",
        conventions: [
            "Multi-stage builds for smaller images",
            "Don't run as root",
            "Use .dockerignore",
        ],
    },
};
export function detectFramework(directory, files) {
    const detected = [];
    for (const [framework, config] of Object.entries(FRAMEWORK_CONVENTIONS)) {
        for (const pattern of config.patterns) {
            if (pattern.includes(":")) {
                const [file, content] = pattern.split(":");
                if (files.some(f => f.includes(file)) && files.some(f => f.includes(content))) {
                    if (!detected.includes(framework))
                        detected.push(framework);
                }
            }
            else if (files.some(f => f.includes(pattern))) {
                if (!detected.includes(framework))
                    detected.push(framework);
            }
        }
    }
    return detected;
}
