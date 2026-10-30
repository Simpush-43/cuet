export default {
  id: 'differentiation',
  subject: 'maths',
  title: 'Continuity and Differentiability',
  videoUrl: '',
  notes: [
    {
      heading: 'Standard derivatives',
      points: [
        'd/dx (x^n) = n x^(n-1)',
        'd/dx (sin x) = cos x, d/dx (cos x) = -sin x, d/dx (tan x) = sec^2 x',
        'd/dx (e^x) = e^x and d/dx (ln x) = 1/x',
      ],
    },
    {
      heading: 'Rules',
      points: [
        "Product rule: (uv)' = u'v + uv'.",
        "Quotient rule: (u/v)' = (u'v - uv') / v^2.",
        "Chain rule: d/dx f(g(x)) = f'(g(x)) x g'(x).",
        'For functions like x^x, take ln of both sides first (logarithmic differentiation): d/dx (x^x) = x^x (1 + ln x).',
      ],
    },
    {
      heading: 'Continuity link',
      points: [
        'If f is differentiable at a point, it is continuous there.',
        'The reverse is false: |x| is continuous at 0 but not differentiable at 0.',
      ],
    },
  ],
  mindMap: {
    center: 'Differentiation',
    branches: [
      { label: 'Standard results', items: ['x^n, sin, cos, tan', 'e^x, ln x'] },
      { label: 'Rules', items: ['Product', 'Quotient', 'Chain'] },
      { label: 'Special methods', items: ['Logarithmic (x^x)', 'Implicit'] },
      { label: 'Link to continuity', items: ['Differentiable gives continuous', '|x| at 0 is the counterexample'] },
    ],
  },
  dpp: [
    {
      q: 'Find d/dx (x^5).',
      options: ['x^4', '5x^4', '5x^5', '4x^5'],
      answer: 1,
      explanation: 'Power rule: n x^(n-1) with n = 5 gives 5x^4.',
    },
    {
      q: 'Find d/dx (sin 2x).',
      options: ['cos 2x', '2 cos 2x', '-2 cos 2x', '2 sin 2x'],
      answer: 1,
      explanation: 'Chain rule: cos(2x) x d/dx(2x) = 2 cos 2x.',
    },
    {
      q: 'Find d/dx (x^2 e^x).',
      options: ['2x e^x', 'x^2 e^x', 'e^x (x^2 + 2x)', '2x'],
      answer: 2,
      explanation: 'Product rule: 2x e^x + x^2 e^x = e^x (x^2 + 2x).',
    },
    {
      q: 'Find d/dx (ln 3x).',
      options: ['1/x', '3/x', '1/(3x)', '3x'],
      answer: 0,
      explanation: 'ln 3x = ln 3 + ln x, and ln 3 is a constant, so the derivative is 1/x.',
    },
    {
      q: 'Find d/dx (x^x) for x > 0.',
      options: ['x . x^(x-1)', 'x^x ln x', 'x^x (1 + ln x)', 'x^x'],
      answer: 2,
      explanation: "Let y = x^x. Then ln y = x ln x, so y'/y = ln x + 1 and y' = x^x (1 + ln x).",
    },
  ],
  test: [
    {
      q: 'Find d/dx (cos x).',
      options: ['sin x', '-sin x', 'cos x', '-cos x'],
      answer: 1,
      explanation: 'Standard result: d/dx (cos x) = -sin x.',
    },
    {
      q: 'Find d/dx (tan x).',
      options: ['sec x', 'sec^2 x', 'cot x', '-cosec^2 x'],
      answer: 1,
      explanation: 'Standard result: d/dx (tan x) = sec^2 x.',
    },
    {
      q: 'Find the value of d/dx (x^3 - 3x + 5) at x = 2.',
      options: ['3', '6', '9', '12'],
      answer: 2,
      explanation: 'Derivative = 3x^2 - 3. At x = 2: 12 - 3 = 9.',
    },
    {
      q: 'Find d/dx (sin(x^2)).',
      options: ['cos(x^2)', '2x cos(x^2)', '2x sin(x^2)', '-2x cos(x^2)'],
      answer: 1,
      explanation: 'Chain rule: cos(x^2) x 2x = 2x cos(x^2).',
    },
    {
      q: 'Find d/dx [x / (x + 1)].',
      options: ['1/(x+1)^2', 'x/(x+1)^2', '1/(x+1)', '(2x+1)/(x+1)^2'],
      answer: 0,
      explanation: 'Quotient rule: [(x+1)(1) - x(1)] / (x+1)^2 = 1/(x+1)^2.',
    },
    {
      q: 'Which statement is true?',
      options: [
        'Every continuous function is differentiable',
        'If f is differentiable at a point, it is continuous there',
        '|x| is differentiable at x = 0',
        'Continuity implies differentiability',
      ],
      answer: 1,
      explanation: 'Differentiable implies continuous. The converse is false, and |x| at 0 is the standard counterexample.',
    },
  ],
};
