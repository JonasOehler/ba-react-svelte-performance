import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.lines import Line2D
import numpy as np
import os
import sys

_date       = __import__('datetime').date.today().isoformat()
DATA_PATH   = sys.argv[1] if len(sys.argv) > 1 else f'../results/{_date}/summary.csv'
FIGURES_DIR = sys.argv[2] if len(sys.argv) > 2 else f'../results/figures/{_date}'
os.makedirs(FIGURES_DIR, exist_ok=True)

COLOR_REACT  = '#5272A1'
COLOR_SVELTE = '#FFB200'
IQR_ALPHA    = 0.15
COLOR_WARN   = '#E87722'
COLOR_CRIT   = '#C0392B'

plt.rcParams.update({
    'font.family':      'serif',
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

# Load data
df = pd.read_csv(DATA_PATH)
df['hz'] = (1000 / df['tickInterval']).round(0).astype(int)

react  = df[df['framework'] == 'react'].copy()
svelte = df[df['framework'] == 'svelte'].copy()

print(f"Loaded {len(df)} rows ({len(react)} React, {len(svelte)} Svelte)")
print(f"Grid sizes : {sorted(df['gridSize'].unique())}")
print(f"Frequencies: {sorted(df['hz'].unique())} Hz")


# H2: Scripting overhead at f=10 Hz
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
fig.savefig(os.path.join(FIGURES_DIR, 'h2_scripting.pdf'), dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved h2_scripting.pdf")


# H2: Scripting ratio
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
fig.savefig(os.path.join(FIGURES_DIR, 'h2_scripting_ratio.pdf'), dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved h2_scripting_ratio.pdf")


# H3: Memory at f=10 Hz
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
fig.savefig(os.path.join(FIGURES_DIR, 'h3_memory.pdf'), dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved h3_memory.pdf")


# H3: Memory ratio
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
fig.savefig(os.path.join(FIGURES_DIR, 'h3_memory_ratio.pdf'), dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved h3_memory_ratio.pdf")


#  H1: INP
fig, ax = plt.subplots()
FREQ_STYLES = [(16, '-'), (100, '--')]
for data, color in [(react, COLOR_REACT), (svelte, COLOR_SVELTE)]:
    for interval, ls in FREQ_STYLES:
        sub = data[data['tickInterval'] == interval].sort_values('gridSize')
        ax.plot(sub['gridSize'], sub['inp'], color=color, linestyle=ls, marker='o')

ax.axhline(y=200, color=COLOR_WARN, linestyle=':', linewidth=1.5)
ax.set_ylim(0, 230)

legend_handles = [
    Line2D([0],[0], color=COLOR_REACT,  linewidth=2,   label='React 19'),
    Line2D([0],[0], color=COLOR_SVELTE, linewidth=2,   label='Svelte 5'),
    Line2D([0],[0], color='gray', linewidth=2, linestyle='-',  label='63 Hz (f = 16 ms)'),
    Line2D([0],[0], color='gray', linewidth=2, linestyle='--', label='10 Hz (f = 100 ms)'),
    Line2D([0],[0], color=COLOR_WARN, linewidth=1.5, linestyle=':', label='"Needs Improvement" (200 ms)'),
]
ax.legend(handles=legend_handles, fontsize=9, ncol=2, handlelength=3, loc='center left')
ax.set_xscale('log')
ax.xaxis.set_major_formatter(mticker.ScalarFormatter())
ax.set_xticks(GRID_TICKS)
ax.set_xlabel('Grid-Größe n')
ax.set_ylabel('INP (ms)')
ax.set_title('H1: Interaktionslatenz (INP) bei 63 Hz und 10 Hz')
fig.savefig(os.path.join(FIGURES_DIR, 'h1_inp.pdf'), dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved h1_inp.pdf")


# H4: Frame budget at f=20 Hz
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
fig.savefig(os.path.join(FIGURES_DIR, 'h4_frame_budget.pdf'), dpi=300, bbox_inches='tight')
plt.close(fig)
print("Saved h4_frame_budget.pdf")


# H4: Long tasks at n=10000
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
    fig.savefig(os.path.join(FIGURES_DIR, 'h4_long_tasks.pdf'), dpi=300, bbox_inches='tight')
    plt.close(fig)
    print("Saved h4_long_tasks.pdf")
else:
    print("Skipped h4_long_tasks.pdf (longTaskCount_median not in data)")

print(f"\nAll figures written to: {FIGURES_DIR}")
