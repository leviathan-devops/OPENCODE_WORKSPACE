#!/usr/bin/env bun
import { Log } from "@/util/log"

const log = Log.create({ service: "shark-wizard" })

export async function sharkWizard() {
  console.log("🦈 Shark Agent Setup Wizard")
  console.log("=".repeat(40))
  console.log("")
  console.log("Shark enforcement features:")
  console.log("  - Guardian: File protection for PERSONAL/SYSTEM paths")
  console.log("  - Workflow: 5-step enforcement (PLAN→BUILD→TEST→VERIFY→SHIP)")
  console.log("  - Behavioral validation: Mock mode, theatrical code detection")
  console.log("")
  console.log("Configuration stored in .shark/ directory")
  console.log("")
  console.log("🎉 Run 'opencode' to start with enforcement enabled.")
}
