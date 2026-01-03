import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
// import markedKatex from 'marked-katex-extension';
import { Theme, StyleObject } from './themes';

// marked-katex-extension 配置（暂时禁用，需要适配 marked v4）
// TODO: 适配 marked-katex-extension 到 marked v4
// try {
//   marked.use(markedKatex({
//     output: 'html',
//   }));
// } catch (error) {
//   console.warn('Failed to load marked-katex-extension:', error);
// }

export interface WxRendererOptions {
  theme: Theme;
  fonts: string;
  size: string;
}

type Footnote = [number, string, string];

export class WxRenderer {
  private opts: WxRendererOptions;
  private footnotes: Footnote[] = [];
  private footnoteIndex: number = 0;
  private styleMapping: Record<string, StyleObject> = {};

  constructor(opts: WxRendererOptions) {
    this.opts = opts;
  }

  private merge(base: StyleObject, extend: StyleObject): StyleObject {
    return Object.assign({}, base, extend);
  }

  private buildTheme(themeTpl: Theme): Record<string, StyleObject> {
    const mapping: Record<string, StyleObject> = {};
    const base = this.merge(themeTpl.BASE, {
      'font-family': this.opts.fonts,
      'font-size': this.opts.size,
    });

    // Build inline styles
    for (const ele in themeTpl.inline) {
      if (themeTpl.inline.hasOwnProperty(ele)) {
        const style = themeTpl.inline[ele as keyof typeof themeTpl.inline];
        mapping[ele] = this.merge(themeTpl.BASE, style);
      }
    }

    // Build block styles
    const baseBlock = this.merge(base, {});
    for (const ele in themeTpl.block) {
      if (themeTpl.block.hasOwnProperty(ele)) {
        const style = themeTpl.block[ele as keyof typeof themeTpl.block];
        mapping[ele] = this.merge(baseBlock, style);
      }
    }

    return mapping;
  }

  private getStyles(tokenName: string, addition?: string): string {
    const arr: string[] = [];
    const dict = this.styleMapping[tokenName];
    if (!dict) return '';
    
    for (const key in dict) {
      arr.push(`${key}:${dict[key]}`);
    }
    
    return `style="${arr.join(';')}${addition ? ';' + addition : ''}"`;
  }

  private addFootnote(title: string, link: string): number {
    this.footnotes.push([++this.footnoteIndex, title, link]);
    return this.footnoteIndex;
  }

  buildFootnotes(): string {
    const footnoteArray = this.footnotes.map((x) => {
      if (x[1] === x[2]) {
        return `<code style="font-size: 90%; opacity: 0.6;">[${x[0]}]</code>: <i>${x[1]}</i><br/>`;
      }
      return `<code style="font-size: 90%; opacity: 0.6;">[${x[0]}]</code> ${x[1]}: <i>${x[2]}</i><br/>`;
    });
    
    if (!footnoteArray.length) {
      return '';
    }
    
    return `<h4 ${this.getStyles('h4')}>引用链接</h4><p ${this.getStyles('footnotes')}>${footnoteArray.join('\n')}</p>`;
  }

  buildAddition(): string {
    return `
      <style>
        .preview-wrapper pre::before {
          position: absolute;
          top: 0;
          right: 0;
          color: #ccc;
          text-align: center;
          font-size: 0.8em;
          padding: 5px 10px 0;
          line-height: 15px;
          height: 15px;
          font-weight: 600;
        }
      </style>
    `;
  }

  setOptions(newOpts: Partial<WxRendererOptions>): void {
    this.opts = Object.assign({}, this.opts, newOpts);
  }

  hasFootnotes(): boolean {
    return this.footnotes.length !== 0;
  }

