/* A small player for the Design canvas .dc.html format: holes, sc-if, sc-for, dc-import, DCLogic lifecycle. */
(function () {
  const SRC = window.DC_SOURCES || {}, defs = {}, helmetDone = {};
  const camel = (s) => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
  function decode(s) { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
  function def(name) {
    if (defs[name]) return defs[name];
    const txt = SRC[name]; if (!txt) throw new Error('no source for ' + name);
    let body = txt.slice(txt.indexOf('<x-dc>') + 6, txt.lastIndexOf('</x-dc>'));
    let helmet = ''; body = body.replace(/<helmet>([\s\S]*?)<\/helmet>/, (m, h) => { helmet = h; return ''; });
    const sm = txt.match(/<script type="text\/x-dc"[^>]*data-props=(['"])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/script>/);
    let props = {}; try { props = JSON.parse(decode(sm[2])); } catch (e) { console.log('props parse fail ' + name); }
    const defaults = {}; for (const k in props) if (props[k] && typeof props[k] === 'object' && 'default' in props[k]) defaults[k] = props[k].default;
    const Cls = new Function('DCLogic', sm[3] + '\n;return Component;')(DCLogic);
    const tpl = document.createElement('template'); tpl.innerHTML = body;
    return (defs[name] = { name, tpl, helmet, Cls, defaults });
  }
  function addHelmet(d) {
    if (helmetDone[d.name]) return; helmetDone[d.name] = 1;
    const box = document.createElement('div'); box.innerHTML = d.helmet;
    [...box.children].forEach((el) => { if (el.tagName === 'LINK' && /fonts\.(googleapis|gstatic)/.test(el.href)) return; if (el.tagName === 'STYLE') document.head.appendChild(el); });
  }
  class DCLogic {
    constructor(p) { this.props = p || {}; this.state = {}; }
    setState(u, cb) { const s = typeof u === 'function' ? u(this.state, this.props) : u; this.state = Object.assign({}, this.state, s); if (this.__inst) this.__inst.schedule(); if (cb) Promise.resolve().then(cb); }
  }
  window.DCLogic = DCLogic;
  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  function lookup(scope, path) {
    if (path === 'true') return true; if (path === 'false') return false; if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$/.test(path)) return path.slice(1, -1);
    return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), scope);
  }
  function whole(v) { const m = v.match(/^\{\{\s*([^}]+?)\s*\}\}$/); return m ? m[1] : null; }
  function interp(v, scope) { return v.replace(HOLE, (m, p) => { const r = lookup(scope, p); return r == null || typeof r === 'function' ? '' : String(r); }); }
  let evSeq = 0; const handlers = new Map();
  let uid = 0;
  class Inst {
    constructor(name, props, host, top) { this.d = def(name); addHelmet(this.d); this.host = host; this.kids = new Map(); this.id = ++uid;
      const p = top ? Object.assign({}, this.d.defaults, props) : props;
      this.logic = new this.d.Cls(p); this.logic.props = p; this.logic.__inst = this; this.pending = false; }
    schedule() { if (this.pending || this.dead) return; this.pending = true; queueMicrotask(() => { this.pending = false; if (!this.dead) this.render(); }); }
    mount() { this.render(); if (this.logic.componentDidMount) this.logic.componentDidMount(); }
    update(props) { const prev = this.logic.props; this.logic.props = props; this.render(); if (this.logic.componentDidUpdate) this.logic.componentDidUpdate(prev); }
    unmount() { this.dead = true; if (this.logic.componentWillUnmount) this.logic.componentWillUnmount(); this.kids.forEach((k) => k.unmount()); }
    render() {
      const vals = this.logic.renderVals ? this.logic.renderVals() : {};
      const imports = [];
      const out = document.createElement('div');
      const walk = (src, parent, scope, lp) => {
        src.childNodes.forEach((n, i) => {
          if (n.nodeType === 3) { parent.appendChild(document.createTextNode(interp(n.nodeValue, scope))); return; }
          if (n.nodeType !== 1) return;
          const tag = n.localName;
          if (tag === 'sc-if') { const p = whole(n.getAttribute('value') || ''); if (p && lookup(scope, p)) walk(n, parent, scope, lp + '.' + i); return; }
          if (tag === 'sc-for') { const L = lookup(scope, whole(n.getAttribute('list') || '') || '') || []; const as = n.getAttribute('as');
            L.forEach((it, j) => { const s2 = Object.create(scope); s2[as] = it; walk(n, parent, s2, lp + '.' + i + ':' + j); }); return; }
          if (tag === 'dc-import') {
            const key = this.id + '/' + lp + '.' + i, props = {};
            [...n.attributes].forEach((a) => { if (a.name === 'name' || a.name.startsWith('hint-')) return; const w = whole(a.value); props[camel(a.name)] = w ? lookup(scope, w) : interp(a.value, scope); });
            const ph = document.createElement('div'); ph.setAttribute('data-dck', key); ph.style.cssText = 'display: contents';
            parent.appendChild(ph); imports.push({ key, name: n.getAttribute('name'), props }); return;
          }
          const el = n.namespaceURI === 'http://www.w3.org/1999/xhtml' ? document.createElement(tag) : document.createElementNS(n.namespaceURI, n.tagName);
          [...n.attributes].forEach((a) => {
            if (a.name.startsWith('hint-')) return;
            const w = whole(a.value);
            if (/^on[a-z]+$/.test(a.name) && w) { const fn = lookup(scope, w); if (typeof fn === 'function') { const id = 'e' + (++evSeq); handlers.set(id, fn); el.setAttribute('data-ev-' + a.name.slice(2), id); } return; }
            try { if (a.namespaceURI) el.setAttributeNS(a.namespaceURI, a.name, interp(a.value, scope)); else el.setAttribute(a.name, interp(a.value, scope)); } catch (e) {}
          });
          walk(n.content || n, el, scope, lp + '.' + i);
          parent.appendChild(el);
        });
      };
      const scope = Object.create(vals);
      walk(this.d.tpl.content, out, scope, '');
      morphdom(this.host, out, { childrenOnly: true,
        getNodeKey: (nd) => (nd.getAttribute && nd.getAttribute('data-dck')) || nd.id,
        onBeforeElChildrenUpdated: (from) => !from.hasAttribute('data-dck') });
      const seen = new Set();
      imports.forEach((im) => {
        const ph = this.host.querySelector('[data-dck="' + CSS.escape(im.key) + '"]'); if (!ph) return; seen.add(im.key);
        let k = this.kids.get(im.key);
        if (k && k.host !== ph) { k.unmount(); k = null; }
        if (!k) { k = new Inst(im.name, im.props, ph, false); this.kids.set(im.key, k); k.mount(); }
        else k.update(im.props);
      });
      this.kids.forEach((k, key) => { if (!seen.has(key)) { k.unmount(); this.kids.delete(key); } });
    }
  }
  ['click', 'input', 'pointerdown', 'pointerup', 'change'].forEach((t) => document.addEventListener(t, (e) => {
    const el = e.target.closest && e.target.closest('[data-ev-' + t + ']'); if (!el) return; const fn = handlers.get(el.getAttribute('data-ev-' + t)); if (fn) fn(e); }, true));
  window.DCMount = function (host, name, props) { const i = new Inst(name, props || {}, host, true); i.mount(); return i; };
})();
