function addStep(message) {
    const stepLog = document.getElementById('stepLog');
    const step = document.createElement('div');
    step.className = 'step';
    step.textContent = message;
    stepLog.appendChild(step);
    stepLog.scrollTop = stepLog.scrollHeight;
}

function clearSteps() {
    document.getElementById('stepLog').innerHTML = '';
}

class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.color = 'red';
    }
}

class RedBlackTree {
    constructor() {
        this.root = null;
    }

    insert(value) {
        const newNode = new Node(value);
        addStep(`Inserting node with value ${value}`);

        if (!this.root) {
            this.root = newNode;
            this.root.color = 'black';
            addStep(`Tree was empty. Made ${value} the root node (black)`);
            this.updateVisualization();
            return;
        }

        this.insertNode(this.root, newNode);
        addStep(`Added ${value} as a red node`);
        this.fixInsertion(newNode);
        this.updateVisualization();
    }

    async insertNode(node, newNode) {
        if (newNode.value < node.value) {
            await this.visualizeStep(
                `Comparing ${newNode.value} with ${node.value}`,
                { 
                    node: node.value, 
                    type: 'compare', 
                    message: `${newNode.value} < ${node.value}\nGoing left`, 
                    comparingValue: newNode.value
                }
            );
            if (node.left === null) {
                node.left = newNode;
                newNode.parent = node;
                await this.visualizeStep(
                    `Found insertion point`,
                    { 
                        node: newNode.value, 
                        type: 'highlight',
                        message: `Inserting ${newNode.value} as left child of ${node.value}`,
                        insertPoint: true
                    }
                );
            } else {
                await this.insertNode(node.left, newNode);
            }
        } else {
            await this.visualizeStep(
                `Comparing ${newNode.value} with ${node.value}`,
                { 
                    node: node.value, 
                    type: 'compare', 
                    message: `${newNode.value} >= ${node.value}\nGoing right`,
                    comparingValue: newNode.value
                }
            );
            if (node.right === null) {
                node.right = newNode;
                newNode.parent = node;
                await this.visualizeStep(
                    `Found insertion point`,
                    { 
                        node: newNode.value, 
                        type: 'highlight',
                        message: `Inserting ${newNode.value} as right child of ${node.value}`,
                        insertPoint: true
                    }
                );
            } else {
                await this.insertNode(node.right, newNode);
            }
        }
    }

    async visualizeStep(message, highlightInfo = null) {
        addStep(message);
        this.updateVisualization(highlightInfo);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    fixInsertion(node) {
        while (node !== this.root && node.parent.color === 'red') {
            let uncle;
            if (node.parent === node.parent.parent.left) {
                uncle = node.parent.parent.right;
                
                if (uncle && uncle.color === 'red') {
                    addStep(`Case 1: Uncle is red. Recoloring nodes...`);
                    node.parent.color = 'black';
                    uncle.color = 'black';
                    node.parent.parent.color = 'red';
                    node = node.parent.parent;
                    this.updateVisualization();
                } else {
                    if (node === node.parent.right) {
                        addStep(`Case 2: Node is right child. Performing left rotation...`);
                        node = node.parent;
                        this.rotateLeft(node);
                        this.updateVisualization();
                    }
                    addStep(`Case 3: Recoloring and right rotation...`);
                    node.parent.color = 'black';
                    node.parent.parent.color = 'red';
                    this.rotateRight(node.parent.parent);
                    this.updateVisualization();
                }
            } else {
                uncle = node.parent.parent.left;
                
                if (uncle && uncle.color === 'red') {
                    addStep(`Case 1: Uncle is red. Recoloring nodes...`);
                    node.parent.color = 'black';
                    uncle.color = 'black';
                    node.parent.parent.color = 'red';
                    node = node.parent.parent;
                    this.updateVisualization();
                } else {
                    if (node === node.parent.left) {
                        addStep(`Case 2: Node is left child. Performing right rotation...`);
                        node = node.parent;
                        this.rotateRight(node);
                        this.updateVisualization();
                    }
                    addStep(`Case 3: Recoloring and left rotation...`);
                    node.parent.color = 'black';
                    node.parent.parent.color = 'red';
                    this.rotateLeft(node.parent.parent);
                    this.updateVisualization();
                }
            }
        }
        if (this.root.color !== 'black') {
            addStep(`Ensuring root is black`);
            this.root.color = 'black';
        }
    }

    rotateLeft(node) {
        const rightChild = node.right;
        node.right = rightChild.left;
        
        if (rightChild.left !== null) {
            rightChild.left.parent = node;
        }
        
        rightChild.parent = node.parent;
        
        if (node.parent === null) {
            this.root = rightChild;
        } else if (node === node.parent.left) {
            node.parent.left = rightChild;
        } else {
            node.parent.right = rightChild;
        }
        
        rightChild.left = node;
        node.parent = rightChild;
    }

    rotateRight(node) {
        const leftChild = node.left;
        node.left = leftChild.right;
        
        if (leftChild.right !== null) {
            leftChild.right.parent = node;
        }
        
        leftChild.parent = node.parent;
        
        if (node.parent === null) {
            this.root = leftChild;
        } else if (node === node.parent.right) {
            node.parent.right = leftChild;
        } else {
            node.parent.left = leftChild;
        }
        
        leftChild.right = node;
        node.parent = leftChild;
    }

    updateVisualization(highlightInfo = null) {
        const width = document.getElementById('treeContainer').clientWidth;
        const height = document.getElementById('treeContainer').clientHeight;
        
        d3.select('#treeContainer').selectAll('*').remove();
        
        const svg = d3.select('#treeContainer')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        const tooltip = svg.append("g")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("fill", "#333")
            .attr("opacity", 0.9);

        tooltip.append("text")
            .attr("class", "tooltip-text")
            .attr("fill", "#fff")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em");

        const margin = {top: 40, right: 40, bottom: 40, left: 40};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const g = svg.append('g')
            .attr('transform', `translate(${width/2},${margin.top})`);
        
        const tree = d3.tree()
            .size([innerWidth/2, innerHeight])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));
        
