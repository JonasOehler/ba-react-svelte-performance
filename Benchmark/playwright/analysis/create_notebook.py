"""Generates analysis/benchmark_analysis.ipynb from code strings.
Run with: python analysis/create_notebook.py
"""
import nbformat as nbf

nb = nbf.v4.new_notebook()
nb.metadata = {
    "kernelspec": {
        "display_name": "Python 3 (ipykernel)",
        "language": "python",
        "name": "python3",
    },
    "language_info": {"name": "python", "version": "3.13.6"},
}

cells = []

# Title
cells.append(nbf.v4.new_markdown_cell(
    "# Benchmark-Analyse: React 19 vs. Svelte 5\n"
    "Hypothesen H1–H4 · Bachelorarbeit Jonas Öhler · 2026"
))

# Konfiguration 
cells.append(nbf.v4.new_markdown_cell("## Abschnitt 0 — Konfiguration"))
cells.append(nbf.v4.new_code_cell("""\
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import os

# Pfad zur summary.csv — nach neuem Benchmark-Run hier anpassen
DATA_PATH   = '../benchmark/results/2026-05-31/summary.csv'
FIGURES_DIR = 'figures'
os.makedirs(FIGURES_DIR, exist_ok=True)

COLOR_REACT  = '#5272A1'
COLOR_SVELTE = '#FFB200'
IQR_ALPHA    = 0.15
COLOR_WARN   = '#E87722'   # INP "Needs Improvement" Schwelle
COLOR_CRIT   = '#C0392B'   # INP "Poor" Schwelle / Frame-Budget

plt.rcParams.update({
    'font.family':      'Times New Roman',
    'font.serif':       ['Times New Roman'],
    'mathtext.fontset': 'stix',
    'font.size':        11,
    'axes.titlesize':   12,
    'axes.labelsize':   11,
    'legend.fontsize':  10,
    'figure.figsize':   (10, 6),
    'axes.grid':        True,
    'grid.alpha':       0.3,
    'lines.linewidth':  2.0,
    'lines.markersize': 7,
})

GRID_TICKS = [100, 400, 900, 1600, 4000, 10000]
"""))

# Daten laden
cells.append(nbf.v4.new_markdown_cell("## Abschnitt 1 — Daten laden & vorbereiten"))
cells.append(nbf.v4.new_code_cell("""\
df = pd.read_csv(DATA_PATH)
df['hz'] = (1000 / df['tickInterval']).round(0).astype(int)

react  = df[df['framework'] == 'react'].copy()
svelte = df[df['framework'] == 'svelte'].copy()

print(f"Szenarien geladen: {len(df)} Zeilen ({len(react)} React, {len(svelte)} Svelte)")
print(f"Grid-Größen : {sorted(df['gridSize'].unique())}")
print(f"Frequenzen  : {sorted(df['hz'].unique())} Hz")
df.head()
"""))

# H2 Scripting
cells.append(nbf.v4.new_markdown_cell(
    "## Abschnitt 2 — H2: Scripting-Overhead (CPU-Skalierung)\n"
    "Referenzfrequenz: f = 10 Hz (tickInterval = 100 ms)"
))

cells.append(nbf.v4.new_code_cell("""\
fig, ax = plt.subplots()

for data, color, label in [
    (react,  COLOR_REACT,  'React 19'),
    (svelte, COLOR_SVELTE, 'Svelte 5'),
]:
    sub = data[data['tickInterval'] == 100].sort_values('gridSize')
    med = sub['scriptingMsPerTick_median']
    iqr = sub['scriptingMsPerTick_iqr']
    ax.plot(sub['gridSize'], med, color=color, marker='o', label=label)
    ax.fill_between(sub['gridSize'],
                    np.maximum(0, med - iqr / 2),
                    med + iqr / 2,
                    color=color, alpha=IQR_ALPHA)

ax.set_xscale('log')
ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
ax.set_xticks(GRID_TICKS)
ax.set_xlabel('Grid-Größe n')
ax.set_ylabel('Scripting-Zeit / Tick (ms, Median ± IQR/2)')
ax.set_title('H2: Scripting-Overhead bei f = 10 Hz')
ax.legend()
fig_h2_scripting = fig
plt.show()
"""))

