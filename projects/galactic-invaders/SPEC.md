# Space Invaders — Browser Game Specification

## Project Overview
- **Project Name:** Galactic Invaders
- **Type:** Arcade shooter game
- **Core Functionality:** Classic Space Invaders with modern graphics, multiple enemy types, power-ups, and wave progression
- **Target Users:** Casual gamers looking for engaging browser-based entertainment

## Visual & Rendering Specification

### Scene Setup
- **Canvas:** Full viewport with responsive scaling
- **Background:** Animated starfield with parallax layers (3 layers at different speeds)
- **Color Palette:** 
  - Primary: Cyan (#00f0ff) and Magenta (#ff00aa)
  - Accent: Gold (#ffd700) and Lime (#00ff88)
  - Background: Deep space black (#0a0a12) with purple nebula hints

### Visual Style
- Retro-futuristic with neon glow effects
- CRT scanline overlay (subtle)
- Screen shake on explosions
- Particle systems for:
  - Player thrust
  - Enemy explosions
  - Bullet impacts
  - Power-up collection

### Typography
- Font: "Orbitron" (Google Fonts) for HUD and titles
- Score display: Large, glowing numbers
- Wave announcements: Animated text with scale effect

## Game Entities

### Player Ship
- Sleek triangular design with engine glow
- Color: Cyan with white core
- Size: 40x50 pixels
- States: Normal, Invulnerable (flashing), Powered-up (glow aura)

### Enemy Types (4 varieties)
1. **Grunt** — Basic enemy, straight movement, single shot
2. **Weaver** — Sine-wave horizontal movement, single shot
3. **Tank** — Slow, takes 3 hits, fires spread shot
4. **UFO** — Rare, flies across top, drops bombs

### Enemy Formations
- Grid formation: 5 rows x 11 columns
- Formation drops down when reaching screen edges
- Movement speed increases as enemies are destroyed

### Bullets
- Player: Fast cyan laser bolts
- Enemy: Slower magenta projectiles

### Power-Ups (drop from destroyed enemies)
- **Rapid Fire:** Faster shooting
- **Shield:** Temporary invulnerability
- **Triple Shot:** 3-way spread
- **Bomb:** Screen-clearing explosion

## Game Mechanics

### Player Controls
- **Arrow Left/Right or A/D:** Move horizontally
- **Spacebar:** Fire
- **P:** Pause
- **R:** Restart (when game over)

### Scoring
- Grunt: 10 points
- Weaver: 20 points
- Tank: 30 points
- UFO: 100 points
- Power-up collected: 50 points
- Wave completion bonus: 100 × wave number

### Progression
- Wave 1: 40 Grunts
- Wave 2: 30 Grunts + 10 Weavers
- Wave 3: 20 Grunts + 15 Weavers + 5 Tanks
- Wave 4+: Increasing difficulty with more Tanks and UFO appearances

### Lives System
- Start with 3 lives
- Extra life at 10,000 points
- Brief invulnerability after death (2 seconds)

## Audio Specification
- Web Audio API synthesized sounds
- Background: Retro synthwave loop
- Effects: Laser, explosion, power-up, death, game over

## Acceptance Criteria
1. ✓ Player can move and shoot
2. ✓ Enemies move in formation and descend
3. ✓ Collision detection works for all entities
4. ✓ Score increments correctly
5. ✓ Lives decrease on player death
6. ✓ Game over screen with final score
7. ✓ Wave progression increases difficulty
8. ✓ Power-ups spawn and function
9. ✓ Sound effects play
10. ✓ Game is responsive to window size
