/* ====================================
   DOCKER LEARNING PLATFORM - JAVASCRIPT
   Objective: Interactive learning experience with dynamic content
   Docs: Handles user interactions, content loading, and state management
         for the Docker educational platform
   ==================================== */

/* ====================================
   GLOBAL STATE MANAGEMENT
   Objective: Track user's current position and preferences
   Docs: Variables for tracking selected node, view layer, and active tab
   ==================================== */
let currentNode = null;
let currentLayer = 'overview';
let currentTab = 'concept';

/* ====================================
   CONTENT METADATA CONFIGURATION
   Objective: Define display properties for each learning topic
   Docs: Contains titles, badges, breadcrumbs, and learning path information
         for all nine Docker topics in the learning journey
   ==================================== */
const nodeMetadata = {
    install: {
        title: "🚀 Install Docker",
        badges: ["Essential", "15 mins", "Platform Specific"],
        breadcrumb: "Start → Install"
    },
    basics: {
        title: "📦 Container Basics",
        badges: ["Core Skills", "30 mins", "Hands-On"],
        breadcrumb: "Start → Install → Basics"
    },
    images: {
        title: "🏗️ Build Custom Images",
        badges: ["Essential", "45 mins", "Creative"],
        breadcrumb: "Start → Install → Basics → Images"
    },
    compose: {
        title: "🎼 Docker Compose",
        badges: ["Multi-Container", "45 mins", "Orchestration"],
        breadcrumb: "Start → Install → Basics → Images → Compose"
    },
    volumes: {
        title: "💾 Data Persistence",
        badges: ["Storage", "30 mins", "Critical"],
        breadcrumb: "Start → ... → Volumes"
    },
    network: {
        title: "🌐 Networking",
        badges: ["Connectivity", "40 mins", "Advanced"],
        breadcrumb: "Start → ... → Network"
    },
    registry: {
        title: "📤 Registry & CI/CD",
        badges: ["Distribution", "45 mins", "DevOps"],
        breadcrumb: "Start → ... → Registry"
    },
    production: {
        title: "⚙️ Production Deployment",
        badges: ["Production", "1.5 hours", "Advanced"],
        breadcrumb: "Start → ... → Production"
    },
    orchestration: {
        title: "☸️ Kubernetes Integration",
        badges: ["Advanced", "2 hours", "Enterprise"],
        breadcrumb: "Start → ... → Kubernetes"
    }
};

/* ====================================
   CONTENT RETRIEVAL SYSTEM
   Objective: Load educational content from embedded database
   Docs: Retrieves content from hidden contentDatabase div based on
         node ID and tab selection, avoiding external file dependencies
   ==================================== */
function getContentFromHTML(nodeId, tabName) {
    const contentDatabase = document.getElementById('contentDatabase');
    if (!contentDatabase) {
        console.error('Content database not loaded yet');
        return '<p>Loading content...</p>';
    }
    
    const nodeContent = contentDatabase.querySelector(`div[data-node="${nodeId}"]`);
    if (!nodeContent) {
        console.error(`No content found for node: ${nodeId}`);
        return '<p>Content not found</p>';
    }
    
    const tabContent = nodeContent.querySelector(`div[data-tab="${tabName}"]`);
    if (!tabContent) {
        console.error(`No ${tabName} content found for node: ${nodeId}`);
        return '<p>Tab content not found</p>';
    }
    
    return tabContent.innerHTML;
}

/* ====================================
   NODE SELECTION AND INTERACTION
   Objective: Handle user clicks on diagram nodes
   Docs: Manages node selection, visual state updates, and content loading
         Updates active states and triggers content panel updates
   ==================================== */
function selectNode(nodeId) {
    // Remove active class from all nodes
    document.querySelectorAll('.node').forEach(node => {
        node.classList.remove('active');
    });
    
    // Add active class to selected node
    const selectedNode = document.querySelector(`g[onclick="selectNode('${nodeId}')"]`);
    if (selectedNode) {
        selectedNode.classList.add('active');
    }
    
    currentNode = nodeId;
    updateInfoPanel();
    
    // Show detail button for complex topics
    if (['images', 'compose', 'volumes', 'network'].includes(nodeId)) {
        document.getElementById('detailBtn').style.display = 'block';
    } else {
        document.getElementById('detailBtn').style.display = 'none';
    }
}

/* ====================================
   INFORMATION PANEL MANAGEMENT
   Objective: Update content panel based on selected node and tab
   Docs: Updates header information, badges, breadcrumbs, and loads
         appropriate educational content for the selected topic
   ==================================== */
