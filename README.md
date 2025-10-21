# AI Tutor - Middle School English Learning Platform

An intelligent, autonomous AI tutor powered by AWS Bedrock that helps middle school students (grades 6-8) learn English through personalized lessons, adaptive quizzes, and gamified learning experiences.

## 🎯 Project Overview

**Built for:** AWS AI Agent Hackathon  
**Target Audience:** Middle school students (grades 6-8)  
**Tech Stack:** React + TypeScript, AWS Bedrock AgentCore, Python, DynamoDB  
**UI Framework:** Aceternity UI + Framer Motion (beautiful, engaging animations)

## ✨ Key Features

### 🤖 Autonomous AI Agent (tutor_agent)
- **Reasoning LLM:** Amazon Bedrock Nova Pro for intelligent decision-making
- **Autonomous Teaching:** AI decides what to teach, when to assess, and how to adapt
- **6 Question Types:** MCSA, MCMA, True/False, Short Answer, Fill-in-Blank, Word Match
- **Adaptive Learning:** Difficulty adjusts based on student performance
- **Personalized Content:** Lessons aligned with student interests

### 🎮 Gamification System
- **XP & Levels:** Earn experience points, level up (30+ levels)
- **40+ Achievements:** Unlock badges for vocabulary, grammar, reading, streaks, speed, and accuracy
- **5 Rarity Tiers:** Common, Uncommon, Rare, Epic, Legendary
- **Streak Tracking:** Daily learning streaks with rewards
- **Progress Visualization:** See improvement over time

### 📚 Learning Experience
- **Guided Journey:** Not chat-based - AI orchestrates the entire learning path
- **Beautiful UI:** Aceternity UI components with smooth animations
- **Interactive Quizzes:** Fun, engaging question types with instant feedback
- **E-Reader Style:** Comfortable reading experience for lesson content
- **Real-time Feedback:** AI validates answers and provides explanations

## 📋 Documentation

- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Complete development roadmap
- **[Constants Specification](./CONSTANTS_SPECIFICATION.md)** - Shared enums and constants

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
AWS API Gateway (Cognito JWT Auth)
    ↓
AgentCore Runtime (tutor_agent)
    ↓
Amazon Bedrock Nova Pro + DynamoDB + Memory
```

### AWS Services Used
- ✅ **Amazon Bedrock** - Nova Pro for reasoning and content generation
- ✅ **AWS AgentCore Runtime** - Agent orchestration and execution
- ✅ **Amazon Cognito** - Student authentication
- ✅ **Amazon DynamoDB** - Progress tracking, achievements, student profiles
- ✅ **Amazon S3 + CloudFront** - Frontend hosting and CDN
- ✅ **AWS Systems Manager** - Parameter store for configuration

## 🚀 Quick Start

### Prerequisites
- AWS Account with Bedrock access (region: us-east-1 recommended)
- AWS CLI configured with profile "bookhood"
- Node.js 18+
- Python 3.11+
- npm/pnpm

### 1. Clone and Setup
```bash
git clone https://github.com/karthiks3000/ai-tutor.git
cd ai-tutor
```

### 2. Deploy Infrastructure (CDK)
```bash
cd cdk
npm install
npm run build
./deploy.sh dev --profile bookhood
```

### 3. Deploy Backend Agent
```bash
cd agents/tutor_agent
pip install -r requirements.txt
pip install bedrock-agentcore-starter-toolkit
./deploy-tutor-agent.sh --profile bookhood
```

### 4. Deploy Frontend
```bash
cd frontend
npm install
./deploy-frontend.sh dev --profile bookhood
```

## 📊 Project Structure

```
ai-tutor/
├── IMPLEMENTATION_PLAN.md          # Development roadmap
├── CONSTANTS_SPECIFICATION.md      # Shared constants
├── cdk/                            # AWS infrastructure (CDK)
├── agents/tutor_agent/             # Backend AI agent (Python)
│   ├── tutor_agent.py              # Main orchestrator
│   ├── tools/                      # Agent tools
│   └── models/                     # Data models
└── frontend/                       # React frontend
    ├── src/
    │   ├── pages/                  # Main pages
    │   ├── components/             # Reusable components
    │   │   ├── learning/           # Question types, quiz engine
    │   │   ├── gamification/       # XP, badges, achievements
    │   │   └── ui/                 # Aceternity UI components
    │   ├── services/               # API clients
    │   └── types/                  # TypeScript definitions
    └── public/                     # Static assets