cells.append(nbf.v4.new_code_cell("""\
fig, ax = plt.subplots()

r = react[react['tickInterval'] == 100].sort_values('gridSize').set_index('gridSize')
s = svelte[svelte['tickInterval'] == 100].sort_values('gridSize').set_index('gridSize')
ratio = r['scriptingMsPerTick_median'] / s['scriptingMsPerTick_median']

ax.plot(ratio.index, ratio.values, color=COLOR_REACT, marker='o', label='Verhältnis React / Svelte')
ax.axhline(y=1, color='gray', linestyle='--', linewidth=1, label='Parität (1×)')
ax.set_xscale('log')
ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
ax.set_xticks(GRID_TICKS)
ax.set_xlabel('Grid-Größe n')
ax.set_ylabel('Scripting-Zeit React / Svelte')
ax.set_title('H2: Wachstum des Scripting-Overheads relativ zu Svelte')
ax.legend()
fig_h2_ratio = fig
plt.show()
"""))

# H3 Memory
cells.append(nbf.v4.new_markdown_cell(
    "## Abschnitt 3 — H3: Speichereffizienz\n"
    "JS-Heap-Delta nach erzwungener GC, Referenzfrequenz: f = 10 Hz"
))

cells.append(nbf.v4.new_code_cell("""\
fig, ax = plt.subplots()

for data, color, label in [
    (react,  COLOR_REACT,  'React 19'),
    (svelte, COLOR_SVELTE, 'Svelte 5'),
]:
    sub = data[data['tickInterval'] == 100].sort_values('gridSize')
    ax.plot(sub['gridSize'], sub['heapDelta_median_bytes'] / 1024,
            color=color, marker='o', label=label)

ax.set_xscale('log')
ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
ax.set_xticks(GRID_TICKS)
ax.set_xlabel('Grid-Größe n')
ax.set_ylabel('JS-Heap-Delta (kB, Median)')
ax.set_title('H3: Speicherverbrauch nach GC bei f = 10 Hz')
ax.legend()
fig_h3_memory = fig
plt.show()
"""))

cells.append(nbf.v4.new_code_cell("""\
fig, ax = plt.subplots()

r = react[react['tickInterval'] == 100].sort_values('gridSize').set_index('gridSize')
s = svelte[svelte['tickInterval'] == 100].sort_values('gridSize').set_index('gridSize')
mem_ratio = r['heapDelta_median_bytes'] / s['heapDelta_median_bytes']

ax.plot(mem_ratio.index, mem_ratio.values, color=COLOR_REACT, marker='o',
        label='Verhältnis React / Svelte')
ax.axhline(y=1, color='gray', linestyle='--', linewidth=1, label='Parität (1×)')
ax.set_xscale('log')
ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
ax.set_xticks(GRID_TICKS)
ax.set_xlabel('Grid-Größe n')
ax.set_ylabel('Heap-Delta React / Svelte')
ax.set_title('H3: React-Speicher-Overhead relativ zu Svelte (3× bis 6×)')
ax.legend()
fig_h3_ratio = fig
plt.show()
"""))

# H1 INP
cells.append(nbf.v4.new_markdown_cell(
    "## Abschnitt 4 — H1: Interaktionslatenz (INP)\n"
    "Vergleich bei f = 63 Hz (tickInterval 16 ms) und f = 10 Hz (tickInterval 100 ms)"
))

cells.append(nbf.v4.new_code_cell("""\
from matplotlib.lines import Line2D

fig, ax = plt.subplots()

FREQ_STYLES = [(16, '-'), (100, '--')]

for data, color in [(react, COLOR_REACT), (svelte, COLOR_SVELTE)]:
    for interval, ls in FREQ_STYLES:
        sub = data[data['tickInterval'] == interval].sort_values('gridSize')
        ax.plot(sub['gridSize'], sub['inp'], color=color, linestyle=ls, marker='o')

ax.axhline(y=50,  color=COLOR_WARN, linestyle=':', linewidth=1.5)
ax.axhline(y=200, color=COLOR_CRIT, linestyle=':', linewidth=1.5)

legend_handles = [
    Line2D([0],[0], color=COLOR_REACT,  linewidth=2,   label='React 19'),
    Line2D([0],[0], color=COLOR_SVELTE, linewidth=2,   label='Svelte 5'),
    Line2D([0],[0], color='gray', linewidth=2, linestyle='-',  label='63 Hz (f = 16 ms)'),
    Line2D([0],[0], color='gray', linewidth=2, linestyle='--', label='10 Hz (f = 100 ms)'),
    Line2D([0],[0], color=COLOR_WARN, linewidth=1.5, linestyle=':', label='„Needs Improvement" (50 ms)'),
    Line2D([0],[0], color=COLOR_CRIT, linewidth=1.5, linestyle=':', label='„Poor" (200 ms)'),
]
ax.legend(handles=legend_handles, fontsize=9, ncol=2, handlelength=3)

ax.set_xscale('log')
ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
ax.set_xticks(GRID_TICKS)
ax.set_xlabel('Grid-Größe n')
ax.set_ylabel('INP (ms)')
ax.set_title('H1: Interaktionslatenz (INP) bei 63 Hz und 10 Hz')
fig_h1_inp = fig
plt.show()
"""))

