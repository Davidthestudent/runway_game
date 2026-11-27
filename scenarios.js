/* Scenario data for Runway.
 *
 * Each round has a title, the situation text, two options (a and b),
 * a play(pick, state) function that returns { delta, text } where delta
 * is the change in months of runway, and a one-line lesson.
 * play() may read and write flags on the shared state object
 * (profitable, expanded) so that later rounds can react to earlier choices.
 *
 * The file works both in the browser (window.RUNWAY_SCENARIOS) and in
 * Node (module.exports) so the scenarios can be unit-tested.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RUNWAY_SCENARIOS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var START = 6;

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

  return { START: START, ROUNDS: ROUNDS };
});
