import { readFile, writeFile, unlink, rmdir } from "node:fs/promises";

// Static hosts do not run server redirects. Preserve old query strings and
// heading fragments before the generated meta-refresh takes over.
export function preserveRedirectFragments(redirects) {
	return {
		name: "legacy-redirect-fragments",
		hooks: {
			"astro:build:done": async ({ dir }) => {
				for (const [source, target] of Object.entries(redirects)) {
					const folder = new URL(source.replace(/^\//, "").replace(/\/?$/, "/"), dir);
					const generatedFile = new URL("index.html", folder);
					const html = await readFile(generatedFile, "utf8");
					let file = generatedFile;
					// Astro's directory output adds /index.html even to .html routes.
					// Keep the original file URL working on plain static servers.
					if (source.endsWith(".html")) {
						await unlink(generatedFile);
						await rmdir(folder);
						file = new URL(source.slice(1), dir);
					}
					const script = `<script>const target=new URL(${JSON.stringify(target)},location.origin);const query=new URLSearchParams(location.search);for(const [key,value] of query){if(!target.searchParams.has(key))target.searchParams.append(key,value)}if(location.hash&&!target.hash)target.hash=location.hash;location.replace(target.href);</script>`;
					await writeFile(file, html.replace('<meta http-equiv="refresh"', script + '<meta http-equiv="refresh"'));
				}
			},
		},
	};
}
