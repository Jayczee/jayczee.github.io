<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { GraphData, GraphNode, GraphLink } from "../../utils/graph-utils";
	import { playSfx } from "../../utils/sfx";

	let {
		graphData,
		isLocal = false,
		activeSlug = "",
	}: {
		graphData: GraphData;
		isLocal?: boolean;
		activeSlug?: string;
	} = $props();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animId: number = 0;

	// Viewport Pan & Zoom
	let width = $state(800);
	let height = $state(600);
	let transform = $state({ x: 0, y: 0, k: 1 });
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };
	let draggedNode: SimulationNode | null = null;

	// Interactive states
	let hoveredNode = $state<SimulationNode | null>(null);
	let selectedNode = $state<SimulationNode | null>(null);
	let searchQuery = $state("");
	let showTags = $state(true);
	let showCategories = $state(true);
	let isDark = $state(true);
	let isFullscreen = $state(false);
	let primaryColor = $state("#f59e0b");
	let nodeCount = $state(0);
	let linkCount = $state(0);

	interface SimulationNode extends GraphNode {
		x: number;
		y: number;
		vx: number;
		vy: number;
		fx?: number | null;
		fy?: number | null;
	}

	interface SimulationLink {
		source: SimulationNode;
		target: SimulationNode;
		type: GraphLink["type"];
		strength: number;
	}

	// Internal raw data (Plain JavaScript objects, not Svelte 5 reactive state proxies)
	// This guarantees link.source === node is strictly true!
	let rawNodes: SimulationNode[] = [];
	let rawLinks: SimulationLink[] = [];
	let nodeMap = new Map<string, SimulationNode>();
	let neighborMap = new Map<string, Set<string>>();

	// Physics parameters
	const REPULSION = isLocal ? 2200 : 1600;
	const SPRING_LENGTH = isLocal ? 90 : 75;
	const SPRING_K = 0.055;
	const GRAVITY = isLocal ? 0.04 : 0.025;
	const DAMPING = 0.85;
	let isSimulating = true;
	let alpha = 1.0;

	function updateThemeColors() {
		if (typeof document === "undefined") return;
		isDark = document.documentElement.classList.contains("dark");
		const style = getComputedStyle(document.documentElement);
		const prim = style.getPropertyValue("--primary")?.trim();
		if (prim && (prim.startsWith("#") || prim.startsWith("rgb") || prim.startsWith("hsl"))) {
			primaryColor = prim;
		} else {
			primaryColor = "#f59e0b";
		}
	}

	function initGraph() {
		if (!graphData || !Array.isArray(graphData.nodes)) return;

		nodeMap.clear();
		neighborMap.clear();

		// 1. Filter nodes based on user toggles
		const filteredInputNodes = graphData.nodes.filter((n) => {
			if (!n) return false;
			if (!showTags && n.type === "tag") return false;
			if (!showCategories && n.type === "category") return false;
			return true;
		});

		const validIds = new Set(filteredInputNodes.map((n) => n.id));

		// 2. Filter links connecting valid nodes
		const safeLinks = Array.isArray(graphData.links) ? graphData.links : [];
		const filteredInputLinks = safeLinks.filter((l) => {
			if (!l || !l.source || !l.target) return false;
			return validIds.has(l.source) && validIds.has(l.target);
		});

		// 3. Create simulation node objects
		rawNodes = filteredInputNodes.map((n, i) => {
			const angle = (i / Math.max(filteredInputNodes.length, 1)) * 2 * Math.PI;
			const radius = n.type === "category" ? 70 : isLocal ? 120 : 160 + Math.random() * 80;
			const isCurrentPost = n.id === activeSlug;

			const simNode: SimulationNode = {
				...n,
				x: isCurrentPost ? 0 : Math.cos(angle) * radius,
				y: isCurrentPost ? 0 : Math.sin(angle) * radius,
				vx: 0,
				vy: 0,
				fx: isCurrentPost ? 0 : null,
				fy: isCurrentPost ? 0 : null,
			};
			nodeMap.set(n.id, simNode);
			neighborMap.set(n.id, new Set<string>());
			return simNode;
		});

		// 4. Create simulation links pointing directly to the exact node objects
		rawLinks = [];
		for (const l of filteredInputLinks) {
			const src = nodeMap.get(l.source);
			const tgt = nodeMap.get(l.target);
			if (src && tgt) {
				rawLinks.push({
					source: src,
					target: tgt,
					type: l.type,
					strength: l.strength || 1,
				});
				neighborMap.get(src.id)?.add(tgt.id);
				neighborMap.get(tgt.id)?.add(src.id);
			}
		}

		nodeCount = rawNodes.length;
		linkCount = rawLinks.length;
		alpha = 1.0;
		isSimulating = true;
	}

	function tickSimulation() {
		if (alpha < 0.003) {
			isSimulating = false;
			return;
		}

		const count = rawNodes.length;

		// 1. Repulsion between all nodes
		for (let i = 0; i < count; i++) {
			const n1 = rawNodes[i];
			for (let j = i + 1; j < count; j++) {
				const n2 = rawNodes[j];
				let dx = n2.x - n1.x;
				let dy = n2.y - n1.y;
				let distSq = dx * dx + dy * dy;
				if (distSq < 1) distSq = 1;
				const dist = Math.sqrt(distSq);

				const force = (REPULSION / distSq) * alpha;
				const fx = (dx / dist) * force;
				const fy = (dy / dist) * force;

				if (n1.fx == null) {
					n1.vx -= fx;
					n1.vy -= fy;
				}
				if (n2.fx == null) {
					n2.vx += fx;
					n2.vy += fy;
				}
			}
		}

		// 2. Spring force along links
		for (let k = 0; k < rawLinks.length; k++) {
			const link = rawLinks[k];
			const dx = link.target.x - link.source.x;
			const dy = link.target.y - link.source.y;
			const dist = Math.sqrt(dx * dx + dy * dy) || 1;

			const targetDist = link.type === "category" ? SPRING_LENGTH * 0.7 : SPRING_LENGTH;
			const displacement = dist - targetDist;
			const force = displacement * SPRING_K * link.strength * alpha;
			const fx = (dx / dist) * force;
			const fy = (dy / dist) * force;

			if (link.source.fx == null) {
				link.source.vx += fx;
				link.source.vy += fy;
			}
			if (link.target.fx == null) {
				link.target.vy -= fy;
				link.target.vx -= fx;
			}
		}

		// 3. Center gravity & velocity integration
		for (let i = 0; i < count; i++) {
			const n = rawNodes[i];
			if (n.fx != null) {
				n.x = n.fx;
				n.y = n.fy!;
				n.vx = 0;
				n.vy = 0;
				continue;
			}

			// Gravity to center
			n.vx -= n.x * GRAVITY * alpha;
			n.vy -= n.y * GRAVITY * alpha;

			// Velocity damping
			n.vx *= DAMPING;
			n.vy *= DAMPING;

			n.x += n.vx;
			n.y += n.vy;
		}

		alpha *= 0.985;
	}

	function render() {
		if (!ctx || !canvas) return;
		const dpr = window.devicePixelRatio || 1;

		updateThemeColors();

		// Clear screen
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		// Apply DPR first
		ctx.scale(dpr, dpr);
		// Apply pan & zoom centered
		ctx.translate(width / 2 + transform.x, height / 2 + transform.y);
		ctx.scale(transform.k, transform.k);

		// 1. Draw subtle background coordinate grid
		drawGrid(ctx);

		const activeNeighbors = hoveredNode ? neighborMap.get(hoveredNode.id) : null;

		// 2. Draw Links (Line starts from source.x, source.y and ends exactly at target.x, target.y)
		for (const link of rawLinks) {
			const isConnected =
				!hoveredNode ||
				link.source.id === hoveredNode.id ||
				link.target.id === hoveredNode.id;

			const isDimmed = hoveredNode && !isConnected;

			ctx.beginPath();
			ctx.moveTo(link.source.x, link.source.y);
			ctx.lineTo(link.target.x, link.target.y);

			if (isDimmed) {
				ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)";
				ctx.lineWidth = 1;
			} else if (hoveredNode && isConnected) {
				ctx.strokeStyle = primaryColor; // Glowing primary
				ctx.lineWidth = 2.6;
			} else {
				// Default link colors based on type
				if (link.type === "citation") {
					ctx.strokeStyle = "rgba(245, 158, 11, 0.55)";
					ctx.lineWidth = 1.8;
				} else if (link.type === "series") {
					ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
					ctx.lineWidth = 1.5;
				} else if (link.type === "category") {
					ctx.strokeStyle = "rgba(168, 85, 247, 0.35)";
					ctx.lineWidth = 1.3;
				} else {
					ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)";
					ctx.lineWidth = 1;
				}
			}
			ctx.stroke();
		}

		// 3. Draw Nodes (Center coordinates node.x, node.y strictly equal link.source/target)
		for (const node of rawNodes) {
			const isHovered = hoveredNode?.id === node.id;
			const isNeighbor = activeNeighbors?.has(node.id);
			const isDimmed = hoveredNode && !isHovered && !isNeighbor;
			const isMatched = searchQuery && node.title.toLowerCase().includes(searchQuery.toLowerCase());
			const isCurrentPost = node.id === activeSlug;

			const radius = node.val * (isHovered ? 1.35 : isCurrentPost ? 1.4 : 1.0);

			// Outer glowing halo
			if (isHovered || isCurrentPost || isMatched) {
				ctx.beginPath();
				ctx.arc(node.x, node.y, radius * 2.2, 0, Math.PI * 2);
				ctx.fillStyle = node.type === "category"
					? "rgba(168, 85, 247, 0.3)"
					: "rgba(245, 158, 11, 0.35)";
				ctx.fill();
			}

			// Main Node Circle
			ctx.beginPath();
			ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

			if (isDimmed) {
				ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
			} else {
				if (node.type === "category") {
					ctx.fillStyle = isHovered ? "#d8b4fe" : "#a855f7"; // Vibrant purple
				} else if (node.type === "tag") {
					ctx.fillStyle = isHovered ? "#6ee7b7" : "#10b981"; // Emerald green
				} else {
					// Post Node
					if (isCurrentPost) {
						ctx.fillStyle = "#ef4444"; // Red beacon for current post
					} else if (node.connections >= 5) {
						ctx.fillStyle = isHovered ? "#fde047" : primaryColor;
					} else {
						ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7"; // Cyan / blue
					}
				}
			}
			ctx.fill();

			// Crisp border
			ctx.strokeStyle = isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)";
			ctx.lineWidth = 1.5;
			ctx.stroke();

			// 4. Draw Labels
			const shouldShowLabel =
				isHovered ||
				isNeighbor ||
				isCurrentPost ||
				isMatched ||
				node.type === "category" ||
				(transform.k > 1.1 && node.val >= 7) ||
				transform.k > 1.8;

			if (shouldShowLabel && !isDimmed) {
				drawNodeLabel(ctx, node, radius, isHovered || isCurrentPost);
			}
		}

		ctx.restore();

		// Keep simulation ticking if needed
		if (isSimulating) {
			tickSimulation();
		}

		animId = requestAnimationFrame(render);
	}

	function drawGrid(context: CanvasRenderingContext2D) {
		const step = 80;
		const range = 1200;
		context.strokeStyle = isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(0, 0, 0, 0.035)";
		context.lineWidth = 1;

		context.beginPath();
		for (let x = -range; x <= range; x += step) {
			context.moveTo(x, -range);
			context.lineTo(x, range);
		}
		for (let y = -range; y <= range; y += step) {
			context.moveTo(-range, y);
			context.lineTo(range, y);
		}
		context.stroke();

		// Center Axis Marker (+)
		context.strokeStyle = "rgba(245, 158, 11, 0.25)";
		context.beginPath();
		context.moveTo(-15, 0);
		context.lineTo(15, 0);
		context.moveTo(0, -15);
		context.lineTo(0, 15);
		context.stroke();
	}

	function drawNodeLabel(
		context: CanvasRenderingContext2D,
		node: SimulationNode,
		radius: number,
		highlight: boolean,
	) {
		const fontSize = highlight ? 12 : Math.max(10, Math.min(12, Math.round(11 / transform.k)));
		context.font = `${highlight ? "bold " : ""}${fontSize}px monospace, system-ui, sans-serif`;

		const text = node.title.length > 20 && !highlight ? `${node.title.slice(0, 18)}…` : node.title;
		const textWidth = context.measureText(text).width;
		const textX = node.x;
		const textY = node.y + radius + fontSize + 4;

		// Background Pill
		const padX = 5;
		const padY = 2;
		context.fillStyle = isDark
			? highlight
				? "rgba(15, 23, 42, 0.95)"
				: "rgba(10, 15, 25, 0.85)"
			: highlight
				? "rgba(255, 255, 255, 0.95)"
				: "rgba(255, 255, 255, 0.9)";

		context.fillRect(
			textX - textWidth / 2 - padX,
			textY - fontSize + 1 - padY,
			textWidth + padX * 2,
			fontSize + padY * 2,
		);

		if (highlight) {
			context.strokeStyle = primaryColor;
			context.lineWidth = 1;
			context.strokeRect(
				textX - textWidth / 2 - padX,
				textY - fontSize + 1 - padY,
				textWidth + padX * 2,
				fontSize + padY * 2,
			);
		}

		// Text
		context.fillStyle = isDark
			? highlight
				? primaryColor
				: "#f1f5f9"
			: highlight
				? "#d97706"
				: "#0f172a";
		context.textAlign = "center";
		context.fillText(text, textX, textY);
	}

	function getPointerPos(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const clientX = e.clientX - rect.left;
		const clientY = e.clientY - rect.top;
		const x = (clientX - width / 2 - transform.x) / transform.k;
		const y = (clientY - height / 2 - transform.y) / transform.k;
		return { clientX, clientY, x, y };
	}

	function findNodeAt(x: number, y: number): SimulationNode | null {
		for (let i = rawNodes.length - 1; i >= 0; i--) {
			const n = rawNodes[i];
			const dx = x - n.x;
			const dy = y - n.y;
			const hitRadius = Math.max(n.val * 1.35, 14);
			if (dx * dx + dy * dy <= hitRadius * hitRadius) {
				return n;
			}
		}
		return null;
	}

	// Mouse Interaction Handlers
	function handleMouseDown(e: MouseEvent) {
		const { x, y, clientX, clientY } = getPointerPos(e);
		const hit = findNodeAt(x, y);

		if (hit) {
			draggedNode = hit;
			hit.fx = hit.x;
			hit.fy = hit.y;
			reheatSimulation(0.4);
		} else {
			isDragging = true;
			dragStart = { x: clientX - transform.x, y: clientY - transform.y };
		}
	}

	function handleMouseMove(e: MouseEvent) {
		const { x, y, clientX, clientY } = getPointerPos(e);

		if (draggedNode) {
			draggedNode.fx = x;
			draggedNode.fy = y;
			draggedNode.x = x;
			draggedNode.y = y;
			reheatSimulation(0.3);
			return;
		}

		if (isDragging) {
			transform.x = clientX - dragStart.x;
			transform.y = clientY - dragStart.y;
			return;
		}

		// Hover Check
		const hit = findNodeAt(x, y);
		if (hit !== hoveredNode) {
			hoveredNode = hit;
			if (hit) {
				try {
					playSfx("click");
				} catch (err) {}
			}
		}
	}

	function handleMouseUp() {
		if (draggedNode) {
			if (draggedNode.id !== activeSlug) {
				draggedNode.fx = null;
				draggedNode.fy = null;
			}
			draggedNode = null;
			reheatSimulation(0.2);
		}
		isDragging = false;
	}

	function handleClick(e: MouseEvent) {
		const { x, y } = getPointerPos(e);
		const hit = findNodeAt(x, y);

		if (hit) {
			selectedNode = hit;
			try {
				playSfx("switch");
			} catch (err) {}

			if (hit.type === "post" && hit.url) {
				window.location.href = hit.url;
			} else if (hit.type === "category" || hit.type === "tag") {
				// Focus view on this hub
				zoomToNode(hit);
			}
		}
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
		const newK = Math.max(0.25, Math.min(4.0, transform.k * zoomFactor));

		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - width / 2;
		const mouseY = e.clientY - rect.top - height / 2;

		transform.x = mouseX - (mouseX - transform.x) * (newK / transform.k);
		transform.y = mouseY - (mouseY - transform.y) * (newK / transform.k);
		transform.k = newK;
	}

	function reheatSimulation(amount = 0.5) {
		alpha = Math.max(alpha, amount);
		isSimulating = true;
	}

	function resetView() {
		transform = { x: 0, y: 0, k: isLocal ? 1.2 : 0.85 };
		reheatSimulation(0.6);
		try {
			playSfx("switch");
		} catch (e) {}
	}

	function zoomToNode(node: SimulationNode) {
		transform.x = -node.x * 1.5;
		transform.y = -node.y * 1.5;
		transform.k = 1.5;
		hoveredNode = node;
		reheatSimulation(0.2);
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
		setTimeout(updateSize, 100);
		try {
			playSfx("click");
		} catch (e) {}
	}

	function updateSize() {
		if (!container || !canvas) return;
		width = container.clientWidth;
		height = isFullscreen ? window.innerHeight - 80 : isLocal ? 380 : 680;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;

		ctx = canvas.getContext("2d");
	}

	onMount(() => {
		updateSize();
		initGraph();
		resetView();

		window.addEventListener("resize", updateSize);
		animId = requestAnimationFrame(render);
	});

	onDestroy(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("resize", updateSize);
			cancelAnimationFrame(animId);
		}
	});

	$effect(() => {
		// Watch filters
		if (showTags !== undefined || showCategories !== undefined) {
			initGraph();
		}
	});

	$effect(() => {
		if (searchQuery) {
			const matched = rawNodes.find((n) =>
				n.title.toLowerCase().includes(searchQuery.toLowerCase()),
			);
			if (matched) {
				zoomToNode(matched);
			}
		}
	});
