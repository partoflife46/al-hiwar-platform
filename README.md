# Al-Hiwar Digital Da'wah Platform (Clean Edition)

Digital da'wah, interfaith dialogue, and new Muslim academy platform built with Next.js 15 App Router, TypeScript, and Tailwind CSS.
This edition runs on a **pure zero-account database** (`0 users`).

---

## 1. System Prerequisites

- **Node.js**: `>= 18.18.0` (Node 20 LTS or Node 22 recommended)
- **NPM**: `>= 9.x`
- **Editor**: Visual Studio Code (recommended)

---

## 2. Quickstart: Run in VS Code & Terminal

1. **Open the project folder:**
   - In VS Code: **File** > **Open Folder...** > select `Al-Hiwar Clean`.
   - Or via macOS Terminal:
     ```bash
     code "/Users/adifiqriyansyah/Desktop/Al-Hiwar Clean"
     ```

2. **Open the integrated terminal in VS Code:**
   - Press ``Ctrl + ` `` (or **Terminal** > **New Terminal**).

3. **Dependencies:**
   Pre-installed in `node_modules/`. To reinstall if needed:
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Go to [http://localhost:3000](http://localhost:3000)

---

## 3. First Account Setup (Zero-Account Flow)

The database starts completely empty with zero accounts.

### How to Create the First Administrator:
1. Go to the registration page: [http://localhost:3000/register](http://localhost:3000/register).
2. Enter your details (First Name, Surname, Email, Password, Date of Birth).
3. **The very first account registered automatically receives the `ADMINISTRATOR` role.**
4. Enter the 6-digit verification code:
   - In local development mode, the passcode prints directly in your terminal console and appears on screen with an **Auto-fill** button.
5. Once verified, you are redirected directly to the management backoffice: `/staff`.

### Creating Subsequent Accounts:
- **Staff Accounts (Supervisor, Dialogist, Instructor):**
  - Sign in as Administrator at `/staff`.
  - Go to the **Management** tab > click **"+ Add Account"**.
- **Public Users (Seekers / Non-Muslims):**
  - Any subsequent registration at `/register` creates a standard Seeker account.

---

## 4. Terminal Commands (NPM Scripts)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local dev server at `http://localhost:3000` |
| `npm run build` | Builds optimized Next.js production bundle |
| `npm start` | Starts production server from build artifacts |
| `npm test` | Runs the full automated test suite (592 Vitest tests) |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run typecheck` | Runs TypeScript static type validation (`tsc --noEmit`) |

---

## 5. Environment Configuration (`.env.local`)

Configure these variables in `.env.local` (or Railway Variables in production):
```env
# Transactional Email (Resend)
RESEND_API_KEY=<RESEND_API_KEY>
RESEND_FROM=Al Hiwar Platform <onboarding@resend.dev>

# Public Production URL (for password reset links & certificate QR codes)
APP_BASE_URL=https://<YOUR_RAILWAY_DOMAIN>.up.railway.app
NEXT_PUBLIC_APP_URL=https://<YOUR_RAILWAY_DOMAIN>.up.railway.app

# Session Token Security Key (HMAC-SHA256)
SESSION_SECRET=<SESSION_SECRET>
```

---

## 6. Directory Structure

```
Al-Hiwar Clean/
├── .env.local             # Resend API credentials & HMAC session secret
├── .gitignore             # Git ignore patterns
├── README.md              # Project documentation and operational guide
├── docs/                  # Official Project Documentation & Architecture Models
│   ├── AL HIWAR DIGITAL DAAWAH PLATFORM.pdf                 # Comprehensive Platform Specification
│   ├── al-hiwar-digital-da-wah-platform-v3.se-project.json  # Software Engineering Architecture Model (v3)
│   └── diagramsOfAlHiwar (1).docx                          # Architecture & Flow Diagrams Document
├── node_modules/          # Installed dependencies
├── public/                # Static assets, Shahadah audio samples, and brand marks
├── src/
│   ├── app/               # Next.js App Router (Pages, Layouts, & API Routes)
│   ├── components/        # UI components (Chat, Audio recorder, Modals)
│   └── lib/               # Database adapter, RBAC, Services, and PDF engine
├── tests/                 # 29 test suites (592 tests in Vitest)
├── package.json           # Dependencies and run scripts
├── tailwind.config.ts     # Styling tokens and color palette
└── tsconfig.json          # TypeScript compiler configuration
```

---

## 7. Project Documentation & Specifications

The `docs/` directory holds the official specifications, diagrams, and model files:

- **Platform Specification Document (PDF):**
  [`docs/AL HIWAR DIGITAL DAAWAH PLATFORM.pdf`](docs/AL%20HIWAR%20DIGITAL%20DAAWAH%20PLATFORM.pdf)
  Complete functional specification, institutional framework, and operational rules.

- **Architecture & System Flow Diagrams (DOCX):**
  [`docs/diagramsOfAlHiwar (1).docx`](docs/diagramsOfAlHiwar%20(1).docx)
  Detailed sequence diagrams, architectural schemas, and workflow mappings.

- **Software Engineering Model Project (SE-Project JSON):**
  [`docs/al-hiwar-digital-da-wah-platform-v3.se-project.json`](docs/al-hiwar-digital-da-wah-platform-v3.se-project.json)
  Complete UML package structures, entity diagrams, and relational model (v3).
