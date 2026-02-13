'use client';

import { useState, useEffect } from 'react';
import {
  getStudyData,
  recordStudySession,
  addStudyGoal,
  toggleGoalComplete,
  DEFAULT_STUDY,
} from '@/lib/storage';

interface StudyPlannerProps {
  onRecordSession?: boolean;
  currentTopic?: string;
}

const BADGE_LABELS: Record<string, string> = {
  week: '7-Day Streak',
  month: '30-Day Streak',
};

export default function StudyPlanner({ onRecordSession, currentTopic }: StudyPlannerProps) {
  const [data, setData] = useState(DEFAULT_STUDY);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    setData(getStudyData());
  }, [onRecordSession, currentTopic]);

  const handleRecord = () => {
    recordStudySession();
    setData(getStudyData());
  };

  const handleAddGoal = () => {
    const topic = newGoal.trim() || currentTopic;
    if (topic) {
      addStudyGoal(topic);
      setNewGoal('');
      setData(getStudyData());
    }
  };

  const handleToggleGoal = (topic: string) => {
    toggleGoalComplete(topic);
    setData(getStudyData());
  };

  return (
    <section className="section study-planner">
      <h2 className="section-title">Study Progress</h2>

      <div className="study-streak">
        <div className="streak-value">{data.streak}</div>
        <div className="streak-label">day streak</div>
        <button type="button" className="streak-btn" onClick={handleRecord}>
          ✓ Log today
        </button>
      </div>

      {data.badges && data.badges.length > 0 && (
        <div className="study-badges">
          {data.badges.map((b) => (
            <span key={b} className="badge">
              🏆 {BADGE_LABELS[b] || b}
            </span>
          ))}
        </div>
      )}

      <div className="study-goals">
        <h3 className="goals-title">Learning Goals</h3>
        <div className="goals-add">
          <input
            type="text"
            placeholder={currentTopic || 'Add topic to study'}
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
          />
          <button type="button" onClick={handleAddGoal}>
            Add
          </button>
        </div>
        <ul className="goals-list">
          {(data.goals || []).slice(0, 8).map((g, i) => (
            <li key={i} className={g.completed ? 'completed' : ''}>
              <button type="button" onClick={() => handleToggleGoal(g.topic)}>
                <span className="goal-check">{g.completed ? '✓' : '○'}</span>
                {g.topic}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
