export type StyleObject = Record<string, string>;

export interface ThemeBlock {
  h1: StyleObject;
  h2: StyleObject;
  h3: StyleObject;
  h4: StyleObject;
  p: StyleObject;
  blockquote: StyleObject;
  blockquote_p: StyleObject;
  code_pre: StyleObject;
  code: StyleObject;
  image: StyleObject;
  ol: StyleObject;
  ul: StyleObject;
  footnotes: StyleObject;
  figure: StyleObject;
  hr: StyleObject;
}

export interface ThemeInline {
  listitem: StyleObject;
  codespan: StyleObject;
  link: StyleObject;
  wx_link: StyleObject;
  strong: StyleObject;
  table: StyleObject;
  thead: StyleObject;
  td: StyleObject;
  footnote: StyleObject;
  figcaption: StyleObject;
}

export interface Theme {
  BASE: StyleObject;
  block: ThemeBlock;
  inline: ThemeInline;
}

const baseColor = '#3f3f3f';

export const defaultTheme: Theme = {
  BASE: {
    'text-align': 'left',
    'line-height': '1.75',
  },
  block: {
    h1: {
      'font-size': '1.2em',
      'text-align': 'center',
      'font-weight': 'bold',
      display: 'table',
      margin: '2em auto 1em',
      padding: '0 1em',
      'border-bottom': '2px solid rgba(0, 152, 116, 0.9)',
      color: baseColor,
    },
    h2: {
      'font-size': '1.2em',
      'text-align': 'center',
      'font-weight': 'bold',
      display: 'table',
      margin: '4em auto 2em',
      padding: '0 0.2em',
      background: 'rgba(0, 152, 116, 0.9)',
      color: '#fff',
    },
    h3: {
      'font-weight': 'bold',
      'font-size': '1.1em',
      margin: '2em 8px 0.75em 0',
      'line-height': '1.2',
      'padding-left': '8px',
      'border-left': '3px solid rgba(0, 152, 116, 0.9)',
      color: baseColor,
    },
    h4: {
      'font-weight': 'bold',
      'font-size': '1em',
      margin: '2em 8px 0.5em',
      color: 'rgba(66, 185, 131, 0.9)',
    },
    p: {
      margin: '1.5em 8px',
      'letter-spacing': '0.1em',
      color: baseColor,
      'text-align': 'justify',
    },
    blockquote: {
      'font-style': 'normal',
      'border-left': 'none',
      padding: '1em',
      'border-radius': '8px',
      color: 'rgba(0,0,0,0.5)',
      background: '#f7f7f7',
      margin: '2em 8px',
    },
    blockquote_p: {
      'letter-spacing': '0.1em',
      color: 'rgb(80, 80, 80)',
      'font-size': '1em',
      display: 'block',
    },
    code_pre: {
      'font-size': '14px',
      'overflow-x': 'auto',
      'border-radius': '8px',
      padding: '1em',
      'line-height': '1.5',
      margin: '10px 8px',
    },
    code: {
      margin: '0',
      'white-space': 'nowrap',
      'font-family': 'Menlo, Operator Mono, Consolas, Monaco, monospace',
    },
    image: {
      'border-radius': '4px',
      display: 'block',
      margin: '0.1em auto 0.5em',
      width: '100% !important',
    },
    ol: {
      'margin-left': '0',
      'padding-left': '1em',
      color: baseColor,
    },
    ul: {
      'margin-left': '0',
      'padding-left': '1em',
      'list-style': 'circle',
      color: baseColor,
    },
    footnotes: {
      margin: '0.5em 8px',
      'font-size': '80%',
      color: baseColor,
    },
    figure: {
      margin: '1.5em 8px',
      color: baseColor,
    },
    hr: {
      'border-style': 'solid',
      'border-width': '1px 0 0',
      'border-color': 'rgba(0,0,0,0.1)',
      '-webkit-transform-origin': '0 0',
      '-webkit-transform': 'scale(1, 0.5)',
      'transform-origin': '0 0',
      transform: 'scale(1, 0.5)',
    },
  },
  inline: {
    listitem: {
      'text-indent': '-1em',
      display: 'block',
      margin: '0.2em 8px',
      color: baseColor,
    },
    codespan: {
      'font-size': '90%',
      color: '#d14',
      background: 'rgba(27,31,35,.05)',
      padding: '3px 5px',
      'border-radius': '4px',
    },
    link: {
      color: '#576b95',
    },
    wx_link: {
      color: '#576b95',
      'text-decoration': 'none',
    },
    strong: {
      color: 'rgba(15, 76, 129, 0.9)',
      'font-weight': 'bold',
    },
    table: {
      'border-collapse': 'collapse',
      'text-align': 'center',
      margin: '1em 8px',
      color: baseColor,
    },
    thead: {
      background: 'rgba(0, 0, 0, 0.05)',
      'font-weight': 'bold',
      color: baseColor,
    },
    td: {
      border: '1px solid #dfdfdf',
      padding: '0.25em 0.5em',
      color: baseColor,
    },
    footnote: {
      'font-size': '12px',
      color: baseColor,
    },
    figcaption: {
      'text-align': 'center',
      color: '#888',
      'font-size': '0.8em',
    },
  },
};

