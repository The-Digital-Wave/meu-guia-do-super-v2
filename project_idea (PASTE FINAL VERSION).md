

Hey Claude, \[Set Claude to PLAN MODE]



This is my idea for a mobile app .. \[describe the idea]. Now you can ask me a bunch of questions about the design (theme, color palette, logos), what the pages should look like, just any information you need to build this app. Let’s get a clean spec and plan going before we start building anything. I’d like you to create a markdown file that’s gonna have all the specs set up the project and the structure, and then we’ll start building workflows together. Ask me anything you need!



Help me out define which tech stack to use and what else you might suggest that I haven’t yet thought off. project\_idea.txt



CLAUDE CODE FOLDER STRUCTURE

AGENTS

&#x20;   • Product Architect: project/product\_management/CLAUDE.md

&#x20;   • UI/UX Designers: project/ux\_designCLAUDE.md

&#x20;   • Backend engineer: project/backend/CLAUDE.md

&#x20;   • Frontend engineer: project/frontend/CLAUDE.md

&#x20;   • QA engineer: project/quality\_assurance/CLAUDE.md

&#x20;   • DevSecOps: project/devsecops/CLAUDE.md

* 

AGENTS FOLDER STRUCTURE

project/

├── 📋 product\_management/

│   ├── CLAUDE.md          <-- Shared Product Strategy \& Backlog Hub

│   ├── user\_stories/      <-- Product Requirements Documents (PRDs)

│   └── roadmap.md

├── 🎨 ux\_design/

│   ├── CLAUDE.md <-- Role definition, guardrails, \& tools for the UX Agent

│   └── task\_backlog.md <-- Current design deliverables 

├── 💻 backend/

│   ├── CLAUDE.md          <-- API Architecture, DB Schema, Security rules

│   └── src/

├── 📱 frontend/

│   ├── CLAUDE.md          <-- Mobile UI, State, Native bindings, Components

│   └── src/

├── 🧪 quality\_assurance/

│   ├── CLAUDE.md <-- Role definition, assertions, \& test suites for the QA Agent

│   └── bug\_tracker.md <-- Current test tracking 

└── 🚀 devsecops/

&#x20;   ├── CLAUDE.md          <-- CI/CD, IaC, Mobile App Store pipelines, Security

&#x20;   └── .github/workflows/



TECH STACK

Below I suggest a list of technologies for you, but feel free to use other ones that you feel would make my mobile app more robust and scalable. I’ll ask you to ask me and explain why you decided for an alternative technology before you actually change.



FRONTEND

&#x20;   • React Native

&#x20;   • Expo

&#x20;   • Next.js

&#x20;   • Tailwind CSS

&#x20;   • Zustand

&#x20;   • React Tanstack Query



BACKEND

&#x20;   • Nest

&#x20;   • Express

&#x20;   • Redis (caching)

&#x20;   • Supabase (PostgresSQL)

&#x20;   • JWT or OAuth2 (authentication)

&#x20;   • Role-based access control: role-based authorization for admin routes



DEPLOYMENT

&#x20;   • Render/Heroku/Hostinger (choose the one you think has the best cost-benefit relation)





VERSIONING

&#x20;   • Git/GitHub (Versioning)

&#x20;       ◦ Create a git/github repo and save the first work in a commit. After that, keep commiting your future updates in code periodically to keep track of the progress and recover gracefully from failure eventually.

&#x20;       ◦ If possible, I’d like you to work in a according to gitflow best practices: for each new feature you implement, create an issue, then a new feature branch out the main branch, develop your work in this feature branch, and when your done, create a pull request to main and merge your work. If fixes, hotfixes, refactors are needed along the way, create dedicated branches from them and follow the same gitflow best practices we applied for features.



