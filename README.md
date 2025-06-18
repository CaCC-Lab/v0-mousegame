# Fruit Harvest Game

A multi-platform action game built with Next.js, React, TypeScript, and Electron. Players collect falling fruits using various interaction methods to achieve high scores.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.8-blue)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-32.0-47848F)](https://www.electronjs.org/)

## Features

- **Cross-platform Support**: Runs in web browsers and as a desktop application (Windows, macOS, Linux)
- **Multiple Interaction Methods**: Click, double-click, right-click, and drag-and-drop mechanics
- **Progressive Difficulty**: 6 stages with increasing complexity
- **Power-up System**: 8 different power-ups with various effects
- **Internationalization**: Full support for Japanese and English
- **Test-Driven Development**: Comprehensive test coverage with Jest and React Testing Library
- **Responsive Design**: Optimized for various screen sizes and devices
- **Performance Optimized**: 60fps gameplay with efficient rendering

## Tech Stack

- **Frontend Framework**: Next.js 14.2.8 with App Router
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **Animation**: Framer Motion
- **Desktop Framework**: Electron 32.0
- **Testing**: Jest + React Testing Library + Playwright
- **Build Tools**: Turbopack, electron-builder
- **State Management**: React Hooks + Context API

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/CaCC-Lab/v0-mousegame.git

# Navigate to project directory
cd v0-mousegame

# Install dependencies
npm install
```

### Development

```bash
# Start Next.js development server
npm run dev

# Start Electron development mode
npm run electron:dev

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint
```

### Building for Production

```bash
# Build Next.js application
npm run build

# Build Electron applications
npm run build:win     # Windows (.exe)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (.AppImage)
```

## Architecture

### Project Structure

```
v0-mousegame/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── FruitHarvestGame.tsx   # Main game component
│   ├── Fruit.tsx              # Fruit entity component
│   ├── PowerUp.tsx            # Power-up component
│   ├── DifficultySelector.tsx # Difficulty selection
│   └── ui/                    # Reusable UI components
├── hooks/                 # Custom React hooks
│   ├── useGameLogic.ts       # Core game logic
│   ├── usePowerUps.ts        # Power-up system
│   ├── useStage.ts           # Stage management
│   └── useLanguage.ts        # i18n hook
├── lib/                   # Business logic
│   ├── gameLogic.ts          # Game mechanics
│   ├── stageManager.ts       # Stage progression
│   ├── soundManager.ts       # Audio management
│   └── i18n/                 # Translations
├── types/                 # TypeScript definitions
│   ├── game.ts              # Game entities
│   ├── stage.ts             # Stage types
│   └── powerup.ts           # Power-up types
├── electron/              # Electron-specific code
│   ├── main.ts              # Main process
│   └── preload.ts           # Preload script
└── __tests__/            # Test files
```

### Key Design Patterns

1. **Custom Hook Architecture**: Core game logic is encapsulated in custom hooks for reusability and testability
2. **Manager Pattern**: Dedicated manager classes for stages, sound, and difficulty
3. **Component Composition**: UI components are composed of smaller, reusable parts
4. **Test-Driven Development**: All features are developed with tests first

### Game Mechanics

#### Fruit Collection Methods

| Fruit | Interaction | Points | Implementation |
|-------|------------|--------|----------------|
| Apple | Single Click | 10 | Standard click event |
| Blueberry | Double Click | 20 | Click event with timing |
| Lemon | Right Click | 30 | Context menu prevention |
| Watermelon | Drag & Drop | 50 | Mouse tracking + drop zone |

#### Power-Up System

The game features 8 different power-ups that spawn randomly every 10 seconds:

- **Speed Boost**: Slows fruit movement (15s)
- **Score Multiplier**: Doubles points (20s)
- **Slow Motion**: Freezes time (10s)
- **Magnet**: Attracts nearby fruits
- **Shield**: No penalty for missed fruits (30s)
- **Time Extension**: Adds 15 seconds
- **Extra Fruits**: Spawns 5 new fruits
- **Freeze Time**: Stops the timer (10s)

## Testing

The project follows Test-Driven Development (TDD) principles with comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Test Structure

- **Unit Tests**: Components, hooks, and utilities
- **Integration Tests**: Game flow and state management
- **E2E Tests**: Full user scenarios with Playwright

## Deployment

### Web Deployment

The application can be deployed to any static hosting service:

```bash
# Build for production
npm run build

# Output will be in .next/ directory
```

### Desktop Distribution

Electron builds are configured for auto-update support:

```bash
# Build and package for all platforms
npm run build:all
```

## Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# Add any environment-specific variables here
```

### Game Configuration

Game parameters can be adjusted in `types/difficulty.ts` and `types/stage.ts`:

- Fruit spawn rates
- Movement speeds
- Time limits
- Score multipliers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript strict mode
- Write tests for new features
- Update documentation as needed

## Performance Considerations

- **Rendering**: Uses React.memo and useCallback for optimization
- **Animation**: RequestAnimationFrame for smooth 60fps gameplay
- **State Management**: Optimized re-renders with proper dependency arrays
- **Asset Loading**: Lazy loading for audio and images

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Electron (Windows, macOS, Linux)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Animations powered by [Framer Motion](https://www.framer.com/motion/)