# H4 Tipping Point
cells.append(nbf.v4.new_markdown_cell(
    "## Abschnitt 5 — H4: Tipping Point\n"
    "Frame-Budget-Auslastung und Long Tasks als Operationalisierung des Tipping Points"
))

cells.append(nbf.v4.new_code_cell("""\
fig, ax = plt.subplots()

for data, color, label in [
    (react,  COLOR_REACT,  'React 19'),
    (svelte, COLOR_SVELTE, 'Svelte 5'),
]:
    sub = data[data['tickInterval'] == 50].sort_values('gridSize')
    total = sub['scriptingMsPerTick_median'] + sub['renderingMsPerTick_median']
    ax.plot(sub['gridSize'], total, color=color, marker='o', label=label)

ax.axhline(y=16.7, color=COLOR_CRIT, linestyle='--', linewidth=1.5,
           label='Frame-Budget (16,7 ms)')
ax.set_xscale('log')
ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
ax.set_xticks(GRID_TICKS)
ax.set_xlabel('Grid-Größe n')
ax.set_ylabel('Scripting + Rendering / Tick (ms, Median)')
ax.set_title('H4: Frame-Budget-Auslastung bei f = 20 Hz')
ax.legend()
fig_h4_frame = fig
plt.show()
"""))

cells.append(nbf.v4.new_code_cell("""\
if 'longTaskCount_median' in df.columns:
    fig, ax = plt.subplots()

    n10k = df[df['gridSize'] == 10000].sort_values('hz')
    for fw, color, label in [
        ('react',  COLOR_REACT,  'React 19'),
        ('svelte', COLOR_SVELTE, 'Svelte 5'),
    ]:
        sub = n10k[n10k['framework'] == fw]
        ax.plot(sub['hz'], sub['longTaskCount_median'],
                color=color, marker='o', label=label)

    ax.set_xlabel('Update-Frequenz (Hz)')
    ax.set_ylabel('Long Tasks / Repetition (Median, W3C > 50 ms)')
    ax.set_title('H4: Long Tasks bei n = 10.000 — Kreuzungspunkt')
    ax.legend()
    ax.set_xticks(sorted(n10k['hz'].unique()))
    fig_h4_longtasks = fig
    plt.show()
else:
    print("Hinweis: longTaskCount_median fehlt in den Daten.")
    print("Benchmark mit Long-Task-Messung ausführen und bench:summarize neu starten.")
    fig_h4_longtasks = None
"""))

# Export
cells.append(nbf.v4.new_markdown_cell(
    "## Abschnitt 6 — Export\n"
    "Alle Abbildungen als PDF nach `figures/` — direkt in LaTeX einbindbar."
))

cells.append(nbf.v4.new_code_cell("""\
for _name in ['fig_h2_scripting','fig_h2_ratio','fig_h3_memory',
              'fig_h3_ratio','fig_h1_inp','fig_h4_frame','fig_h4_longtasks']:
    if _name not in dir():
        globals()[_name] = None

EXPORT = {
    'h2_scripting.pdf':       fig_h2_scripting,
    'h2_scripting_ratio.pdf': fig_h2_ratio,
    'h3_memory.pdf':          fig_h3_memory,
    'h3_memory_ratio.pdf':    fig_h3_ratio,
    'h1_inp.pdf':             fig_h1_inp,
    'h4_frame_budget.pdf':    fig_h4_frame,
    'h4_long_tasks.pdf':      fig_h4_longtasks,
}

for filename, fig in EXPORT.items():
    if fig is not None:
        path = os.path.join(FIGURES_DIR, filename)
        fig.savefig(path, dpi=300, bbox_inches='tight')
        print(f"Gespeichert : {path}")
    else:
        print(f"Übersprungen: {filename} (keine Daten)")
"""))

# Assemble & write
nb.cells = cells

output_path = "analysis/benchmark_analysis.ipynb"
with open(output_path, "w", encoding="utf-8") as f:
    nbf.write(nb, f)

print(f"Notebook erstellt: {output_path}")
