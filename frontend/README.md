# AI Tutor Frontend

React + TypeScript frontend for the AI Tutor application.

## Features

- **Beautiful UI** with Tailwind CSS and custom animations
- **5 Pages** - Landing, Sign Up, Sign In, Onboarding, Learning Journey
- **6 Question Types** - MCSA, MCMA, True/False, Short Answer, Fill-in-Blank, Word Match
- **Gamification** - XP system, achievements, badges, streaks
- **State Management** - Zustand for auth, learning, and progress
- **AWS Integration** - Cognito auth, Agent Core API

## Quick Start

### Development
```bash
npm install
npm run dev
```

Visit http://localhost:5173

### Build
```bash
npm run build
```

### Deploy
```bash
./deploy-frontend.sh dev --profile default
```

## Environment Variables

Copy `.env.example` to `.env.production` and fill in values from CDK deployment:

```bash
VITE_ENVIRONMENT=production
VITE_AGENT_CORE_URL=<from-agent-deployment>
VITE_COGNITO_USER_POOL_ID=<from-cdk-output>
VITE_COGNITO_USER_POOL_CLIENT_ID=<from-cdk-output>
VITE_COGNITO_REGION=us-east-1
```

## Project Structure

```
src/
├── pages/              # 5 main pages
├── components/
│   ├── learning/       # 8 learning components (quiz, questions, lesson)
│   └── gamification/   # 5 gamification components (XP, badges, achievements)
├── types/              # TypeScript definitions
├── config/             # Environment and Amplify config
├── services/           # API clients (agent, cognito, progress)
├── stores/             # Zustand state management
└── lib/                # Utility functions
```

## Components

### Learning Components
- **QuizEngine** - Orchestrates quiz flow
- **MCQQuestion** - Multiple choice (single/multiple)
- **TrueFalseQuestion** - True/False
- **ShortAnswerQuestion** - Open-ended text
- **FillInBlankQuestion** - Fill blanks with word bank
- **WordMatchQuestion** - Match words to definitions
- **LessonReader** - E-reader style content
- **FeedbackPopup** - Answer feedback

### Gamification Components
- **XPCounter** - Floating XP/level display
- **AchievementModal** - Badge unlock celebration
- **StreakTracker** - Daily streak indicator
- **BadgeDisplay** - Achievement gallery
- **LevelProgressBar** - Level progression bar

## Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **AWS Amplify** - Cognito authentication
- **Framer Motion** - Animations (ready to add)

## Status

✅ All core components implemented
✅ All 6 question types functional
✅ Gamification system complete
✅ State management ready
✅ API clients implemented
⏳ Ready for deployment and testing

Built for the AWS AI Agent Hackathon 🚀
