/* Full-page twinkling starfield. Purely decorative — always drawing, but only
   visible when body.dark-mode is applied (see #bg-stars rules in style.css). */
(function () {
    const canvas = document.getElementById('bg-stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        generate();
    }

    function generate() {
        const count = Math.max(60, Math.floor((w * h) / 8500));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.2 + 0.3,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 1.1
        }));
    }

    function draw(t) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#F5F0DC';
        for (const s of stars) {
            const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.0006 * s.speed + s.phase));
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
})();
