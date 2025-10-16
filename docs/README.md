# Degree Plan Assistant Documentation 

# Degree Plan Assistant Agent

## Overview
The **Degree Plan Assistant Agent** is an AI-powered academic planning tool designed to help AUI students build accurate degree plans, select courses, and validate prerequisites. It automates communication with peer mentors and FYE instructors, ensuring that plans meet catalog requirements before submission.

---

##  Purpose
AUI students often face difficulties navigating complex degree catalogs, tracking prerequisites, and receiving timely approval from advisors. This system simplifies academic planning through intelligent validation and streamlined approval workflows.

---

##  Users
- **Students:** Generate and validate their degree plans.
- **Peer Mentors:** Review plans and provide guidance.
- **FYE Instructors:** Grade pre-validated submissions for reflection and analysis.
- **Admins:** Manage catalogs, users, and workflows.

---

## 🧩 Core Features
- **AI Validation:** Uses university catalog and transcripts to check course eligibility.
- **Automated Workflows:** Integrates with n8n to notify mentors and instructors.
- **Interactive Planner:** Built with Next.js for real-time course selection.
- **Catalog Integration:** Automatically updates course and prerequisite data.
- **Role-Based Access:** Managed via NextAuth for secure user roles.

---

## Architecture
- **Frontend:** Next.js (TypeScript + Tailwind)
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Automation:** n8n workflows
- **AI Layer:** LangChain + OpenAI API
- **Deployment:** Vercel (frontend), Render/AWS (backend), MongoDB Atlas

---

##Folder Structure
degree-plan-assistant/
│
├── frontend/ → Next.js app (UI + API)
├── backend/ → Express API + AI logic
├── n8n/ → Automation workflows
├── scripts/ → Data loaders (catalog, seeding)
└── docs/ → Documentation and progress reports
