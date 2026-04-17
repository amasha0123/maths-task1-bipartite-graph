# ADMC Group Assignment - Bipartite Graph Checker
# BFS 2-Coloring with Trace & OPTIONAL Visualization
# ============================================================

from collections import deque
import os

# Try to import visual libraries (will be used if available)
HAS_VISUALS = False
try:
    import networkx as nx
    import matplotlib.pyplot as plt
    HAS_VISUALS = True
except ImportError:
    pass

class Graph:
    def __init__(self, num_vertices=0):
        self.V = num_vertices
        self.adj = {}

    def add_edge(self, u, v):
        if u not in self.adj: self.adj[u] = []
        if v not in self.adj: self.adj[v] = []
        if v not in self.adj[u]: self.adj[u].append(v)
        if u not in self.adj[v]: self.adj[v].append(u)

def is_bipartite(graph):
    nodes = list(graph.adj.keys())
    color = {n: -1 for n in nodes}
    steps = []

    for start in nodes:
        if color[start] != -1: continue
        
        color[start] = 0
        queue = deque([start])
        steps.append(f"Component root: node {start} -> color Set A (0)")

        while queue:
            u = queue.popleft()
            color_label = "A" if color[u] == 0 else "B"
            steps.append(f"  Visit node {u} [color {color_label}]")

            for v in graph.adj[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]
                    queue.append(v)
                    neighbor_label = "A" if color[v] == 0 else "B"
                    steps.append(f"    Node {v} -> assign color {neighbor_label}")
                elif color[v] == color[u]:
                    steps.append(f"    CONFLICT at node {v} -> NOT BIPARTITE")
                    return False, None, steps
    return True, color, steps

def visualize_if_possible(graph, is_bip, color_map, label):
    if not HAS_VISUALS:
        print("\n(Note: Install matplotlib & networkx to see the visual window)")
        return

    G = nx.Graph()
    for u in graph.adj:
        for v in graph.adj[u]:
            G.add_edge(u, v)

    plt.figure(figsize=(9, 6))
    if is_bip and color_map:
        top = [n for n, c in color_map.items() if c == 0]
        pos = nx.bipartite_layout(G, top)
        node_colors = ['#3498db' if color_map[n] == 0 else '#e74c3c' for n in G.nodes()]
        title = f"{label}: BIPARTITE ✅"
    else:
        pos = nx.spring_layout(G)
        node_colors = '#95a5a6'
        title = f"{label}: NOT BIPARTITE ❌"

    nx.draw(G, pos, with_labels=True, node_color=node_colors, node_size=1200, 
            font_weight='bold', font_color='white', edge_color='#bdc3c7', width=2)
    plt.title(title, fontsize=15, pad=20)
    plt.show()

def print_result(graph, label="Custom Graph"):
    print(f"\n" + "="*60)
    print(f"  {label.upper()}")
    print("="*60)
    
    nodes = list(graph.adj.keys())
    edges = []
    seen = set()
    for u in graph.adj:
        for v in graph.adj[u]:
            if (v, u) not in seen:
                edges.append((u, v))
                seen.add((u, v))
    
    print(f"  Vertices : {len(nodes)} {nodes}")
    print(f"  Edges    : {edges}")

    bipartite, color, steps = is_bipartite(graph)

    print("\n  --- Algorithm trace ---")
    for s in steps: print(" ", s)

    print("\n  --- Final Result ---")
    if bipartite:
        print("  Status: BIPARTITE [Set A = blue, Set B = red]")
    else:
        print("  Status: NOT BIPARTITE (Contains odd cycle)")

    # Show the window!
    visualize_if_possible(graph, bipartite, color, label)

def load_from_txt(filename):
    g = Graph()
    if not os.path.exists(filename): return None
    with open(filename, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                parts = line.split(',')
                if len(parts) == 2:
                    g.add_edge(parts[0].strip(), parts[1].strip())
    return g

# ===================== MAIN MENU =====================
if __name__ == "__main__":
    print("\n" + "#"*45)
    print("   ADMC ASSIGNMENT: BIPARTITE GRAPH TOOL")
    print("#"*45)
    print("1. Analyze 'graph.txt' (Trace + Visual)")
    print("2. Run Built-in Examples")
    
    choice = input("\nEnter choice (1 or 2): ").strip()

    if choice == "1":
        g = load_from_txt("graph.txt")
        if g and g.adj:
            print_result(g, "Analysis of graph.txt")
        else:
            print("Error: graph.txt is empty or missing! Please add edges like 'A,B'.")
    elif choice == "2":
        g1 = Graph()
        for u, v in [(1,2),(2,3),(3,4),(4,1)]: g1.add_edge(u, v)
        print_result(g1, "Example 1: Square Cycle")

        g2 = Graph()
        for u, v in [(1,2),(2,3),(3,1)]: g2.add_edge(u, v)
        print_result(g2, "Example 2: Triangle Cycle")

    print("\nProcess finished.")
