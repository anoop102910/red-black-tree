function renderTree(tree, stepDescription = '', highlightInfo = null) {
    d3.select("#bTreeContainer").select("svg").remove();
    d3.select("#stepDescription").text("");
    d3.selectAll(".comparison-tooltip").remove();
    
    const margin = {top: 60, right: 40, bottom: 40, left: 40};
    const width = 1200 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    if (!document.getElementById("stepDescription")) {
        const descDiv = document.createElement("div");
        descDiv.id = "stepDescription";
        descDiv.style.textAlign = "center";
        descDiv.style.marginBottom = "10px";
        descDiv.style.fontSize = "16px";
        document.getElementById("bTreeContainer").insertBefore(
            descDiv, 
            document.getElementById("bTreeContainer").firstChild
        );
    }

    document.getElementById("stepDescription").textContent = stepDescription;

    const svg = d3.select("#bTreeContainer")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

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

    const hierarchy = d3.hierarchy(tree.visualize());
    const treeLayout = d3.tree().size([width, height]);
    const treeData = treeLayout(hierarchy);

    svg.selectAll(".link")
        .data(treeData.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y))
        .attr("stroke", "#4f5b66")
        .attr("fill", "none");

    const nodes = svg.selectAll(".node")
        .data(treeData.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("rect")
        .attr("class", "node-container")
        .attr("x", d => -(d.data.keys.length * 45) / 2 - 15)
        .attr("y", -30)
        .attr("width", d => Math.max(90, d.data.keys.length * 45 + 30))
        .attr("height", 60)
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("fill", d => {
            if (d.data.keys.length >= 2 * tree.order - 1) {
                return "#2d5a27";
            }
            return d.data.isLeaf ? "#2d5a27" : "#1a472a";
        })
        .attr("fill-opacity", 0.8)
        .attr("stroke", d => d.data.isLeaf ? "#2d5a27" : "#1a472a");

    const keyGroups = nodes.selectAll(".key-group")
        .data(d => d.data.keys.map(key => ({
            key: key,
            isLeaf: d.data.isLeaf
        })))
        .enter()
        .append("g")
        .attr("class", "key-group")
        .attr("transform", (d, i, nodes) => {
            const parentData = d3.select(nodes[i].parentNode).datum();
            const totalKeys = parentData.data.keys.length;
            const xOffset = (i - (totalKeys - 1) / 2) * 50;
            return `translate(${xOffset}, 0)`;
        });

    keyGroups.append("rect")
        .attr("class", "key-box")
        .attr("x", -20)
        .attr("y", -25)
        .attr("width", 40)
        .attr("height", 50)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", (d, i, nodes) => {
            if (highlightInfo && highlightInfo.comparingKey === d.key) {
                const keyGroup = d3.select(nodes[i].parentNode);
                const comparison = d3.select("g.tooltip")  // Select the tooltip directly
                    .style("opacity", 1);  // Ensure tooltip is visible
                keyGroup.append("text")
                    .attr("class", "comparison-tooltip")
                    .attr("text-anchor", "middle")
                    .attr("y", 45)
                    .attr("fill", "#ffffff")
                    .attr("font-size", "12px")
                    .text(`Comparing with ${highlightInfo.value}`);
                
                return "#ff4444";
            }
            if (highlightInfo && highlightInfo.compareKey === d.key) {
                return "#FFD700";
            }
            if (highlightInfo && highlightInfo.insertedValue === d.key) {
                return "#2d5a27";
            }
            return d.isLeaf ? "#2d5a27" : "#1a472a";
        });

    keyGroups.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(d => d.key);

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
        
        tooltip.raise();
        
        tooltip
            .attr("transform", `translate(${x},${adjustedY})`)
            .transition()
            .duration(200)
            .style("opacity", 1);
    }

    function getTransformedPosition(transform1, transform2) {
        const t1 = parseTransform(transform1);
        const t2 = parseTransform(transform2);
        return [t1.x + t2.x, t1.y + t2.y];
    }

    function parseTransform(transform) {
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        if (match) {
            return {
                x: parseFloat(match[1]),
                y: parseFloat(match[2])
            };
        }
        return { x: 0, y: 0 };
    }

    // Remove or comment out this block at the end of renderTree function
    /*
    if (!highlightInfo || !highlightInfo.comparingKey) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    }
    */
}

class BTree {
    constructor(order) {
        this.order = order;
        this.maxKeys = 2 * order - 1; // Maximum keys per node
        this.root = new BTreeNode(true);
        this.root.order = order;
    }

