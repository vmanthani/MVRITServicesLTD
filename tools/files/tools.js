/**
 * Tool Registry
 * -------------
 * Each tool is a declarative spec:
 *   inputs  — what the user provides (drives the generated form)
 *   compute — a pure function (values) => results   [the actual maths]
 *   outputs — how results are labelled and formatted
 *   tips / faq / formula — content, which also feeds the SEO page body
 *
 * The renderer builds the UI from this. No per-tool HTML is hand-written,
 * so a fix to the renderer fixes every tool at once.
 */

const num = (key, label, opts = {}) => ({ key, label, type: 'number', ...opts });
const sel = (key, label, options, opts = {}) => ({ key, label, type: 'select', options, ...opts });

const TOOLS = {

  /* ===================== FINANCE ===================== */

  'compound-interest': {
    title: 'Compound Interest Calculator',
    category: 'finance',
    icon: '📈',
    description: 'Calculate how an investment grows with compound interest, including regular contributions.',
    keywords: ['compound interest', 'investment growth', 'savings calculator', 'future value'],
    formula: 'A = P(1 + r/n)^(nt) + PMT · [((1 + r/n)^(nt) − 1) / (r/n)]',
    inputs: [
      num('principal', 'Initial Principal', { unit: '$', default: 10000, min: 0 }),
      num('rate', 'Annual Interest Rate', { unit: '%', default: 7, step: 0.01 }),
      num('years', 'Time Period', { unit: 'years', default: 10, min: 0 }),
      sel('freq', 'Compounding Frequency', [
        { value: 1, label: 'Annually' },
        { value: 2, label: 'Semi-annually' },
        { value: 4, label: 'Quarterly' },
        { value: 12, label: 'Monthly' },
        { value: 365, label: 'Daily' }
      ], { default: 12 }),
      num('contribution', 'Additional Contribution per Period', { unit: '$', default: 0, min: 0 })
    ],
    compute: ({ principal, rate, years, freq, contribution }) => {
      const r = rate / 100;
      const n = Number(freq);
      const periods = n * years;
      const periodRate = r / n;

      const growthFactor = Math.pow(1 + periodRate, periods);
      const fromPrincipal = principal * growthFactor;
      // Future value of an ordinary annuity; r=0 degenerates to simple sum.
      const fromContributions = periodRate === 0
        ? contribution * periods
        : contribution * ((growthFactor - 1) / periodRate);

      const total = fromPrincipal + fromContributions;
      const invested = principal + contribution * periods;

      return {
        total,
        interest: total - invested,
        invested,
        effectiveRate: (Math.pow(1 + periodRate, n) - 1) * 100
      };
    },
    outputs: [
      { key: 'total', label: 'Final Balance', format: 'currency', primary: true },
      { key: 'interest', label: 'Total Interest Earned', format: 'currency' },
      { key: 'invested', label: 'Total Amount Invested', format: 'currency' },
      { key: 'effectiveRate', label: 'Effective Annual Rate', format: 'percent' }
    ],
    tips: [
      'More frequent compounding increases returns, but the gain from monthly to daily is small — the rate matters far more than the frequency.',
      'The effective annual rate (APY) is the honest comparison figure between accounts with different compounding schedules.',
      'Contributions are treated as arriving at the end of each period. Contributing at the start of each period yields slightly more.'
    ],
    faq: [
      { q: 'What is the difference between simple and compound interest?', a: 'Simple interest is calculated only on the original principal. Compound interest is calculated on the principal plus all previously accumulated interest, so growth accelerates over time.' },
      { q: 'Does this account for inflation or tax?', a: 'No. The result is a nominal figure. To estimate real purchasing power, subtract your expected inflation rate from the interest rate before calculating.' }
    ]
  },

  'loan-payment': {
    title: 'Loan Payment Calculator',
    category: 'finance',
    icon: '🏦',
    description: 'Calculate monthly loan payments, total interest paid, and the full cost of borrowing.',
    keywords: ['loan calculator', 'monthly payment', 'mortgage payment', 'amortization'],
    formula: 'M = P · [r(1+r)^n] / [(1+r)^n − 1]',
    inputs: [
      num('amount', 'Loan Amount', { unit: '$', default: 250000, min: 0 }),
      num('rate', 'Annual Interest Rate', { unit: '%', default: 6.5, step: 0.01 }),
      num('years', 'Loan Term', { unit: 'years', default: 30, min: 0 })
    ],
    compute: ({ amount, rate, years }) => {
      const monthlyRate = rate / 100 / 12;
      const n = years * 12;
      const monthly = monthlyRate === 0
        ? amount / n
        : amount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      const totalPaid = monthly * n;
      return {
        monthly,
        totalPaid,
        totalInterest: totalPaid - amount,
        interestRatio: ((totalPaid - amount) / amount) * 100
      };
    },
    outputs: [
      { key: 'monthly', label: 'Monthly Payment', format: 'currency', primary: true },
      { key: 'totalPaid', label: 'Total Paid Over Term', format: 'currency' },
      { key: 'totalInterest', label: 'Total Interest', format: 'currency' },
      { key: 'interestRatio', label: 'Interest as % of Principal', format: 'percent' }
    ],
    tips: [
      'Shortening the term raises the monthly payment but usually cuts total interest dramatically.',
      'This covers principal and interest only. Property tax, insurance, and fees are additional.',
      'Extra payments applied to principal reduce total interest more the earlier they are made.'
    ],
    faq: [
      { q: 'Why is so much of an early payment interest?', a: 'Interest is charged on the outstanding balance, which is highest at the start. As the balance falls, a growing share of each fixed payment goes to principal.' }
    ]
  },

  'percentage': {
    title: 'Percentage Calculator',
    category: 'mathematics',
    icon: '％',
    description: 'Calculate percentages, percentage change, and reverse percentages in both directions.',
    keywords: ['percentage calculator', 'percent change', 'percentage increase', 'percent of'],
    formula: 'part = whole × pct/100  ·  change = (new − old)/old × 100',
    inputs: [
      num('value', 'Value A', { default: 25 }),
      num('total', 'Value B', { default: 200 })
    ],
    compute: ({ value, total }) => ({
      aOfB: total === 0 ? NaN : (value / total) * 100,
      pctOfB: (value / 100) * total,
      change: value === 0 ? NaN : ((total - value) / value) * 100,
      increased: total * (1 + value / 100),
      decreased: total * (1 - value / 100),
      difference: (value + total) === 0 ? NaN : (Math.abs(value - total) / ((value + total) / 2)) * 100
    }),
    outputs: [
      { key: 'aOfB', label: 'A is what % of B', format: 'percent', primary: true },
      { key: 'pctOfB', label: 'A% of B', format: 'number' },
      { key: 'change', label: '% change from A to B', format: 'percent' },
      { key: 'increased', label: 'B increased by A%', format: 'number' },
      { key: 'decreased', label: 'B decreased by A%', format: 'number' },
      { key: 'difference', label: '% difference (symmetric)', format: 'percent' }
    ],
    tips: [
      'Percentage change is directional: going 100 → 50 is −50%, but 50 → 100 is +100%. The same absolute move gives different percentages.',
      'A 20% drop followed by a 20% rise does not return you to the start — it leaves you 4% down.',
      'Percentage difference (symmetric) compares two values without treating either as the baseline.'
    ],
    faq: [
      { q: 'What is the difference between percentage points and percent?', a: 'If a rate moves from 5% to 7%, that is a rise of 2 percentage points, but a 40% increase in relative terms. Mixing the two is a common source of misleading statistics.' }
    ]
  },

  'vat-sales-tax': {
    title: 'VAT & Sales Tax Calculator',
    category: 'finance',
    icon: '🧾',
    description: 'Add tax to a net price or extract tax from a gross price — works in both directions.',
    keywords: ['VAT calculator', 'sales tax', 'GST calculator', 'tax inclusive'],
    formula: 'gross = net × (1 + rate)  ·  net = gross / (1 + rate)',
    inputs: [
      num('amount', 'Amount', { unit: '$', default: 100, min: 0 }),
      num('rate', 'Tax Rate', { unit: '%', default: 20, step: 0.01 }),
      sel('mode', 'Amount is', [
        { value: 'net', label: 'Net (tax not yet added)' },
        { value: 'gross', label: 'Gross (tax already included)' }
      ], { default: 'net' })
    ],
    compute: ({ amount, rate, mode }) => {
      const r = rate / 100;
      const net = mode === 'net' ? amount : amount / (1 + r);
      const gross = mode === 'net' ? amount * (1 + r) : amount;
      return { net, tax: gross - net, gross };
    },
    outputs: [
      { key: 'gross', label: 'Gross (incl. tax)', format: 'currency', primary: true },
      { key: 'net', label: 'Net (excl. tax)', format: 'currency' },
      { key: 'tax', label: 'Tax Amount', format: 'currency' }
    ],
    tips: [
      'To remove 20% tax you divide by 1.2 — you do not subtract 20%. Subtracting gives the wrong answer.',
      'Switch the mode selector to work backwards from a receipt total.'
    ],
    faq: [
      { q: 'Why can I not just subtract the tax percentage?', a: 'The tax was calculated on the net amount, not the gross. Subtracting 20% of the gross removes too much. Dividing by 1.20 reverses the original operation correctly.' }
    ]
  },

  /* ===================== MATHEMATICS ===================== */

  'quadratic-solver': {
    title: 'Quadratic Equation Solver',
    category: 'mathematics',
    icon: '𝑥²',
    description: 'Solve ax² + bx + c = 0, including complex roots, vertex, and discriminant.',
    keywords: ['quadratic formula', 'equation solver', 'roots', 'discriminant'],
    formula: 'x = (−b ± √(b² − 4ac)) / 2a',
    inputs: [
      num('a', 'Coefficient a', { default: 1 }),
      num('b', 'Coefficient b', { default: -3 }),
      num('c', 'Coefficient c', { default: 2 })
    ],
    compute: ({ a, b, c }) => {
      if (a === 0) {
        return { root1: b === 0 ? NaN : -c / b, root2: NaN, discriminant: NaN, vertexX: NaN, vertexY: NaN, nature: 'Linear (a = 0) — one root' };
      }
      const d = b * b - 4 * a * c;
      const vertexX = -b / (2 * a);
      const vertexY = a * vertexX * vertexX + b * vertexX + c;

      if (d > 0) {
        const sq = Math.sqrt(d);
        return { root1: (-b + sq) / (2 * a), root2: (-b - sq) / (2 * a), discriminant: d, vertexX, vertexY, nature: 'Two distinct real roots' };
      }
      if (d === 0) {
        return { root1: -b / (2 * a), root2: -b / (2 * a), discriminant: 0, vertexX, vertexY, nature: 'One repeated real root' };
      }
      const re = -b / (2 * a);
      const im = Math.sqrt(-d) / (2 * a);
      return {
        root1: `${re.toFixed(4)} + ${Math.abs(im).toFixed(4)}i`,
        root2: `${re.toFixed(4)} − ${Math.abs(im).toFixed(4)}i`,
        discriminant: d, vertexX, vertexY, nature: 'Two complex conjugate roots'
      };
    },
    outputs: [
      { key: 'root1', label: 'Root 1', format: 'auto', primary: true },
      { key: 'root2', label: 'Root 2', format: 'auto' },
      { key: 'nature', label: 'Nature of Roots', format: 'text' },
      { key: 'discriminant', label: 'Discriminant (b² − 4ac)', format: 'number' },
      { key: 'vertexX', label: 'Vertex x', format: 'number' },
      { key: 'vertexY', label: 'Vertex y', format: 'number' }
    ],
    tips: [
      'The discriminant alone tells you the root type: positive gives two real roots, zero gives one, negative gives a complex pair.',
      'The vertex is the parabola\u2019s minimum when a > 0 and its maximum when a < 0.'
    ],
    faq: [
      { q: 'What if a = 0?', a: 'The equation is no longer quadratic but linear (bx + c = 0), with the single root x = −c/b. The tool detects and handles this.' }
    ]
  },

  'statistics': {
    title: 'Statistics Calculator (Mean, Median, Mode, SD)',
    category: 'mathematics',
    icon: '📊',
    description: 'Compute mean, median, mode, standard deviation, variance, and quartiles from a dataset.',
    keywords: ['mean median mode', 'standard deviation calculator', 'variance', 'quartiles'],
    formula: 'σ = √( Σ(xᵢ − μ)² / N )   ·   s = √( Σ(xᵢ − x̄)² / (N−1) )',
    inputs: [
      { key: 'data', label: 'Data Set (comma or space separated)', type: 'text', default: '12, 15, 11, 18, 15, 20, 13, 15' }
    ],
    compute: ({ data }) => {
      const nums = String(data).split(/[\s,;]+/).map(Number).filter(n => isFinite(n));
      const N = nums.length;
      if (N === 0) return {};

      const sorted = [...nums].sort((a, b) => a - b);
      const sum = nums.reduce((s, n) => s + n, 0);
      const mean = sum / N;

      const median = N % 2 ? sorted[(N - 1) / 2] : (sorted[N / 2 - 1] + sorted[N / 2]) / 2;

      const counts = {};
      nums.forEach(n => counts[n] = (counts[n] || 0) + 1);
      const maxCount = Math.max(...Object.values(counts));
      const modes = Object.keys(counts).filter(k => counts[k] === maxCount);
      const mode = maxCount === 1 ? 'No mode' : modes.join(', ');

      const sqDiff = nums.reduce((s, n) => s + (n - mean) ** 2, 0);
      const popVar = sqDiff / N;
      const sampVar = N > 1 ? sqDiff / (N - 1) : NaN;

      const quantile = p => {
        const idx = (N - 1) * p;
        const lo = Math.floor(idx), hi = Math.ceil(idx);
        return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
      };
      const q1 = quantile(0.25), q3 = quantile(0.75);

      return {
        count: N, sum, mean, median, mode,
        min: sorted[0], max: sorted[N - 1], range: sorted[N - 1] - sorted[0],
        popSD: Math.sqrt(popVar), sampSD: Math.sqrt(sampVar),
        popVar, sampVar, q1, q3, iqr: q3 - q1
      };
    },
    outputs: [
      { key: 'mean', label: 'Mean (average)', format: 'number', primary: true },
      { key: 'median', label: 'Median', format: 'number' },
      { key: 'mode', label: 'Mode', format: 'text' },
      { key: 'sampSD', label: 'Standard Deviation (sample, n−1)', format: 'number' },
      { key: 'popSD', label: 'Standard Deviation (population, N)', format: 'number' },
      { key: 'sampVar', label: 'Variance (sample)', format: 'number' },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'sum', label: 'Sum', format: 'number' },
      { key: 'min', label: 'Minimum', format: 'number' },
      { key: 'max', label: 'Maximum', format: 'number' },
      { key: 'range', label: 'Range', format: 'number' },
      { key: 'q1', label: 'Q1 (25th percentile)', format: 'number' },
      { key: 'q3', label: 'Q3 (75th percentile)', format: 'number' },
      { key: 'iqr', label: 'Interquartile Range', format: 'number' }
    ],
    tips: [
      'Use the sample standard deviation (n−1) when your data is a sample drawn from a larger population — this is the usual case.',
      'The median resists outliers; the mean does not. A large gap between them signals a skewed distribution.',
      'The IQR is a robust spread measure. Points beyond Q1 − 1.5·IQR or Q3 + 1.5·IQR are conventional outliers.'
    ],
    faq: [
      { q: 'Why are there two standard deviations?', a: 'Dividing by N gives the population standard deviation, correct when your data is the entire population. Dividing by N−1 (Bessel\u2019s correction) gives an unbiased estimate when your data is a sample.' }
    ]
  },

  /* ===================== SCIENCE ===================== */

  'ohms-law': {
    title: "Ohm's Law Calculator",
    category: 'engineering',
    icon: '⚡',
    description: 'Calculate voltage, current, resistance, and power. Enter any two values.',
    keywords: ['ohms law', 'voltage calculator', 'current resistance', 'electrical power'],
    formula: 'V = I · R   ·   P = V · I = I²R = V²/R',
    inputs: [
      num('voltage', 'Voltage (V)', { unit: 'V', default: 12, optional: true }),
      num('current', 'Current (I)', { unit: 'A', default: 2, optional: true }),
      num('resistance', 'Resistance (R)', { unit: 'Ω', default: null, optional: true })
    ],
    compute: ({ voltage, current, resistance }) => {
      const has = v => v !== null && v !== '' && isFinite(Number(v));
      let V = has(voltage) ? Number(voltage) : null;
      let I = has(current) ? Number(current) : null;
      let R = has(resistance) ? Number(resistance) : null;

      if (V !== null && I !== null) R = I === 0 ? Infinity : V / I;
      else if (V !== null && R !== null) I = R === 0 ? Infinity : V / R;
      else if (I !== null && R !== null) V = I * R;
      else return { note: 'Enter any two of voltage, current, or resistance.' };

      return { voltage: V, current: I, resistance: R, power: V * I, note: '' };
    },
    outputs: [
      { key: 'voltage', label: 'Voltage', format: 'number', unit: 'V', primary: true },
      { key: 'current', label: 'Current', format: 'number', unit: 'A' },
      { key: 'resistance', label: 'Resistance', format: 'number', unit: 'Ω' },
      { key: 'power', label: 'Power', format: 'number', unit: 'W' },
      { key: 'note', label: '', format: 'text' }
    ],
    tips: [
      'Leave one field blank and fill the other two — the tool solves for the missing quantity.',
      'Power dissipation determines the resistor wattage rating you need. Choose a rating at least double the calculated power.',
      'Keep units consistent: milliamps must be converted to amps (divide by 1000) before entry.'
    ],
    faq: [
      { q: 'Does Ohm\u2019s law apply to all components?', a: 'Only to ohmic components, where resistance is constant. Diodes, transistors, and filament lamps are non-ohmic — their resistance changes with voltage or temperature.' }
    ]
  },

  'bmi': {
    title: 'BMI Calculator',
    category: 'health',
    icon: '⚖️',
    description: 'Calculate Body Mass Index from height and weight, in metric or imperial units.',
    keywords: ['BMI calculator', 'body mass index', 'BMI chart'],
    formula: 'BMI = weight(kg) / height(m)²',
    inputs: [
      sel('system', 'Unit System', [
        { value: 'metric', label: 'Metric (kg, cm)' },
        { value: 'imperial', label: 'Imperial (lb, in)' }
      ], { default: 'metric' }),
      num('weight', 'Weight', { default: 70, min: 0 }),
      num('height', 'Height', { default: 175, min: 0 })
    ],
    compute: ({ system, weight, height }) => {
      let kg = Number(weight), m;
      if (system === 'imperial') { kg = weight * 0.45359237; m = height * 0.0254; }
      else { m = height / 100; }
      if (!m) return {};
      const bmi = kg / (m * m);
      const category =
        bmi < 18.5 ? 'Below the healthy range' :
        bmi < 25   ? 'Within the healthy range' :
        bmi < 30   ? 'Above the healthy range' :
                     'Well above the healthy range';
      return { bmi, category };
    },
    outputs: [
      { key: 'bmi', label: 'Body Mass Index', format: 'number', primary: true },
      { key: 'category', label: 'Standard Category', format: 'text' }
    ],
    tips: [
      'BMI is a population-level screening measure, not a diagnosis or a measure of health.',
      'It does not distinguish muscle from fat, so it misclassifies athletes and very muscular people.',
      'It is also less applicable to children, pregnant people, and older adults, and its thresholds vary across ethnic groups.',
      'Treat any result as a prompt for a conversation with a clinician rather than a conclusion in itself.'
    ],
    faq: [
      { q: 'Is BMI a reliable measure of health?', a: 'On its own, no. It is a cheap and quick population-level indicator. Waist circumference, body composition, blood markers, fitness, and clinical history all say considerably more about an individual\u2019s health than BMI does.' }
    ]
  },

  'aspect-ratio': {
    title: 'Aspect Ratio Calculator',
    category: 'design',
    icon: '🖼️',
    description: 'Calculate proportional dimensions and simplify aspect ratios for images and video.',
    keywords: ['aspect ratio', 'resize dimensions', 'image proportions', '16:9 calculator'],
    formula: 'newHeight = newWidth × (originalHeight / originalWidth)',
    inputs: [
      num('w1', 'Original Width', { unit: 'px', default: 1920, min: 1 }),
      num('h1', 'Original Height', { unit: 'px', default: 1080, min: 1 }),
      num('w2', 'New Width', { unit: 'px', default: 1280, min: 0 })
    ],
    compute: ({ w1, h1, w2 }) => {
      if (!w1 || !h1) return {};
      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      const g = gcd(Math.round(w1), Math.round(h1));
      return {
        newHeight: w2 * (h1 / w1),
        ratio: `${Math.round(w1 / g)}:${Math.round(h1 / g)}`,
        decimal: w1 / h1,
        megapixels: (w1 * h1) / 1e6
      };
    },
    outputs: [
      { key: 'newHeight', label: 'New Height', format: 'number', unit: 'px', primary: true },
      { key: 'ratio', label: 'Simplified Ratio', format: 'text' },
      { key: 'decimal', label: 'Ratio as Decimal', format: 'number' },
      { key: 'megapixels', label: 'Original Megapixels', format: 'number' }
    ],
    tips: [
      'Common ratios: 16:9 widescreen video, 4:3 legacy displays, 1:1 square social posts, 9:16 vertical/stories, 3:2 most DSLR sensors.',
      'Scaling to a non-integer height causes half-pixel rendering. Round to an even number for video encoding.'
    ],
    faq: [
      { q: 'Why does my video need even dimensions?', a: 'Most codecs (H.264, H.265) subsample chroma in 2×2 blocks, so both width and height must be divisible by 2 — some encoders require multiples of 4 or 16.' }
    ]
  },

  'fuel-efficiency': {
    title: 'Fuel Efficiency & Trip Cost Calculator',
    category: 'utilities',
    icon: '⛽',
    description: 'Convert between MPG and L/100km, and calculate the fuel cost of a journey.',
    keywords: ['mpg to l/100km', 'fuel economy', 'trip cost calculator', 'fuel consumption'],
    formula: 'L/100km = 235.214583 / MPG(US)',
    inputs: [
      num('efficiency', 'Fuel Efficiency', { default: 30, min: 0 }),
      sel('unit', 'Efficiency Unit', [
        { value: 'mpgus', label: 'MPG (US)' },
        { value: 'mpguk', label: 'MPG (Imperial)' },
        { value: 'l100', label: 'L/100 km' },
        { value: 'kml', label: 'km per Litre' }
      ], { default: 'mpgus' }),
      num('distance', 'Trip Distance', { default: 300, min: 0 }),
      sel('distUnit', 'Distance Unit', [
        { value: 'mi', label: 'Miles' },
        { value: 'km', label: 'Kilometres' }
      ], { default: 'mi' }),
      num('price', 'Fuel Price per Unit', { unit: '$', default: 3.5, min: 0, step: 0.01 }),
      sel('priceUnit', 'Price Per', [
        { value: 'gal', label: 'US Gallon' },
        { value: 'l', label: 'Litre' }
      ], { default: 'gal' })
    ],
    compute: ({ efficiency, unit, distance, distUnit, price, priceUnit }) => {
      // Normalise everything to litres per 100 km.
      let l100;
      if (unit === 'mpgus') l100 = efficiency ? 235.214583 / efficiency : Infinity;
      else if (unit === 'mpguk') l100 = efficiency ? 282.481 / efficiency : Infinity;
      else if (unit === 'kml') l100 = efficiency ? 100 / efficiency : Infinity;
      else l100 = efficiency;

      const km = distUnit === 'mi' ? distance * 1.609344 : distance;
      const litres = (l100 / 100) * km;
      const pricePerLitre = priceUnit === 'gal' ? price / 3.785411784 : price;

      return {
        l100,
        mpgus: l100 ? 235.214583 / l100 : Infinity,
        mpguk: l100 ? 282.481 / l100 : Infinity,
        kml: l100 ? 100 / l100 : Infinity,
        litres,
        gallons: litres / 3.785411784,
        cost: litres * pricePerLitre,
        costPerDistance: distance ? (litres * pricePerLitre) / distance : 0
      };
    },
    outputs: [
      { key: 'cost', label: 'Total Fuel Cost', format: 'currency', primary: true },
      { key: 'litres', label: 'Fuel Needed', format: 'number', unit: 'L' },
      { key: 'gallons', label: 'Fuel Needed', format: 'number', unit: 'US gal' },
      { key: 'l100', label: 'Consumption', format: 'number', unit: 'L/100km' },
      { key: 'mpgus', label: 'Efficiency', format: 'number', unit: 'MPG (US)' },
      { key: 'mpguk', label: 'Efficiency', format: 'number', unit: 'MPG (UK)' },
      { key: 'kml', label: 'Efficiency', format: 'number', unit: 'km/L' },
      { key: 'costPerDistance', label: 'Cost per Unit Distance', format: 'currency' }
    ],
    tips: [
      'MPG and L/100km are inverse measures: higher MPG is better, lower L/100km is better.',
      'A US gallon is about 3.785 L; an Imperial gallon is about 4.546 L, so UK MPG figures look ~20% better than US figures for the same car.',
      'Improving from 15 to 20 MPG saves more fuel per mile than improving from 40 to 50 MPG — the inverse relationship is counterintuitive.'
    ],
    faq: [
      { q: 'Where does the constant 235.214583 come from?', a: 'It is 100 × 3.785411784 (litres per US gallon) ÷ 1.609344 (km per mile), the factor that converts miles-per-gallon into litres-per-100-kilometres.' }
    ]
  },

  'date-difference': {
    title: 'Date Difference Calculator',
    category: 'time',
    icon: '📅',
    description: 'Calculate the exact time between two dates in years, months, days, and total units.',
    keywords: ['date difference', 'days between dates', 'age calculator', 'date duration'],
    formula: 'Calendar-aware difference accounting for varying month lengths and leap years',
    inputs: [
      { key: 'start', label: 'Start Date', type: 'date', default: '2000-01-01' },
      { key: 'end', label: 'End Date', type: 'date', default: 'TODAY' }
    ],
    compute: ({ start, end }) => {
      const d1 = new Date(start), d2 = new Date(end);
      if (isNaN(d1) || isNaN(d2)) return {};
      const [a, b] = d1 <= d2 ? [d1, d2] : [d2, d1];

      let years = b.getFullYear() - a.getFullYear();
      let months = b.getMonth() - a.getMonth();
      let days = b.getDate() - a.getDate();
      if (days < 0) {
        months--;
        days += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
      }
      if (months < 0) { years--; months += 12; }

      const msPerDay = 86400000;
      const totalDays = Math.round((b - a) / msPerDay);

      return {
        breakdown: `${years} years, ${months} months, ${days} days`,
        totalDays,
        totalWeeks: totalDays / 7,
        totalMonths: years * 12 + months,
        totalHours: totalDays * 24,
        totalMinutes: totalDays * 1440,
        weekdays: countWeekdays(a, b)
      };
    },
    outputs: [
      { key: 'breakdown', label: 'Difference', format: 'text', primary: true },
      { key: 'totalDays', label: 'Total Days', format: 'number' },
      { key: 'weekdays', label: 'Weekdays (Mon–Fri)', format: 'number' },
      { key: 'totalWeeks', label: 'Total Weeks', format: 'number' },
      { key: 'totalMonths', label: 'Total Months', format: 'number' },
      { key: 'totalHours', label: 'Total Hours', format: 'number' },
      { key: 'totalMinutes', label: 'Total Minutes', format: 'number' }
    ],
    tips: [
      'The years/months/days breakdown is calendar-aware — it accounts for months of different lengths and for leap years.',
      'The weekday count excludes Saturdays and Sundays but not public holidays, which vary by country.'
    ],
    faq: [
      { q: 'Why do the months not simply equal days ÷ 30?', a: 'Months vary from 28 to 31 days. This tool walks the calendar rather than assuming an average month length, so the breakdown matches how people actually count dates.' }
    ]
  }
};

function countWeekdays(a, b) {
  let count = 0;
  const cur = new Date(a.getTime());
  while (cur < b) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOOLS };
}
