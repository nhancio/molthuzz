import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import ts from 'typescript';

test('native UI literals use the catalog and member-authored fields never enter translation calls', async () => {
  const english = JSON.parse(await readFile(new URL('./locales/en.json', import.meta.url), 'utf8'));
  const issues: string[] = [];
  const attributes = new Set(['accessibilityLabel', 'placeholder', 'label', 'title', 'text']);
  for (const folder of ['screens', 'components']) {
    const base = new URL(`../${folder}/`, import.meta.url);
    for (const filename of (await readdir(base)).filter((file) => file.endsWith('.tsx'))) {
      const source = ts.createSourceFile(filename, await readFile(new URL(filename, base), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function inspect(node: ts.Node) {
        const location = `${folder}/${filename}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`;
        if (ts.isJsxText(node)) {
          const text = node.text.replace(/\s+/g, ' ').trim();
          if (/[A-Za-z]{2}/.test(text) && !['makein', 'makein✳'].includes(text)) issues.push(`${location}: untranslated JSX ${text}`);
        }
        if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression) && /^\s+$/.test(node.expression.text)) {
          const parent = node.parent;
          const tag = ts.isJsxElement(parent) ? parent.openingElement.tagName.getText(source) : '';
          if (!['Text', 'NativeText', 'Button', 'Badge'].includes(tag)) issues.push(`${location}: raw native whitespace outside Text`);
        }
        if (ts.isJsxAttribute(node) && attributes.has(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer) && /[A-Za-z]{2}/.test(node.initializer.text)) {
          const container = node.parent.parent;
          const translatedNotice = (ts.isJsxSelfClosingElement(container) || ts.isJsxOpeningElement(container)) && container.tagName.getText(source) === 'Notice' && Object.hasOwn(english, node.initializer.text);
          if (!translatedNotice && !['https://…', '1998-08-24'].includes(node.initializer.text)) issues.push(`${location}: untranslated ${node.name.getText(source)}`);
        }
        if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0]) {
          const argument = node.arguments[0];
          if (ts.isStringLiteral(argument) && !Object.hasOwn(english, argument.text)) issues.push(`${location}: missing key ${argument.text}`);
          if (ts.isPropertyAccessExpression(argument) && ['bio', 'name', 'location', 'question', 'answer', 'text'].includes(argument.name.text) && argument.expression.getText(source) !== 'item') issues.push(`${location}: translated member content ${argument.getText(source)}`);
        }
        ts.forEachChild(node, inspect);
      }
      inspect(source);
    }
  }
  assert.deepEqual(issues, []);
});
