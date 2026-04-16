# Calculator Project Specification

## Project Overview
- **Project name**: Web Calculator
- **Type**: Single-page web application
- **Core functionality**: A functional calculator with basic arithmetic operations
- **Target users**: Anyone needing quick calculations

## UI/UX Specification

### Layout Structure
- Centered calculator container (max-width: 320px)
- Display area at top showing input and result
- Grid of buttons below (4 columns)
- Responsive: works on mobile and desktop

### Visual Design

**Color Palette**
- Background: `#1a1a2e` (deep navy)
- Calculator body: `#16213e` (dark blue)
- Display background: `#0f3460` (medium blue)
- Display text: `#e94560` (coral red)
- Number buttons: `#1a1a2e` with `#e94560` border
- Operator buttons: `#e94560` (coral)
- Clear button: `#e94560` background with white text
- Equals button: `#e94560` background

**Typography**
- Font family: 'Orbitron', sans-serif (from Google Fonts)
- Display: 2rem, bold
- Buttons: 1.5rem, bold

**Spacing**
- Calculator padding: 20px
- Button gap: 10px
- Button padding: 15px

**Visual Effects**
- Box shadow on calculator: 0 10px 30px rgba(233, 69, 96, 0.3)
- Button hover: scale(1.05) with transition
- Button active: scale(0.95)
- Rounded corners: 15px for calculator, 10px for buttons

### Components

**Display**
- Shows current input (max 12 digits)
- Shows result when calculation complete

**Buttons**
- Numbers: 0-9, decimal point
- Operators: +, -, ×, ÷
- Clear (C) - clears all
- Equals (=) - calculates result

## Functionality Specification

### Core Features
1. Number input (0-9 and decimal)
2. Basic arithmetic: add, subtract, multiply, divide
3. Chain calculations (e.g., 5 + 3 × 2)
4. Clear all (C button)
5. Display shows current input

### User Interactions
- Click number → append to display
- Click operator → store operator and first number
- Click equals → calculate and display result
- Click C → reset calculator

### Edge Cases
- Prevent multiple decimal points
- Handle division by zero (show "Error")
- Handle overflow (truncate display)

## Acceptance Criteria
1. Calculator displays and functions on page load
2. All number buttons work correctly
3. All operators work correctly
4. Clear button resets the calculator
5. Equals button produces correct results
6. Visual design matches spec (colors, fonts, effects)