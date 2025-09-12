// script.js - Docker Interactive Diagram JavaScript

// Docker Learning Application
class DockerLearningApp {
    constructor() {
        this.currentNode = null;
        this.currentLayer = 'overview';
        this.currentTab = 'concept';
        this.currentStyle = 'modern';
        this.showSubtitles = true;
        this.completedNodes = new Set();
        
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.renderOverviewLayer();
        this.setupKeyboardShortcuts();
        this.loadProgress();
    }

    // Node data structure
    nodeData = {
        install: {
            id: 'install',
            title: 'Install Docker',
            icon: '🚀',
            subtitle: 'Setup & Configuration',
            position: { x: 150, y: 150 },
            badges: ['Essential', '15 mins', 'Platform Specific'],
            connections: ['basics'],
            content: {
                concept: `
                    <h3>🤔 What is Docker?</h3>
                    <p>Docker is a platform that packages your application and all its dependencies into a "container" - think of it as a lightweight, portable box that runs the same everywhere.</p>
                    
                    <h3>❓ Why Docker Matters</h3>
                    <ul>
                        <li><strong>No more "works on my machine"</strong> - Containers run identically everywhere</li>
                        <li><strong>Instant environment setup</strong> - New team members productive in minutes</li>
                        <li><strong>Resource efficient</strong> - Unlike VMs, containers share the host OS kernel</li>
                    </ul>

                    <div class="tip-box">
                        <strong>💡 Key Insight:</strong> Docker containers are NOT virtual machines. They're much lighter and faster!
                    </div>
                `,
                practical: `
                    <h3>🛠️ Installation Steps</h3>
                    <ol class="step-list">
                        <li>
                            <strong>Download Docker Desktop</strong>
                            <div class="code-block" data-language="bash">
# For Windows/Mac: Visit docker.com/products/docker-desktop
# For Linux Ubuntu/Debian:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh</div>
                        </li>
                        <li>
                            <strong>Verify Installation</strong>
                            <div class="code-block" data-language="bash">
docker --version
# Expected: Docker version 24.x.x, build xxxxx</div>
                        </li>
                        <li>
                            <strong>Test with Hello World</strong>
                            <div class="code-block" data-language="bash">
docker run hello-world
# This downloads a test image and runs it</div>
                        </li>
                    </ol>
                    <div class="success-box">
                        <strong>✅ Success!</strong>
                        <p>If you see "Hello from Docker!" - you're ready to go!</p>
                    </div>
                `,
                troubleshoot: `
                    <h3>🔧 Common Installation Issues</h3>
                    
                    <h4>❌ "Cannot connect to Docker daemon"</h4>
                    <div class="code-block" data-language="bash">
# Fix: Start Docker service
sudo systemctl start docker
# Or on Mac/Windows: Open Docker Desktop app</div>

                    <h4>❌ "Permission denied" on Linux</h4>
                    <div class="code-block" data-language="bash">
# Fix: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker  # Or logout/login</div>

                    <h4>❌ WSL2 Issues on Windows</h4>
                    <div class="warning-box">
                        <strong>Fix Required:</strong>
                        <p>Enable WSL2 in Windows Features, install WSL2 kernel update from Microsoft</p>
                    </div>
                `
            }
        },
        basics: {
            id: 'basics',
            title: 'Container Basics',
            icon: '📦',
            subtitle: 'Core Commands & Concepts',
            position: { x: 400, y: 150 },
            badges: ['Core Skills', '30 mins', 'Hands-On'],
            connections: ['images', 'network'],
            content: {
                concept: `
                    <h3>🎯 Container Fundamentals</h3>
                    <p>Containers are running instances of Docker images. Think of it this way:</p>
                    <ul>
                        <li><strong>Image</strong> = Recipe/Blueprint (like a class in programming)</li>
                        <li><strong>Container</strong> = Actual dish/Instance (like an object)</li>
                        <li><strong>Registry</strong> = Cookbook library (Docker Hub)</li>
                    </ul>
                `,
                practical: `
                    <h3>💻 Essential Docker Commands</h3>
                    
                    <h4>1️⃣ Pull an Image</h4>
                    <div class="code-block" data-language="bash">
# Download nginx web server image
docker pull nginx:latest

# List downloaded images
docker images</div>

                    <h4>2️⃣ Run Your First Container</h4>
                    <div class="code-block" data-language="bash">
# Run nginx in foreground (Ctrl+C to stop)
docker run nginx

# Run in background (detached)
docker run -d nginx

# Run with port mapping (host:container)
docker run -d -p 8080:80 nginx
# Visit http://localhost:8080</div>
                `,
                troubleshoot: `
                    <h3>🔧 Common Container Issues</h3>
                    
                    <h4>❌ Container exits immediately</h4>
                    <p>Check logs to see why:</p>
                    <div class="code-block" data-language="bash">
docker logs [container_id]
# Look for error messages</div>
                `
            }
        },
        images: {
            id: 'images',
            title: 'Build Images',
            icon: '🏗️',
            subtitle: 'Dockerfile & Layers',
            position: { x: 650, y: 150 },
            badges: ['Essential', '45 mins', 'Creative'],
            connections: ['compose', 'registry'],
            content: {
                concept: `
                    <h3>🎨 Understanding Docker Images</h3>
                    <p>Images are the blueprints for containers. They contain:</p>
                    <ul>
                        <li><strong>Base OS:</strong> Minimal Linux distribution</li>
                        <li><strong>Runtime:</strong> Language/framework (Node.js, Python, Java)</li>
                        <li><strong>Application Code:</strong> Your actual application</li>
                        <li><strong>Configuration:</strong> Environment variables, exposed ports</li>
                    </ul>
                `,
                practical: `
                    <h3>🛠️ Create Your First Image</h3>
                    
                    <h4>1️⃣ Write Dockerfile</h4>
                    <div class="code-block" data-language="dockerfile">
# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching!)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Define startup command
CMD ["npm", "start"]</div>
                `,
                troubleshoot: `
                    <h3>🔧 Image Building Issues</h3>
                    
                    <h4>❌ "COPY failed: no such file"</h4>
                    <div class="code-block" data-language="bash">
# Ensure you're in the right directory
ls -la  # Check files exist
docker build -t myapp .  # Note the dot!</div>
                `
            }
        },
        compose: {
            id: 'compose',
            title: 'Docker Compose',
            icon: '🎼',
            subtitle: 'Multi-Container Apps',
            position: { x: 650, y: 350 },
            badges: ['Multi-Container', '1 hour', 'Real-World'],
            connections: ['production'],
            content: {
                concept: `
                    <h3>🎭 Why Docker Compose?</h3>
                    <p>Managing multiple containers with docker run commands becomes complex. Docker Compose lets you:</p>
                    <ul>
                        <li><strong>Define</strong> multi-container apps in one YAML file</li>
                        <li><strong>Start/Stop</strong> everything with one command</li>
                        <li><strong>Set up</strong> networks and volumes automatically</li>
                    </ul>
                `,
                practical: `
                    <h3>💻 Build a Full Stack App</h3>
                    
                    <h4>1️⃣ Create docker-compose.yml</h4>
                    <div class="code-block" data-language="yaml">
version: '3.8'

services:
  frontend:
    image: node:18-alpine
    ports:
      - "3000:3000"
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=database
  
  database:
    image: mysql:8
    environment:
      - MYSQL_ROOT_PASSWORD=secret
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:</div>
                `,
                troubleshoot: `
                    <h3>🔧 Compose Troubleshooting</h3>
                    
                    <h4>❌ Services can't communicate</h4>
                    <p>Use service names as hostnames:</p>
                    <div class="code-block" data-language="bash">
# Wrong: localhost or 127.0.0.1
mysql://localhost:3306

# Correct: service name
mysql://database:3306</div>
                `
            }
        },
        volumes: {
            id: 'volumes',
            title: 'Data Persistence',
            icon: '💾',
            subtitle: 'Volumes & Storage',
            position: { x: 400, y: 350 },
            badges: ['Storage', '30 mins', 'Critical'],
            connections: ['compose'],
            content: {
                concept: `
                    <h3>💭 The Persistence Problem</h3>
                    <p>Containers are ephemeral - when removed, all data is lost! Volumes solve this:</p>
                    <ul>
                        <li><strong>Persist data</strong> beyond container lifecycle</li>
                        <li><strong>Share data</strong> between containers</li>
                        <li><strong>Decouple</strong> storage from container</li>
                    </ul>
                `,
                practical: `
                    <h3>🛠️ Working with Volumes</h3>
                    
                    <h4>1️⃣ Named Volumes</h4>
                    <div class="code-block" data-language="bash">
# Create a volume
docker volume create mydata

# Use in container
docker run -d -v mydata:/data nginx

# Inspect volume
docker volume inspect mydata</div>
                `,
                troubleshoot: `
                    <h3>🔧 Volume Issues</h3>
                    
                    <h4>❌ Permission denied</h4>
                    <div class="code-block" data-language="bash">
# Check file ownership
docker exec mycontainer ls -la /data

# Fix: Run as specific user
docker run --user 1000:1000 -v mydata:/data myimage</div>
                `
            }
        },
        network: {
            id: 'network',
            title: 'Networking',
            icon: '🌐',
            subtitle: 'Container Communication',
            position: { x: 150, y: 350 },
            badges: ['Networking', '45 mins', 'Advanced'],
            connections: ['volumes'],
            content: {
                concept: `
                    <h3>🔗 Docker Networks Explained</h3>
                    <p>Networks enable container communication:</p>
                    <ul>
                        <li><strong>Bridge:</strong> Default network, containers on same host</li>
                        <li><strong>Host:</strong> Container uses host's network directly</li>
                        <li><strong>None:</strong> No network access</li>
                        <li><strong>Overlay:</strong> Multi-host communication (Swarm)</li>
                    </ul>
                `,
                practical: `
                    <h3>💻 Network Configuration</h3>
                    
                    <h4>1️⃣ Create Custom Networks</h4>
                    <div class="code-block" data-language="bash">
# Create network
docker network create myapp-network

# Run container on network
docker run -d --name web --network myapp-network nginx</div>
                `,
                troubleshoot: `
                    <h3>🔧 Network Troubleshooting</h3>
                    
                    <h4>❌ Cannot connect between containers</h4>
                    <ul>
                        <li>Ensure both on same network</li>
                        <li>Use container name, not localhost</li>
                        <li>Check if service is listening on 0.0.0.0</li>
                    </ul>
                `
            }
        },
        registry: {
            id: 'registry',
            title: 'Registry & CI/CD',
            icon: '📤',
            subtitle: 'Push, Pull, Deploy',
            position: { x: 150, y: 550 },
            badges: ['Deployment', '1 hour', 'Production'],
            connections: ['production'],
            content: {
                concept: `
                    <h3>🏪 Container Registries</h3>
                    <p>Registries store and distribute Docker images:</p>
                    <ul>
                        <li><strong>Docker Hub:</strong> Public registry (default)</li>
                        <li><strong>AWS ECR:</strong> Amazon's private registry</li>
                        <li><strong>Azure ACR:</strong> Microsoft's registry</li>
                        <li><strong>Private:</strong> Self-hosted registry</li>
                    </ul>
                `,
                practical: `
                    <h3>🚀 Push to Registry</h3>
                    
                    <h4>1️⃣ Docker Hub</h4>
                    <div class="code-block" data-language="bash">
# Login
docker login

# Tag image
docker tag myapp:1.0 yourusername/myapp:1.0

# Push
docker push yourusername/myapp:1.0</div>
                `,
                troubleshoot: `
                    <h3>🔧 Registry Issues</h3>
                    
                    <h4>❌ "unauthorized: authentication required"</h4>
                    <div class="code-block" data-language="bash">
# Login again
docker logout
docker login</div>
                `
            }
        },
        production: {
            id: 'production',
            title: 'Production Deploy',
            icon: '⚙️',
            subtitle: 'Best Practices',
            position: { x: 400, y: 550 },
            badges: ['Production', '2 hours', 'Best Practices'],
            connections: ['orchestration'],
            content: {
                concept: `
                    <h3>🏭 Production Considerations</h3>
                    <p>Moving to production requires careful planning:</p>
                    <ul>
                        <li><strong>Security:</strong> Scan images, use secrets management</li>
                        <li><strong>Performance:</strong> Resource limits, health checks</li>
                        <li><strong>Reliability:</strong> Restart policies, logging</li>
                        <li><strong>Monitoring:</strong> Metrics, alerts, tracing</li>
                    </ul>
                `,
                practical: `
                    <h3>🚀 Production-Ready Setup</h3>
                    
                    <h4>1️⃣ Secure Dockerfile</h4>
                    <div class="code-block" data-language="dockerfile">
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
# Create non-root user
RUN adduser -S nodejs -u 1001
USER nodejs
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]</div>
                `,
                troubleshoot: `
                    <h3>🔧 Production Issues</h3>
                    
                    <h4>❌ Container keeps restarting</h4>
                    <div class="code-block" data-language="bash">
# Check logs
docker logs --tail 50 -f container_name

# Check exit code
docker inspect container_name --format='{{.State.ExitCode}}'</div>
                `
            }
        },
        orchestration: {
            id: 'orchestration',
            title: 'Orchestration',
            icon: '☸️',
            subtitle: 'Kubernetes & Scale',
            position: { x: 650, y: 550 },
            badges: ['Kubernetes', 'Advanced', 'Scale'],
            connections: [],
            content: {
                concept: `
                    <h3>🎭 Why Orchestration?</h3>
                    <p>When you have dozens/hundreds of containers across multiple hosts:</p>
                    <ul>
                        <li><strong>Scheduling:</strong> Where should containers run?</li>
                        <li><strong>Scaling:</strong> Auto-scale based on load</li>
                        <li><strong>Healing:</strong> Restart failed containers</li>
                        <li><strong>Updates:</strong> Rolling deployments</li>
                    </ul>
                `,
                practical: `
                    <h3>☸️ Kubernetes Basics</h3>
                    
                    <h4>1️⃣ Deploy to Kubernetes</h4>
                    <div class="code-block" data-language="yaml">
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80</div>
                `,
                troubleshoot: `
                    <h3>🔧 Orchestration Troubleshooting</h3>
                    
                    <h4>❌ Pod stuck in Pending</h4>
                    <div class="code-block" data-language="bash">
# Describe pod for events
kubectl describe pod pod-name

# Common causes:
# - Insufficient resources
# - Image pull errors</div>
                `
            }
        }
    };

