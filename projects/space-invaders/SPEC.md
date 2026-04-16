# Space Invaders - Neon Assault

## Project Overview
- **Type**: Browser-based arcade game (single HTML file)
- **Core**: Classic Space Invaders with modern neon aesthetics, particle effects, and smooth animations
- **Target**: Playable immediately in any modern browser

## Visual Specification

### Art Style: Neon Arcade
- Deep space background (#0a0a12) with subtle star field
- Neon glow effects on all game elements
- CRT scanline overlay for retro feel
- Color palette: Cyan (player), Magenta (enemies), Yellow (bullets), Green (UI)

### Game Elements

#### Player Ship
- Sleek triangular design with engine glow
- Cyan neon outline with inner gradient
- Thruster particles when moving
- Shield flash on hit (3 lives)

#### Alien Invaders
- 5 rows × 11 columns = 55 aliens
- 3 types with different point values:
  - Top row (10 pts): Squid type - magenta with pulsing glow
  - Middle rows (20 pts): Crab type - purple with wave animation
  - Bottom rows (30 pts): Octopus type - pink with tentacle animation
- Death explosion: Particle burst matching alien color

#### Barriers/Shields
- 4 destructible barriers with pixelated chunks
- Green neon color that chips away on hit
- 5 hit points before fully destroyed

#### UFO (Bonus Ship)
- Random appearance at top
- 50-300 points (random)
- Red with spinning propeller effect
- Drums "charge up" sound as it crosses

#### Background
- Parallax star field (3 layers, different speeds)
- Subtle nebula gradient in corner
- Screen shake on explosions

## Gameplay Specification

### Core Mechanics
- Player moves left/right with Arrow Keys or A/D
- Spacebar fires bullets (max 1 on screen at a time initially, upgrades later)
- Aliens move in formation, dropping down and reversing at edges
- Alien speed increases as fewer remain
- Score displayed top-left, Lives top-right, Wave center

### Enemy Behavior
- Movement: Right → drop → Left → drop → repeat
- Random alien fires downward (frequency increases with wave)
- 3 hit zones: top row hardest to hit, bottom easiest

### Power-ups (drop from killed aliens randomly)
- Rapid Fire (yellow): Double bullet speed
- Triple Shot (cyan): 3 bullets at once
- Shield Boost (green): Temporary invincibility

### Waves
- Wave 1: Slow speed, low fire rate
- Each subsequent wave: +10% speed, +15% fire rate
- Every 5 waves: Boss wave with tough mini-boss aliens

### Audio (Web Audio API)
- Retro synthesized sounds:
  - Player shoot: Short "pew"
  - Alien death: Low "explosion"
  - Player hit: Warning alarm
  - Wave complete: Fanfare arpeggio
  - Game over: Descending tone

## UI Specification

### HUD
- Top bar with slight transparency
- Score: "SCORE: 00000" (cyan)
- Wave: "WAVE 01" (yellow)
- Lives: 3 ship icons (cyan)
- High score tracking (localStorage)

### Screens
1. **Title Screen**: Logo with pulsing "PRESS SPACE TO START"
2. **Pause Screen**: "PAUSED" overlay
3. **Game Over**: Final score, high score, "PRESS SPACE TO RESTART"
4. **Wave Complete**: Brief "WAVE X COMPLETE" before next wave

## Technical Specification

### Rendering
- HTML5 Canvas (1200×800)
- 60 FPS game loop with requestAnimationFrame
- Delta time for consistent physics

### Performance
- Object pooling for bullets and particles
- Efficient collision detection (grid-based for aliens)

## Acceptance Criteria
- [ ] Player can move and shoot
- [ ] 55 aliens in 5×11 formation move correctly
- [ ] Aliens shoot back and kill player
- [ ] Score increases on kills
- [ ] Barriers take damage and eventually destroy
- [ ] Power-ups drop and work
- [ ] Waves progress with increasing difficulty
- [ ] Sound effects play
- [ ] Game over and restart work
- [ ] High score saves to localStorage
