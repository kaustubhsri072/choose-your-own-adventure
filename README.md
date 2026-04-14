# choose-your-own-adventure

## Submission Info

- Deployed Website URL: `REPLACE_WITH_PUBLIC_DEPLOYMENT_URL`
- GitHub Repository URL: `https://github.com/pisan382/choose-your-own-adventure`
- Team Members:
	- `Krish Marpuri`
	- `Kaustubh Srikantapuram`

## Project Goal

Create a web-based authoring and reading workflow for Choose Your Own Adventure stories.

Current repository status:
- OCR and story extraction pipeline is implemented.
- Story graph generation is implemented.
- Bounded story-path expansion is implemented.
- SVG story graph rendering is implemented.
- Web reader + graph explorer + local authoring prototype is implemented.

## Web App (Implemented)

The project now includes a browser interface at the repository root page.

Implemented views and capabilities:
- Reader mode:
	- starts from page 2
	- follows branching choices from the graph
	- tracks the active path
- Graph explorer:
	- shows node/edge/terminal counts
	- shows outgoing links from the current page
	- runs basic integrity checks (missing text and unreachable nodes)
	- includes the generated SVG story-map snapshot
- Authoring mode (local draft):
	- edit current page text
	- add new pages
	- add new choices
	- export draft as JSON
	- persist draft in browser local storage

Key files:
- `index.html`
- `web/styles.css`
- `web/app.js`

## Run Locally

Use a local HTTP server (required for browser fetch calls):

```bash
python3 -m http.server 8000
```

Then open:
- `http://localhost:8000/`

## Deploy to GitHub Pages

The repository includes a GitHub Actions workflow for deployment:
- `.github/workflows/deploy-pages.yml`

Deployment steps:
1. Push to `main`.
2. In GitHub repo settings, enable Pages with source set to **GitHub Actions**.
3. Wait for the **Deploy GitHub Pages** workflow to finish.
4. Copy the published URL into the `Deployed Website URL` field above.

Expected Pages URL pattern:
- `https://<GitHubUserName>.github.io/<ProjectName>/`

## Team Contribution Requirement

All team members must contribute commits to the same repository.

Check contribution history at:
- `https://github.com/<GitHubUserName>/<ProjectName>/commits/main/`

## Read-First AI Workflow

For future AI sessions in this repository:
1. Read `Codebase.md` first.
2. Read `AI-Instructions.md` second.
3. Preserve instruction trace files and notes when planning major changes.

## Build Story Graph

Run:

```bash
python3 scripts/build_story_graph.py \
	--pages-dir output/cot-pages-ocr-v2 \
	--output output/cot-story-graph.mmd
```

Generated output:
- `output/cot-story-graph.mmd`: Mermaid graph of branching story transitions from the corrected OCR v2 page set.

## Generate All Story Variants

Run:

```bash
python3 scripts/write_all_stories.py
```

Generated outputs:
- `output/cot-stories/story-0001.txt` (and additional numbered files): one complete path per file.
- `output/cot-stories/manifest.json`: index of generated story files and page paths.

Optional flags:

```bash
python3 scripts/write_all_stories.py \
	--graph output/cot-story-graph.mmd \
	--pages-dir output/cot-pages-ocr-v2 \
	--output-dir output/cot-stories \
	--start-page 2 \
	--max-decisions 20
```

## Re-Extract From Spread-Scanned PDF

The book scan is a two-page spread layout. The story starts on the left side of PDF page 8:
- PDF page 8 -> story pages 2 and 3
- PDF page 9 -> story pages 4 and 5

Run:

```bash
python3 scripts/reextract_cot_ocr_split.py \
	--pdf samples/the-cave-of-time.pdf \
	--pdf-start-page 8 \
	--pdf-end-page 66 \
	--story-start-page 2 \
	--output-dir output/cot-pages-ocr-v2
```

Generated output:
- `output/cot-pages-ocr-v2/*.txt`: OCR re-extraction using left/right half-page splitting.