// Run with node --test __tests__/app/admin/content/LongformMarkdown.test.mjs.
// Use native ESM so these assertions exercise react-markdown and its real plugins.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { JSDOM } = createRequire(require.resolve('jest-environment-jsdom'))('jsdom');
const source = readFileSync(new URL('../../../../app/admin/content/components/card-series/LongformMarkdown.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
});
const moduleSource = outputText.replace(/from (['"])([^'"]+)\1/g, (_, quote, specifier) => `from "${import.meta.resolve(specifier)}"`);
const { default: LongformMarkdown } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);

function render(body) {
  return new JSDOM(renderToStaticMarkup(React.createElement(LongformMarkdown, { body }))).window.document;
}

test('single enters render as breaks and blank lines retain paragraph spacing', () => {
  const body = '축제 전에 같이 갈 사람을 미리 찾고,\n축제 당일에는 현장에 있는 사람을 확인해요.\n\n만남 요청을 보내보세요.';
  const document = render(body);
  assert.equal(document.querySelectorAll('p').length, 2);
  assert.equal(document.querySelectorAll('p:first-child br').length, 1);
  assert.equal(document.querySelector('p').style.marginBottom, '12px');
});

test('existing hard breaks do not create duplicate breaks; code stays literal', () => {
  const document = render('첫 줄  \n둘째 줄\n\n```text\na\nb\n```');
  assert.equal(document.querySelector('p').querySelectorAll('br').length, 1);
  assert.equal(document.querySelector('pre code').textContent, 'a\nb\n');
  assert.equal(document.querySelector('pre code').querySelectorAll('br').length, 0);
});

test('bullets, ordered numbers and quote borders are visible despite a CSS reset', () => {
  const document = render('- 축제 같이 갈 사람\n- 함께 놀 친구\n\n3. 사전 신청\n4. 앱 설치\n\n> 첫 인용 줄\n> 둘째 인용 줄');
  assert.equal(document.querySelector('ul').style.listStyleType, 'disc');
  assert.equal(document.querySelector('ol').style.listStyleType, 'decimal');
  assert.equal(document.querySelector('ol').getAttribute('start'), '3');
  assert.equal(document.querySelectorAll('li').length, 4);
  assert.equal(document.querySelector('blockquote').style.borderLeftWidth, '4px');
  assert.equal(document.querySelector('blockquote').querySelectorAll('br').length, 1);
});

test('bold, images and links continue rendering and unsafe URLs remain blocked', () => {
  const document = render('**축제 메이트**\n\n![축제](https://example.com/festival.png)\n\n[신청](https://example.com/apply)\n\n[차단](javascript:alert)');
  assert.equal(document.querySelector('strong').textContent, '축제 메이트');
  assert.equal(document.querySelector('img').getAttribute('src'), 'https://example.com/festival.png');
  assert.equal(document.querySelector('img').getAttribute('alt'), '축제');
  assert.equal(document.querySelector('a').getAttribute('href'), 'https://example.com/apply');
  assert.notEqual(document.querySelectorAll('a')[1].getAttribute('href'), 'javascript:alert');
});