    async insert(value) {
        const root = this.root;
        await this.visualizeStep(`Inserting ${value}`);

        if (root.keys.length === this.maxKeys) {
            const newRoot = new BTreeNode(false);
            newRoot.order = this.order;
            newRoot.children.push(this.root);
            this.root = newRoot;
            await this.root.splitChild(0, root, this);
            await this.root.insertNonFull(value, this);
        } else {
            await this.root.insertNonFull(value, this);
        }
    }

    async visualizeStep(message, highlightInfo = null) {
        renderTree(this, message, highlightInfo);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    visualize() {
        return this.root.visualize();
    }

    async delete(value) {
        if (!this.root) {
            await this.visualizeStep('Tree is empty');
            return false;
        }

        await this.visualizeStep(`Starting deletion of ${value}`);
        const result = await this.root.delete(value, this);

        // If the root is empty, make its first child the new root
        if (this.root.keys.length === 0 && !this.root.isLeaf) {
            this.root = this.root.children[0];
        }

        return result;
    }

    async update(oldValue, newValue) {
        await this.visualizeStep(`Starting update: changing ${oldValue} to ${newValue}`);
        
        // First check if newValue already exists
        let current = this.root;
        let exists = false;
        
        // Simple check if new value already exists
        const checkExists = async (node) => {
            for (let key of node.keys) {
                if (key === newValue) {
                    exists = true;
                    return;
                }
            }
            if (!node.isLeaf) {
                for (let child of node.children) {
                    await checkExists(child);
                }
            }
        };
        
        await checkExists(this.root);
        
        if (exists) {
            await this.visualizeStep(`Cannot update: ${newValue} already exists in the tree`);
            return false;
        }
        
        // Delete old value and insert new value
        const deleteResult = await this.delete(oldValue);
        if (deleteResult) {
            await this.insert(newValue);
            await this.visualizeStep(`Successfully updated ${oldValue} to ${newValue}`);
            return true;
        } else {
            await this.visualizeStep(`Update failed: ${oldValue} not found in the tree`);
            return false;
        }
    }

    async search(value) {
        if (!this.root) {
            await this.visualizeStep('Tree is empty');
            return false;
        }

        await this.visualizeStep(`Starting search for ${value}`);
        return await this.root.search(value, this);
    }
}

class BTreeNode {
    constructor(isLeaf) {
        this.isLeaf = isLeaf;
        this.keys = [];
        this.children = [];
        this.order = null;
    }

    async insertNonFull(value, tree) {
        let i = this.keys.length - 1;

        if (this.isLeaf) {
            // Show comparison with each key from right to left
            for (let j = this.keys.length - 1; j >= 0; j--) {
                await tree.visualizeStep(
                    `Comparing ${value} with ${this.keys[j]}`,
                    { comparingKey: this.keys[j], value: value }
                );
                if (this.keys[j] <= value) {
                    i = j;
                    break;
                }
                i = j - 1;
            }
            this.keys.splice(i + 1, 0, value);
            await tree.visualizeStep(`Inserted ${value} into leaf node`);
        } else {
            // Show comparison with each key from right to left
            for (let j = this.keys.length - 1; j >= 0; j--) {
                await tree.visualizeStep(
                    `Comparing ${value} with ${this.keys[j]}`,
                    { comparingKey: this.keys[j], value: value }
                );
                if (this.keys[j] <= value) {
                    i = j;
                    break;
                }
                i = j - 1;
            }
            i++;

            if (this.children[i].keys.length === 2 * tree.order - 1) {
                await this.splitChild(i, this.children[i], tree);
                if (value > this.keys[i]) {
                    i++;
                }
            }
            await this.children[i].insertNonFull(value, tree);
        }
    }

    async splitChild(index, childNode, tree) {
        // First show tooltip about node size exceeded
        await tree.visualizeStep(
            `Node size exceeded maximum limit`,
            { comparingKey: childNode.keys[Math.floor((2 * tree.order - 1) / 2)], 
              value: "Node full" }
        );

        const newNode = new BTreeNode(childNode.isLeaf);
        newNode.order = tree.order;
        
        const mid = Math.floor((2 * tree.order - 1) / 2);
        const promotedKey = childNode.keys[mid];
        
        // Show tooltip about promoting the middle key
        await tree.visualizeStep(
            `Moving ${promotedKey} to parent node`,
            { comparingKey: promotedKey, 
              value: "Moving up" }
        );
        
        newNode.keys = childNode.keys.splice(mid + 1);
        this.keys.splice(index, 0, promotedKey);
        childNode.keys.splice(mid);
        
        if (!childNode.isLeaf) {
            newNode.children = childNode.children.splice(mid + 1);
        }
        
        this.children.splice(index + 1, 0, newNode);
        
        // Show final state after split
        await tree.visualizeStep(
            `Split complete: ${promotedKey} moved up and node split into two parts`,
            { compareKey: promotedKey }  // highlight the promoted key in yellow
        );
    }