function updateInfoPanel() {
    if (!currentNode || !nodeMetadata[currentNode]) return;
    
    const data = nodeMetadata[currentNode];
    
    // Update header information
    document.getElementById('infoTitle').textContent = data.title;
    
    // Update learning badges
    const badgesHtml = data.badges.map(badge => 
        `<span class="info-badge">${badge}</span>`
    ).join('');
    document.getElementById('infoBadges').innerHTML = badgesHtml;
    
    // Update breadcrumb navigation
    document.getElementById('breadcrumb').innerHTML = 
        data.breadcrumb.split(' → ').map((item, index) => 
            index === data.breadcrumb.split(' → ').length - 1 
                ? `<span>${item}</span>` 
                : item
        ).join(' → ');
    
    // Show tabbed interface
    document.getElementById('tabContainer').style.display = 'flex';
    
    // Load and display current tab content
    showTab(currentTab);
}

/* ====================================
   TAB SWITCHING FUNCTIONALITY
   Objective: Handle content type switching (Concept/Practical/Troubleshoot)
   Docs: Updates tab visual states and loads corresponding content from
         the embedded database for the current topic
   ==================================== */
function showTab(tabName) {
    if (!currentNode || !nodeMetadata[currentNode]) return;
    
    currentTab = tabName;
    
    // Update active tab styling
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeTab = document.querySelector(`button[onclick="showTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Load content from embedded database
    const content = getContentFromHTML(currentNode, tabName);
    document.getElementById('infoContent').innerHTML = 
        `<div class="tab-content active fade-in">${content}</div>`;
}

/* ====================================
   DIAGRAM LAYER MANAGEMENT
   Objective: Switch between overview and detailed diagram views
   Docs: Controls visibility of different SVG layers and manages
         the transition between high-level and detailed learning paths
   ==================================== */
function showLayer(layer) {
    currentLayer = layer;
    
    // Update control button states
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Toggle layer visibility
    if (layer === 'overview') {
        document.getElementById('overviewLayer').style.display = 'block';
        document.getElementById('detailLayer').style.display = 'none';
    } else if (layer === 'detail') {
        document.getElementById('overviewLayer').style.display = 'none';
        document.getElementById('detailLayer').style.display = 'block';
        showDetailedView();
    }
}

/* ====================================
   DETAILED VIEW FUNCTIONALITY
   Objective: Show expanded learning paths for complex topics
   Docs: Placeholder for future implementation of detailed sub-topic views
   ==================================== */
function showDetailedView() {
    console.log('Showing detailed view for:', currentNode);
    // Implementation for detailed view would go here
    // Could include sub-topics, step-by-step breakdowns, etc.
}

/* ====================================
   VIEW RESET FUNCTIONALITY
   Objective: Return platform to initial welcome state
   Docs: Clears all selections, resets UI elements, and shows welcome content
   ==================================== */
function resetView() {
    // Reset to overview layer
    document.getElementById('overviewLayer').style.display = 'block';
    document.getElementById('detailLayer').style.display = 'none';
    
    // Clear all node selections
    document.querySelectorAll('.node').forEach(node => {
        node.classList.remove('active');
    });
    
    currentNode = null;
    
    // Reset information panel to welcome state
    document.getElementById('infoTitle').textContent = 'Welcome to Your Docker Journey! 🎯';
    document.getElementById('infoBadges').innerHTML = 
        '<span class="info-badge">Beginner Friendly</span><span class="info-badge">Hands-On</span>';
    document.getElementById('breadcrumb').innerHTML = 
        '<span>Start</span> → Select a topic to begin';
    document.getElementById('tabContainer').style.display = 'none';
    
    // Display welcome content with platform instructions
    document.getElementById('infoContent').innerHTML = `
        <div class="info-section fade-in">
            <h3>🎯 How This Works</h3>
            <p>This interactive diagram will guide you through Docker step-by-step:</p>
            <ol class="step-list">
                <li><strong>Click any topic</strong> in the diagram to start learning</li>
                <li><strong>Follow the numbered path</strong> for the recommended learning order</li>
                <li><strong>Each topic has 3 tabs:</strong> Concept (theory), Practical (hands-on), Troubleshoot (common issues)</li>
                <li><strong>Use "Detailed Steps"</strong> button to see sub-topics for deeper learning</li>
            </ol>
            
            <div class="tip-box">
                <strong>💡 Pro Tip:</strong> Keep a terminal open and try commands as you learn!
            </div>

            <h3>📋 Prerequisites</h3>
            <ul>
                <li>✅ Basic command line knowledge</li>
                <li>✅ A computer with admin access</li>
                <li>✅ Internet connection for downloads</li>
                <li>✅ 4GB+ RAM recommended</li>
            </ul>

            <div class="success-box">
                <strong>Ready?</strong> Click "🚀 Install Docker" to begin your journey!
            </div>
        </div>
    `;
}

/* ====================================
   APPLICATION INITIALIZATION
   Objective: Set up platform when page loads
   Docs: Ensures DOM is ready before initializing the learning platform
   ==================================== */
document.addEventListener('DOMContentLoaded', function() {
    resetView();
});
