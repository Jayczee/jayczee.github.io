// Resume data rendered by src/pages/resume.astro.
// TODO: replace the placeholder content below with your real information.

export type ResumeContact = {
	name: string;
	icon: string; // Iconify icon name, e.g. "fa6-solid:envelope"
	url?: string;
	text: string;
};

export type ResumeExperience = {
	company: string;
	role: string;
	start: string; // e.g. "2022.07"
	end?: string; // leave empty for "至今"
	location?: string;
	highlights: string[];
};

export type ResumeProject = {
	name: string;
	role?: string;
	url?: string;
	tech: string[];
	description: string;
};

export type ResumeSkillGroup = {
	category: string;
	items: string[];
};

export type ResumeEducation = {
	school: string;
	degree: string;
	major: string;
	start: string;
	end: string;
};

export type Resume = {
	name: string;
	title: string;
	location?: string;
	summary: string;
	contacts: ResumeContact[];
	experiences: ResumeExperience[];
	projects: ResumeProject[];
	skills: ResumeSkillGroup[];
	education: ResumeEducation[];
};

export const resume: Resume = {
	name: "Jayczee",
	title: "软件工程师", // TODO
	location: "中国", // TODO
	summary:
		"这里写一段 2~3 句话的个人简介：你的技术方向、工作年限、擅长解决什么问题，以及你在找什么样的机会。", // TODO
	contacts: [
		{
			name: "Email",
			icon: "fa6-solid:envelope",
			url: "mailto:jayczee2716@gmail.com",
			text: "jayczee2716@gmail.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Jayczee",
			text: "github.com/Jayczee",
		},
		{
			name: "Blog",
			icon: "fa6-solid:pen-nib",
			url: "https://jayczee.cn/blog/",
			text: "jayczee.cn",
		},
	],
	experiences: [
		{
			company: "公司名称", // TODO
			role: "职位",
			start: "2023.01",
			location: "城市",
			highlights: [
				"负责 xxx 系统的设计与开发，支撑 xxx 业务。",
				"主导 xxx 优化，使 xxx 指标提升 xx%。",
			],
		},
		{
			company: "上一家公司", // TODO
			role: "职位",
			start: "2020.07",
			end: "2022.12",
			location: "城市",
			highlights: ["参与 xxx 项目，负责 xxx 模块。"],
		},
	],
	projects: [
		{
			name: "个人博客", // TODO
			role: "独立开发",
			url: "https://github.com/Jayczee/jayczee.github.io",
			tech: ["Astro", "Svelte", "Tailwind CSS"],
			description:
				"基于 Astro 的个人博客与简历站点，支持全文搜索、评论与暗色模式。",
		},
	],
	skills: [
		{ category: "语言", items: ["TypeScript", "JavaScript", "Python"] }, // TODO
		{ category: "前端", items: ["Vue", "React", "Astro", "Tailwind CSS"] },
		{ category: "后端 / 运维", items: ["Node.js", "Docker", "Nginx", "Linux"] },
	],
	education: [
		{
			school: "学校名称", // TODO
			degree: "本科",
			major: "专业",
			start: "2016.09",
			end: "2020.06",
		},
	],
};
