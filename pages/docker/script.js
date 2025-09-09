// Global variables
let currentNode = null;
let currentLayer = 'overview';
let currentTab = 'concept';

// Node metadata (content is loaded from content.html)
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

// Function to get content from the loaded HTML
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

// Core functions
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

function updateInfoPanel() {
    if (!currentNode || !nodeMetadata[currentNode]) return;
    
    const data = nodeMetadata[currentNode];
    
    // Update header
    document.getElementById('infoTitle').textContent = data.title;
    
    // Update badges
    const badgesHtml = data.badges.map(badge => 
        `<span class="info-badge">${badge}</span>`
    ).join('');
    document.getElementById('infoBadges').innerHTML = badgesHtml;
    
    // Update breadcrumb
    document.getElementById('breadcrumb').innerHTML = 
        data.breadcrumb.split(' → ').map((item, index) => 
            index === data.breadcrumb.split(' → ').length - 1 
                ? `<span>${item}</span>` 
                : item
        ).join(' → ');
    
    // Show tabs
    document.getElementById('tabContainer').style.display = 'flex';
    
    // Update content
    showTab(currentTab);
}

function showTab(tabName) {
    if (!currentNode || !nodeMetadata[currentNode]) return;
    
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeTab = document.querySelector(`button[onclick="showTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Get content from HTML file
    const content = getContentFromHTML(currentNode, tabName);
    document.getElementById('infoContent').innerHTML = 
        `<div class="tab-content active fade-in">${content}</div>`;
}

function showLayer(layer) {
    currentLayer = layer;
    
    // Update control buttons
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide layers
    if (layer === 'overview') {
        document.getElementById('overviewLayer').style.display = 'block';
        document.getElementById('detailLayer').style.display = 'none';
    } else if (layer === 'detail') {
        document.getElementById('overviewLayer').style.display = 'none';
        document.getElementById('detailLayer').style.display = 'block';
        showDetailedView();
    }
}

function showDetailedView() {
    console.log('Showing detailed view for:', currentNode);
    // Implementation for detailed view would go here
}

function resetView() {
    // Reset to overview
    showLayer('overview');
    
    // Clear selection
    document.querySelectorAll('.node').forEach(node => {
        node.classList.remove('active');
    });
    
    currentNode = null;
    
    // Reset info panel
    document.getElementById('infoTitle').textContent = 'Welcome to Your Docker Journey! 🎯';
    document.getElementById('infoBadges').innerHTML = 
        '<span class="info-badge">Beginner Friendly</span><span class="info-badge">Hands-On</span>';
    document.getElementById('breadcrumb').innerHTML = 
        '<span>Start</span> → Select a topic to begin';
    document.getElementById('tabContainer').style.display = 'none';
    
    // Reset to welcome content
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
    
    // Hide detail button
    document.getElementById('detailBtn').style.display = 'none';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    resetView();
});
