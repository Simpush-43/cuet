export default {
  id: 'determinants',
  subject: 'maths',
  title: 'Determinants',
  videoUrl: '',
  notes: [
    {
      heading: 'Evaluating',
      points: [
        'For a 2 x 2 determinant, |a, b; c, d| = ad - bc.',
        'For 3 x 3, expand along any row or column using cofactors, and pick the one with the most zeros.',
        'Area of a triangle with vertices (x1, y1), (x2, y2), (x3, y3) is (1/2) times the absolute value of the determinant [x1, y1, 1; x2, y2, 1; x3, y3, 1].',
      ],
    },
    {
      heading: 'Properties',
      points: [
        'Swapping two rows (or columns) changes the sign of the determinant.',
        'If two rows are identical (or proportional), the determinant is 0.',
        '|AB| = |A| |B|.',
        'For an n x n matrix, |kA| = k^n |A|.',
      ],
    },
    {
      heading: 'Inverse',
      points: [
        'A is singular if |A| = 0 and non-singular otherwise.',
        'The inverse exists only for a non-singular matrix: A^-1 = adj(A) / |A|.',
        '|A^-1| = 1 / |A|, and |adj A| = |A|^(n-1) for an n x n matrix.',
      ],
    },
  ],
  mindMap: {
    center: 'Determinants',
    branches: [
      { label: 'Evaluate', items: ['2 x 2: ad - bc', '3 x 3: expand along a row or column'] },
      { label: 'Properties', items: ['Row swap flips sign', 'Identical rows give 0', '|AB| = |A||B|', '|kA| = k^n |A|'] },
      { label: 'Inverse', items: ['Needs |A| not 0', 'A^-1 = adj A / |A|'] },
      { label: 'Application', items: ['Area of a triangle'] },
    ],
  },
  dpp: [
    {
      q: 'Evaluate |3, 2; 1, 4|.',
      options: ['14', '10', '12', '2'],
      answer: 1,
      explanation: 'ad - bc = 3(4) - 2(1) = 12 - 2 = 10.',
    },
    {
      q: 'A is a 3 x 3 matrix with |A| = 4. Find |2A|.',
      options: ['8', '16', '32', '64'],
      answer: 2,
      explanation: '|kA| = k^n |A| with k = 2 and n = 3: 8 x 4 = 32.',
    },
    {
      q: 'If two rows of a determinant are identical, its value is:',
      options: ['1', '-1', '0', 'Cannot be found'],
      answer: 2,
      explanation: 'Swapping the identical rows changes the sign but not the matrix, so D = -D, which gives D = 0.',
    },
    {
      q: 'For what value of k is the matrix [k, 2; 3, 6] singular?',
      options: ['0', '1', '2', '3'],
      answer: 1,
      explanation: 'Singular means determinant 0: 6k - 6 = 0, so k = 1.',
    },
    {
      q: 'Find the area of the triangle with vertices (0, 0), (4, 0) and (0, 3).',
      options: ['12', '6', '7', '3.5'],
      answer: 1,
      explanation: 'Right triangle with base 4 and height 3: (1/2)(4)(3) = 6. The determinant formula gives the same value.',
    },
  ],
  test: [
    {
      q: 'Evaluate |2, -1; 4, 3|.',
      options: ['2', '10', '6', '14'],
      answer: 1,
      explanation: '2(3) - (-1)(4) = 6 + 4 = 10.',
    },
    {
      q: 'A is a 2 x 2 matrix with |A| = 5. Find |A^-1|.',
      options: ['5', '1/5', '-5', '25'],
      answer: 1,
      explanation: '|A^-1| = 1 / |A| = 1/5.',
    },
    {
      q: 'A is a 3 x 3 matrix with |A| = 3. Find |adj A|.',
      options: ['3', '9', '27', '1/3'],
      answer: 1,
      explanation: '|adj A| = |A|^(n-1) = 3^2 = 9.',
    },
    {
      q: 'If two rows of a determinant D are swapped, the new value is:',
      options: ['D', '-D', '0', '2D'],
      answer: 1,
      explanation: 'Interchanging two rows changes the sign of the determinant.',
    },
    {
      q: 'A and B are n x n matrices with |A| = 2 and |B| = 3. Find |AB|.',
      options: ['5', '6', '1', '23'],
      answer: 1,
      explanation: '|AB| = |A| |B| = 2 x 3 = 6.',
    },
    {
      q: 'The inverse of a square matrix A exists only if:',
      options: ['|A| = 0', '|A| is not 0', 'A is symmetric', 'A is the identity'],
      answer: 1,
      explanation: 'A^-1 = adj A / |A|, which needs |A| not equal to 0.',
    },
  ],
};
