const dayData = [
    { title: "Student @ UNSW", desc: "CTRL + C & CTRL + V Expert", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500" },
    { title: "SQL & Assembly", desc: "IDK how any of these work.", img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=500" },
    { title: "Runner & Reader", desc: "Running from problems, reading for more problems.", img: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=500" }
];

const nightData = [
    { title: "Rage Queueing Val", desc: "Hardstuck Silver and fighting for my life.", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500" },
    { title: "Elo Terrorist", desc: "-200 RR in a single sitting. Pawns go BRRRRRR HaHa.", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500" },
    { title: "Binge Watcher", desc: "Suits and Game of Thrones enthusiast.", img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=500" }
];

// Edit this array to add/remove project cards — same markup and CSS classes
// as before, just generated instead of hand-written in index.html.
const projectsData = [
    { title: "EnviRobots 🥇", desc: "Built a rugged tank-style robot from scratch to handle arena surveillance and real-time data collection. During live testing, it logged 10/11 accurate readings, which I turned into a winning case study presentation for a panel of judges.", link: "https://lnkd.in/p/gtYfbNyq" },
    { title: "Closet Ninja 🥉", desc: "ClosetNinja turns your physical wardrobe into a smart digital closet, tracking what you actually wear so unused clothes don't just rot in your closet. It helps you shop smarter by converting price tags into hours worked, giving forgotten items a second life through outfit suggestions, and making it easy to donate or repair what you don't use.", link: "https://github.com/Sohamtilekar21/CSE_soc_hackathon_2026" },
    { title: "Refract", desc: "A shared, role-aware translation layer for cross-functional teams. Highlight any phrase in a team chat or a doc — get an explanation reframed for your discipline plus the second-order impact for your work, grounded in the team's context brief.", link: "https://github.com/AdityaSanap1821/CtxBridge" }
];

const toggle = document.getElementById('mode-toggle');
const heroText = document.getElementById('hero-text');
const grid = document.getElementById('main-content');
const daysDisplay = document.getElementById('days-count');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const projectGrid = document.getElementById('project-grid');

// --- Survival counter ---
function updateCounter() {
    const startDate = new Date('2025-09-15'); // T3 2025 start
    const diffDays = Math.floor(Math.abs(new Date() - startDate) / (1000 * 60 * 60 * 24));
    daysDisplay.innerText = String(diffDays).padStart(3, '0');
}

// --- Activity cards ---
function renderCards(isNight) {
    const data = isNight ? nightData : dayData;
    grid.style.opacity = 0;
    setTimeout(() => {
        grid.innerHTML = data.map(item => `
            <div class="card">
                <img src="${item.img}" alt="${item.title}" loading="lazy">
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
            </div>
        `).join('');
        grid.style.opacity = 1;
    }, 200);
}

// --- Project cards ---
function renderProjects() {
    if (!projectGrid) return;
    projectGrid.innerHTML = projectsData.map(p => `
        <a class="project-card" href="${p.link}" target="_blank" rel="noopener">
            <span class="corner"></span>
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
            <span class="project-link">View repo →</span>
        </a>
    `).join('');
}

// --- Persisted day/night preference ---
const savedMode = localStorage.getItem('mode');
const startNight = savedMode === 'night';

function applyMode(isNight, persist) {
    document.body.classList.toggle('dark-mode', isNight);
    toggle.checked = isNight;
    heroText.innerHTML = isNight
        ? 'Saving Gotham <span>during the night.</span>'
        : 'Studying Software Engineering at UNSW <span>during the day.</span>';
    renderCards(isNight);
    if (window.setGlobeNight) window.setGlobeNight(isNight);
    if (persist) localStorage.setItem('mode', isNight ? 'night' : 'day');
}

toggle.addEventListener('change', function () {
    applyMode(this.checked, true);
});

// --- Mobile nav ---
if (navToggle) {
    navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    }));
}

// --- Init ---
updateCounter();
grid.style.transition = "opacity 0.3s ease";
renderProjects();
applyMode(startNight, false);