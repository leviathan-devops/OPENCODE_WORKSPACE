# Simple Calculator - Specification

## Project Overview
- **Project Name**: Simple Calculator
- **Type**: Single-page web application
- **Core Functionality**: Basic arithmetic operations calculator
- **Target Users**: Anyone needing quick calculations

## Visual Specification

### Layout
- Centered calculator card with rounded corners
- Display screen at top showing current input/result
- Grid of buttons below (4 columns x 5 rows)

### Color Palette
- Background: Dark slate (#1a1a2e)
- Calculator body: Deep purple (#16213e)
- Display: Dark blue (#0f3460)
- Number buttons: Slate (#1f4068)
- Operator buttons: Orange accent (#e94560)
- Equals button: Bright orange (#ff6b35)
- Clear button: Red (#c73e1d)
- Text: White (#eaeaea)

### Typography
- Display: 2rem monospace, right-aligned
- Buttons: 1.5rem sans-serif

### Button Layout
```
[  C  ] [  ± ] [  %  ] [  ÷  ]
[  7  ] [  8  ] [  9  ] [  ×  ]
[  4  ] [  5  ] [  6  ] [  −  ]
[  1  ] [  2  ] [  3  ] [  +  ]
[  0  ] [  .  ] [  =  ]
```

## Functionality Specification

### Core Features
1. **Number Input**: 0-9 and decimal point
2. **Operations**: Add, subtract, multiply, divide
3. **Special Functions**:
   - Clear (C): Reset all values
   - Sign toggle (±): Convert positive/negative
   - Percentage (%): Convert to percentage (divide by 100)
4. **Equals**: Evaluate and display result
5. **Chained Operations**: Support multiple operations before equals

### Behavior
- Display max 12 characters
- Prevent multiple decimal points in same number
- Prevent division by zero
- Clear error states on new input
- Click feedback via subtle scale animation

## Acceptance Criteria
- [ ] All number buttons (0-9) work correctly
- [ ] All operators (+, −, ×, ÷) function properly
- [ ] Decimal point adds only one per number
- [ ] Clear resets calculator state
- [ ] Percentage converts value correctly
- [ ] Sign toggle changes positive/negative
- [ ] Equals evaluates expression correctly
- [ ] Division by zero shows error message
- [ ] Buttons have visual click feedback
- [ ] Responsive on mobile viewports
