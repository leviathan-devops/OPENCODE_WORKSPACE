# Architecture Documentation

## System Overview
Physiolab is designed as a modular physiological data processing platform.

## Component Architecture
```
                    ┌─────────────┐
                    │   Web UI    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  REST API   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
  │   Core      │  │   Utils     │  │  Database   │
  │ Processing  │  │             │  │             │
  │  (Python)   │  │             │  │             │
  └─────────────┘  └─────────────┘  └─────────────┘
```
