// The player's guide in the game (Phase 10 checkpoint 3, D253): the main menu's Guide button shows docs/PLAYER_GUIDE.md,
// bundled as text, so the guide in the repository and the one in the game are the same file. A small Markdown reader
// turns it into the panel's HTML: headings, paragraphs, lists, tables, bold and code. Everything is escaped first, so
// the text can't add HTML of its own.

import GUIDE from '../../docs/PLAYER_GUIDE.md?raw';

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

/** The guide's Markdown as HTML (only the forms the guide uses). */
export function guideHtml(md = GUIDE) {
  const out = [];
  const lists = []; // the open lists, outermost first: 'ul' or 'ol' (nested by two spaces each)
  let para = [];
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const closeLists = (to = 0) => {
    while (lists.length > to) out.push(`</li></${lists.pop()}>`);
  };
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const heading = line.match(/^(#{1,3}) (.*)$/);
    const item = line.match(/^( *)(-|\d+\.) (.*)$/);
    if (heading) {
      flush();
      closeLists();
      const level = heading[1].length + 1; // # is the panel's h2
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (line.startsWith('|')) {
      flush();
      closeLists();
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      i -= 1;
      const [head, , ...body] = rows; // the second row is the |---| line
      out.push(`<table><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join('')}</tr>`
        + `${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</table>`);
    } else if (item) {
      flush();
      const level = Math.floor(item[1].length / 2) + 1;
      const kind = item[2] === '-' ? 'ul' : 'ol';
      if (level > lists.length) {
        out.push(`<${kind}><li>`);
        lists.push(kind);
      } else {
        closeLists(level);
        out.push('</li><li>');
      }
      out.push(inline(item[3]));
    } else if (/^ {2,}\S/.test(line) && lists.length) {
      out.push(` ${inline(line.trim())}`); // a list item running onto the next line
    } else if (line.trim() === '') {
      flush();
      if (!/^( *)(-|\d+\.) /.test(lines[i + 1] ?? '')) closeLists();
    } else {
      closeLists();
      para.push(line.trim());
    }
  }
  flush();
  closeLists();
  return out.join('');
}

/** Draws the guide in the menu panel, scrolling, with Back. */
export function renderGuide(panel, { onBack }) {
  panel.replaceChildren();
  const body = document.createElement('div');
  body.className = 'menu-guide';
  body.innerHTML = guideHtml(); // our own file, escaped above
  const box = document.createElement('div');
  box.className = 'menu-buttons';
  const back = Object.assign(document.createElement('button'), { textContent: 'Back' });
  back.addEventListener('click', onBack);
  box.appendChild(back);
  panel.append(body, box);
  body.scrollTop = 0;
}
