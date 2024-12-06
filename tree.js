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

    insertNode(node, newNode) {
        if (newNode.value < node.value) {
            if (node.left === null) {
                node.left = newNode;
                newNode.parent = node;
            } else {
                this.insertNode(node.left, newNode);
            }
        } else {
            if (node.right === null) {
                node.right = newNode;
                newNode.parent = node;
            } else {
                this.insertNode(node.right, newNode);
            }
        }
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

    updateVisualization() {
        const width = document.getElementById('treeContainer').clientWidth;
        const height = document.getElementById('treeContainer').clientHeight;
        
        d3.select('#treeContainer').selectAll('*').remove();
        
        const svg = d3.select('#treeContainer')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
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
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x},${d.y})`);
        
        nodes.append('circle')
            .attr('r', 15)
            .attr('class', d => d.data.color);
        
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