  getRenderer(citeStatus: boolean): Renderer {
    // Reset footnotes for each render
    this.footnotes = [];
    this.footnoteIndex = 0;

    // Build style mapping
    this.styleMapping = this.buildTheme(this.opts.theme);
    
    const renderer = new Renderer();
    const getStyles = (tokenName: string, addition?: string) => this.getStyles(tokenName, addition);
    const addFootnote = (title: string, link: string) => this.addFootnote(title, link);

    renderer.heading = (text: string, level: number) => {
      switch (level) {
        case 1:
          return `<h1 ${getStyles('h1')}>${text}</h1>`;
        case 2:
          return `<h2 ${getStyles('h2')}>${text}</h2>`;
        case 3:
          return `<h3 ${getStyles('h3')}>${text}</h3>`;
        default:
          return `<h4 ${getStyles('h4')}>${text}</h4>`;
      }
    };

    renderer.paragraph = (text: string) => {
      if (text.indexOf('<figure') !== -1 && text.indexOf('<img') !== -1) {
        return text;
      }
      return text.replace(/ /g, '') === ''
        ? ''
        : `<p ${getStyles('p')}>${text}</p>`;
    };

    renderer.blockquote = (text: string) => {
      const replacedText = text.replace(/<p.*?>/g, `<p ${getStyles('blockquote_p')}>`);
      return `<blockquote ${getStyles('blockquote')}>${replacedText}</blockquote>`;
    };

    renderer.code = (text: string, lang: string = '') => {
      // Handle mermaid diagrams
      if (lang.startsWith('mermaid')) {
        // Note: mermaid support would need to be added separately
        return `<center><pre class="mermaid">${text}</pre></center>`;
      }
      
      const langParts = lang.split(' ');
      let detectedLang = langParts[0];
      detectedLang = hljs.getLanguage(detectedLang) ? detectedLang : 'plaintext';
      
      const highlighted = hljs.highlight(text, { language: detectedLang }).value;
      const processedText = highlighted
        .replace(/\r\n/g, '<br/>')
        .replace(/\n/g, '<br/>')
        .replace(/(>[^<]+)|(^[^<]+)/g, (str) => {
          return str.replace(/\s/g, '&nbsp;');
        });

      return `<pre class="hljs code__pre" ${getStyles('code_pre')}><code class="language-${detectedLang}" ${getStyles('code')}>${processedText}</code></pre>`;
    };

    renderer.codespan = (text: string) => {
      return `<code ${getStyles('codespan')}>${text}</code>`;
    };

    renderer.listitem = (text: string) => {
      return `<li ${getStyles('listitem')}><span><%s/></span>${text}</li>`;
    };

    renderer.list = (text: string, ordered: boolean, start: number) => {
      let processedText = text.replace(/<\/*p .*?>/g, '').replace(/<\/*p>/g, '');
      const segments = processedText.split('<%s/>');
      
      if (!ordered) {
        processedText = segments.join('• ');
        return `<ul ${getStyles('ul')}>${processedText}</ul>`;
      }
      
      processedText = segments[0];
      for (let i = 1; i < segments.length; i++) {
        processedText = processedText + (start + i - 1) + '. ' + segments[i];
      }
      return `<ol ${getStyles('ol')}>${processedText}</ol>`;
    };

    renderer.image = (href: string, title: string, text: string) => {
      const createSubText = (s: string) => {
        if (!s) {
          return '';
        }
        return `<figcaption ${getStyles('figcaption')}>${s}</figcaption>`;
      };

      const transform = (title: string, alt: string): string => {
        const legend = localStorage.getItem('legend') || 'alt';
        switch (legend) {
          case 'alt':
            return alt;
          case 'title':
            return title;
          case 'alt-title':
            return alt || title;
          case 'title-alt':
            return title || alt;
          default:
            return '';
        }
      };

      const subText = createSubText(transform(title, text));
      const figureStyles = getStyles('figure');
      const imgStyles = getStyles('image');
      
      return `<figure ${figureStyles}><img ${imgStyles} src="${href}" title="${title || ''}" alt="${text || ''}"/>${subText}</figure>`;
    };

    renderer.link = (href: string, title: string, text: string) => {
      if (href.startsWith('https://mp.weixin.qq.com')) {
        return `<a href="${href}" title="${title || text}" ${getStyles('wx_link')}>${text}</a>`;
      }
      
      if (href === text) {
        return text;
      }
      
      if (citeStatus) {
        const ref = addFootnote(title || text, href);
        return `<span ${getStyles('link')}>${text}<sup>[${ref}]</sup></span>`;
      }
      
      return `<span ${getStyles('link')}>${text}</span>`;
    };

    renderer.strong = (text: string) => {
      return `<strong ${getStyles('strong')}>${text}</strong>`;
    };

    renderer.em = (text: string) => {
      return `<span style="font-style: italic;">${text}</span>`;
    };

    renderer.table = (header: string, body: string) => {
      return `<section style="padding:0 8px;"><table class="preview-table"><thead ${getStyles('thead')}>${header}</thead><tbody>${body}</tbody></table></section>`;
    };

    renderer.tablecell = (text: string, flags: { header?: boolean; align?: string }) => {
      return `<td ${getStyles('td')}>${text}</td>`;
    };

    renderer.hr = () => {
      return `<hr ${getStyles('hr')}>`;
    };

    return renderer;
  }
}

