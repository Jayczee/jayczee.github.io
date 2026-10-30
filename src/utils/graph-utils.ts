import { getCollection } from "astro:content";
import { formatDateToYYYYMMDD } from "./date-utils";

export type GraphNodeType = "post" | "tag" | "category";
export type GraphLinkType = "citation" | "tag" | "category" | "series";

export interface GraphNode {
	id: string;
	title: string;
	type: GraphNodeType;
	val: number;
	url?: string;
	category?: string;
	tags?: string[];
	series?: string;
	published?: string;
	connections: number;
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
}

export interface GraphLink {
	source: string;
	target: string;
	type: GraphLinkType;
	strength?: number;
}

export interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
	categories: string[];
	tags: string[];
	stats: {
		postCount: number;
		tagCount: number;
		catCount: number;
		linkCount: number;
	};
}

let cachedGraphData: GraphData | null = null;

export async function getGraphData(): Promise<GraphData> {
	if (cachedGraphData) return cachedGraphData;

	const allPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const nodesMap = new Map<string, GraphNode>();
	const linksMap = new Map<string, GraphLink>();
	const postSlugSet = new Set<string>();

	const categoriesSet = new Set<string>();
	const tagsSet = new Set<string>();

	// Pass 1: Collect post slugs
	for (const post of allPosts) {
		postSlugSet.add(post.slug);
	}

	// Pass 2: Create Post Nodes
	for (const post of allPosts) {
		const category = post.data.category || "";
		const tags = post.data.tags || [];
		const series = post.data.series || "";

		if (category) categoriesSet.add(category);
		for (const tag of tags) {
			if (tag) tagsSet.add(tag);
		}

		nodesMap.set(post.slug, {
			id: post.slug,
			title: post.data.title,
			type: "post",
			val: 6, // Base size
			url: `/posts/${post.slug}/`,
			category: category || undefined,
			tags: tags.length ? tags : undefined,
			series: series || undefined,
			published: post.data.published ? formatDateToYYYYMMDD(post.data.published) : undefined,
			connections: 0,
		});
	}

	// Helper to add link safely
	const addLink = (source: string, target: string, type: GraphLinkType, strength = 1) => {
		if (source === target) return;
		const key = [source, target].sort().join("<->");
		if (!linksMap.has(key)) {
			linksMap.set(key, { source, target, type, strength });
		}
	};

	// Pass 3: Category Nodes & Links
	for (const cat of categoriesSet) {
		const catId = `cat:${cat}`;
		nodesMap.set(catId, {
			id: catId,
			title: cat,
			type: "category",
			val: 10,
			connections: 0,
		});
	}

	// Pass 4: Tag Nodes & Links
	for (const tag of tagsSet) {
		const tagId = `tag:${tag}`;
		nodesMap.set(tagId, {
			id: tagId,
			title: `#${tag}`,
			type: "tag",
			val: 5,
			connections: 0,
		});
	}

	// Pass 5: Build Relationships
	// 5.1 Post to Category & Post to Tag
	for (const post of allPosts) {
		if (post.data.category) {
			addLink(post.slug, `cat:${post.data.category}`, "category", 0.6);
		}
		if (post.data.tags && post.data.tags.length) {
			for (const tag of post.data.tags) {
				addLink(post.slug, `tag:${tag}`, "tag", 0.4);
			}
		}

		// 5.2 Direct Citations in post.body
		if (post.body) {
			// Matches /posts/some-slug or /posts/some-slug/
			const matches = post.body.matchAll(/\/posts\/([a-zA-Z0-9_\-\.]+)/g);
			for (const m of matches) {
				const targetSlug = m[1].replace(/\/$/, "");
				if (targetSlug !== post.slug && postSlugSet.has(targetSlug)) {
					addLink(post.slug, targetSlug, "citation", 1.2);
				}
			}
		}
	}

	// 5.3 Series sequential links
	const seriesMap = new Map<string, typeof allPosts>();
	for (const post of allPosts) {
		if (post.data.series) {
			const arr = seriesMap.get(post.data.series) || [];
			arr.push(post);
			seriesMap.set(post.data.series, arr);
		}
	}

	for (const [, list] of seriesMap.entries()) {
		list.sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
		for (let i = 0; i < list.length - 1; i++) {
			addLink(list[i].slug, list[i + 1].slug, "series", 0.9);
		}
	}

	// Pass 6: Calculate connections count & scale node size
	const links = Array.from(linksMap.values());
	for (const link of links) {
		const srcNode = nodesMap.get(link.source);
		const tgtNode = nodesMap.get(link.target);
		if (srcNode) srcNode.connections++;
		if (tgtNode) tgtNode.connections++;
	}

	// Dynamic sizing based on degree
	for (const node of nodesMap.values()) {
		if (node.type === "category") {
			node.val = Math.min(10 + node.connections * 0.8, 22);
		} else if (node.type === "post") {
			node.val = Math.min(6 + node.connections * 0.9, 18);
		} else if (node.type === "tag") {
			node.val = Math.min(4 + node.connections * 0.6, 14);
		}
	}

	const nodes = Array.from(nodesMap.values());

	const result: GraphData = {
		nodes,
		links,
		categories: Array.from(categoriesSet).sort(),
		tags: Array.from(tagsSet).sort(),
		stats: {
			postCount: allPosts.length,
			tagCount: tagsSet.size,
			catCount: categoriesSet.size,
			linkCount: links.length,
		},
	};

	cachedGraphData = result;
	return result;
}

export function getLocalGraphData(currentSlug: string, fullGraph: GraphData): GraphData {
	const neighborIds = new Set<string>([currentSlug]);

	// Find 1st-degree links
	for (const link of fullGraph.links) {
		if (link.source === currentSlug) neighborIds.add(link.target);
		if (link.target === currentSlug) neighborIds.add(link.source);
	}

	const subNodes = fullGraph.nodes.filter((n) => neighborIds.has(n.id));
	const subLinks = fullGraph.links.filter(
		(l) => neighborIds.has(l.source) && neighborIds.has(l.target),
	);

	return {
		nodes: subNodes,
		links: subLinks,
		categories: fullGraph.categories,
		tags: fullGraph.tags,
		stats: {
			postCount: subNodes.filter((n) => n.type === "post").length,
			tagCount: subNodes.filter((n) => n.type === "tag").length,
			catCount: subNodes.filter((n) => n.type === "category").length,
			linkCount: subLinks.length,
		},
	};
}
