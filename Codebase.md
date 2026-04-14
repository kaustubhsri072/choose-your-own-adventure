# Codebase Notes

## Purpose

This workspace extracts text from the scanned PDF of The Cave of Time, builds a story graph from the extracted pages, writes all possible bounded story paths, and renders the graph as SVG.

## Canonical Source Of Truth

The canonical extracted page set is:
- output/cot-pages-ocr-v2

Do not use the older cot-pages extraction workflow. It had bad OCR and was removed.

## Important PDF Mapping

The scan is a two-page spread layout.

Story start mapping:
- PDF page 8 contains story page 2 on the left and story page 3 on the right
- PDF page 9 contains story page 4 on the left and story page 5 on the right

The story begins on story page 2 with:
- "You've hiked through Snake Canyon once before ..."

Do not confuse story page numbers with PDF page numbers.

## Current Scripts

Canonical scripts in scripts/:
- reextract_cot_ocr_split.py
- build_story_graph.py
- write_all_stories.py
- render_story_graph_svg.py

Superseded scripts were deleted:
- extract_cot.py
- reextract_cot_spreads.py

## What Each Script Does

### reextract_cot_ocr_split.py

Re-extracts story pages from the PDF using OCR on left/right halves of each PDF spread page.

Typical command:

```bash
python3 scripts/reextract_cot_ocr_split.py \
  --pdf samples/the-cave-of-time.pdf \
  --pdf-start-page 8 \
  --pdf-end-page 66 \
  --story-start-page 2 \
  --output-dir output/cot-pages-ocr-v2
```

### build_story_graph.py

Builds Mermaid graph output from the corrected OCR page files.

Typical command:

```bash
python3 scripts/build_story_graph.py \
  --pages-dir output/cot-pages-ocr-v2 \
  --output output/cot-story-graph.mmd
```

Notes:
- Reads explicit "turn to page X" choices from page text.
- Adds sequential continuation edges for pages that continue onto the next numbered page before any explicit choice appears.

### write_all_stories.py

Writes all possible bounded stories from the graph.

Typical command:

```bash
python3 scripts/write_all_stories.py \
  --graph output/cot-story-graph.mmd \
  --pages-dir output/cot-pages-ocr-v2 \
  --start-page 2 \
  --max-decisions 20 \
  --output-dir output/cot-stories
```

Important behavior:
- Starts from story page 2
- Stops on cycles
- Stops if decision points exceed 20
- Clears old story-*.txt files in the target output directory before writing new ones

### render_story_graph_svg.py

Renders the Mermaid graph to SVG without external layout tools.

Typical command:

```bash
python3 scripts/render_story_graph_svg.py \
  --graph output/cot-story-graph.mmd \
  --output output/cot-story-graph.svg
```

Current visual behavior:
- Uses a layered Sugiyama-style layout with iterative barycenter ordering
- Colors terminal pages differently
- Highlights the main trunk from page 2

## Current Canonical Outputs

Keep these:
- output/cot-pages-ocr-v2
- output/cot-story-graph.mmd
- output/cot-story-graph.svg
- output/cot-stories

These older directories were deleted because they were exploratory or obsolete:
- output/cot-pages
- output/cot-pages-reextract
- output/cot-stories-from-page-02
- output/cot-stories-start10
- output/tmp

## Current Known State

At the end of this session:
- The corrected OCR v2 extraction produced story pages in output/cot-pages-ocr-v2
- The graph was rebuilt from OCR v2 pages and saved to output/cot-story-graph.mmd
- The bounded story writer generated 45 stories into output/cot-stories
- The graph SVG was rendered to output/cot-story-graph.svg

## Caveats

OCR is improved but not perfect.
- Some pages still have minor OCR noise
- Page continuations across spreads are important; graph construction relies on sequential edges when no explicit choice appears
- Story page numbers, not PDF page numbers, control graph edges and story traversal

## Next-Time Guidance

