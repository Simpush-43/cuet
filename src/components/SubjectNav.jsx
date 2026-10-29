import { NavLink } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';

// Strip of all subjects so each one feels like its own section.
export default function SubjectNav() {
  const { subjects } = useContent();
  return (
    <nav className="subnav" aria-label="Subjects">
      {subjects.map((s) => (
        <NavLink key={s.id} to={`/subject/${s.id}`}>
          {s.name}
        </NavLink>
      ))}
    </nav>
  );
}
