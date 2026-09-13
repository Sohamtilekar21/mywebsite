(function () {
    const overlay = document.getElementById('captcha-overlay');
    const grid = document.getElementById('captcha-grid');
    const closeBtn = document.getElementById('captcha-close');
    const verifyBtn = document.getElementById('captcha-verify');
    const msg = document.getElementById('captcha-msg');
    const resumeLinks = document.querySelectorAll('.js-resume-download');
    if (!overlay || !grid || resumeLinks.length === 0) return;

    const resumeHref = resumeLinks[0].getAttribute('href') || 'assets/resume.pdf';

    const pool = [
        { label: 'UNSW', img: 'assets/captcha/UNSW.jpg', correct: true },
        { label: 'Macquarie', img: 'assets/captcha/MQ.jpg', correct: false },
        { label: 'USYD', img: 'assets/captcha/USYD.jpg', correct: false },
        { label: 'UNSW', img: 'assets/captcha/UNSW-2.jpg', correct: true },
        { label: 'University of Melbourne', img: 'assets/captcha/UNIMELB.jpg', correct: false },
        { label: 'UTS', img: 'assets/captcha/UTS.jpg', correct: false },
        { label: 'WSU', img: 'assets/captcha/WSU.jpg', correct: false },
        { label: 'RMIT', img: 'assets/captcha/RMIT.jpg', correct: false },
        { label: 'GRIFFITH', img: 'assets/captcha/GRIFFITH.jpg', correct: false }
    ];

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function buildGrid() {
        grid.innerHTML = '';
        shuffle(pool).forEach(item => {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = 'captcha-tile';
            tile.dataset.correct = String(item.correct);
            tile.innerHTML = `<span class="captcha-img-wrap"><img class="captcha-img" src="${item.img}" alt="${item.label} hand-drawn logo" loading="lazy"></span><span class="captcha-caption">${item.label}</span>`;
            tile.addEventListener('click', () => tile.classList.toggle('selected'));
            grid.appendChild(tile);
        });
        msg.textContent = '';
        msg.className = 'captcha-msg';
    }

    function openCaptcha() {
        buildGrid();
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeCaptcha() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function triggerDownload() {
        const a = document.createElement('a');
        a.href = resumeHref;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    resumeLinks.forEach(link => link.addEventListener('click', (e) => {
        e.preventDefault();
        openCaptcha();
    }));

    closeBtn.addEventListener('click', closeCaptcha);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCaptcha(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeCaptcha();
    });

    verifyBtn.addEventListener('click', () => {
        const tiles = Array.from(grid.querySelectorAll('.captcha-tile'));
        const isCorrect = tiles.every(t => (t.dataset.correct === 'true') === t.classList.contains('selected'));
        if (isCorrect) {
            msg.textContent = 'Correct. Obviously.';
            msg.className = 'captcha-msg success';
            verifyBtn.disabled = true;
            setTimeout(() => {
                closeCaptcha();
                verifyBtn.disabled = false;
                triggerDownload();
            }, 550);
        } else {
            msg.textContent = "Not quite — it's UNSW. Try again.";
            msg.className = 'captcha-msg error';
            buildGrid();
        }
    });
})();