---

## 📦 Dependencies Summary

Below is the full list of all packages installed and required for the Degree Plan Assistant Agent MVP.

---

### 🖥️ Frontend (Next.js + TypeScript + Tailwind)
| Package | Purpose |
|----------|----------|
| **next** | React framework for server-side rendering and routing |
| **react** / **react-dom** | Core React libraries |
| **typescript** | Type safety for large-scale app development |
| **tailwindcss** | CSS framework for fast, responsive UI design |
| **eslint** / **eslint-config-next** | Code linting and style consistency |
| **axios** | HTTP client for calling backend APIs |
| **@tanstack/react-query** | Server-state management and data fetching |
| **next-auth** | Authentication and role management |
| **postcss** / **autoprefixer** | Tailwind build tools for CSS processing |
| **prettier** *(optional)* | Code formatting consistency |

**Installation Commands**
```bash
npm install axios @tanstack/react-query next-auth
npm install -D prettier eslint-config-prettier
---

## ⚙️ Backend Environment Setup Log

This section documents the creation of the **backend environment** for the Degree Plan Assistant Agent.  
It covers folder structure, installation commands, and base boilerplate code for a working Express + MongoDB API with AI integration.

---

### 🧱 Step 1: Create Backend Folder and Initialize Node Project

In the root project directory, run:

```bash
cd backend
npm init -y

Backend (Node.js + Express + MongoDB + AI)
Package	Purpose
express	Web framework for API creation
mongoose	MongoDB object modeling and schema management
cors	Cross-Origin Resource Sharing middleware
dotenv	Environment variable management
axios	Makes HTTP requests to APIs (LLM, n8n)
langchain	Framework for LLM orchestration and prompt chains
openai	OpenAI API client for GPT-based reasoning
nodemon (dev)	Hot-reload server during development
typescript / ts-node (optional)	TypeScript backend support
@types/express, @types/node (dev)	TypeScript definitions

### Installation Commands

npm install express mongoose cors dotenv axios langchain openai
npm install -D nodemon typescript ts-node @types/express @types/node