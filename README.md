# Performance and Resource Analysis of React and Svelte

> Bachelor's thesis — Jonas Öhler, Medieninformatik (B.Sc.)  
> Hochschule der Medien Stuttgart  
> Supervisors: Prof. Dr. Simon Wiest · Prof. Dr. Tobias Jordine  
> Submission: 20 July 2026

This repository contains the benchmark implementation and the LaTeX source of the thesis
**"Performance- und Ressourcenanalyse von React und Svelte bei steigender UI-Dichte und
Update-Frequenz"**.

The study measures Interaction to Next Paint (INP), scripting cost, heap memory usage,
and long-task frequency across a matrix of 8 UI-density levels × 4 update frequencies × 2 frameworks,
with 10 repetitions per scenario and 3 measurement suites (1 920 Playwright runs in total).

## Repository Structure

```
.
├── Thesis/           # LaTeX source files (abschlussarbeit.tex is the root document)
└── Benchmark/        # npm workspace — all benchmark code
    ├── react-app/    # React 19 benchmark app (Vite, port 4173)
    ├── svelte-app/   # Svelte 5 benchmark app (Vite, port 4174)
    ├── shared-logic/ # Shared TypeScript: MockEngine, grid scenarios
    └── playwright/   # Test runner, result storage, and analysis scripts
```

## Test Environment

Results reported in the thesis were produced on the following hardware and software configuration. Performance numbers are hardware-dependent and will differ on other machines.

**Hardware**

| Component | Specification |
|-----------|---------------|
| CPU | Intel Core i9-9900K (8 cores / 16 threads, 5.0 GHz single-core boost, 4.7 GHz all-core boost) |
| RAM | 64 GB DDR4-3200 |
| GPU | Intel UHD Graphics 630 (integrated) |
| OS | Windows 11 Education |

**Software**

| Component | Version |
|-----------|---------|
| React | 19.2.6 |
| Svelte | 5.55.7 |
| Vite | 8.0.13 |
| Node.js | 24 |
| Playwright | 1.52.0 |
| Chromium | bundled with Playwright 1.52.0 |
| `babel-plugin-react-compiler` | 1.0.0 |
| `@vitejs/plugin-react` | 6.0.2 |
| `@sveltejs/vite-plugin-svelte` | 7.1.2 |

## Prerequisites

- **Node.js** ≥ 24
- **Python** ≥ 3.11 with `pip` (for analysis only)

## Running the Benchmark

> **Note:** The full suite takes approximately 7–8 hours.

```bash
# 1. Install dependencies (Chromium is installed automatically via postinstall)
cd Benchmark
npm ci

# 2. Build shared logic, then both apps
npm --workspace @benchmark/shared-logic run build
npm --workspace react-app run build
npm --workspace svelte-app run build

# 3. Serve both apps, then run the full suite
npm --workspace react-app run preview &
npm --workspace svelte-app run preview &
cd playwright && npm run bench:all
```

Results and the aggregated `summary.csv` are written to `Benchmark/playwright/results/<date>/`.

## Analysing Results

```bash
# From the repository root:
cd Benchmark/playwright/analysis

python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Generate all thesis figures (replace <date> with the run date, e.g. 2026-06-25)
python generate_figures.py ../results/<date>/summary.csv ../results/figures/<date>
```

Figures are written to `Benchmark/playwright/results/figures/<date>/`.

To explore the data interactively instead:

```bash
jupyter notebook benchmark_analysis.ipynb
```

## Thesis

LaTeX source root: `Thesis/abschlussarbeit.tex`  
Pre-built PDF: `Thesis/abschlussarbeit.pdf`

## License

Copyright © 2026 Jonas Öhler <br>

This program and the accompanying materials are made available under the
terms of the Eclipse Public License 2.0 which is available at
http://www.eclipse.org/legal/epl-2.0.
