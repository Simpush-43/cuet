import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContent } from '../context/ContentContext.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import Tabs from '../components/Tabs.jsx';
import VideoEmbed from '../components/VideoEmbed.jsx';
import Notes from '../components/Notes.jsx';
import MindMap from '../components/MindMap.jsx';
import Dpp from '../components/Dpp.jsx';
import ChapterTest from '../components/ChapterTest.jsx';

const TABS = [
  { id: 'video', label: 'Lecture' },
  { id: 'notes', label: 'Notes' },
  { id: 'map', label: 'Mind map' },
  { id: 'dpp', label: 'DPP' },
  { id: 'test', label: 'Test' },
];

export default function ChapterPage() {
  const { chapterId } = useParams();
  const { getChapter } = useContent();
  const chapter = getChapter(chapterId);
  const { done, toggleDone } = useProgress();
  const [tab, setTab] = useState('video');

  if (!chapter) {
    return (
      <>
        <p>We could not find that chapter.</p>
        <Link to="/">Back to subjects</Link>
      </>
    );
  }

  return (
    <>
      <Link to={`/subject/${chapter.subject}`} className="crumb">Back to chapters</Link>
      <div className="chead">
        <h1>{chapter.title}</h1>
        <label className="check">
          <input type="checkbox" checked={!!done[chapter.id]} onChange={() => toggleDone(chapter.id)} />
          Mark chapter complete
        </label>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="panel" key={chapter.id + tab}>
        {tab === 'video' && <VideoEmbed chapter={chapter} />}
        {tab === 'notes' && <Notes sections={chapter.notes} />}
        {tab === 'map' && <MindMap map={chapter.mindMap} />}
        {tab === 'dpp' && <Dpp questions={chapter.dpp} />}
        {tab === 'test' && <ChapterTest chapter={chapter} />}
      </div>
    </>
  );
}