    visualize(x = 400, y = 50, width = 800, height = 100) {
        const nodeData = {
            name: this.keys.join(", "),
            keys: this.keys,
            isLeaf: this.isLeaf,
            x: x,
            y: y,
            children: []
        };

        if (!this.children.length) return nodeData;

        const childWidth = width / this.children.length;
        for (let i = 0; i < this.children.length; i++) {
            nodeData.children.push(
                this.children[i].visualize(
                    x - width/2 + i * childWidth + childWidth/2, 
                    y + height, 
                    childWidth, 
                    height
                )
            );
        }

        return nodeData;
    }

    async findKeyIndex(value) {
        let i = 0;
        while (i < this.keys.length) {
            await tree.visualizeStep(`Comparing ${value} with ${this.keys[i]}`);
            if (value <= this.keys[i]) {
                break;
            }
            i++;
        }
        return i;
    }

    async borrowFromPrev(index, tree) {
        const child = this.children[index];
        const sibling = this.children[index - 1];

        await tree.visualizeStep(`Borrowing from previous sibling for node at index ${index}`);

        // Move all keys in child one step ahead
        for (let i = child.keys.length - 1; i >= 0; i--) {
            child.keys[i + 1] = child.keys[i];
        }

        // If child is not leaf, move all its children one step ahead
        if (!child.isLeaf) {
            for (let i = child.children.length - 1; i >= 0; i--) {
                child.children[i + 1] = child.children[i];
            }
        }

        // Set child's first key equal to keys[index-1] from the current node
        child.keys[0] = this.keys[index - 1];

        // Moving the last key from sibling to parent
        this.keys[index - 1] = sibling.keys[sibling.keys.length - 1];

        // Moving the last child of sibling to child's first position
        if (!child.isLeaf) {
            child.children[0] = sibling.children[sibling.children.length - 1];
            sibling.children.pop();
        }

        // Remove the last key from sibling
        sibling.keys.pop();

        await tree.visualizeStep('Borrowed from previous sibling');
    }

    async borrowFromNext(index, tree) {
        const child = this.children[index];
        const sibling = this.children[index + 1];

        await tree.visualizeStep(`Borrowing from next sibling for node at index ${index}`);

        // Set child's first key equal to keys[index] from the current node
        child.keys.push(this.keys[index]);

        // First key from sibling is inserted into keys[index] in current node
        this.keys[index] = sibling.keys[0];

        // Moving all keys in sibling one step behind
        for (let i = 1; i < sibling.keys.length; i++) {
            sibling.keys[i - 1] = sibling.keys[i];
        }

        // Moving the child pointers one step behind
        if (!sibling.isLeaf) {
            child.children.push(sibling.children[0]);
            for (let i = 1; i < sibling.children.length; i++) {
                sibling.children[i - 1] = sibling.children[i];
            }
            sibling.children.pop();
        }

        // Remove the first key from sibling
        sibling.keys.shift();

        await tree.visualizeStep('Borrowed from next sibling');
    }

    async fillChild(index, tree) {
        await tree.visualizeStep(`Ensuring child at index ${index} has enough keys`);

        // Try borrowing from left sibling
        if (index > 0 && this.children[index - 1].keys.length >= this.order) {
            await this.borrowFromPrev(index, tree);
        }
        // Try borrowing from right sibling
        else if (index < this.keys.length && this.children[index + 1].keys.length >= this.order) {
            await this.borrowFromNext(index, tree);
        }
        // Merge with a sibling
        else {
            if (index === this.keys.length) {
                await this.mergeChildren(index - 1, tree);
            } else {
                await this.mergeChildren(index, tree);
            }
        }
    }

    async mergeChildren(index, tree) {
        const child = this.children[index];
        const sibling = this.children[index + 1];
        
        await tree.visualizeStep(`Merging child at index ${index} with its sibling`);
        
        // Move key from parent to child
        child.keys.push(this.keys[index]);
        
        // Copy all keys from sibling to child
        for (const key of sibling.keys) {
            child.keys.push(key);
        }
        
        // If not leaf, copy all children from sibling
        if (!child.isLeaf) {
            for (const childNode of sibling.children) {
                child.children.push(childNode);
            }
        }
        
        // Remove key from parent
        this.keys.splice(index, 1);
        // Remove sibling from parent's children
        this.children.splice(index + 1, 1);
        
        await tree.visualizeStep('Merge complete');
    }

