# Hostlink

**Where teams host their work** — A focused project tracker for small teams, built for hackathon PS 09.

Hostlink sits between scattered chat threads and heavyweight tools like Jira, giving teams enough structure to stay aligned without the complexity of enterprise project management software.

## Problem Statement

Small teams need clarity on who's doing what, when things are due, and what's ready to ship — but most tools either bury you in features you'll never use or leave you stitching updates together from Slack threads. Hostlink gives teams a shared workspace that's light enough to use daily and clear enough to trust.

## Features

**Implemented:**

- **Projects & Tasks** — Full CRUD for projects and tasks with ownership, priorities, and due dates
- **Kanban Board** — Drag-and-drop workflow across Backlog → In Progress → Review → Done with validated state transitions
- **List View** — Sortable, filterable task table with search and pagination
- **Task Details** — Right-side drawer with full task editing, comment threads, and activity history
- **Comments** — Threaded discussions on every task
- **Overdue Tracking** — Visual flags and counts for tasks past their due date
- **Analytics** — Per-project completion percentage, burndown chart, workload distribution, and overdue list (updates live as tasks move)
- **My Tasks** — Personal view grouping your assigned tasks by Overdue / Today / This Week / Later / Completed
- **Workspace Analytics** — Aggregate stats across all projects
- **Team Directory** — View all team members
- **Settings** — Dark mode toggle and user preferences
- **Demo Mode** — Switch between demo users without authentication
- **Mobile Responsive** — Full functionality on 360-414px viewports
- **Animations** — Polished transitions and micro-interactions via Framer Motion

## Tech Stack

### Frontend

- **Framework**: Next.js 16.3.3 (App Router, React 19)
- **Language**: TypeScript 5.7.3
- **Styling**: Tailwind CSS 4.3.3
- **UI Components**: shadcn/ui (built on Base UI)
- **Drag & Drop**: dnd-kit 6.3.1 + @dnd-kit/sortable 10.0.0
- **Charts**: Recharts 3.8.0
- **Animations**: Framer Motion 13.4.4
- **State Management**: Zustand 5.0.15
- **Date Handling**: date-fns 4.4.0
- **Icons**: Lucide React 1.16.0
- **Notifications**: Sonner 2.0.8

### Backend

- **Database**: SQLite (via Prisma, production-ready for Postgres)
- **ORM**: Prisma 5.22.0 + @prisma/client 5.22.0
- **API**: Next.js API Routes (Route Handlers)
- **Runtime**: Node.js with tsx 4.23.15 for scripts

### Development

- **Package Manager**: pnpm 12.3.4
- **Build Tool**: Turbopack (Next.js 16)
- **Testing**: Node.js built-in test runner
- **Analytics**: Vercel Analytics 1.6.1

## Folder Structure

