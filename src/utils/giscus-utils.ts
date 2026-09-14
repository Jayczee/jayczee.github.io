export function getCommentMapping(
	slug: string,
	redirects: Record<string, string>,
	discussions: Record<string, number>,
	discussion?: number,
	commentTerm?: string,
): { mapping: "number" | "specific"; term: string } {
	const number = discussion ?? discussions[slug];
	if (number) return { mapping: "number", term: String(number) };
	if (commentTerm) return { mapping: "specific", term: commentTerm };
	const currentPath = `/posts/${slug}/`;
	const legacyPath = Object.entries(redirects).find(
		([, destination]) => destination === currentPath,
	)?.[0];
	const pathname = legacyPath ?? currentPath;
	return {
		mapping: "specific",
		term: pathname.substring(1).replace(/\.\w+$/, ""),
	};
}

export function getCommentTheme(baseUrl: string, dark: boolean): string {
	return `${baseUrl}/${dark ? "dark" : "light"}.css`;
}
