<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { get } from 'svelte/store';

	// bind:this als $state, damit der Effekt reagiert, sobald das Canvas existiert.
	let canvas = $state<HTMLCanvasElement | undefined>();

	type P = { x: number; y: number; vx: number; vy: number; r: number; shape: string };

	function drawShape(ctx: CanvasRenderingContext2D, p: P) {
		const { x, y, r, shape } = p;
		ctx.beginPath();
		if (shape === 'square') {
			ctx.rect(x - r, y - r, r * 2, r * 2);
		} else if (shape === 'triangle') {
			ctx.moveTo(x, y - r);
			ctx.lineTo(x + r, y + r);
			ctx.lineTo(x - r, y + r);
			ctx.closePath();
		} else if (shape === 'star') {
			for (let i = 0; i < 10; i++) {
				const rad = (Math.PI / 5) * i;
				const rr = i % 2 === 0 ? r : r / 2;
				ctx.lineTo(x + Math.cos(rad) * rr, y + Math.sin(rad) * rr);
			}
			ctx.closePath();
		} else {
			ctx.arc(x, y, r, 0, Math.PI * 2);
		}
		ctx.fill();
	}

	// Läuft erst, wenn das Canvas wirklich im DOM ist (Partikel an). Stürzt nie ab,
	// wenn Partikel aus sind, und räumt beim Ausschalten sauber auf.
	$effect(() => {
		const el = canvas;
		if (!el) return;
		const ctx = el.getContext('2d');
		if (!ctx) return;

		let raf = 0;
		let particles: P[] = [];
		let w = 0, h = 0;

		function resize() {
			w = el!.width = window.innerWidth;
			h = el!.height = window.innerHeight;
		}
		function seed() {
			const a = get(settings).appearance;
			const shapes = a.particleShapes?.length ? a.particleShapes : ['circle'];
			const speed = a.particleSpeed;
			const baseR = a.particleSize ?? 2;
			particles = Array.from({ length: a.particleCount }, () => ({
				x: Math.random() * w,
				y: Math.random() * h,
				vx: (Math.random() - 0.5) * speed,
				vy: (Math.random() - 0.5) * speed,
				r: baseR * (0.6 + Math.random() * 0.8),
				shape: shapes[Math.floor(Math.random() * shapes.length)]
			}));
		}
		function frame() {
			if (!ctx) return;
			ctx.clearRect(0, 0, w, h);
			const color = get(settings).appearance.particleColor;
			ctx.fillStyle = color;
			ctx.globalAlpha = 0.55;
			for (const p of particles) {
				p.x += p.vx; p.y += p.vy;
				if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
				if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
				drawShape(ctx, p);
			}
			ctx.globalAlpha = 0.1;
			ctx.strokeStyle = color;
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const dx = particles[i].x - particles[j].x;
					const dy = particles[i].y - particles[j].y;
					if (dx * dx + dy * dy < 12100) {
						ctx.beginPath();
						ctx.moveTo(particles[i].x, particles[i].y);
						ctx.lineTo(particles[j].x, particles[j].y);
						ctx.stroke();
					}
				}
			}
			raf = requestAnimationFrame(frame);
		}

		resize();
		seed();
		frame();
		const onR = () => resize();
		window.addEventListener('resize', onR);
		const unsub = settings.subscribe(() => { if (w) seed(); });

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', onR);
			unsub();
		};
	});
</script>

{#if $settings.appearance.particles}
	<canvas bind:this={canvas} class="particles"></canvas>
{/if}

<style>
	.particles { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none; }
</style>
