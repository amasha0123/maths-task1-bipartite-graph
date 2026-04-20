# Bipartite Graph Tool

This project provides two ways to analyze graphs for bipartiteness:
1. **Web Dashboard**: A modern, interactive web interface with real-time algorithm tracing and physics-based visualization.
2. **Python CLI**: A command-line tool for quick analysis and edge-case testing.

## Features
- **BFS Coloring Algorithm**: Efficiently determines if a graph can be split into two independent sets.
- **Visual Trace**: Watch the algorithm visit nodes and assign sets in real-time.
- **Bipartite Layout**: Automatically rearranges nodes into two distinct columns if the graph is bipartite.
- **Presets**: Quickly test Squares (Bipartite), Triangles (Non-Bipartite), Stars, and more.

## How to Run

### Web Application
Simply open `index.html` in any modern web browser.
- **Left Panel**: Enter edges in `Node1,Node2` format.
- **Center Canvas**: Interactive graph area (nodes are draggable).
- **Right Panel**: View the logic trace and final set assignments.

### Python Tool
Ensure you have the dependencies installed:
```bash
pip install networkx matplotlib
```
Run the script:
```bash
python main.py
```

## Algorithm Logic
The tool uses a **Breadth-First Search (BFS)** approach:
1. Start at an unvisited node and assign it to **Set A**.
2. Visit all neighbors and assign them to **Set B**.
3. Continue recursively/iteratively.
4. If a neighbor is already visited and has the *same* color as the current node, the graph is NOT bipartite.
