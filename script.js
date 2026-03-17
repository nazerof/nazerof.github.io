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

        if (mobileNavMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', function() {
            mobileMenuToggle.classList.remove('active');
            mobileNavMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

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

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Floating particles effect in hero section
function createParticles() {
    const hero = document.querySelector('.hero, .hero-compact, .blog-post-hero, .blog-hero, .article-hero');
    if (!hero) return;
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 3 + 2; // 2-5px
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.4 + 0.3});
            border-radius: 50%;
            pointer-events: none;
            animation: float ${Math.random() * 8 + 6}s infinite linear;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 8}s;
        `;
        hero.appendChild(particle);
    }
}

const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes float {
        0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-400px) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(particleStyle);

window.addEventListener('load', createParticles);

// Card hover effects
document.querySelectorAll('.experience-card, .skill-category, .education-card, .knowledge-card, .project-card, .blog-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
        this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
    });
});

// Typing effect for hero subtitle
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

setTimeout(() => {
    const subtitle = document.querySelector('.hero .subtitle');
    if (subtitle) {
        const originalText = subtitle.textContent;
        typeWriter(subtitle, originalText, 80);
    }
}, 1000);

// Skill item hover effects
document.querySelectorAll('.skill-item').forEach(skill => {
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

// Loading animation
window.addEventListener('load', function() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.animation = 'fadeInUp 1.5s ease-out';
    }
});