    // Render overview layer with nodes
    renderOverviewLayer() {
        const overviewLayer = document.getElementById('overviewLayer');
        overviewLayer.innerHTML = '';
        
        // Render connections first
        this.renderConnections();
        
        // Render nodes
        Object.values(this.nodeData).forEach(node => {
            const nodeElement = this.createNodeElement(node);
            overviewLayer.appendChild(nodeElement);
        });
    }

    // Create node element based on current style
    createNodeElement(node) {
        const div = document.createElement('div');
        div.className = `node-${this.currentStyle}`;
        div.id = `node-${node.id}`;
        div.style.left = `${node.position.x}px`;
        div.style.top = `${node.position.y}px`;
        
        if (this.completedNodes.has(node.id)) {
            div.classList.add('completed');
        }
        
        if (this.showSubtitles) {
            div.classList.add('show-subtitles');
        }
        
        div.onclick = () => this.selectNode(node.id);
        
        // Build node content based on style
        if (this.currentStyle === 'modern') {
            div.innerHTML = `
                <span class="node-icon">${node.icon}</span>
                <div class="node-title">${node.title}</div>
                <div class="node-subtitle">${node.subtitle}</div>
            `;
        } else if (this.currentStyle === 'circular') {
            div.innerHTML = `
                <span class="node-icon">${node.icon}</span>
                <div class="node-title">${node.title}</div>
                <div class="node-subtitle">${node.subtitle}</div>
            `;
        } else if (this.currentStyle === 'mindmap') {
            div.innerHTML = `
                <span class="node-icon">${node.icon}</span>
                <div class="node-content">
                    <div class="node-title">${node.title}</div>
                    <div class="node-subtitle">${node.subtitle}</div>
                </div>
            `;
        }
        
        return div;
    }