        const root = d3.hierarchy(this.toObject(this.root));
        
        const treeData = tree(root);
        treeData.descendants().forEach(d => {
            d.x = d.x - innerWidth/4;
        });
        
        const links = g.selectAll('.link')
            .data(treeData.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y));
        
        const nodes = g.selectAll('.node')
            .data(treeData.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        nodes.append('text')
            .attr('class', 'comparison-text')
            .attr('dy', '35')
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('fill', '#333')
            .text(d => {
                if (highlightInfo && highlightInfo.node === d.data.value) {
                    return highlightInfo.message || '';
                }
                return '';
            })
            .call(wrap, 120);

        if (highlightInfo && highlightInfo.comparingValue) {
            nodes.append('path')
                .attr('class', 'comparison-path')
                .attr('d', d => {
                    if (highlightInfo.node === d.data.value) {
                        const direction = highlightInfo.message.includes('right') ? 1 : -1;
                        return `M 0,20 L ${30 * direction},40`;
                    }
                    return '';
                })
                .attr('stroke', '#666')
                .attr('stroke-width', '2')
                .attr('fill', 'none')
                .attr('marker-end', 'url(#arrow)');
        }

        svg.append('defs').append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#666');

        nodes.append('circle')
            .attr('r', 15)
            .attr('class', d => {
                if (highlightInfo && highlightInfo.node === d.data.value) {
                    if (highlightInfo.type === 'compare') {
                        showTooltip(tooltip, d.x, d.y, highlightInfo.message);
                        return 'comparing';
                    } else if (highlightInfo.type === 'highlight') {
                        return 'highlighted';
                    }
                }
                return d.data.color;
            });
        
        nodes.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text(d => d.data.value)
            .style('fill', 'white');
    }

    toObject(node) {
        if (!node) return null;
        return {
            value: node.value,
            color: node.color,
            children: [
                this.toObject(node.left),
                this.toObject(node.right)
            ].filter(n => n !== null)
        };
    }
}

const tree = new RedBlackTree();

function insertNode() {
    const value = parseInt(document.getElementById('nodeInput').value);
    if (!isNaN(value)) {
        tree.insert(value);
        document.getElementById('nodeInput').value = '';
    }
}

function deleteNode() {
    // Implementation for delete operation can be added here
    alert('Delete operation not implemented yet');
}

function showTooltip(tooltip, x, y, text) {
    tooltip.select("text")
        .text(text);

    const bbox = tooltip.select("text").node().getBBox();
    
    tooltip.select("rect")
        .attr("x", -bbox.width/2 - 5)
        .attr("y", -bbox.height/2)
        .attr("width", bbox.width + 10)
        .attr("height", bbox.height + 4);

    const adjustedY = y - bbox.height - 30;
    
    tooltip.raise()
        .attr("transform", `translate(${x},${adjustedY})`)
        .transition()
        .duration(200)
        .style("opacity", 1);
}

function wrap(text, width) {
    text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\n/);
        const lineHeight = 1.1;
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));

        text.text(null);

        words.forEach((word, i) => {
            text.append("tspan")
                .attr("x", 0)
                .attr("y", y)
                .attr("dy", `${i * lineHeight + dy}em`)
                .text(word);
        });
    });
} 