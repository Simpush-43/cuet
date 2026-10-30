// answer = index of the correct option (0 = first option).
// Matrix notation: [1, 2; 3, 4] means row 1 is 1, 2 and row 2 is 3, 4.
export default {
  id: 'matrices',
  subject: 'maths',
  title: 'Matrices',
  videoUrl: '', // paste a YouTube video or playlist link here
  notes: [
    {
      heading: 'Basics',
      points: [
        'A matrix of order m x n has m rows and n columns, so it has m x n elements.',
        'Notation used here: [1, 2; 3, 4] means row 1 is 1, 2 and row 2 is 3, 4.',
        'Addition and subtraction work only for matrices of the same order.',
      ],
    },
    {
      heading: 'Multiplication',
      points: [
        'AB is defined only when the columns of A equal the rows of B.',
        'An m x n matrix times an n x p matrix gives an m x p matrix.',
        'In general AB is not equal to BA, and BA may not even exist.',
        'For any square matrix A and identity I of the same order, AI = IA = A.',
      ],
    },
    {
      heading: 'Transpose, symmetric and skew-symmetric',
      points: [
        '(AB)^T = B^T A^T. The order reverses.',
        'Symmetric: A^T = A. Skew-symmetric: A^T = -A, so every diagonal element is 0.',
        'For any square matrix A, A + A^T is symmetric and A - A^T is skew-symmetric.',
        'Every square matrix = (1/2)(A + A^T) + (1/2)(A - A^T).',
      ],
    },
  ],
  mindMap: {
    center: 'Matrices',
    branches: [
      { label: 'Order', items: ['m rows, n columns', 'Same order for add/subtract'] },
      { label: 'Multiplication', items: ['Columns of A = rows of B', 'AB is not BA in general', 'AI = IA = A'] },
      { label: 'Transpose', items: ['(AB)^T = B^T A^T', 'Symmetric: A^T = A', 'Skew: A^T = -A'] },
      { label: 'Decomposition', items: ['A = symmetric + skew-symmetric'] },
    ],
  },
  dpp: [
    {
      q: 'A is a 3 x 2 matrix and B is a 2 x 4 matrix. What is the order of AB?',
      options: ['3 x 4', '2 x 2', '4 x 3', '3 x 2'],
      answer: 0,
      explanation: 'Inner orders match (2 and 2), so AB is defined with order (rows of A) x (columns of B) = 3 x 4.',
    },
    {
      q: 'If A = [2, 3; 1, 4] and B = [1, 0; 2, 1], find AB.',
      options: ['[8, 3; 9, 4]', '[2, 0; 2, 4]', '[8, 9; 3, 4]', '[5, 3; 3, 5]'],
      answer: 0,
      explanation: 'Row 1: 2(1)+3(2) = 8 and 2(0)+3(1) = 3. Row 2: 1(1)+4(2) = 9 and 1(0)+4(1) = 4.',
    },
    {
      q: 'Which of these matrices is skew-symmetric?',
      options: ['[0, 2; -2, 0]', '[0, 2; 2, 0]', '[1, 2; -2, 1]', '[0, 2; -2, 1]'],
      answer: 0,
      explanation: 'Skew-symmetric needs zero diagonal and a(ij) = -a(ji). Only [0, 2; -2, 0] satisfies both.',
    },
    {
      q: '(AB)^T equals:',
      options: ['A^T B^T', 'B^T A^T', 'AB', 'BA'],
      answer: 1,
      explanation: 'The transpose of a product reverses the order: (AB)^T = B^T A^T.',
    },
    {
      q: 'If A = [1, 2; 3, 4], find A + A^T.',
      options: ['[2, 4; 6, 8]', '[2, 5; 5, 8]', '[1, 3; 2, 4]', '[0, 1; -1, 0]'],
      answer: 1,
      explanation: 'A^T = [1, 3; 2, 4]. Adding: [1+1, 2+3; 3+2, 4+4] = [2, 5; 5, 8]. It is symmetric, as expected.',
    },
  ],
  test: [
    {
      q: 'A is 2 x 3 and B is 3 x 3. Which product is defined?',
      options: ['AB only', 'BA only', 'Both AB and BA', 'Neither'],
      answer: 0,
      explanation: 'AB: columns of A (3) = rows of B (3), so it exists. BA: columns of B (3) is not equal to rows of A (2).',
    },
    {
      q: 'How many elements does a 3 x 4 matrix have?',
      options: ['7', '12', '9', '16'],
      answer: 1,
      explanation: '3 rows x 4 columns = 12 elements.',
    },
    {
      q: 'If A = [1, 2; 0, 1], find A squared.',
      options: ['[1, 2; 0, 1]', '[1, 4; 0, 1]', '[1, 4; 0, 4]', '[1, 0; 0, 1]'],
      answer: 1,
      explanation: 'Row 1: 1(1)+2(0) = 1 and 1(2)+2(1) = 4. Row 2: 0 and 0(2)+1(1) = 1. So A squared = [1, 4; 0, 1].',
    },
    {
      q: 'The matrix [2, x; 5, 1] is symmetric. Find x.',
      options: ['2', '5', '1', '0'],
      answer: 1,
      explanation: 'Symmetric means a(12) = a(21), so x = 5.',
    },
    {
      q: 'For any square matrix A, the matrix A - A^T is:',
      options: ['Symmetric', 'Skew-symmetric', 'The identity matrix', 'Always the zero matrix'],
      answer: 1,
      explanation: '(A - A^T)^T = A^T - A = -(A - A^T), which is the definition of skew-symmetric.',
    },
    {
      q: 'Which statement is true for matrices in general?',
      options: ['AB = BA always', '(AB)^T = B^T A^T', '(AB)^T = A^T B^T', 'A + B is defined for any two matrices'],
      answer: 1,
      explanation: 'Matrix multiplication is not commutative and addition needs equal orders. Only (AB)^T = B^T A^T holds.',
    },
  ],
};
