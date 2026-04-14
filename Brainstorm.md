# Brainstorm

## Objective
Build a web-based "Choose Your Own Adventure" authoring and reading tool, starting from The Cave of Time extraction pipeline already in this repo.

## Constraints from assignment and project history
- Keep a visible creation trace (instructions and AI interactions).
- Preserve and use `Codebase.md` as the continuity document.
- Ensure all team members contribute commits to the same repository.
- Publish a public deployed site and include URLs in `README.md`.

## Exploratory Questions for AI (Planning Mode)
Use these prompts before implementation sessions.

1. What is the smallest useful MVP for a CYOA authoring tool using our current OCR + graph outputs?
2. Which data model should we standardize on for authored stories: graph JSON, markdown files with frontmatter, or relational schema?
3. How should authoring mode differ from reader mode in UX and route structure?
4. What is the safest strategy to prevent broken links and orphan story nodes while editing?
5. Should graph layout happen client-side (D3/ELK) or server-side during build?
6. What deployment option gives the fastest path to public hosting (GitHub Pages, Vercel, Netlify) with low maintenance?
7. How do we design team workflow so each person has independent, reviewable commits?
8. What tests are most important for story integrity (cycle handling, dead-end detection, missing page references)?

## Candidate Product Directions

### Direction A: Static-first Story Viewer
- Build a static site that reads generated outputs from `output/cot-stories` and `output/cot-story-graph.mmd`.
- Pros: fast to ship and easy to deploy.
- Cons: limited authoring capabilities.

### Direction B: Browser Authoring + Export
- Add a browser editor for nodes/choices with save/export to JSON.
- Include validation for duplicate page IDs, missing targets, and unreachable nodes.
- Pros: directly addresses authoring pain.
- Cons: larger implementation scope.

### Direction C: Hybrid MVP (Recommended)
- Phase 1: Story reader + interactive graph.
- Phase 2: Lightweight authoring operations (add node, add choice, edit text, validate).
- Phase 3: Import/export and versioned story snapshots.

## Proposed MVP Scope (Recommended)
- Story Reader View:
  - Start from a page/node.
  - Show text and choices.
  - Track visited path.
- Graph View:
  - Render nodes and edges.
  - Highlight current node/path.
  - Mark terminal and unfinished nodes.
- Authoring View:
  - Add/edit/delete nodes and choices.
  - Validate references.
  - Save project JSON.

## Suggested Tech Approach
- Frontend: React + TypeScript + Vite.
- Graph: Mermaid for quick rendering first, then optional D3 upgrade.
- Persistence (initial): JSON files in repo.
- Optional backend later: simple API for multi-author edits.

## Coordination Plan
- Shared rules:
  - Every task starts as an issue or ToDo item.
  - One branch per person per feature.
  - Small PRs with screenshots for UI changes.
  - Merge only after one teammate review.
- Contribution visibility:
  - Check commit attribution at:
    - `https://github.com/<GitHubUserName>/<ProjectName>/commits/main/`
- Minimum team contribution target:
  - Each member ships at least one feature commit and one review/fix commit.

## What "Good" Should Look Like
- Author can quickly add branches without losing track.
- Reader can traverse a polished storyline on web and mobile.
- Graph clearly reveals dead ends, merges, and incomplete nodes.
- Repo history clearly shows all team members contributed.
- README has valid deployment and repository URLs.

## Decision Log Template
Copy this section for each major design decision.

- Date:
- Decision:
- Options considered:
- Why chosen:
- Tradeoffs:
- Follow-up tasks:
