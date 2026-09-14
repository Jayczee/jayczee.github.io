import { getCommentTheme } from "../utils/giscus-utils";

class BlogComments extends HTMLElement {
	private visibility?: IntersectionObserver;
	private themeObserver?: MutationObserver;
	private widget?: HTMLElement;
	private timeout?: ReturnType<typeof setTimeout>;
	private loading = false;
	private generation = 0;
	private events?: AbortController;

	connectedCallback() {
		this.events = new AbortController();
		this.querySelector("[data-comment-widget]")?.replaceChildren();
		this.querySelector("[data-comment-retry]")?.addEventListener(
			"click",
			() => void this.load(),
			{ signal: this.events.signal },
		);
		window.addEventListener("message", this.onMessage, {
			signal: this.events.signal,
		});
		this.visibility = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					this.visibility?.disconnect();
					void this.load();
				}
			},
			{ rootMargin: "200px" },
		);
		this.visibility.observe(this);
	}

	disconnectedCallback() {
		this.generation++;
		this.loading = false;
		clearTimeout(this.timeout);
		this.events?.abort();
		this.visibility?.disconnect();
		this.themeObserver?.disconnect();
		this.widget?.remove();
		this.widget = undefined;
	}

	private status(message: string, retry = false) {
		const status = this.querySelector<HTMLElement>("[data-comment-status]");
		if (status) {
			status.textContent = message;
			status.hidden = !message;
		}
		const button = this.querySelector<HTMLButtonElement>(
			"[data-comment-retry]",
		);
		if (button) button.hidden = !retry;
	}

	private syncTheme = () => {
		const themeBase = this.dataset.themeBase;
		if (!themeBase) return;
		this.widget?.setAttribute(
			"theme",
			getCommentTheme(
				themeBase,
				document.documentElement.classList.contains("dark"),
			),
		);
	};

	private onMessage = (event: MessageEvent) => {
		const frame = this.widget?.shadowRoot?.querySelector("iframe");
		if (
			event.origin !== "https://giscus.app" ||
			!frame ||
			event.source !== frame.contentWindow
		)
			return;
		const payload = event.data?.giscus;
		if (!payload) return;
		if (
			payload.error &&
			!String(payload.error).includes("Discussion not found")
		) {
			clearTimeout(this.timeout);
			this.status("评论暂时无法加载，请重试或通过上方链接访问 GitHub。", true);
		} else if (payload.resizeHeight || payload.discussion || payload.error) {
			clearTimeout(this.timeout);
			this.status("");
		}
	};

	private async load() {
		if (this.loading) return;
		this.loading = true;
		const generation = ++this.generation;
		this.status("正在连接 GitHub 评论……");
		this.themeObserver?.disconnect();
		this.widget?.remove();
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			this.status(
				"评论加载较慢，请检查网络，或通过上方链接访问 GitHub。",
				true,
			);
		}, 20000);
		try {
			await import("giscus");
			if (!this.isConnected || generation !== this.generation) return;
			const widget = document.createElement("giscus-widget");
			for (const name of [
				"repo",
				"repoId",
				"category",
				"categoryId",
				"lang",
				"mapping",
				"term",
			]) {
				widget.setAttribute(name, this.dataset[name] ?? "");
			}
			widget.setAttribute("strict", "1");
			widget.setAttribute("reactionsEnabled", "1");
			widget.setAttribute("emitMetadata", "1");
			widget.setAttribute("inputPosition", "top");
			widget.setAttribute("loading", "eager");
			this.widget = widget;
			this.syncTheme();
			this.querySelector("[data-comment-widget]")?.replaceChildren(widget);
			this.themeObserver = new MutationObserver(this.syncTheme);
			this.themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class"],
			});
		} catch {
			if (this.isConnected && generation === this.generation) {
				clearTimeout(this.timeout);
				this.status("评论组件加载失败，请检查网络后重试。", true);
			}
		} finally {
			if (generation === this.generation) this.loading = false;
		}
	}
}

if (!customElements.get("blog-comments")) {
	customElements.define("blog-comments", BlogComments);
}