function createCustomTheme(theme: Theme, color: string): Theme {
  const customTheme = JSON.parse(JSON.stringify(theme)) as Theme;
  customTheme.block.h1['border-bottom'] = `2px solid ${color}`;
  customTheme.block.h2['background'] = color;
  customTheme.block.h3['border-left'] = `3px solid ${color}`;
  customTheme.block.h4['color'] = color;
  customTheme.inline.strong['color'] = color;
  return customTheme;
}

export function setColorWithTemplate(theme: Theme) {
  return (color: string) => {
    return createCustomTheme(theme, color);
  };
}

export function setColorWithCustomTemplate(theme: Theme, color: string): Theme {
  return createCustomTheme(theme, color);
}

export function setFontSizeWithTemplate(template: Theme) {
  return function (fontSize: number): Theme {
    const customTheme = JSON.parse(JSON.stringify(template)) as Theme;
    customTheme.block.h1['font-size'] = `${fontSize * 1.2}px`;
    customTheme.block.h2['font-size'] = `${fontSize * 1.2}px`;
    customTheme.block.h3['font-size'] = `${fontSize * 1.1}px`;
    customTheme.block.h4['font-size'] = `${fontSize}px`;
    return customTheme;
  };
}

export const setColor = setColorWithTemplate(defaultTheme);
export const setFontSize = setFontSizeWithTemplate(defaultTheme);

export function customCssWithTemplate(
  jsonString: Record<string, StyleObject>,
  color: string,
  theme: Theme
): Theme {
  const customTheme = createCustomTheme(theme, color);

  if (jsonString.h1) {
    customTheme.block.h1 = Object.assign(customTheme.block.h1, jsonString.h1);
  }
  if (jsonString.h2) {
    customTheme.block.h2 = Object.assign(customTheme.block.h2, jsonString.h2);
  }
  if (jsonString.h3) {
    customTheme.block.h3 = Object.assign(customTheme.block.h3, jsonString.h3);
  }
  if (jsonString.h4) {
    customTheme.block.h4 = Object.assign(customTheme.block.h4, jsonString.h4);
  }
  if (jsonString.code) {
    customTheme.block.code = Object.assign(
      customTheme.block.code,
      jsonString.code
    );
  }
  if (jsonString.p) {
    customTheme.block.p = Object.assign(customTheme.block.p, jsonString.p);
  }
  if (jsonString.hr) {
    customTheme.block.hr = Object.assign(customTheme.block.hr, jsonString.hr);
  }
  if (jsonString.blockquote) {
    customTheme.block.blockquote = Object.assign(
      customTheme.block.blockquote,
      jsonString.blockquote
    );
  }
  if (jsonString.blockquote_p) {
    customTheme.block.blockquote_p = Object.assign(
      customTheme.block.blockquote_p,
      jsonString.blockquote_p
    );
  }
  if (jsonString.image) {
    customTheme.block.image = Object.assign(
      customTheme.block.image,
      jsonString.image
    );
  }

  if (jsonString.strong) {
    customTheme.inline.strong = Object.assign(
      customTheme.inline.strong,
      jsonString.strong
    );
  }
  if (jsonString.codespan) {
    customTheme.inline.codespan = Object.assign(
      customTheme.inline.codespan,
      jsonString.codespan
    );
  }
  if (jsonString.link) {
    customTheme.inline.link = Object.assign(
      customTheme.inline.link,
      jsonString.link
    );
  }
  if (jsonString.wx_link) {
    customTheme.inline.wx_link = Object.assign(
      customTheme.inline.wx_link,
      jsonString.wx_link
    );
  }
  if (jsonString.ul) {
    customTheme.block.ul = Object.assign(customTheme.block.ul, jsonString.ul);
  }
  if (jsonString.ol) {
    customTheme.block.ol = Object.assign(customTheme.block.ol, jsonString.ol);
  }
  if (jsonString.li) {
    customTheme.inline.listitem = Object.assign(
      customTheme.inline.listitem,
      jsonString.li
    );
  }

  return customTheme;
}