    async getPredecessor(index, tree) {
        let current = this.children[index];
        await tree.visualizeStep('Finding predecessor');
        
        // Keep moving to the rightmost child until we reach a leaf
        while (!current.isLeaf) {
            current = current.children[current.children.length - 1];
            await tree.visualizeStep('Moving to rightmost child');
        }
        
        // Return the last key
        return current.keys[current.keys.length - 1];
    }

    async getSuccessor(index, tree) {
        let current = this.children[index + 1];
        await tree.visualizeStep('Finding successor');
        
        // Keep moving to the leftmost child until we reach a leaf
        while (!current.isLeaf) {
            current = current.children[0];
            await tree.visualizeStep('Moving to leftmost child');
        }
        
        // Return the first key
        return current.keys[0];
    }

    async delete(value, tree) {
        let index = 0;
        
        // First phase: Finding the key
        while (index < this.keys.length && this.keys[index] < value) {
            await tree.visualizeStep(
                `Searching: Comparing ${value} with ${this.keys[index]}`,
                { comparingKey: this.keys[index], value: value }
            );
            index++;
        }

        // Second phase: Found the key or moving to child
        if (index < this.keys.length && this.keys[index] === value) {
            await tree.visualizeStep(
                `Found ${value} at current node!`,
                { compareKey: this.keys[index] }
            );
            
            if (this.isLeaf) {
                await tree.visualizeStep(
                    `Deleting ${value} from leaf node`,
                    { comparingKey: this.keys[index], value: "Deleting" }
                );
                this.keys.splice(index, 1);
                await tree.visualizeStep(`Deleted ${value} successfully`);
                return true;
            } else {
                return await this.deleteFromNonLeaf(index, tree);
            }
        }

        // If key not found in current node
        if (this.isLeaf) {
            await tree.visualizeStep(`${value} not found in tree`);
            return false;
        }

        // If not leaf, search the last child
        await tree.visualizeStep(
            `Moving to child node to find ${value}`,
            { comparingKey: this.keys[index < this.keys.length ? index : index-1], value: value }
        );

        // Check if child needs rebalancing
        if (this.children[index].keys.length < this.order) {
            await this.fillChild(index, tree);
        }

        return await this.children[index].delete(value, tree);
    }

    async deleteFromNonLeaf(index, tree) {
        const key = this.keys[index];
        await tree.visualizeStep(`Deleting ${key} from internal node`);

        // Case 2a: If the subtree before key has at least t keys
        if (this.children[index].keys.length >= this.order) {
            const pred = await this.getPredecessor(index, tree);
            this.keys[index] = pred;
            await tree.visualizeStep(`Replaced ${key} with predecessor ${pred}`);
            return await this.children[index].delete(pred, tree);
        }
        
        // Case 2b: If the subtree after key has at least t keys
        else if (this.children[index + 1].keys.length >= this.order) {
            const succ = await this.getSuccessor(index, tree);
            this.keys[index] = succ;
            await tree.visualizeStep(`Replaced ${key} with successor ${succ}`);
            return await this.children[index + 1].delete(succ, tree);
        }
        
        // Case 2c: If both immediate children have t-1 keys
        else {
            await this.mergeChildren(index, tree);
            return await this.children[index].delete(key, tree);
        }
    }