```

## 🎨 UI Components (Aceternity)

The app uses beautiful, animated components from [Aceternity UI](https://ui.aceternity.com):
- 3D Card Effects for quiz options
- Text Generate Effect for lesson content
- Particles for celebrations
- Spotlight for hero sections
- Gradient buttons and backgrounds
- Smooth page transitions

## 🎯 Hackathon Requirements Met

✅ **LLM hosted on AWS:** Amazon Bedrock Nova Pro  
✅ **AgentCore Primitive:** tutor_agent built on AgentCore Runtime  
✅ **Reasoning LLM:** Nova Pro for decision-making  
✅ **Autonomous Capabilities:** AI decides teaching strategy independently  
✅ **External Tools Integration:** DynamoDB, LLM-based validation, memory systems  

### AI Agent Principles Demonstrated
1. **Autonomy** - Self-directed teaching without constant oversight
2. **Goal-Oriented** - Aims to improve English proficiency
3. **Perception** - Collects data from quiz responses and exercises
4. **Rationality** - Makes informed teaching decisions based on data
5. **Proactivity** - Anticipates struggling areas before student asks
6. **Continuous Learning** - Improves from interaction history
7. **Adaptability** - Adjusts difficulty and topics dynamically
8. **Collaboration** - Works with student to achieve learning goals

## 🔧 Environment Variables

### Backend (.env)
```bash
AWS_PROFILE=bookhood
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.amazon.nova-pro-v1:0
```

### Frontend (.env.production)
```bash
VITE_ENVIRONMENT=production
VITE_AGENT_CORE_URL=<from-agent-deployment>
VITE_COGNITO_USER_POOL_ID=<from-cdk-output>
VITE_COGNITO_USER_POOL_CLIENT_ID=<from-cdk-output>
VITE_COGNITO_REGION=us-east-1
```

## 📈 Development Timeline

- **Day 1:** Infrastructure setup, CDK deployment
- **Day 2-3:** Backend agent development (tools, models, orchestrator)
- **Day 4-5:** Frontend development (pages, components, UI)
- **Day 6:** Integration, testing, bug fixes
- **Day 7:** Polish, demo prep, documentation

## 🎓 Student Learning Journey

1. **Sign Up / Sign In** - Cognito authentication
2. **Onboarding Survey** - Grade, interests, learning goals
3. **Diagnostic Quiz** - AI assesses current level (15-20 questions)
4. **Personalized Lessons** - AI generates content aligned with interests
5. **Pop Quizzes** - Seamless knowledge checks during lessons
6. **Achievement Unlocks** - Earn badges, XP, and level up
7. **Progress Tracking** - See improvement over time

## 🏆 Achievement Categories

- **Vocabulary:** Word Sprout, Word Wizard, Vocabulary Master (500 words)
- **Grammar:** Grammar Rookie, Grammar Guru, Grammar Master
- **Reading:** Bookworm, Library Card, Literature Lover (100 lessons)
- **Streaks:** Hot Streak (3 days), Dedicated Learner (7 days), Unstoppable (30 days)
- **Speed:** Quick Draw (<5s), Speed Demon, Lightning Fast
- **Accuracy:** Sharpshooter (90%+), Perfectionist (100%), Champion

## 🤝 Contributing

This project was built for the AWS AI Agent Hackathon. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- AWS Bedrock Team for AgentCore Runtime
- Aceternity UI for beautiful components
- Middle school educators for learning insights

## 📞 Contact

**GitHub:** [@karthiks3000](https://github.com/karthiks3000)  
**Project:** [ai-tutor](https://github.com/karthiks3000/ai-tutor)

---

**Built with ❤️ for middle school students learning English**
