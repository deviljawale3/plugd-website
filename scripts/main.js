// Main JavaScript for PLUGD Website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initNavigation();
    initCounterAnimation();
    initScrollAnimations();
    initProductFilters();
    initMobileMenu();
    initSmoothScrolling();
    initParticleEffects();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 255, 127, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Active nav link highlighting
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function highlightActiveLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightActiveLink);
}

// Counter animation for hero stats
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const increment = target / 100;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current).toLocaleString();
        }, 20);
    };

    // Intersection Observer for counter animation
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                animateCounter(counter);
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Add fade-in class to elements that should animate
    const animateElements = document.querySelectorAll('.feature-card, .product-card, .section-header');
    animateElements.forEach(element => {
        element.classList.add('fade-in');
        observer.observe(element);
    });
}

// Product filtering
function initProductFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(filterBtn => filterBtn.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            productCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navAuth = document.querySelector('.nav-auth');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        
        // Create mobile menu if it doesn't exist
        if (!document.querySelector('.mobile-menu')) {
            createMobileMenu();
        }
        
        const mobileMenu = document.querySelector('.mobile-menu');
        mobileMenu.classList.toggle('active');
    });

    function createMobileMenu() {
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = `
            <div class="mobile-menu-content">
                <ul class="mobile-nav-menu">
                    <li><a href="#home" class="mobile-nav-link">Home</a></li>
                    <li><a href="#products" class="mobile-nav-link">Products</a></li>
                    <li><a href="#ai-features" class="mobile-nav-link">AI Features</a></li>
                    <li><a href="#about" class="mobile-nav-link">About</a></li>
                    <li><a href="#contact" class="mobile-nav-link">Contact</a></li>
                </ul>
                <div class="mobile-nav-auth">
                    <button class="btn-secondary">Login</button>
                    <button class="btn-primary">Sign Up</button>
                </div>
            </div>
        `;
        document.body.appendChild(mobileMenu);

        // Add click handlers for mobile menu links
        const mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
}

// Smooth scrolling
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Particle effects for enhanced visual appeal
function initParticleEffects() {
    createFloatingParticles();
}

function createFloatingParticles() {
    const hero = document.querySelector('.hero');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(0, 255, 127, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            pointer-events: none;
            animation: floatParticle ${Math.random() * 10 + 10}s infinite linear;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            z-index: 1;
        `;
        hero.appendChild(particle);
    }
}

// Add CSS animations for particles
const style = document.createElement('style');
style.textContent = `
    @keyframes floatParticle {
        0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
            opacity: 0;
        }
    }

    .mobile-menu {
        position: fixed;
        top: 80px;
        left: 0;
        width: 100%;
        height: calc(100vh - 80px);
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        z-index: 999;
        transform: translateY(-100%);
        opacity: 0;
        transition: all 0.3s ease-in-out;
    }

    .mobile-menu.active {
        transform: translateY(0);
        opacity: 1;
    }

    .mobile-menu-content {
        padding: 2rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    .mobile-nav-menu {
        list-style: none;
        margin-bottom: 2rem;
    }

    .mobile-nav-menu li {
        margin-bottom: 1.5rem;
    }

    .mobile-nav-link {
        font-size: 1.2rem;
        font-weight: 600;
        text-decoration: none;
        color: var(--dark-color);
        transition: color 0.3s ease;
    }

    .mobile-nav-link:hover {
        color: var(--primary-color);
    }

    .mobile-nav-auth {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 200px;
    }

    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }

    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }

    /* Enhanced button interactions */
    .btn-primary, .btn-secondary, .btn-outline {
        position: relative;
        overflow: hidden;
    }

    .btn-primary::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
        z-index: 1;
    }

    .btn-primary:hover::before {
        width: 200px;
        height: 200px;
    }

    .btn-primary span {
        position: relative;
        z-index: 2;
    }

    /* Product card hover effects */
    .product-card {
        transform-style: preserve-3d;
    }

    .product-card:hover {
        transform: translateY(-10px) rotateX(5deg);
    }

    /* Loading animation for buttons */
    .btn-loading {
        position: relative;
        color: transparent !important;
    }

    .btn-loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Enhanced scroll indicators */
    .scroll-indicator {
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 3px;
        background: var(--gradient-primary);
        z-index: 1001;
        transition: width 0.3s ease;
    }
`;
document.head.appendChild(style);

// Scroll progress indicator
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-indicator';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (window.scrollY / scrollTotal) * 100;
        progressBar.style.width = `${scrollProgress}%`;
    });
}

// Initialize scroll progress
initScrollProgress();

// Enhanced loading states for buttons
function addLoadingState(button) {
    button.classList.add('btn-loading');
    button.disabled = true;
    
    setTimeout(() => {
        button.classList.remove('btn-loading');
        button.disabled = false;
    }, 2000);
}

// Add click handlers for buttons
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-primary, .btn-secondary, .btn-outline')) {
        addLoadingState(e.target);
    }
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
window.addEventListener('scroll', debounce(() => {
    // Scroll-dependent functions here
}, 10));

// Add entrance animations for better UX
function addEntranceAnimations() {
    const elements = document.querySelectorAll('.hero-content, .hero-visual, .feature-card, .product-card');
    
    elements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.1}s`;
        element.classList.add('animate-entrance');
    });
}

// Initialize entrance animations
setTimeout(addEntranceAnimations, 100);

// Add CSS for entrance animations
const entranceStyle = document.createElement('style');
entranceStyle.textContent = `
    .animate-entrance {
        animation: slideInUp 0.6s ease-out both;
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Enhanced visual feedback */
    .feature-card:hover .feature-icon {
        transform: scale(1.1) rotate(5deg);
        transition: transform 0.3s ease;
    }

    .product-card:hover .product-image {
        transform: scale(1.05);
        transition: transform 0.3s ease;
    }

    /* Improved accessibility */
    .btn-primary:focus,
    .btn-secondary:focus,
    .btn-outline:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;
document.head.appendChild(entranceStyle);