```
hostlink/
├── app/                      # Next.js App Router pages and API routes
│   ├── (app)/               # Main app layout group
│   │   ├── [section]/       # Dynamic routes for /my-tasks, /analytics, /team, /settings
│   │   └── projects/        # Project routes
│   │       ├── [id]/        # Project detail with [[...view]] catch-all for /board, /list, /analytics
│   │       └── page.tsx     # Projects home
│   ├── api/                 # API Route Handlers
│   │   ├── users/          # GET /api/users
│   │   ├── projects/       # CRUD for projects
│   │   │   └── [id]/       # Project detail, tasks, analytics
│   │   ├── tasks/          # Task CRUD, move, comments
│   │   ├── comments/       # Comment deletion
│   │   └── my-tasks/       # Personal task list
│   ├── login/              # Demo login page
│   ├── page.tsx            # Marketing landing page
│   └── layout.tsx          # Root layout
├── components/              # React components
│   ├── analytics/          # Chart components (burndown, completion ring, workload)
│   ├── board/              # Kanban board, columns, task cards, quick-add
│   ├── landing/            # Marketing page, login page, product preview
│   ├── layout/             # App shell, sidebar, topbar, breadcrumbs, search
│   ├── list/               # Task table, status dropdown, filters
│   ├── projects/           # Project list, cards, new project modal
│   ├── task/               # Task drawer, modal, fields, activity feed, toolbar
│   ├── ui/                 # Base UI components (button, dialog, badge, etc.)
│   └── workspace/          # My Tasks, Team, Settings, Workspace Analytics
├── lib/                    # Utilities and business logic
│   ├── api.ts             # API client functions (calls backend routes)
│   ├── db.ts              # Prisma client singleton
│   ├── hooks.ts           # React hooks (useSWR wrappers)
│   ├── seed.ts            # Database seed script
│   ├── store.ts           # Zustand state (UI state only, domain data from API)
│   ├── types.ts           # TypeScript types
│   ├── utils.ts           # Utility functions (transitions, analytics, sorting)
│   └── *.test.ts          # Test files
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                 # Static assets
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Data Model / Schema

The database uses Prisma ORM with the following tables:

### User
- `id` (String, primary key)
- `name` (String)
- `email` (String, unique)
- `role` (String) — e.g. "Team Lead", "Developer", "Designer"
- `color` (String) — for avatar theming
- `createdAt` (DateTime)

### Project
- `id` (String, primary key)
- `name` (String)
- `description` (String, optional)
- `color` (String) — for project card/icon
- `createdAt` (DateTime)
- `updatedAt` (DateTime, optional)
- **Relations**: `members` (ProjectMember[]), `tasks` (Task[]), `taskEvents` (TaskEvent[])

### ProjectMember (join table)
- `id` (String, primary key, auto-generated UUID)
- `projectId` (String, foreign key)
- `userId` (String, foreign key)
- Unique constraint on `(projectId, userId)`

### Task
- `id` (String, primary key)
- `key` (String, unique) — e.g. "HL-12"
- `projectId` (String, foreign key)
- `title` (String)
- `description` (String, optional)
- `assigneeId` (String, foreign key → User)
- `priority` (String) — "urgent" | "high" | "normal"
- `status` (String) — "backlog" | "in_progress" | "review" | "done"
- `dueDate` (String) — ISO date format (yyyy-MM-dd)
- `createdAt` (DateTime)
- `movedAt` (DateTime) — last status change
- `completedAt` (DateTime, optional) — set when status becomes "done"
- **Relations**: `comments` (Comment[]), `events` (TaskEvent[])
- **Indexes**: `(projectId, status)`, `assigneeId`

### Comment
- `id` (String, primary key)
- `taskId` (String, foreign key)
- `authorId` (String, foreign key → User)
- `body` (String)
- `createdAt` (DateTime)
- **Index**: `taskId`

### TaskEvent
- `id` (String, primary key)
- `taskId` (String, foreign key)
- `projectId` (String, foreign key)
- `userId` (String, foreign key → User)
- `fromStatus` (String, optional) — null for task creation
- `toStatus` (String)
- `createdAt` (DateTime)
- **Indexes**: `(projectId, createdAt)`, `taskId`

**Cascading Deletes**: Deleting a project cascades to its tasks, comments, project members, and task events. Deleting a task cascades to its comments and events.

## API Routes

All routes return JSON. Errors return `{ error: string }` with appropriate HTTP status codes.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/projects` | List projects with computed stats (task count, completion %, overdue count) |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project (name, description, color, members) |
| DELETE | `/api/projects/:id` | Delete project (cascades) |
| GET | `/api/projects/:id/tasks` | List tasks for a project (supports ?q=, ?assignee=, ?priority=, ?status= filters) |
| POST | `/api/projects/:id/tasks` | Create a task in a project |
| GET | `/api/projects/:id/analytics` | Per-project analytics (completion %, burndown, workload, overdue) |
| GET | `/api/tasks/:id` | Get task details with comments and events |
| PATCH | `/api/tasks/:id` | Update task fields (title, description, assignee, priority, due date) |
| DELETE | `/api/tasks/:id` | Delete task (cascades) |
| POST | `/api/tasks/:id/move` | **Move task to new status** — validates transition, updates status, stamps timestamps, creates TaskEvent. Returns 422 with `{ error, allowed: [...] }` on invalid transitions. |
| GET | `/api/tasks/:id/comments` | List comments for a task |
| POST | `/api/tasks/:id/comments` | Add a comment to a task |
| DELETE | `/api/comments/:id` | Delete a comment |
| GET | `/api/my-tasks?userId=` | Tasks assigned to a user across all projects |

