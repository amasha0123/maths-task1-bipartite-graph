document.addEventListener('DOMContentLoaded', () => {
    const cyContainer = document.getElementById('cy');
    const edgesInput = document.getElementById('edges-input');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-btn');
    const traceLog = document.getElementById('trace-log');
    const statusText = document.getElementById('status-text');
    const statusBadge = document.getElementById('status-badge');
    const setAnodes = document.getElementById('set-a-nodes');
    const setBnodes = document.getElementById('set-b-nodes');
    const setsContainer = document.getElementById('sets-container');

    // Initialize Cytoscape
    let cy = cytoscape({
        container: cyContainer,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#94a3b8',
                    'label': 'data(id)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '12px',
                    'font-weight': 'bold',
                    'width': '40px',
                    'height': '40px',
                    'transition-property': 'background-color, line-color, target-arrow-color',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#334155',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: '.set-a',
                style: {
                    'background-color': '#38bdf8',
                    'box-shadow': '0 0 10px #38bdf8'
                }
            },
            {
                selector: '.set-b',
                style: {
                    'background-color': '#f472b6',
                    'box-shadow': '0 0 10px #f472b6'
                }
            },
            {
                selector: '.conflict',
                style: {
                    'background-color': '#ef4444',
                    'shape': 'star'
                }
            }
        ],
        layout: { name: 'cose', animate: true }
    });

    const examples = {
        square: "A,B\nB,C\nC,D\nD,A",
        triangle: "A,B\nB,C\nC,A",
        star: "Center,A\nCenter,B\nCenter,C\nCenter,D\nCenter,E",
        complex: "1,2\n2,3\n3,4\n4,5\n5,6\n6,1\n1,4\n2,5"
    };

    function log(message, type = '') {
        const line = document.createElement('div');
        line.className = `trace-line ${type}`;
        line.textContent = message;
        traceLog.appendChild(line);
        traceLog.scrollTop = traceLog.scrollHeight;
    }

    function parseInput() {
        const text = edgesInput.value.trim();
        if (!text) return [];
        return text.split('\n')
            .map(line => line.split(',').map(s => s.trim()))
            .filter(parts => parts.length === 2 && parts[0] && parts[1]);
    }

    async function analyze() {
        const edges = parseInput();
        if (edges.length === 0) {
            alert("Please enter some edges first (e.g., A,B)");
            return;
        }

        // Reset state
        cy.elements().remove();
        traceLog.innerHTML = '';
        setsContainer.style.display = 'none';
        statusText.textContent = "Analyzing...";
        statusBadge.textContent = "RUNNING";
        statusBadge.className = "status-badge status-pending";

        log("🚀 Building graph structure...");
        
        // Add nodes and edges
        const nodes = new Set();
        edges.forEach(([u, v]) => {
            nodes.add(u);
            nodes.add(v);
        });

        nodes.forEach(id => cy.add({ group: 'nodes', data: { id } }));
        edges.forEach(([u, v]) => cy.add({ group: 'edges', data: { source: u, target: v } }));

        cy.layout({ name: 'cose', animate: true }).run();
        await new Promise(r => setTimeout(r, 800));

        // Bipartite Check (BFS)
        const color = {}; // node id -> 0 or 1
        const queue = [];
        let isBipartite = true;
        const visited = new Set();

        const allNodes = cy.nodes().map(n => n.id());
        
        for (const startNode of allNodes) {
            if (visited.has(startNode)) continue;

            log(`📍 New component found. Starting from ${startNode}`, 'highlight');
            color[startNode] = 0;
            queue.push(startNode);
            visited.add(startNode);
            
            cy.getElementById(startNode).addClass('set-a');
            await new Promise(r => setTimeout(r, 400));

            while (queue.length > 0) {
                const u = queue.shift();
                const uColor = color[u];
                const uLabel = uColor === 0 ? 'A' : 'B';
                
                log(`  Checking neighbors of ${u} (Set ${uLabel})`);

                const neighbors = cy.getElementById(u).neighborhood('node');
                for (let i = 0; i < neighbors.length; i++) {
                    const v = neighbors[i].id();
                    
                    if (!(v in color)) {
                        color[v] = 1 - uColor;
                        visited.add(v);
                        queue.push(v);
                        const vLabel = color[v] === 0 ? 'A' : 'B';
                        log(`    Node ${v} -> Assigned Set ${vLabel}`);
                        cy.getElementById(v).addClass(color[v] === 0 ? 'set-a' : 'set-b');
                        await new Promise(r => setTimeout(r, 300));
                    } else if (color[v] === uColor) {
                        log(`    ❌ CONFLICT! Node ${v} and ${u} are both in Set ${uLabel}`, 'highlight');
                        cy.getElementById(v).addClass('conflict');
                        cy.getElementById(u).addClass('conflict');
                        isBipartite = false;
                        break;
                    }
                }
                if (!isBipartite) break;
            }
            if (!isBipartite) break;
        }

        if (isBipartite) {
            statusText.textContent = "Graph is Bipartite!";
            statusBadge.textContent = "BIPARTITE";
            statusBadge.className = "status-badge status-bipartite";
            log("✅ Success: Graph can be split into two independent sets.");
            
            const setA = allNodes.filter(n => color[n] === 0);
            const setB = allNodes.filter(n => color[n] === 1);
            
            setAnodes.textContent = setA.join(', ');
            setBnodes.textContent = setB.join(', ');
            setsContainer.style.display = 'block';

            // Rearrange into Bipartite layout
            log("🎨 Rearranging into bipartite layout...");
            const width = cy.width();
            const height = cy.height();
            
            setA.forEach((id, i) => {
                cy.getElementById(id).animate({
                    position: { x: width * 0.3, y: (height / (setA.length + 1)) * (i + 1) }
                }, { duration: 1000 });
            });
            
            setB.forEach((id, i) => {
                cy.getElementById(id).animate({
                    position: { x: width * 0.7, y: (height / (setB.length + 1)) * (i + 1) }
                }, { duration: 1000 });
            });

        } else {
            statusText.textContent = "Not Bipartite";
            statusBadge.textContent = "FAILED";
            statusBadge.className = "status-badge status-not-bipartite";
            log("❌ Result: Graph contains at least one odd cycle.");
        }
    }

    runBtn.addEventListener('click', analyze);
    resetBtn.addEventListener('click', () => {
        cy.elements().remove();
        traceLog.innerHTML = '<div class="trace-line">Canvas reset.</div>';
        statusText.textContent = "Ready to analyze";
        statusBadge.textContent = "WAITING";
        statusBadge.className = "status-badge status-pending";
        setsContainer.style.display = 'none';
        edgesInput.value = '';
    });

    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            edgesInput.value = examples[btn.dataset.example];
            analyze();
        });
    });

    // Load initial example
    edgesInput.value = examples.square;
    analyze();
});
