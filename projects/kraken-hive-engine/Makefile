.PHONY: install test run format lint clean

install:
	@echo "Installing kraken-hive..."
	uv venv
	uv pip install -e ".[dev]"

test:
	@echo "Running tests..."
	uv run pytest tests/ -v --cov=src/kraken --cov-report=term-missing

run:
	@echo "Running kraken-hive..."
	uv run kraken-hive --help

format:
	@echo "Formatting code..."
	uv run black src/ tests/
	uv run ruff check --fix src/ tests/

lint:
	@echo "Linting code..."
	uv run ruff check src/ tests/
	uv run mypy src/

clean:
	@echo "Cleaning..."
	rm -rf build/ dist/ *.egg-info .pytest_cache .coverage htmlcov .ruff_cache
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