    // Render connection lines between nodes
    renderConnections() {
        const svg = document.getElementById('connectionGroup');
        svg.innerHTML = '';
        
        Object.values(this.nodeData).forEach(node => {
            node.connections.forEach(targetId => {
                const target = this.nodeData[targetId];
                if (target) {
                    const line = this.createConnectionLine(node, target);
                    svg.appendChild(line);
                }
            });
        });
    }

    // Create SVG path for connection
    createConnectionLine(fromNode, toNode) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const x1 = fromNode.position.x + 90;
        const y1 = fromNode.position.y + 40;
        const x2 = toNode.position.x + 90;
        const y2 = toNode.position.y + 40;
        
        // Create curved path
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy) / 2;
        
        path.setAttribute('d', `M ${x1},${y1} Q ${(x1 + x2) / 2},${(y1 + y2) / 2 - dr / 4} ${x2},${y2}`);
        path.setAttribute('class', 'connection-line');
        path.setAttribute('id', `line-${fromNode.id}-${toNode.id}`);
        
        return path;
    }

    // Select a node
    selectNode(nodeId) {
        // Remove previous active states
        document.querySelectorAll(`.node-${this.currentStyle}`).forEach(node => {
            node.classList.remove('active');
        });
        
        // Remove active from connection lines
        document.querySelectorAll('.connection-line').forEach(line => {
            line.classList.remove('active');
        });
        
        // Add active state to clicked node
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement) {
            nodeElement.classList.add('active');
        }
        
        // Highlight connected lines
        const node = this.nodeData[nodeId];
        node.connections.forEach(targetId => {
            const line = document.getElementById(`line-${nodeId}-${targetId}`);
            if (line) {
                line.classList.add('active');
            }
        });
        
        // Update current node
        this.currentNode = nodeId;
        
        // Update info panel
        this.updateInfoPanel(node);
        
        // Show detail button
        document.getElementById('detailBtn').style.display = 'inline-flex';
        
        // Update progress
        this.updateProgress();
    }

    // Update info panel with node content
    updateInfoPanel(node) {
        // Update title and badges
        document.getElementById('infoTitle').textContent = `${node.icon} ${node.title}`;
        document.getElementById('infoBadges').innerHTML = node.badges.map(badge => 
            `<span class="info-badge">${badge}</span>`
        ).join('');
        
        // Update breadcrumb
        this.updateBreadcrumb(node);
        
        // Show tabs
        document.getElementById('tabContainer').style.display = 'flex';
        document.getElementById('quickActions').style.display = 'flex';
        
        // Load content for current tab
        this.showTab(this.currentTab);
    }

    // Update breadcrumb navigation
    updateBreadcrumb(node) {
        const breadcrumb = document.getElementById('breadcrumb');
        const path = this.getNodePath(node);
        
        breadcrumb.innerHTML = path.map((item, index) => {
            const isLast = index === path.length - 1;
            return `
                <span class="breadcrumb-item ${isLast ? 'active' : ''}">${item}</span>
                ${!isLast ? '<span class="breadcrumb-separator">→</span>' : ''}
            `;
        }).join('');
    }

    // Get node path for breadcrumb
    getNodePath(node) {
        const path = ['Start'];
        
        // Simple path based on node connections
        if (node.id === 'install') {
            path.push('Install Docker');
        } else if (node.id === 'basics') {
            path.push('Install Docker', 'Container Basics');
        } else if (node.id === 'images') {
            path.push('Install Docker', 'Container Basics', 'Build Images');
        } else {
            path.push('...', node.title);
        }
        
        return path;
    }

    // Show specific tab content
    showTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Find and activate the clicked tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tab)) {
                btn.classList.add('active');
            }
        });
        
        // Load content
        if (this.currentNode && this.nodeData[this.currentNode]) {
            const content = this.nodeData[this.currentNode].content[tab];
            document.getElementById('infoContent').innerHTML = `
                <div class="info-section fade-in">
                    ${content}
                </div>
            `;
        }
    }

    // Change node style
    changeNodeStyle(style) {
        this.currentStyle = style;
        this.renderOverviewLayer();
        
        // Reselect current node if exists
        if (this.currentNode) {
            this.selectNode(this.currentNode);
        }
    }

    // Toggle subtitles
    toggleSubtitles() {
        this.showSubtitles = !this.showSubtitles;
        
        document.querySelectorAll(`.node-${this.currentStyle}`).forEach(node => {
            if (this.showSubtitles) {
                node.classList.add('show-subtitles');
            } else {
                node.classList.remove('show-subtitles');
            }
        });
    }

    // Show layer (overview or detail)
    showLayer(layer) {
        this.currentLayer = layer;
        
        const overviewLayer = document.getElementById('overviewLayer');
        const detailLayer = document.getElementById('detailLayer');
        
        if (layer === 'overview') {
            overviewLayer.style.display = 'block';
            detailLayer.style.display = 'none';
        } else if (layer === 'detail' && this.currentNode) {
            this.renderDetailLayer();
            overviewLayer.style.display = 'none';
            detailLayer.style.display = 'block';
        }
    }

    // Render detail layer for current node
    renderDetailLayer() {
        const detailLayer = document.getElementById('detailLayer');
        detailLayer.innerHTML = '';
        
        if (!this.currentNode) return;
        
        const node = this.nodeData[this.currentNode];
        const details = [
            { title: 'Learn Concepts', icon: '📚', desc: 'Understand the theory' },
            { title: 'Practice Commands', icon: '💻', desc: 'Hands-on exercises' },
            { title: 'Troubleshoot', icon: '🔧', desc: 'Fix common issues' },
            { title: 'Complete Project', icon: '🎯', desc: 'Build something real' }
        ];
        
        details.forEach((detail, index) => {
            const div = document.createElement('div');
            div.className = `node-${this.currentStyle}`;
            div.style.left = `${150 + index * 200}px`;
            div.style.top = '250px';
            
            div.innerHTML = `
                <span class="node-icon">${detail.icon}</span>
                <div class="node-title">${detail.title}</div>
                <div class="node-subtitle">${detail.desc}</div>
            `;
            
            div.onclick = () => {
                document.getElementById('infoContent').innerHTML = `
                    <div class="info-section fade-in">
                        <h3>${detail.icon} ${detail.title}</h3>
                        <p>${detail.desc}</p>
                        <div class="tip-box">
                            <strong>Next Step:</strong> Complete this section to unlock the next topic!
                        </div>
                    </div>
                `;
            };
            
            detailLayer.appendChild(div);
        });
    }

    // Reset view
    resetView() {
        // Reset states
        this.currentNode = null;
        this.currentTab = 'concept';
        this.currentLayer = 'overview';
        
        // Reset UI
        document.querySelectorAll(`.node-${this.currentStyle}`).forEach(node => {
            node.classList.remove('active');
        });
        
        document.querySelectorAll('.connection-line').forEach(line => {
            line.classList.remove('active');
        });
        
        document.getElementById('overviewLayer').style.display = 'block';
        document.getElementById('detailLayer').style.display = 'none';
        document.getElementById('tabContainer').style.display = 'none';
        document.getElementById('detailBtn').style.display = 'none';
        document.getElementById('quickActions').style.display = 'none';
        
        // Reset info panel
        document.getElementById('infoTitle').textContent = 'Welcome to Your Docker Journey! 🎯';
        document.getElementById('breadcrumb').innerHTML = `
            <span class="breadcrumb-item active">Start</span>
            <span class="breadcrumb-separator">→</span>
            <span class="breadcrumb-item">Select a topic to begin</span>
        `;
        document.getElementById('infoBadges').innerHTML = `
            <span class="info-badge">Beginner Friendly</span>
            <span class="info-badge">Hands-On</span>
        `;
        
        // Reset content
        document.getElementById('infoContent').innerHTML = this.getWelcomeContent();
        
        // Reset progress
        this.updateProgress();
    }

    // Get welcome content
    getWelcomeContent() {
        return `
            <div class="info-section fade-in">
                <h3>🎯 How This Interactive Diagram Works</h3>
                <p>This comprehensive learning tool will guide you through Docker step-by-step:</p>
                <ol class="step-list">
                    <li>
                        <strong>Choose Your Visual Style</strong>
                        <p>Select from three node designs: Modern Cards, Circular Segments, or Mind Map</p>
                    </li>
                    <li>
                        <strong>Click Any Topic</strong>
                        <p>Each node reveals detailed information with theory, practice, and troubleshooting</p>
                    </li>
                    <li>
                        <strong>Follow the Learning Path</strong>
                        <p>Progress through topics in the recommended order for optimal learning</p>
                    </li>
                    <li>
                        <strong>Practice As You Learn</strong>
                        <p>Copy commands directly and try them in your terminal</p>
                    </li>
                </ol>
                
                <div class="tip-box">
                    <strong>💡 Pro Tip:</strong> Toggle subtitles on/off for cleaner visualization. Keep a terminal window open alongside this tutorial!
                </div>

                <h3>📋 Prerequisites Check</h3>
                <div class="checklist">
                    <label class="checklist-item">
                        <input type="checkbox">
                        <span>Basic command line knowledge</span>
                    </label>
                    <label class="checklist-item">
                        <input type="checkbox">
                        <span>Computer with admin access</span>
                    </label>
                    <label class="checklist-item">
                        <input type="checkbox">
                        <span>Internet connection for downloads</span>
                    </label>
                    <label class="checklist-item">
                        <input type="checkbox">
                        <span>4GB+ RAM (8GB recommended)</span>
                    </label>
                </div>

                <div class="success-box">
                    <strong>🚀 Ready to Begin?</strong>
                    <p>Click "Install Docker" in the diagram to start your DevOps journey!</p>
                </div>
            </div>
        `;
    }

    // Update progress tracker
    updateProgress() {
        const totalNodes = Object.keys(this.nodeData).length;
        const completedCount = this.completedNodes.size;
        const percentage = (completedCount / totalNodes) * 100;
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            if (completedCount === 0) {
                progressText.textContent = 'Ready to start your Docker journey!';
            } else if (completedCount === totalNodes) {
                progressText.textContent = '🎉 Congratulations! You\'ve completed the Docker learning path!';
            } else {
                progressText.textContent = `Progress: ${completedCount}/${totalNodes} topics completed (${Math.round(percentage)}%)`;
            }
        }
    }

    // Mark current node as complete
    markComplete() {
        if (this.currentNode) {
            this.completedNodes.add(this.currentNode);
            const nodeElement = document.getElementById(`node-${this.currentNode}`);
            if (nodeElement) {
                nodeElement.classList.add('completed');
            }
            this.updateProgress();
            this.saveProgress();
        }
    }

    // Copy code to clipboard
    copyCode() {
        const codeBlocks = document.querySelectorAll('.code-block');
        if (codeBlocks.length > 0) {
            const code = codeBlocks[0].textContent;
            navigator.clipboard.writeText(code).then(() => {
                alert('Code copied to clipboard!');
            });
        }
    }

    // Open resources in new tab
    openInNewTab() {
        window.open('https://docs.docker.com', '_blank');
    }

    // Toggle help overlay
    toggleHelp() {
        const helpOverlay = document.getElementById('helpOverlay');
        helpOverlay.style.display = helpOverlay.style.display === 'none' ? 'flex' : 'none';
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Number keys 1-9 for quick navigation
            if (e.key >= '1' && e.key <= '9') {
                const nodeIds = Object.keys(this.nodeData);
                const index = parseInt(e.key) - 1;
                if (index < nodeIds.length) {
                    this.selectNode(nodeIds[index]);
                }
            }
            
            // Tab key to switch tabs
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const tabs = ['concept', 'practical', 'troubleshoot'];
                const currentIndex = tabs.indexOf(this.currentTab);
                const nextIndex = (currentIndex + 1) % tabs.length;
                this.showTab(tabs[nextIndex]);
            }
            
            // S key to toggle subtitles
            if (e.key === 's' || e.key === 'S') {
                document.getElementById('subtitleToggle').click();
            }
            
            // R key to reset
            if (e.key === 'r' || e.key === 'R') {
                this.resetView();
            }
            
            // ? key for help
            if (e.key === '?') {
                this.toggleHelp();
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            this.adjustDiagramScale();
        });
        
        // Save progress on unload
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
        });
    }

    // Adjust diagram scale for responsive design
    adjustDiagramScale() {
        const container = document.getElementById('diagramContainer');
        const width = container.offsetWidth;
        
        // Adjust node positions based on container width
        if (width < 800) {
            // Mobile view - stack vertically
            Object.values(this.nodeData).forEach((node, index) => {
                node.position = {
                    x: width / 2 - 90,
                    y: 100 + index * 120
                };
            });
            this.renderOverviewLayer();
        }
    }

    // Save progress to localStorage
    saveProgress() {
        const progress = {
            completedNodes: Array.from(this.completedNodes),
            currentNode: this.currentNode,
            currentTab: this.currentTab
        };
        localStorage.setItem('dockerProgress', JSON.stringify(progress));
    }

    // Load progress from localStorage
    loadProgress() {
        const saved = localStorage.getItem('dockerProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.completedNodes = new Set(progress.completedNodes);
            
            // Mark completed nodes
            this.completedNodes.forEach(nodeId => {
                const nodeElement = document.getElementById(`node-${nodeId}`);
                if (nodeElement) {
                    nodeElement.classList.add('completed');
                }
            });
            
            this.updateProgress();
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dockerApp = new DockerLearningApp();
});