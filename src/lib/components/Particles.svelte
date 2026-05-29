<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		let raf = 0;
		let particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
		let w = 0, h = 0;

		function resize() {
			w = canvas.width = canvas.offsetWidth;
			h = canvas.height = canvas.offsetHeight;
		}

		function seed() {
			const count = $settings.appearance.particleCount;
			const speed = $settings.appearance.particleSpeed;
			particles = Array.from({ length: count }, () => ({
				x: Math.random() * w,
				y: Math.random() * h,
				vx: (Math.random() - 0.5) * speed,
				vy: (Math.random() - 0.5) * speed,
				r: Math.random() * 2 + 1
			}));
		}

		function frame() {
			ctx.clearRect(0, 0, w, h);
			const color = $settings.appearance.particleColor;
			for (const p of particles) {
				p.x += p.vx; p.y += p.vy;
				if (p.x < 0 || p.x > w) p.vx *= -1;
				if (p.y < 0 || p.y > h) p.vy *= -1;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = color;
				ctx.globalAlpha = 0.5;
				ctx.fill();
			}
			// dünne Verbindungslinien zwischen nahen Partikeln
			ctx.globalAlpha = 0.12;
			ctx.strokeStyle = color;
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const dx = particles[i].x - particles[j].x;
					const dy = particles[i].y - particles[j].y;
					const dist = Math.hypot(dx, dy);
					if (dist < 110) {
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
		window.addEventListener('resize', resize);

		// Bei Änderung der Partikel-Optionen neu aufsetzen
		const unsub = settings.subscribe(() => seed());

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			unsub();
		};
	});
</script>

{#if $settings.appearance.particles}
	<canvas bind:this={canvas} class="particles"></canvas>
{/if}

<style>
	.particles {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}
</style>