    async search(value, tree) {
        let i = 0;
        
        // Compare with each key in current node
        for (let i = 0; i < this.keys.length; i++) {
            await tree.visualizeStep(
                `Comparing ${value} with ${this.keys[i]}`,
                { comparingKey: this.keys[i], value: value }
            );
            
            if (value === this.keys[i]) {
                await tree.visualizeStep(
                    `Found ${value}!`,
                    { compareKey: this.keys[i] }  // Highlight in yellow when found
                );
                return true;
            }
            
            if (value < this.keys[i]) {
                if (this.isLeaf) {
                    await tree.visualizeStep(`${value} not found in tree`);
                    return false;
                }
                await tree.visualizeStep(
                    `${value} is less than ${this.keys[i]}, moving to left child`,
                    { comparingKey: this.keys[i], value: value }
                );
                return await this.children[i].search(value, tree);
            }
        }

        // If we've gone through all keys and haven't found it or returned
        if (this.isLeaf) {
            await tree.visualizeStep(`${value} not found in tree`);
            return false;
        }

        // If not leaf, search the last child
        await tree.visualizeStep(
            `${value} is greater than all keys, moving to rightmost child`,
            { comparingKey: this.keys[this.keys.length - 1], value: value }
        );
        return await this.children[this.keys.length].search(value, tree);
    }
}

// Update the initialization event listeners
document.getElementById("initializeButton").addEventListener("click", async () => {
    const keySize = parseInt(document.getElementById("orderInput").value);
    if (keySize >= 1) {
        bTree = new BTree(Math.ceil((keySize + 1) / 2)); // Convert key size to order
        renderTree(bTree, `Empty tree initialized with max ${keySize} keys per node`);
        alert(`Empty B-tree initialized with max ${keySize} keys per node`);
    } else {
        alert("Key size must be at least 1");
    }
});

document.getElementById("initializeSampleButton").addEventListener("click", async () => {
    const keySize = parseInt(document.getElementById("orderInput").value);
    if (keySize >= 1) {
        bTree = new BTree(Math.ceil((keySize + 1) / 2)); // Convert key size to order
        renderTree(bTree, `Tree initialized with max ${keySize} keys per node`);
        
        // Add sample values in a specific order to demonstrate tree structure
        const sampleValues = [10, 20, 5, 15, 25, 30, 35];
        for (const value of sampleValues) {
            await bTree.insert(value);
            await new Promise(resolve => setTimeout(resolve, 800)); // Slightly slower animation for sample data
        }
        
        alert(`B-tree initialized with max ${keySize} keys per node and sample values: ${sampleValues.join(', ')}`);
    } else {
        alert("Key size must be at least 1");
    }
});

document.getElementById("insertButton").addEventListener("click", async () => {
    if (!bTree) {
        alert("Please initialize the tree first!");
        return;
    }

    const inputValue = document.getElementById("insertInput").value;
    if (inputValue) {
        const value = parseInt(inputValue);
        document.getElementById("insertButton").disabled = true;
        await bTree.insert(value);
        document.getElementById("insertButton").disabled = false;
        document.getElementById("insertInput").value = "";
    }
});

document.getElementById("deleteButton").addEventListener("click", async () => {
    if (!bTree) {
        alert("Please initialize the tree first!");
        return;
    }

    const value = parseInt(document.getElementById("deleteInput").value);
    if (!isNaN(value)) {
        document.getElementById("deleteButton").disabled = true;
        await bTree.delete(value);
        document.getElementById("deleteButton").disabled = false;
        document.getElementById("deleteInput").value = "";
    } else {
        alert("Please enter a valid number");
    }
});

document.getElementById("updateButton").addEventListener("click", async () => {
    if (!bTree) {
        alert("Please initialize the tree first!");
        return;
    }

    const oldValue = parseInt(document.getElementById("updateOldInput").value);
    const newValue = parseInt(document.getElementById("updateNewInput").value);
    
    if (!isNaN(oldValue) && !isNaN(newValue)) {
        document.getElementById("updateButton").disabled = true;
        await bTree.update(oldValue, newValue);
        document.getElementById("updateButton").disabled = false;
        document.getElementById("updateOldInput").value = "";
        document.getElementById("updateNewInput").value = "";
    } else {
        alert("Please enter valid numbers for both values");
    }
});

document.getElementById("initializeRandomButton").addEventListener("click", async () => {
    const keySize = parseInt(document.getElementById("orderInput").value);
    const count = parseInt(document.getElementById("randomCountInput").value);
    
    if (keySize >= 1 && count > 0) {
        bTree = new BTree(Math.ceil((keySize + 1) / 2));
        renderTree(bTree, `Tree initialized with max ${keySize} keys per node`);
        
        // Generate random unique values
        const randomValues = new Set();
        while(randomValues.size < count) {
            randomValues.add(Math.floor(Math.random() * 100) + 1);
        }
        
        // Insert random values
        for (const value of randomValues) {
            await bTree.insert(value);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        alert(`B-tree initialized with ${count} random values`);
    } else {
        alert("Please enter valid numbers for key size and count");
    }
});

document.getElementById("searchButton").addEventListener("click", async () => {
    if (!bTree) {
        alert("Please initialize the tree first!");
        return;
    }

    const value = parseInt(document.getElementById("searchInput").value);
    if (!isNaN(value)) {
        document.getElementById("searchButton").disabled = true;
        const found = await bTree.search(value);
        document.getElementById("searchButton").disabled = false;
        document.getElementById("searchInput").value = "";
        
        if (found) {
            alert(`Found ${value} in the tree!`);
        } else {
            alert(`${value} not found in the tree.`);
        }
    } else {
        alert("Please enter a valid number");
    }
});

let bTree = null;
