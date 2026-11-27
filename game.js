(function () {
  var START = 6, SEGMENTS = 14;

  var ROUNDS = [
    {
      title: 'Build or test?',
      text: 'You have an idea and six months of cash. What do you do first?',
      a: { label: 'Build the full product', sub: 'Months of work, then one big launch.' },
      b: { label: 'Test a simple version with ten customers', sub: 'One month. Rough and unfinished.' },
      play: function (pick) {
        if (pick === 'a') return { delta: -2, text: 'You launch a polished product. Customers ignore half the features, and you have to rebuild.' };
        return { delta: 0, text: 'The test costs you a month, but three customers pre-order. That cash pays the month back, and now you know what to build.' };
      },
      lesson: 'A minimum viable product is the cheapest way to find out whether anyone will pay.'
    },
    {
      title: 'Ask or listen?',
      text: 'Before you spend more, you want to know whether people really need this.',
      a: { label: 'Interview ten people about the last time they had the problem', sub: 'Slow, and some answers hurt.' },
      b: { label: 'Send a survey: “Would you use this?”', sub: 'Quick, and you get 200 answers.' },
      play: function (pick) {
        if (pick === 'b') return { delta: -2, text: 'Almost everyone says yes. Then almost nobody pays. People were being polite.' };
        return { delta: 1, text: 'It takes weeks, but you find a problem people already spend money on. Your first real sales arrive.' };
      },
      lesson: 'Opinions are free. Past behaviour shows what people actually do.'
    },
    {
      title: 'Set your price',
      text: 'Customers are coming, but a competitor is cheaper than you.',
      a: { label: 'Undercut them to grow fast', sub: 'More customers, less money per sale.' },
      b: { label: 'Charge a price that covers your costs', sub: 'Fewer customers, each one profitable.' },
      play: function (pick, s) {
        if (pick === 'a') { s.profitable = false; return { delta: -1, text: 'Sales jump, but every sale costs more than it earns. Your growth is eating your cash.' }; }
        s.profitable = true;
        return { delta: 1, text: 'You sell less, but each sale earns money. Your unit economics work.' };
      },
      lesson: 'Revenue growth and sustainable growth are different things.'
    },
    {
      title: 'The big client',
      text: 'A large company wants to buy from you. It pays its invoices after 60 days. Your salaries and rent are due in 30.',
      a: { label: 'Stay with small customers who pay upfront', sub: 'Less impressive, but paid today.' },
      b: { label: 'Take the big order', sub: 'Your largest sale so far.' },
      play: function (pick) {
        if (pick === 'b') return { delta: -2, text: 'On paper you are profitable. In the bank you are empty for a month, and you borrow at a high price to pay salaries.' };
        return { delta: 1, text: 'Nothing to celebrate on social media, but the cash arrives before the bills do.' };
      },
      lesson: 'Profit and cash are different. Businesses die from a lack of cash.'
    },
    {
      title: 'The investor',
      text: 'An investor offers you a large cheque. The condition: open in three new cities this year.',
      a: { label: 'Take the money and expand', sub: 'Four more months of cash, today.' },
      b: { label: 'Say no and grow at your own speed', sub: 'No new money, no new obligations.' },
      play: function (pick, s) {
        if (pick === 'a') { s.expanded = true; return { delta: 4, text: 'Your bank account has never looked better. You sign three long leases and hire three teams.' }; }
        s.expanded = false;
        return { delta: 0, text: 'Nothing changes in the bank. You keep full control and low fixed costs.' };
      },
      lesson: 'Capital buys time. What else it buys depends on what you are scaling.'
    },
    {
      title: 'The shock',
      text: 'A crisis hits. Demand drops by half overnight, and nobody knows for how long.',
      a: { label: 'Cut back to the core business', sub: 'Painful, but it lowers your costs now.' },
      b: { label: 'Keep everything open and wait', sub: 'It might pass quickly.' },
      play: function (pick, s) {
        var hit, text;
        if (s.expanded && !s.profitable) { hit = 5; text = 'Three cities, three leases, and every sale was already losing money. The losses multiply.'; }
        else if (s.expanded) { hit = 3; text = 'Three cities hurt, but each one was earning money before the crisis, so you can carry them for a while.'; }
        else { hit = 1; text = 'You are small and your fixed costs are low. You feel the drop, but it does not threaten you.'; }
        if (pick === 'a') { hit -= 1; text += ' Cutting back to the core saves you a month.'; }
        else { text += ' Waiting means you take the full hit.'; }
        return { delta: -hit, text: text };
      },
      lesson: 'When fixed costs meet falling income, early decisions get paid for.'
    }
  ];

  var app = document.getElementById('app');
  var state;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function months(n) { return n + (n === 1 ? ' month' : ' months'); }
  function signed(n) { return n > 0 ? '+' + n : n < 0 ? '\u2212' + Math.abs(n) : '0'; }
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
    state = { round: 0, months: START, profitable: false, expanded: false, log: [], name: state ? state.name : '' };
    app.textContent = '';
    app.appendChild(stripes());
    app.appendChild(el('h1', null, 'Runway'));
    var intro = el('p', 'situation', 'You run a startup. Six decisions stand between you and a business that lasts.');
    app.appendChild(intro);
    var rules = el('ul', 'rules');
    ['You start with six months of cash. That is your runway.',
     'Good decisions add months. Bad decisions take them away.',
     'At zero months, your business is dead.'].forEach(function (t) { rules.appendChild(el('li', null, t)); });
    app.appendChild(rules);
    var lab = el('label', null, 'Team name');
    lab.setAttribute('for', 'team');
    var input = el('input');
    input.type = 'text'; input.id = 'team'; input.maxLength = 30; input.autocomplete = 'off';
    input.placeholder = 'For example: Team 3';
    input.value = state.name;
    app.appendChild(lab); app.appendChild(input);
    var go = el('button', 'btn', 'Start the game');
    go.type = 'button';
    go.addEventListener('click', function () { state.name = input.value.trim(); showRound(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    app.appendChild(go);
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
    app.appendChild(el('h2', null, verdict));
    app.appendChild(el('p', 'final-num', String(state.months)));
    app.appendChild(el('p', 'final-unit', (state.months === 1 ? 'month' : 'months') + ' of cash left'));
    app.appendChild(el('p', 'verdict', detail));

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

    var again = el('button', 'btn quiet', 'Play again');
    again.type = 'button';
    again.addEventListener('click', showStart);
    app.appendChild(again);
    window.scrollTo(0, 0);
  }

  showStart();
})();