When resuming work:
1. Read this file first.
2. Treat output/cot-pages-ocr-v2 as the current source text.
3. If extraction quality needs improvement, update reextract_cot_ocr_split.py rather than rebuilding older workflows.
4. If graph or story outputs need regeneration, rerun build_story_graph.py, write_all_stories.py, and render_story_graph_svg.py in that order.

## Architecture Summary (Current)

The current repository is a content-processing pipeline, not yet a full web application.

Pipeline stages:
1. OCR extraction from spread-scanned PDF into per-page text files.
2. Story graph construction from extracted page text.
3. Bounded path expansion into complete story files.
4. Graph rendering into SVG for visualization.

Data flow:
- Input: `samples/the-cave-of-time.pdf`
- Intermediate canonical text: `output/cot-pages-ocr-v2/*.txt`
- Graph model: `output/cot-story-graph.mmd`
- Story variants: `output/cot-stories/story-*.txt` and `output/cot-stories/manifest.json`
- Visual artifact: `output/cot-story-graph.svg`

## Approach Taken So Far

- Corrected initial OCR approach after discovering that the scan is spread-based, where one PDF page contains two story pages.
- Standardized on story page numbers as traversal truth.
- Added bounded traversal controls to prevent infinite loop behavior:
  - cycle detection
  - maximum decision-point cutoff
- Added visualization improvements to make the graph easier to inspect:
  - layered layout
  - terminal node highlighting
  - main trunk highlighting from page 2

## Planned Architecture (Web Authoring + Reader)

Target capability: a web-based tool with authoring mode and reader mode.

Recommended phases:
1. Reader MVP
   - Load a normalized story graph JSON.
   - Render current page text and next choices.
   - Track and display path history.
2. Graph Explorer
   - Visualize nodes/edges.
   - Highlight active traversal path and terminal nodes.
3. Authoring MVP
   - Add/edit/delete nodes.
   - Add/edit/delete choices.
   - Validate missing targets, unreachable nodes, and suspicious cycles.
4. Packaging + Deployment
   - Publish as a public web app.
   - Keep source and deployment process reproducible from repo.

Proposed data model for app use:
- `story.json`
  - `nodes`: `{ id, title?, text, tags? }`
  - `choices`: `{ from, to, label }`
  - `meta`: `{ startNode, version, source }`

## AI Session Protocol (Important)

For any future AI session in this repo:
1. Read `Codebase.md` first.
2. Read `AI-Instructions.md` second for instruction history constraints.
3. Verify canonical outputs and scripts before proposing new workflow changes.
4. Preserve historical trace files when planning major changes.

## Team Workflow Recommendation

- Each teammate works on separate feature branches and opens reviewable pull requests.
- Keep commits small and descriptive for contribution visibility.
- Verify team contribution coverage at:
  - `https://github.com/<GitHubUserName>/<ProjectName>/commits/main/`

## Web Layer (Implemented)

A browser-based interface now exists at the repository root entry page.

Primary files:
- `index.html`
- `web/styles.css`
- `web/app.js`

Implemented capabilities:
- Reader mode for branching traversal from page 2.
- Graph explorer with node/edge/terminal metrics and current-page adjacency.
- Validation checks:
  - missing page text
  - unreachable nodes from page 2
- Local authoring draft tools:
  - edit page text
  - add page
  - add choice
  - export local draft JSON

Draft behavior:
- Draft edits are stored in browser local storage.
- Draft edits do not overwrite repository source files.

## Runtime Data Sources Used by Web App

- Graph source: `output/cot-story-graph.mmd`
- Page text source: `output/cot-pages-ocr-v2/*.txt`
- Graph image preview: `output/cot-story-graph.svg`

The app parses Mermaid edges client-side and fetches page text files on demand.

## Deployment Automation

GitHub Pages workflow file:
- `.github/workflows/deploy-pages.yml`

Behavior:
- Triggered on push to `main` and manual dispatch.
- Publishes repository static content through GitHub Pages Actions.
