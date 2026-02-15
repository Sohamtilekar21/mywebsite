const dayData = [
    { title: "Student @ UNSW", desc: "CTRL + C & CTRL + V  Expert", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500" },
    { title: "Chess Trainer", desc: "Teaching tactics and high-level strategy.", img: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=500" },
    { title: "SQL & Assembly", desc: "IDK how any of these work.", img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=500" },
    { title: "Runner & Reader", desc: "Running from problems, reading for more problems.", img: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=500" }
];

const nightData = [
    { title: "I am Batman", desc: "Saving Gotham from Joker.", img: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=500" },
    { title: "Rage Queueing Val", desc: "Hardstuck Silver and fighting for my life.", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500" },
    { title: "Elo Terrorist", desc: "-200 RR in a single sitting. Pawns go BRRRRRR HaHa.", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500" },
    { title: "Binge Watcher", desc: "Suits and Game of Thrones enthusiast.", img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=500" }
];

const toggle = document.getElementById('mode-toggle');
const heroText = document.getElementById('hero-text');
const grid = document.getElementById('main-content');
const unswInfo = document.getElementById('unsw-info');
const daysDisplay = document.getElementById('days-count');

// --- Survival Counter Logic ---
function updateCounter() {
    const startDate = new Date('2025-09-15'); // T1 2024 Start
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    daysDisplay.innerText = diffDays;
}

// --- Content Update Logic ---
function renderCards(isNight) {
    const data = isNight ? nightData : dayData;
    grid.style.opacity = 0; // Fade out effect
    
    setTimeout(() => {
        grid.innerHTML = data.map(item => `
            <div class="card">
                <img src="${item.img}" alt="${item.title}">
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
            </div>
        `).join('');
        grid.style.opacity = 1;
    }, 200);

    unswInfo.style.display = isNight ? 'none' : 'block';
}

toggle.addEventListener('change', function() {
    const isNight = this.checked;
    document.body.classList.toggle('dark-mode', isNight);
    
    if (isNight) {
        heroText.innerHTML = 'Saving Gotham <span>during the night.</span>';
    } else {
        heroText.innerHTML = 'Studying Software Engineering at UNSW <span>during the day.</span>';
    }
    
    renderCards(isNight);
});

// Init
updateCounter();
renderCards(false);
grid.style.transition = "opacity 0.3s ease";
