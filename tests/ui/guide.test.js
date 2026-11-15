// The player's guide (D253): docs/PLAYER_GUIDE.md, shown in the game by the main menu's Guide button. Its Markdown
// becomes the panel's HTML, escaped; and what it says about keys, ranks and missions matches the game's own data.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { guideHtml } from '../../src/ui/guide.js';
import { ACTIONS, keyLabel } from '../../src/input/bindings.js';
import { RANKS } from '../../src/core/ranks.js';
import { TARGETS } from '../../src/core/raid.js';
import { SKILLS } from '../../src/ai/skill.js';
import { aboutLine } from '../../src/ui/menus.js';

const md = readFileSync(new URL('../../docs/PLAYER_GUIDE.md', import.meta.url), 'utf8');

describe('the guide as HTML', () => {
  it('makes headings, paragraphs, nested lists, tables, bold and code', () => {
    const html = guideHtml('# Title\n\nSome **bold** and `code`.\n\n1. One\n   - inner\n     still inner\n2. Two\n\n| A | B |\n|---|---|\n| 1 | 2 |\n');
    expect(html).toBe('<h2>Title</h2><p>Some <strong>bold</strong> and <code>code</code>.</p>'
      + '<ol><li>One<ul><li>inner still inner</li></ul></li><li>Two</li></ol>'
      + '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>');
  });

  it('escapes anything that looks like HTML', () => {
    expect(guideHtml('a <script>alert(1)</script> & "b"')).toBe('<p>a &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;b&quot;</p>');
  });

  it('the bundled guide renders with balanced lists and no stray Markdown', () => {
    const html = guideHtml();
    expect(html.startsWith('<h2>Battle of Britain 1940')).toBe(true);
    for (const tag of ['ul', 'ol', 'li', 'table', 'p']) {
      expect((html.match(new RegExp(`<${tag}>`, 'g')) ?? []).length, tag).toBe((html.match(new RegExp(`</${tag}>`, 'g')) ?? []).length);
    }
    expect(html).not.toMatch(/\*\*|^#|<p>- /m);
  });
});

describe('what the guide says matches the game', () => {
  it('every default key it names for a control is that control\'s key', () => {
    const key = (id) => keyLabel(ACTIONS.find((a) => a.id === id).keys[0]);
    for (const [id, text] of [
      ['yawLeft', '**Z** left'], ['yawRight', '**X** right'], ['throttleUp', '**W** opens it'], ['trimUp', '**T** nose up'],
      ['flapsDown', '**F** down a stop'], ['gear', '**U** raises'], ['radiator', '**O** opens'], ['engineStart', '**L** starts'],
      ['boost', '**Q** pulls the boost cut-out'], ['seat', '**Tab** swaps'], ['bailOut', '**Backspace**'], ['radar', '**F4** hides'],
      ['rudderTrimTakeoff', '**/** sets the take-off rudder trim'], ['joystickPanel', '**J** in flight'],
    ]) {
      expect(md, id).toContain(text);
      expect(text, id).toContain(`**${key(id)}**`);
    }
  });

  it('the ranks, raid targets and skills are the game\'s', () => {
    RANKS.RAF.forEach((r, i) => expect(md).toContain(`| ${r.kills} | ${r.name} | ${RANKS.Luftwaffe[i].name} |`));
    for (const t of TARGETS) expect(md).toContain(t);
    expect(md).toContain(Object.values(SKILLS).map((s) => s.name).join(', ').replace(/, ([^,]*)$/, ' or $1'));
  });

  it('the main menu\'s About line gives the version and points to the guide', () => {
    expect(aboutLine()).toMatch(/^Version \d+\.\d+\.\d+ · .*Guide → About$/);
  });
});
