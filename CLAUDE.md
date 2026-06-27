# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gym Tracker is a Next.js 14 application for tracking workouts, visualizing training patterns via heatmaps, and managing fitness progress. It uses Firebase for backend storage with a localStorage fallback for offline use.

## Key Directories

- `src/app` - Next.js App Router pages and layouts
- `src/components` - Reusable React components
- `src/lib` - Utilities, Firebase integration, state management, and types
- `src/lib/store.tsx` - Centralized state management using React Context with Firebase/localStorage persistence
- `src/lib/types.ts` - TypeScript interfaces for domain models (Workout, Exercise, Template, etc.)
- `public` - Static assets

## Key Features & Architecture

### State Management
- Uses React Context API (`StoreProvider`) in `src/lib/store.tsx`
- Persists data to Firebase when configured, falls back to localStorage
- Manages workouts, templates, exercises, and user authentication state
- Provides CRUD operations for all entities through the store

### Data Models (src/lib/types.ts)
- `Workout`: Contains metadata (name, date) and array of `ExerciseLog`
- `ExerciseLog`: Exercise name with sets and optional notes
- `SetEntry`: Weight, unit, reps, optional RPE/toFailure
- `Template`: Predefined workout structures for quick creation
- `Exercise`: Master list of exercises with default units and categories

### Key Utilities
- `src/lib/units.ts`: Weight conversion utilities (kg, lb, plate, bw)
- `src/lib/heatmap.ts`: GitHub-style heatmap generation for workout volume
- `src/lib/prs.ts`: Personal records and volume calculations
- `src/lib/firebase.ts`: Firebase configuration and initialization

### Styling
- Tailwind CSS configured in `tailwind.config.ts` and `postcss.config.mjs`
- Custom CSS variables in `src/app/globals.css`
- Component-based styling with utility-first approach

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## Common Development Tasks

### Adding a New Exercise Type
1. Add to `DEFAULT_EXERCISES` array in `src/lib/store.tsx`
2. The exercise will be available in the workout form autocomplete

### Creating a New Page
1. Create a directory under `src/app` (e.g., `src/app/newfeature`)
2. Add `page.tsx` (and optionally `loading.tsx`, `error.tsx`)
3. Link from navigation components (`src/components/Nav.tsx` or `src/components/TopBar.tsx`)

### Modifying Workout Logic
- Core workout logic lives in `src/lib/store.tsx` (CRUD operations)
- Workout form component: `src/components/WorkoutForm.tsx`
- Workout display: various pages under `src/app/workout/`

### Styling Components
- Uses Tailwind CSS utility classes
- Custom components in `src/components/` follow naming conventions:
  - `Btn` for buttons (see WorkoutForm for examples)
  - `Card` for container components
  - `Input` for form inputs
- Custom CSS variables defined in `src/app/globals.css`

## Important Files to Understand First

1. **`src/lib/store.tsx`** - Central state management, Firebase integration
2. **`src/lib/types.ts`** - Core data models used throughout the app
3. **`src/app/layout.tsx`** - Root layout with providers and global styles
4. **`src/app/page.tsx`** - Home/dashboard view showing workout stats
5. **`src/components/WorkoutForm.tsx`** - Primary workout creation/editing interface
6. **`src/components/Heatmap.tsx`** - Visualization of workout frequency/volume

## Firebase Configuration

The app expects Firebase configuration in environment variables:
- See `.env.example` for required variables
- Firebase is used for authentication and Firestore storage
- Falls back to localStorage when Firebase is not configured

## Code Quality

- Uses TypeScript for type safety
- ESLint configured with Next.js rules (`eslint-config-next`)
- Follows React best practices with functional components and hooks
- Client components marked with `"use client"` directive where needed

## Database Structure (Firestore)

When Firebase is configured, data is stored in:
```
/users/{userId}/workouts/{workoutId}
/users/{userId}/templates/{templateId}
/users/{userId}/exercises/{exerciseId}
```

Each document contains the fields defined in the corresponding TypeScript interfaces.

## Responsive Design

The application uses Tailwind's responsive prefixes:
- `sm:` for small screens (≥640px)
- No prefix for base mobile styles
- Layout adapts to mobile, tablet, and desktop screens

## State Persistence

- Data persists between sessions via Firebase (when configured) or localStorage
- Auth state persists across sessions
- Workout data is immediately saved to persistence layer on change