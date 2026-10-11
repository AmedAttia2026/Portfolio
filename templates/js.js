document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════════════════════════
       1) PRELOADER
    ═══════════════════════════════════════════════════════ */
    (function preloader() {
        const pre = document.getElementById('preloader');
        const fill = document.getElementById('preloaderBarFill');
        const pct = document.getElementById('preloaderPercent');
        if (!pre) return;
        let progress = 0;
        const tick = setInterval(() => {
            progress += Math.random() * 14 + 4;
            if (progress >= 100) progress = 100;
            fill.style.width = progress + '%';
            pct.textContent = Math.floor(progress) + '%';
            if (progress === 100) {
                clearInterval(tick);
                setTimeout(() => {
                    pre.classList.add('hidden');
                    setTimeout(() => pre.remove(), 800);
                }, 260);
            }
        }, 110);
    })();

    /* ═══════════════════════════════════════════════════════
       2) CUSTOM CURSOR
    ═══════════════════════════════════════════════════════ */
    (function cursor() {
        const dot = document.getElementById('cursorDot');
        const ring = document.getElementById('cursorRing');
        if (!dot || !ring) return;
        if (window.matchMedia('(pointer: coarse)').matches) return;

        let mx = window.innerWidth / 2, my = window.innerHeight / 2;
        let rx = mx, ry = my;

        window.addEventListener('mousemove', (e) => {
            mx = e.clientX; my = e.clientY;
            dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
        });

        const loop = () => {
            rx += (mx - rx) * 0.18;
            ry += (my - ry) * 0.18;
            ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
            requestAnimationFrame(loop);
        };
        loop();

        const hoverTargets = 'a, button, .card, .pillar-card, .contact-card, .stat-mini-box, .edu-metric-box, .tag, .btn, .dock-item, .badge-relocation, [data-tilt]';
        document.querySelectorAll(hoverTargets).forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('hover'));
            el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
        });

        document.addEventListener('mousedown', () => ring.classList.add('click'));
        document.addEventListener('mouseup', () => ring.classList.remove('click'));
    })();

    /* ═══════════════════════════════════════════════════════
       3) SCROLL PROGRESS + BACK TO TOP
    ═══════════════════════════════════════════════════════ */
    (function scrollUI() {
        const bar = document.getElementById('scrollProgress');
        const btt = document.getElementById('backToTop');
        const fill = document.getElementById('backToTopFill');
        const ringLen = 2 * Math.PI * 19; // ≈ 119.4

        const onScroll = () => {
            const h = document.documentElement;
            const scrolled = h.scrollTop;
            const total = h.scrollHeight - h.clientHeight;
            const p = total > 0 ? (scrolled / total) : 0;

            if (bar) bar.style.width = (p * 100) + '%';
            if (fill) fill.style.strokeDashoffset = (ringLen * (1 - p)).toFixed(2);
            if (btt) {
                if (scrolled > 600) btt.classList.add('show');
                else btt.classList.remove('show');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        if (btt) {
            btt.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    })();

    /* ═══════════════════════════════════════════════════════
       4) QUICK DOCK — show after hero
    ═══════════════════════════════════════════════════════ */
    (function quickDock() {
        const dock = document.getElementById('quickDock');
        if (!dock) return;
        const check = () => {
            if (window.scrollY > window.innerHeight * 0.6) {
                dock.classList.add('show');
            } else {
                dock.classList.remove('show');
            }
        };
        window.addEventListener('scroll', check, { passive: true });
        check();
    })();

    /* ═══════════════════════════════════════════════════════
       5) 3D TILT ON CARDS
    ═══════════════════════════════════════════════════════ */
    (function tilt3D() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const MAX = 8;
        document.querySelectorAll('[data-tilt]').forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                const rx = (-py * MAX).toFixed(2);
                const ry = (px * MAX).toFixed(2);
                el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.015)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
            });
        });
    })();

    /* ═══════════════════════════════════════════════════════
       6) MAGNETIC BUTTONS
    ═══════════════════════════════════════════════════════ */
    (function magnetic() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const STRENGTH = 0.28;
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const mx = e.clientX - r.left - r.width / 2;
                const my = e.clientY - r.top - r.height / 2;
                el.style.transform = `translate(${mx * STRENGTH}px, ${my * STRENGTH}px) scale(1.04)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
            });
        });
    })();

    /* ═══════════════════════════════════════════════════════
       7) ANIMATED COUNTERS  (FIXED — works for parent + self)
    ═══════════════════════════════════════════════════════ */
    (function counters() {
        const boxes = document.querySelectorAll('[data-counter-target]');
        if (!boxes.length) return;

        const animate = (box) => {
            const target = parseFloat(box.dataset.counterTarget);
            const decimals = parseInt(box.dataset.counterDecimals || '0', 10);
            const suffix = box.dataset.counterSuffix || '';

            // Try to find the number element inside the box first
            let numEl = box.querySelector('.stat-mini-num, .metric-primary-val');

            // Fallback: if the box itself IS the number element
            if (!numEl) {
                if (box.classList.contains('stat-mini-num') ||
                    box.classList.contains('metric-primary-val')) {
                    numEl = box;
                }
            }
            if (!numEl) return;

            const dur = 1600;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                const val = target * eased;
                numEl.textContent = val.toFixed(decimals) + suffix;
                if (t < 1) requestAnimationFrame(tick);
                else numEl.textContent = target.toFixed(decimals) + suffix;
            };
            requestAnimationFrame(tick);
        };

        const io = new IntersectionObserver((entries) => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    animate(en.target);
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.4 });
        boxes.forEach(b => io.observe(b));
    })();

    /* ═══════════════════════════════════════════════════════
       8) CONTACT FORM
    ═══════════════════════════════════════════════════════ */
    const form = document.getElementById('contactForm');
    const successBox = document.getElementById('successBox');
    const submitBtn = document.getElementById('submitBtn');
    const senderName = document.getElementById('senderName');
    const confirmedName = document.getElementById('confirmedName');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameVal = senderName.value.trim();
            submitBtn.innerHTML = 'Sending Message...';
            submitBtn.disabled = true;
            const formData = new FormData(form);
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    confirmedName.textContent = nameVal || 'Visitor';
                    form.style.display = 'none';
                    successBox.style.display = 'block';
                    form.reset();
                } else {
                    alert('Sending failed. Please check connection and retry.');
                }
            } catch (error) {
                alert('Network connection error. Please try again.');
            } finally {
                submitBtn.innerHTML = '<span>Send Message</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
                submitBtn.disabled = false;
            }
        });
    }

    window.resetContactForm = function() {
        successBox.style.display = 'none';
        form.style.display = 'block';
    };

    /* ═══════════════════════════════════════════════════════
       9) COPY EMAIL + TOAST
    ═══════════════════════════════════════════════════════ */
    window.copyEmailAddress = function(btnEl, text) {
        navigator.clipboard.writeText(text).then(() => {
            const label = btnEl.querySelector('.btn-copy-label');
            const origText = label.textContent;
            btnEl.classList.add('copied-success');
            label.textContent = 'Copied! ✓';
            const toast = document.getElementById('toastCopy');
            const toastText = document.getElementById('toastCopyText');
            toastText.textContent = 'Email address copied!';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2400);
            setTimeout(() => {
                btnEl.classList.remove('copied-success');
                label.textContent = origText;
            }, 2200);
        }).catch(() => prompt('Copy this email:', text));
    };

    /* ═══════════════════════════════════════════════════════
       10) TYPEWRITER
    ═══════════════════════════════════════════════════════ */
    (function typewriter() {
        const roles = [
            "Network & Infrastructure Engineer",
            "CCNA, CCNP Enterprise (R&S) & MCSA Track",
            "Enterprise Routing & Switching Specialist",
            "Windows Server & MCSA Systems Administrator",
            "Network Security & High-Availability Practitioner"
        ];
        let rIdx = 0, cIdx = 0, isDel = false;
        const twEl = document.getElementById('tw-text');
        if (!twEl) return;
        function typeLoop() {
            const current = roles[rIdx];
            if (!isDel) {
                twEl.textContent = current.substring(0, cIdx++);
                if (cIdx > current.length) { isDel = true; setTimeout(typeLoop, 1700); return; }
            } else {
                twEl.textContent = current.substring(0, cIdx--);
                if (cIdx < 0) { isDel = false; rIdx = (rIdx + 1) % roles.length; cIdx = 0; setTimeout(typeLoop, 280); return; }
            }
            setTimeout(typeLoop, isDel ? 18 : 40);
        }
        typeLoop();
    })();

    /* ═══════════════════════════════════════════════════════
       11) CV MODAL
    ═══════════════════════════════════════════════════════ */
    window.openCVModal = function() {
        if (window.innerWidth <= 768) {
            window.open(window.SITE_CONFIG.cvUrl, "_blank");
            return;
        }
        document.getElementById('cvModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    window.closeCVModal = function() {
        document.getElementById('cvModal').classList.remove('active');
        document.body.style.overflow = '';
    };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closeCVModal(); });
    const cvModal = document.getElementById('cvModal');
    if (cvModal) {
        cvModal.addEventListener('click', (e) => { if (e.target === e.currentTarget) window.closeCVModal(); });
    }

    /* ═══════════════════════════════════════════════════════
       12) MOBILE NAV
    ═══════════════════════════════════════════════════════ */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('open')));
    }

    /* ═══════════════════════════════════════════════════════
       13) REVEAL ON SCROLL + STAGGER
    ═══════════════════════════════════════════════════════ */
    (function reveal() {
        const reveals = document.querySelectorAll('.reveal:not(.visible)');
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, i) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => entry.target.classList.add('visible'), i * 60);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
            reveals.forEach(el => observer.observe(el));
        } else {
            reveals.forEach(el => el.classList.add('visible'));
        }
    })();

    /* ═══════════════════════════════════════════════════════
       14) BACKGROUND NETWORK CANVAS
    ═══════════════════════════════════════════════════════ */
    (function networkCanvas() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h;
        let nodes = [];
        let packets = [];
        const NODE_COUNT = 55;
        const MAX_DIST = 145;
        let mouse = { x: null, y: null, radius: 140 };

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

        class NetNode {
            constructor() {
                this.x = Math.random() * w; this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.35;
                this.vy = (Math.random() - 0.5) * 0.35;
                this.isCore = Math.random() > 0.82;
                this.radius = this.isCore ? 3.2 : (1.4 + Math.random() * 1.4);
                this.baseColor = this.isCore ? '56, 189, 248' : (Math.random() > 0.5 ? '168, 85, 247' : '99, 102, 241');
                this.pulse = Math.random() * Math.PI;
            }
            update() {
                this.x += this.vx; this.y += this.vy; this.pulse += 0.025;
                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;
                if (mouse.x !== null) {
                    const dx = mouse.x - this.x, dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        this.x -= (dx / dist) * force * 1.5;
                        this.y -= (dy / dist) * force * 1.5;
                    }
                }
            }
            draw() {
                ctx.beginPath();
                const r = this.radius + Math.sin(this.pulse) * (this.isCore ? 0.9 : 0.4);
                ctx.arc(this.x, this.y, Math.max(0.6, r), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.baseColor}, 0.85)`;
                ctx.fill();
                if (this.isCore) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, r * 2.8, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.18 + Math.sin(this.pulse) * 0.1})`;
                    ctx.lineWidth = 1; ctx.stroke();
                }
            }
        }

        class DataPacket {
            constructor(source, target) {
                this.source = source; this.target = target;
                this.progress = 0;
                this.speed = 0.008 + Math.random() * 0.012;
                this.color = Math.random() > 0.5 ? '#38bdf8' : '#10b981';
            }
            update() { this.progress += this.speed; return this.progress < 1; }
            draw() {
                const cx = this.source.x + (this.target.x - this.source.x) * this.progress;
                const cy = this.source.y + (this.target.y - this.source.y) * this.progress;
                ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color; ctx.shadowBlur = 8;
                ctx.fill(); ctx.shadowBlur = 0;
            }
        }

        for (let i = 0; i < NODE_COUNT; i++) nodes.push(new NetNode());

        function animate() {
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < nodes.length; i++) {
                const n1 = nodes[i];
                n1.update(); n1.draw();
                for (let j = i + 1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dx = n1.x - n2.x, dy = n1.y - n2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < MAX_DIST) {
                        const alpha = (1 - dist / MAX_DIST) * 0.16;
                        ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y);
                        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                        ctx.lineWidth = 0.65; ctx.stroke();
                        if (Math.random() < 0.0006 && packets.length < 18) {
                            packets.push(new DataPacket(n1, n2));
                        }
                    }
                }
                if (mouse.x !== null) {
                    const dx = n1.x - mouse.x, dy = n1.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        const alpha = (1 - dist / mouse.radius) * 0.35;
                        ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                        ctx.lineWidth = 0.8; ctx.stroke();
                    }
                }
            }
            for (let i = packets.length - 1; i >= 0; i--) {
                if (packets[i].update()) packets[i].draw();
                else packets.splice(i, 1);
            }
            requestAnimationFrame(animate);
        }
        animate();
    })();

    /* ═══════════════════════════════════════════════════════
       15) SMOOTH SCROLL
    ═══════════════════════════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 70;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

});