### Transition Validation Logic

Enforced server-side in `/api/tasks/:id/move`:

| From Status | Allowed To |
|---|---|
| Backlog | In Progress |
| In Progress | Backlog, Review |
| Review | In Progress, Done |
| Done | Review (reopen) |

Invalid transitions return HTTP 422 with `{ error: string, allowed: Status[] }`.

## Getting Started / Setup Instructions

### Prerequisites

- Node.js 18+ (tested on Node 20+)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd hostlink

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
# Create a .env file in the project root (see Environment Variables section below)

# Initialize the database
npx prisma db push

# Seed the database with demo data
npx tsx lib/seed.ts

# Run the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Purpose | Example Value |
|---|---|---|
| `DATABASE_URL` | Prisma database connection string | `file:./dev.db` (SQLite) or `postgresql://...` (Postgres) |

**For SQLite (default, local development):**
```bash
DATABASE_URL="file:./dev.db"
```

**For Postgres (production):**
```bash
DATABASE_URL="postgresql://user:password@host:5432/hostlink?schema=public"
```

**Note**: The schema in `prisma/schema.prisma` supports both SQLite (`provider = "sqlite"`) and PostgreSQL. For production deployment, change the provider to `"postgresql"` and update `DATABASE_URL`.

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start the Next.js development server (Turbopack) on port 3000 |
| `build` | `npm run build` | Build the production bundle |
| `start` | `npm run start` | Start the production server |
| `test` | `npm run test` | Run the test suite (via `tsx --test`) |
| `typecheck` | `npm run typecheck` | Run TypeScript type checking without emitting files |
| **Prisma** | | |
| `prisma db push` | `npx prisma db push` | Push the Prisma schema to the database (creates/updates tables) |
| `prisma generate` | `npx prisma generate` | Generate the Prisma Client |
| `prisma studio` | `npx prisma studio` | Open Prisma Studio to browse and edit database data |
| **Seed** | | |
| `seed` | `npx tsx lib/seed.ts` | Populate the database with demo users, projects, and tasks |

## Testing

The project includes 62+ tests written for the original in-memory mock API. After the backend migration, tests may require updates to work with real API routes and database state.

**Run tests:**
```bash
npm run test
```

**Test coverage includes:**
- Analytics computations (burndown, workload, completion %)
- Board drag-and-drop logic and transition validation
- List view filtering and sorting
- Project and task CRUD operations
- Personal task grouping (My Tasks)
- Workspace-level analytics

**Note**: Tests currently expect the in-memory mock API. Adapting them to test the real database layer is recommended for production readiness.

## Deployment

### Deploy to Vercel

