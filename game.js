(function () {
  var START = RUNWAY_SCENARIOS.START, ROUNDS = RUNWAY_SCENARIOS.ROUNDS, SEGMENTS = 14;

  var app = document.getElementById('app');
  var state;
  var keys = {};   // active keyboard shortcuts for the current screen: { a: fn, b: fn, enter: fn }

  // localStorage is optional: private mode or blocked storage must not break the game.
  var store = {
    get: function (k) { try { return localStorage.getItem('runway.' + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('runway.' + k, v); } catch (e) { /* ignore */ } }
  };

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    var k = e.key.toLowerCase();
    if (k === ' ') k = 'enter';
    if (k === 'а') k = 'a';   // Cyrillic layouts share the key cap
    if (k === 'и') k = 'b';
    if (keys[k]) { e.preventDefault(); keys[k](); }
  });

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function months(n) { return n + (n === 1 ? ' month' : ' months'); }
  function signed(n) { return n > 0 ? '+' + n : n < 0 ? '\u2212' + Math.abs(n) : '0'; }
  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var ta = el('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
  }
  function stripes() { var s = el('div', 'stripes'); s.setAttribute('aria-hidden', 'true'); s.appendChild(el('i')); s.appendChild(el('i')); s.appendChild(el('i')); return s; }

  function runway(roundLabel) {
    var wrap = el('div', 'runway');
    var head = el('div', 'runway-head');
    var count = el('p', 'runway-count');
    count.id = 'count';
    head.appendChild(count);
    head.appendChild(el('p', 'runway-round', roundLabel));
    var strip = el('div', 'strip');
    strip.id = 'strip';
    strip.setAttribute('role', 'img');
    for (var i = 0; i < SEGMENTS; i++) strip.appendChild(el('span'));
    wrap.appendChild(head); wrap.appendChild(strip);
    return wrap;
  }
  function paintRunway(n, flash) {
    var count = document.getElementById('count'), strip = document.getElementById('strip');
    if (!count || !strip) return;
    count.textContent = '';
    var b = el('b', null, String(Math.max(n, 0)));
    count.appendChild(b);
    count.appendChild(document.createTextNode(n === 1 ? ' month of cash' : ' months of cash'));
    strip.setAttribute('aria-label', months(Math.max(n, 0)) + ' of cash left');
    strip.classList.toggle('low', n <= 2);
    var cells = strip.children;
    for (var i = 0; i < cells.length; i++) {
      var on = i < n;
      if (flash && cells[i].classList.contains('on') !== on) {
        (function (c) { c.classList.add('flash'); setTimeout(function () { c.classList.remove('flash'); }, 450); })(cells[i]);
      }
      cells[i].classList.toggle('on', on);
    }
  }

  function showStart() {
    state = { round: 0, months: START, profitable: false, expanded: false, log: [], name: state ? state.name : (store.get('name') || '') };
    app.textContent = '';
    app.appendChild(stripes());
    app.appendChild(el('h1', null, 'Runway'));
    var intro = el('p', 'situation', 'You run a startup. Six decisions stand between you and a business that lasts.');
    app.appendChild(intro);
    var rules = el('ul', 'rules');
    ['You start with six months of cash. That is your runway.',
     'Good decisions add months. Bad decisions take them away.',
     'At zero months, your business is dead.',
     'Keyboard: A or B to choose, Enter to continue.'].forEach(function (t) { rules.appendChild(el('li', null, t)); });
    app.appendChild(rules);
    var best = store.get('best');
    if (best !== null) app.appendChild(el('p', 'best', 'Your best run so far: ' + months(Number(best)) + ' of cash left.'));
    var lab = el('label', null, 'Team name');
    lab.setAttribute('for', 'team');
    var input = el('input');
    input.type = 'text'; input.id = 'team'; input.maxLength = 30; input.autocomplete = 'off';
    input.placeholder = 'For example: Team 3';
    input.value = state.name;
    app.appendChild(lab); app.appendChild(input);
    var go = el('button', 'btn', 'Start the game');
    go.type = 'button';
    go.addEventListener('click', function () { state.name = input.value.trim(); store.set('name', state.name); showRound(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    app.appendChild(go);
    keys = { enter: function () { go.click(); } };
    window.scrollTo(0, 0);
  }

  function showRound() {
    var r = ROUNDS[state.round];
    app.textContent = '';
    app.appendChild(runway('Round ' + (state.round + 1) + ' of ' + ROUNDS.length));
    app.appendChild(el('h2', null, r.title));
    app.appendChild(el('p', 'situation', r.text));
    var choices = el('div', 'choices');
    var buttons = {};
    ['a', 'b'].forEach(function (key) {
      var b = el('button', 'choice');
      b.type = 'button';
      b.appendChild(el('span', 'letter', key.toUpperCase()));
      b.appendChild(el('span', 'label', r[key].label));
      b.appendChild(el('span', 'sub', r[key].sub));
      b.addEventListener('click', function () { choose(key, buttons); });
      buttons[key] = b;
      choices.appendChild(b);
    });
    app.appendChild(choices);
    var out = el('div');
    out.id = 'out';
    out.setAttribute('aria-live', 'polite');
    app.appendChild(out);
    paintRunway(state.months, false);
    keys = { a: function () { buttons.a.click(); }, b: function () { buttons.b.click(); } };
    window.scrollTo(0, 0);
  }

  function choose(key, buttons) {
    var r = ROUNDS[state.round];
    buttons.a.disabled = true; buttons.b.disabled = true;
    buttons[key].classList.add('picked');
    var res = r.play(key, state);
    state.months = Math.max(0, state.months + res.delta);
    state.log.push({ title: r.title, choice: r[key].label, delta: res.delta });
    paintRunway(state.months, true);

    var out = document.getElementById('out');
    var box = el('div', 'outcome');
    var cls = res.delta > 0 ? 'plus' : res.delta < 0 ? 'minus' : 'zero';
    box.appendChild(el('p', 'delta ' + cls, res.delta === 0 ? 'No change' : signed(res.delta) + (Math.abs(res.delta) === 1 ? ' month' : ' months')));
    box.appendChild(el('p', null, res.text));
    box.appendChild(el('p', 'lesson', r.lesson));
    out.appendChild(box);

    var dead = state.months <= 0, last = state.round === ROUNDS.length - 1;
    var next = el('button', 'btn', dead ? 'See what went wrong' : last ? 'See your result' : 'Next round');
    next.type = 'button';
    next.addEventListener('click', function () {
      if (dead || last) { showEnd(dead); } else { state.round += 1; showRound(); }
    });
    out.appendChild(next);
    keys = { enter: function () { next.click(); } };
    next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function showEnd(dead) {
    app.textContent = '';
    app.appendChild(stripes());
    if (state.name) app.appendChild(el('p', 'team', state.name));
    var verdict, detail;
    if (dead) {
      verdict = 'Bankrupt';
      detail = 'Your cash ran out in round ' + (state.round + 1) + '. Look at the list below: the round where you died is rarely the round that killed you.';
    } else if (state.months >= 8) {
      verdict = 'Built to last';
      detail = 'You proved demand, earned money on each sale and only then thought about speed.';
    } else if (state.months >= 4) {
      verdict = 'Still standing';
      detail = 'You survived the shock with some cash left. One or two decisions cost you more than they looked.';
    } else {
      verdict = 'Barely alive';
      detail = 'You are still open, but one more surprise would finish you.';
    }
    var prev = store.get('best');
    var record = prev === null || state.months > Number(prev);
    if (record) store.set('best', String(state.months));
    app.appendChild(el('h2', null, verdict));
    app.appendChild(el('p', 'final-num', String(state.months)));
    app.appendChild(el('p', 'final-unit', (state.months === 1 ? 'month' : 'months') + ' of cash left'));
    app.appendChild(el('p', 'verdict', detail + (record && prev !== null ? ' A new personal best.' : '')));

    var wrap = el('div', 'log-wrap');
    var table = el('table', 'log');
    var head = el('tr');
    ['Round', 'Your decision', 'Months'].forEach(function (t) { var th = el('th', null, t); th.scope = 'col'; head.appendChild(th); });
    table.appendChild(head);
    state.log.forEach(function (l) {
      var tr = el('tr');
      tr.appendChild(el('td', null, l.title));
      tr.appendChild(el('td', null, l.choice));
      tr.appendChild(el('td', null, signed(l.delta)));
      table.appendChild(tr);
    });
    wrap.appendChild(table);
    app.appendChild(wrap);

    var closing = el('div', 'closing');
    closing.appendChild(el('strong', null, 'Capital buys time, not demand'));
    closing.appendChild(el('p', null, 'Show this screen to the presenters.'));
    app.appendChild(closing);

    var share = el('button', 'btn quiet share', 'Copy result');
    share.type = 'button';
    share.addEventListener('click', function () {
      var lines = [(state.name ? state.name + ': ' : '') + verdict + ', ' + months(state.months) + ' of cash left'];
      state.log.forEach(function (l, i) { lines.push((i + 1) + '. ' + l.title + ' \u2192 ' + l.choice + ' (' + signed(l.delta) + ')'); });
      lines.push(location.href.split('#')[0]);
      copyText(lines.join('\n'), function (ok) {
        share.textContent = ok ? 'Copied' : 'Could not copy';
        setTimeout(function () { share.textContent = 'Copy result'; }, 1800);
      });
    });
    app.appendChild(share);

    var again = el('button', 'btn quiet', 'Play again');
    again.type = 'button';
    again.addEventListener('click', showStart);
    app.appendChild(again);
    keys = { enter: showStart };
    window.scrollTo(0, 0);
  }

  showStart();
})();
