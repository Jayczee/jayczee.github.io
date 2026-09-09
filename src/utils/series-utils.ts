import { getSortedPosts } from "./content-utils";

export const seriesInfo = [
	{ id: "nas", name: "从零搭建 NAS", description: "从 Docker 和公网访问，到文件共享、下载与家庭影音。" },
	{ id: "leetcode", name: "LeetCode 面试经典 150 题", description: "按学习顺序整理题解，记录思路与 Java 实现。" },
	{ id: "japanese", name: "日语语法笔记", description: "日语 0-N1 语法学习笔记，参考日语翻译小昊子的课程。" },
];

export async function getSeriesList() {
	const posts = await getSortedPosts();
	return seriesInfo.map((series) => ({
		...series,
		posts: posts.filter((post) => post.data.series === series.name)
			.sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0)),
	}));
}
