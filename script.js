// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Navigation Menu Toggle
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileNavMenu = document.getElementById('mobile-nav-menu');

if (mobileMenuToggle && mobileNavMenu) {
    mobileMenuToggle.addEventListener('click', function() {
        mobileMenuToggle.classList.toggle('active');
        mobileNavMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (mobileNavMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', function() {
            mobileMenuToggle.classList.remove('active');
            mobileNavMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close mobile menu when clicking outside
    mobileNavMenu.addEventListener('click', function(e) {
        if (e.target === mobileNavMenu) {
            mobileMenuToggle.classList.remove('active');
            mobileNavMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.getElementById('navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all elements with fade-in class
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Add floating particles effect to hero section
function createParticles() {
    const hero = document.querySelector('.hero');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            animation: float ${Math.random() * 10 + 10}s infinite linear;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 10}s;
        `;
        hero.appendChild(particle);
    }
}

// Add CSS for particle animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes float {
        0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-1000px) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(particleStyle);

// Initialize particles after page load
window.addEventListener('load', createParticles);

// Add interactive hover effects for cards
document.querySelectorAll('.experience-card, .skill-category, .education-card, .knowledge-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
        this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
    });
});

// Add typing effect to hero subtitle
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Initialize typing effect after a delay
setTimeout(() => {
    const subtitle = document.querySelector('.hero .subtitle');
    const originalText = subtitle.textContent;
    typeWriter(subtitle, originalText, 80);
}, 1000);

// Add skill level indicators with animation
document.querySelectorAll('.skill-item').forEach((skill, index) => {
    skill.addEventListener('mouseenter', function() {
        this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.style.color = 'white';
        this.style.transform = 'scale(1.1)';
    });

    skill.addEventListener('mouseleave', function() {
        this.style.background = '#f8f9fa';
        this.style.color = '#333';
        this.style.transform = 'scale(1)';
    });
});

// Add progress bars for skill categories (simulated expertise levels)
const skillLevels = {
    'Python': 95,
    'Machine Learning': 90,
    'Azure': 85,
    'Power Automate': 90,
    'SQL': 88,
    'Data Analysis': 92,
    'RPA': 87,
    'Deep Learning': 82
};

// Add loading animation to hero
window.addEventListener('load', function() {
    const heroContent = document.querySelector('.hero-content');
    heroContent.style.animation = 'fadeInUp 1.5s ease-out';
});

// Add scroll-triggered counter animation for experience years
function animateCounter(element, start, end, duration) {
    let startTime = null;
    function animate(currentTime) {
        if (startTime === null) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

// Knowledge sharing section click handlers
document.querySelectorAll('.knowledge-card a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const area = this.getAttribute('href').substring(1);
        
        // Show modal or redirect to knowledge area
        showKnowledgeModal(area);
    });
});

function showKnowledgeModal(area) {
    const modal = document.createElement('div');
    modal.className = 'knowledge-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${getKnowledgeTitle(area)}</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p>This section is under development. Here you'll find:</p>
                <ul>
                    ${getKnowledgeContent(area)}
                </ul>
                <p><strong>Coming soon:</strong> Interactive tutorials, code examples, and detailed guides.</p>
                <p>For immediate consultation or questions, please contact me directly.</p>
            </div>
            <div class="modal-footer">
                <a href="mailto:nazerof@gmail.com" class="btn btn-primary">
                    <i class="fas fa-envelope"></i> Contact for More Info
                </a>
            </div>
        </div>
    `;

    // Add modal styles
    const modalStyles = `
        .knowledge-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            border-bottom: 1px solid #eee;
            padding-bottom: 1rem;
        }
        .close-modal {
            font-size: 2rem;
            cursor: pointer;
            color: #666;
        }
        .close-modal:hover {
            color: #333;
        }
        .modal-body ul {
            margin: 1rem 0;
            padding-left: 1.5rem;
        }
        .modal-body li {
            margin-bottom: 0.5rem;
        }
        .modal-footer {
            margin-top: 2rem;
            text-align: center;
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;

    if (!document.querySelector('#modal-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'modal-styles';
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }

    document.body.appendChild(modal);

    // Close modal handlers
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function getKnowledgeTitle(area) {
    const titles = {
        'rpa-knowledge': 'RPA & Process Automation',
        'ml-knowledge': 'Machine Learning & Data Science',
        'cloud-knowledge': 'Azure & Cloud Solutions',
        'forecasting-knowledge': 'Time Series & Forecasting',
        'cv-knowledge': 'Computer Vision & OCR',
        'education-knowledge': 'STEM Education & Mentoring'
    };
    return titles[area] || 'Knowledge Area';
}

function getKnowledgeContent(area) {
    const content = {
        'rpa-knowledge': `
            <li>Power Automate flow development and best practices</li>
            <li>End-to-end RPA system design and implementation</li>
            <li>Process optimization and automation strategies</li>
            <li>OCR integration and document processing</li>
            <li>Error handling and monitoring in automation</li>
        `,
        'ml-knowledge': `
            <li>Machine learning algorithm selection and implementation</li>
            <li>Data preprocessing and feature engineering techniques</li>
            <li>Model evaluation and validation strategies</li>
            <li>Time series analysis and forecasting methods</li>
            <li>MLOps and model deployment best practices</li>
        `,
        'cloud-knowledge': `
            <li>Azure services architecture and integration</li>
            <li>Data pipeline design with Azure Data Factory</li>
            <li>Cloud security and access management</li>
            <li>Scalable analytics solutions</li>
            <li>Cost optimization strategies</li>
        `,
        'forecasting-knowledge': `
            <li>Time series decomposition and analysis</li>
            <li>ARIMA, Prophet, and advanced forecasting models</li>
            <li>Supply chain forecasting applications</li>
            <li>Seasonality and trend analysis</li>
            <li>Forecast accuracy measurement and improvement</li>
        `,
        'cv-knowledge': `
            <li>Image processing and computer vision techniques</li>
            <li>Object detection and classification models</li>
            <li>OCR implementation and optimization</li>
            <li>Automated document processing workflows</li>
            <li>Quality control and validation systems</li>
        `,
        'education-knowledge': `
            <li>STEM curriculum design and implementation</li>
            <li>Student mentoring and project guidance</li>
            <li>Educational technology integration</li>
            <li>Assessment design and evaluation</li>
            <li>Leadership in academic environments</li>
        `
    };
    return content[area] || '<li>Comprehensive knowledge and experience</li>';
}

// Add smooth reveal animations on scroll
const revealElements = document.querySelectorAll('.fade-in');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
        }
    });
}, { threshold: 0.2 });

revealElements.forEach(el => revealObserver.observe(el));
