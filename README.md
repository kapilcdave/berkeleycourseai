# BearCourses 🐻

**Multi-agent UC Berkeley course selection intelligence.**  
Upload your degree progress PDF → 6 agents analyze Berkeley Time, RateMyProfessors, the course catalog, your live schedule, Reddit, and your exact major requirements → get a ranked list of the best classes to take.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│  InputPanel → AgentDashboard → ResultsView           │
└─────────────────┬───────────────────────────────────┘
                  │ Tiered parallel fetch
┌─────────────────▼───────────────────────────────────┐
│              VERCEL SERVERLESS FUNCTIONS             │
│                                                      │
│  TIER 0   /api/parse-pdf     PDF → structured data  │
│                                                      │
│  TIER 1   /api/requirements  Web search for reqs    │
│           /api/courses       classes.berkeley.edu    │
│                    ↓ intersect → candidate list      │
│  TIER 2   /api/berkeleytime  Grade distributions    │
│           /api/rmp           Professor ratings       │
│           /api/scheduler     Schedule conflicts      │
│           /api/reddit        r/berkeley signals      │
│                    ↓ score + rank                    │
│  TIER 3   client-side scoring & ranking              │
└─────────────────────────────────────────────────────┘
```

**Key efficiency principle**: Tier 2 enrichment agents only run on the filtered candidate list — courses that both (a) satisfy an unmet requirement and (b) are offered this semester. This can cut the search space from 5,000+ courses to 20–60.

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/bearcourses
cd bearcourses
npm run install:all
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
CALCENTRAL_SESSION_COOKIE=   # optional, for conflict checking
```

**Getting your Anthropic API key**: [console.anthropic.com](https://console.anthropic.com)

**Getting your CalCentral session cookie** (optional):
1. Log in to [calcentral.berkeley.edu](https://calcentral.berkeley.edu)
2. Open DevTools → Application tab → Cookies → calcentral.berkeley.edu
3. Copy the value of `_calcentral_session`
4. Paste into `.env.local`

### 3. Run locally

```bash
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)  
API: [http://localhost:3001](http://localhost:3001)

### 4. Get your degree progress PDF

1. Go to [calcentral.berkeley.edu](https://calcentral.berkeley.edu)
2. Navigate to **My Academics** → **Degree Progress**  
3. Click **Download as PDF**

---

## Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/bearcourses)

### Manual deploy

```bash
npm install -g vercel
vercel login
vercel
```

**Set environment variables in Vercel dashboard:**

```
Settings → Environment Variables:
  ANTHROPIC_API_KEY      = sk-ant-...
  CALCENTRAL_SESSION_COOKIE = (optional)
```

Or via CLI:
```bash
vercel env add ANTHROPIC_API_KEY
vercel env add CALCENTRAL_SESSION_COOKIE
vercel --prod
```

---

## How the Agents Work

### Agent 1 — PDF Parser (`/api/parse-pdf`)
Uses `pdf-parse` to extract raw text from your CalCentral degree progress PDF, then Claude parses it into structured JSON: completed courses, catalog year, unmet requirements by category.

### Agent 2 — Requirements Mapper (`/api/requirements`)
Claude with web search finds your exact major requirements from `guide.berkeley.edu` for your specific catalog year. Catalog year matters — requirements change between years and you're held to the rules of your entry year.

### Agent 3 — Course Catalog (`/api/courses`)
Fetches live course offerings from `classes.berkeley.edu` for the target semester. Includes time slots, instructors, units, and section numbers.

### Agent 4 — Berkeley Time (`/api/berkeleytime`)
Queries Berkeleytime's GraphQL API for grade distributions and average GPA per course. Only runs for the filtered candidate list.

### Agent 5 — RateMyProfessors (`/api/rmp`)
Queries RMP's public GraphQL API for professor ratings, difficulty scores, "would take again" %, and top student tags.

### Agent 6 — CalCentral Scheduler (`/api/scheduler`)
Uses your session cookie to fetch your current enrolled schedule, then checks each candidate course for time conflicts.

### Agent 7 — Reddit Signal (`/api/reddit`)
Claude with web search finds recent r/berkeley posts about each candidate course. Returns dated snippets (so you can judge staleness) with a low weight in the final score.

---

## Scoring Formula

```
Score = base(50)
      + gpa_signal     (0–30 pts)   Berkeley Time avg GPA
      + rmp_signal     (0–25 pts)   RateMyProfessors score
      + wta_signal     (0–15 pts)   "Would take again" %
      + double_bonus   (+10/req)    Each extra req satisfied
      + reddit_signal  (±5 pts)     Community sentiment
      - unit_penalty   (-1/unit off) Distance from target units
      = 0 if time conflict (hard filter)
```

Double-count opportunities get a significant bonus because they're the single most efficient way to make progress — one course doing two jobs.

---

## Privacy

- Your PDF is processed server-side and **never stored** — it's parsed in memory and discarded
- Your CalCentral session cookie is used only to check for schedule conflicts and is never logged
- No user data is retained between sessions

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Pure CSS with CSS variables |
| Animation | CSS animations |
| API | Vercel Serverless Functions (Node.js) |
| PDF Parsing | pdf-parse |
| AI / Orchestration | Anthropic Claude (claude-sonnet-4-20250514) |
| Web Search | Claude's built-in web_search tool |
| Course Data | classes.berkeley.edu + Berkeleytime GraphQL |
| Prof Data | RateMyProfessors GraphQL |
| Deployment | Vercel |

---

## Contributing

PRs welcome. Key areas for improvement:
- Smarter requirement matching (handle course substitution petitions)
- Historical enrollment data to predict seat availability
- Support for graduate programs and minors
- Better Reddit search (semester-specific queries)
- Cached requirement maps to reduce Claude API calls
