# Simple Calculator - Specification

## 1. Project Overview
- **Project name**: Simple Calculator
- **Type**: Single-page web application
- **Core functionality**: Basic arithmetic calculator with clean, intuitive interface
- **Target users**: Anyone needing quick calculations

## 2. Visual Specification

### Layout
- Centered calculator widget on page
- Display area at top (result screen)
- Grid of buttons below (4 columns × 5 rows)

### Color Palette
- Background: `#1a1a2e` (dark navy)
- Calculator body: `#16213e` (darker blue)
- Display: `#0f0f23` (near black)
- Number buttons: `#2d3a5a` (muted blue)
- Operator buttons: `#e94560` (coral red)
- Clear button: `#ff6b6b` (soft red)
- Equals button: `#00d9ff` (cyan)
- Text: `#ffffff` (white)

### Typography
- Display: `JetBrains Mono`, 2.5rem, right-aligned
- Buttons: `Inter`, 1.5rem, centered

### Button Layout (top to bottom, left to right)
```
[ C ] [ ± ] [ % ] [ ÷ ]
[ 7 ] [ 8 ] [ 9 ] [ × ]
[ 4 ] [ 5 ] [ 6 ] [ − ]
[ 1 ] [ 2 ] [ 3 ] [ + ]
[   0   ]   [ . ] [ = ]
```
- Zero button spans 2 columns

### Effects
- Button press: scale(0.95) with 100ms transition
- Subtle box-shadow on calculator body
- Border-radius: 12px on body, 8px on buttons

## 3. Functionality Specification

### Operations
- Addition (+)
- Subtraction (−)
- Multiplication (×)
- Division (÷)
- Percentage (%)
- Sign toggle (±)
- Clear (C)
- Decimal point (.)

### Behavior
- Chained operations supported (e.g., 5 + 3 × 2)
- Display shows "Error" for division by zero
- Max 12 digits displayed
- Keyboard support for numbers and operators

### States
- `firstOperand`: stored after operator pressed
- `operator`: current operator
- `waitingForSecondOperand`: boolean flag
- `displayValue`: current display string

## 4. Acceptance Criteria
- [ ] All buttons render correctly in grid layout
- [ ] Basic arithmetic works (2+2=4, 10-3=7, 4×5=20, 20÷4=5)
- [ ] Clear button resets calculator
- [ ] Percentage calculates correctly (50% = 0.5)
- [ ] Sign toggle works (±)
- [ ] Keyboard input works
- [ ] Visual feedback on button press
- [ ] Division by zero shows error