Hostlink is optimized for deployment on Vercel (Next.js's native platform):

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import the project on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository

3. **Set environment variables** in the Vercel dashboard:
   - For SQLite (not recommended for production): `DATABASE_URL="file:./dev.db"`
   - For Postgres (recommended): set up a hosted Postgres database (e.g., Vercel Postgres, Neon, Supabase, Railway) and set `DATABASE_URL` to the connection string

4. **Update `prisma/schema.prisma`** for Postgres:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

5. **Add a build command** (if not auto-detected):
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install` (or `pnpm install` if using pnpm)

6. **Deploy**
   - Vercel will build and deploy automatically on every push to your main branch
   - After the first deploy, run the seed script manually via Vercel CLI or a one-time serverless function to populate the database

### Database Options for Production

- **Vercel Postgres**: Integrated with Vercel projects, generous free tier
- **Neon**: Serverless Postgres with autoscaling and branching
- **Supabase**: Open-source Firebase alternative with Postgres + realtime
- **Railway**: Simple Postgres hosting with straightforward pricing

### Post-Deployment Setup

After deploying, seed the database:

**Option 1: Via Vercel CLI**
```bash
vercel env pull .env.local
npx tsx lib/seed.ts
```

**Option 2: Create a one-time seed API route**
```typescript
// app/api/seed/route.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  // Add authentication/secret check here
  const { secret } = await request.json()
  if (secret !== process.env.SEED_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await execAsync('npx tsx lib/seed.ts')
  return Response.json({ success: true })
}
```

Then call `POST /api/seed` once with your secret, then delete the route.

## Demo Credentials / Demo Flow

Hostlink includes a **"Continue as demo user"** flow — no authentication required, perfect for hackathon demonstrations or trying the app.

### Demo Users

The seeded database includes three users you can switch between:

1. **Asha Verma** (Team Lead) — `u1`
2. **Rohan Mehta** (Developer) — `u2`
3. **Meera Nair** (Designer) — `u3`

All demo users are members of both projects and own various tasks.

### How to Demo

1. **Visit the app** at [http://localhost:3000](http://localhost:3000) (or your deployed URL)
2. **Click "Continue as demo user"** on the login page (or navigate directly to `/projects`)
3. **Explore the demo data**:
   - **Projects Home**: See 2 projects with completion stats and activity
   - **Kanban Board**: Open "Website Revamp" → view tasks in columns → drag a task from "Backlog" to "In Progress" (watch validation happen)
   - **Task Detail**: Click any task → view/edit fields, read comments, see activity history
   - **Add a Comment**: Open a task → scroll to comments → type and submit
   - **List View**: Switch to List view → filter by status/assignee/priority → sort by due date
   - **Analytics**: Click the Analytics tab → see completion %, burndown chart, workload distribution
   - **My Tasks**: Click "My Tasks" in the sidebar → see your assigned work grouped by timeline
   - **Switch Users**: Click your avatar (top-right) → switch to another demo user → see their task list
   - **Dark Mode**: Open Settings → toggle dark mode → watch the theme change instantly

### Suggested Demo Script (5 minutes)

1. **Landing page** (15s): Show the polished marketing page, scroll to features
2. **Projects Home** (30s): Overview of projects, completion stats, click into "Website Revamp"
3. **Kanban Board** (90s): 
   - Drag "Build login flow" from "In Progress" to "Review" → watch it move
   - Try dragging "Write API documentation" from "Backlog" directly to "Done" → watch validation block it
   - Click the "Build login flow" task card → drawer opens
4. **Task Detail** (60s): 
   - Show existing comments from the team
   - Add a new comment
   - Show the activity feed (status changes over time)
5. **Analytics** (45s): 
   - Click Analytics tab
   - Point out completion %, burndown trend, workload balance
6. **My Tasks** (30s): 
   - Click "My Tasks" → show personal view grouped by timeline
7. **Dark Mode** (15s): Toggle dark mode in Settings to show theme polish

## Known Limitations / Future Scope

### Intentionally Out of Scope (for hackathon demo)

- **No real authentication**: The app uses a demo user switcher instead of login/signup flows with passwords or OAuth
- **No email notifications**: Task assignments and @-mentions don't trigger emails
- **No file attachments**: Tasks and comments are text-only (no image/document uploads)
- **No time tracking**: No built-in timers or hour logging
- **No recurring tasks**: Each task is one-time only
- **No API rate limiting**: The API routes have no throttling or abuse protection
- **No audit log UI**: TaskEvents are stored but not exposed in a dedicated audit view
- **No permissions/roles**: All users can do everything (no admin vs. member distinction)
- **Single workspace**: No multi-tenancy or workspace switching

### Future Enhancements

- **Real authentication**: Clerk, NextAuth, or Supabase Auth
- **Notifications**: Email and in-app notifications for mentions, assignments, due dates
- **File uploads**: Attach images, PDFs, and documents to tasks
- **Activity feed**: Dedicated page showing recent updates across all projects
- **Search**: Global search across projects, tasks, and comments
- **Bulk actions**: Select multiple tasks and move/assign/delete in one action
- **Templates**: Project and task templates for common workflows
- **Integrations**: GitHub issues, Slack notifications, Google Calendar sync
- **Custom fields**: Per-project custom fields beyond title/description/priority
- **Mobile app**: Native iOS/Android apps

---

**Built for Hackathon PS 09** | © 2026 Hostlink | Demo preview — No persistent storage beyond the database
