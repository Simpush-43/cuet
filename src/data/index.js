import matrices from './chapters/matrices.js';
import determinants from './chapters/determinants.js';
import differentiation from './chapters/differentiation.js';

// Register every new chapter file here.
export const chapters = [matrices, determinants, differentiation,'Electric Charges and Fields'];

export const chaptersBySubject = (subjectId) =>
  chapters.filter((c) => c.subject === subjectId);

export const getChapter = (id) => chapters.find((c) => c.id === id);
