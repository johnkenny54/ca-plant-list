import { Config } from "./config.js";
import { Files } from "./files.js";
import { HTML } from "./html.js";
import { Jekyll } from "./jekyll.js";
import { Markdown } from "./markdown.js";

class GenericPage {
    #outputDir;
    #title;
    #baseFileName;
    #js;

    /**
     * @param {string} outputDir
     * @param {string} title
     * @param {string} baseFileName
     * @param {string} [js]
     */
    constructor(outputDir, title, baseFileName, js) {
        this.#outputDir = outputDir;
        this.#title = title;
        this.#baseFileName = baseFileName;
        this.#js = js;
    }

    getBaseFileName() {
        return this.#baseFileName;
    }

    getDefaultIntro() {
        let html = this.getFrontMatter();
        return html + this.getMarkdown();
    }

    getFrontMatter() {
        return (
            "---\n" +
            'title: "' +
            this.#title +
            '"\n' +
            (this.#js ? "js: " + this.#js + "\n" : "") +
            "---\n"
        );
    }

    getMarkdown() {
        // Include site-specific markdown.
        let html = this.#getMarkdown("intros");

        // Include package markdown.
        const mdPath =
            Config.getPackageDir() + "/data/text/" + this.#baseFileName + ".md";
        const markdownHTML = Markdown.fileToHTML(mdPath);
        if (markdownHTML) {
            html += HTML.wrap("div", markdownHTML, { class: "section" });
        }

        return html;
    }

    /**
     * @param {string} path
     */
    #getMarkdown(path) {
        const textPath = path + "/" + this.#baseFileName + ".md";
        if (!Jekyll.hasInclude(this.#outputDir, textPath)) {
            return "";
        }
        return HTML.wrap("div", Jekyll.include(textPath), { class: "section" });
    }

    getOutputDir() {
        return this.#outputDir;
    }

    getTitle() {
        return this.#title;
    }

    /**
     * @param {string} html
     */
    writeFile(html) {
        Files.write(this.#outputDir + "/" + this.#baseFileName + ".html", html);
    }
}

export { GenericPage };