</script>

<div
	bind:this={container}
	class:fixed={isFullscreen}
	class:inset-4={isFullscreen}
	class:z-[9999]={isFullscreen}
	class="relative w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#0a0f1d] text-white font-mono select-none shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all"
>
	<!-- CRT Top Status HUD Ribbon -->
	<div
		class="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10 text-xs"
	>
		<div class="flex items-center gap-2.5">
			<span class="inline-block w-2 h-2 rounded-full bg-[var(--primary,#f59e0b)] animate-pulse shadow-[0_0_8px_var(--primary,#f59e0b)]"></span>
			<span class="font-bold text-[var(--primary,#f59e0b)] tracking-wider">
				{isLocal ? "LOCAL RADAR // 关联知识网" : "GALAXY RADAR // 全站知识星系"}
			</span>
			<span class="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 hidden sm:inline">
				VERLET-2D
			</span>
		</div>

		<!-- Control Actions & Filters -->
		<div class="flex items-center gap-2 text-[11px]">
			<!-- Search input -->
			<div class="relative hidden md:block">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="搜索节点..."
					class="w-32 focus:w-48 transition-all px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] placeholder-white/30 focus:outline-none focus:border-[var(--primary,#f59e0b)]"
				/>
				{#if searchQuery}
					<button
						on:click={() => (searchQuery = "")}
						class="absolute right-2 top-1.5 text-white/40 hover:text-white"
					>×</button>
				{/if}
			</div>

			<!-- Filter Toggles -->
			<button
				type="button"
				class="px-2 py-1 rounded-md border transition cursor-pointer flex items-center gap-1.5 {showTags
					? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
					: 'bg-white/5 border-white/10 text-white/40'}"
				on:click={() => {
					showTags = !showTags;
					try { playSfx("click"); } catch (e) {}
				}}
			>
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
				标签
			</button>

			<button
				type="button"
				class="px-2 py-1 rounded-md border transition cursor-pointer flex items-center gap-1.5 {showCategories
					? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
					: 'bg-white/5 border-white/10 text-white/40'}"
				on:click={() => {
					showCategories = !showCategories;
					try { playSfx("click"); } catch (e) {}
				}}
			>
				<span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
				分类
			</button>

			<!-- Reset button -->
			<button
				type="button"
				class="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
				title="复位中心视角"
				on:click={resetView}
			>
				🎯
			</button>

			<!-- Fullscreen button -->
			<button
				type="button"
				class="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer"
				title={isFullscreen ? "退出全屏" : "全屏沉浸浏览"}
				on:click={toggleFullscreen}
			>
				{isFullscreen ? "↙" : "⛶"}
			</button>
		</div>
	</div>

	<!-- Interactive HTML5 Canvas -->
	<canvas
		bind:this={canvas}
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:click={handleClick}
		on:wheel={handleWheel}
		class="w-full h-full block cursor-grab active:cursor-grabbing"
	></canvas>

	<!-- Hover / Selection HUD Tooltip Overlay -->
	{#if hoveredNode}
		<div
			class="absolute bottom-4 left-4 z-20 max-w-sm p-3.5 rounded-xl bg-black/80 backdrop-blur-md border border-[var(--primary,#f59e0b)]/40 shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-none animate-fade-in font-mono text-xs space-y-1.5"
		>
			<div class="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
				<span
					class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider {hoveredNode.type === 'category'
						? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
						: hoveredNode.type === 'tag'
							? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
							: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}"
				>
					{hoveredNode.type}
				</span>
				<span class="text-white/40 text-[10px]">
					{hoveredNode.connections} 个相连维度
				</span>
			</div>

			<div class="font-bold text-white text-sm leading-snug">
				{hoveredNode.title}
			</div>

			{#if hoveredNode.category}
				<div class="text-[11px] text-white/50 flex items-center gap-1.5">
					<span>分类:</span>
					<span class="text-purple-300 font-medium">{hoveredNode.category}</span>
				</div>
			{/if}

			{#if hoveredNode.tags && hoveredNode.tags.length}
				<div class="flex flex-wrap gap-1 pt-0.5">
					{#each hoveredNode.tags as t}
						<span class="px-1.5 py-0.2 rounded bg-white/5 text-white/60 text-[10px] border border-white/10">
							#{t}
						</span>
					{/each}
				</div>
			{/if}

			{#if hoveredNode.type === "post"}
				<div class="text-[10px] text-[var(--primary,#f59e0b)] pt-1 flex items-center gap-1">
					<span>▶ 点击跳转阅读全文</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Bottom Right Hint / Statistics -->
	<div
		class="absolute bottom-3 right-4 z-10 flex items-center gap-3 text-[10px] text-white/40 font-mono pointer-events-none select-none"
	>
		<span>滚轮缩放 · 拖拽平移/节点</span>
		<span>·</span>
		<span>{nodeCount} 节点 / {linkCount} 互联</span>
	</div>
</div>
