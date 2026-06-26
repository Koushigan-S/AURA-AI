import React from 'react';
import type { AuraDocument, Flashcard, QuizQuestion, Settings } from '../types';
import { Sparkles, TrendingUp } from 'lucide-react';

interface SkillStatusProps {
  documents: AuraDocument[];
  flashcards: Flashcard[];
  questions: QuizQuestion[];
  settings: Settings;
}

export const SkillStatus: React.FC<SkillStatusProps> = ({
  documents,
  flashcards,
  questions,
}) => {
  const getSkillMetrics = () => {
    let recall = 0;
    let accuracy = 0;
    let solving = 0;
    let retention = 0;
    let focus = 0;

    const mcqs = questions.filter(q => q.type === 'mcq' && q.evaluation !== undefined);
    const shorts = questions.filter(q => q.type === 'short' && q.evaluation !== undefined);
    const essays = questions.filter(q => q.type === 'essay' && q.evaluation !== undefined);

    if (mcqs.length > 0) {
      const correct = mcqs.filter(q => q.evaluation!.score > 0).length;
      accuracy = Math.round((correct / mcqs.length) * 100);
    }
    
    if (shorts.length > 0) {
      const totalScore = shorts.reduce((sum, q) => sum + q.evaluation!.score, 0);
      const totalMax = shorts.reduce((sum, q) => sum + q.marks, 0);
      recall = Math.round((totalScore / totalMax) * 100);
    }

    if (essays.length > 0) {
      const totalScore = essays.reduce((sum, q) => sum + q.evaluation!.score, 0);
      const totalMax = essays.reduce((sum, q) => sum + q.marks, 0);
      solving = Math.round((totalScore / totalMax) * 100);
    }

    if (flashcards.length > 0) {
      const avgReps = flashcards.reduce((sum, c) => sum + c.repetitions, 0) / flashcards.length;
      const avgEase = flashcards.reduce((sum, c) => sum + c.ease, 0) / flashcards.length;
      
      const repScore = Math.min(50, avgReps * 15);
      const easeScore = Math.min(50, (avgEase / 2.5) * 40);
      retention = Math.round(repScore + easeScore);
    }

    const totalHighlights = documents.reduce((sum, doc) => sum + doc.highlights.length, 0);
    const docScore = Math.min(40, documents.length * 15);
    const hlScore = Math.min(60, totalHighlights * 8);
    focus = Math.round(docScore + hlScore);
    
    recall = Math.max(0, Math.min(100, recall));
    accuracy = Math.max(0, Math.min(100, accuracy));
    solving = Math.max(0, Math.min(100, solving));
    retention = Math.max(0, Math.min(100, retention));
    focus = Math.max(0, Math.min(100, focus));

    return { recall, accuracy, solving, retention, focus };
  };

  const { recall, accuracy, solving, retention, focus } = getSkillMetrics();
  
  // Radar calculations
  const cx = 150;
  const cy = 150;
  const r = 90;
  const dimensions = [
    { name: 'Concept Recall', val: recall, color: '#0071e3', desc: 'Ability to explain key concepts and terminology.' },
    { name: 'Fact Accuracy', val: accuracy, color: '#eab308', desc: 'Success rate answering multiple-choice questions.' },
    { name: 'Analytical Solving', val: solving, color: '#a855f7', desc: 'Competence in composing essays and arguments.' },
    { name: 'Memory Retention', val: retention, color: '#22c55e', desc: 'Retention based on spaced repetition review history.' },
    { name: 'Study Focus', val: focus, color: '#ec4899', desc: 'Interaction with text highlights and document scope.' }
  ];

  // Calculate coordinates for grid lines
  const levels = [25, 50, 75, 100];
  const gridPolygons = levels.map(level => {
    return dimensions.map((_, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + (r * level / 100) * Math.cos(angle);
      const y = cy + (r * level / 100) * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  // Calculate coordinates for user performance polygon
  const userPoints = dimensions.map((d, i) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + (r * d.val / 100) * Math.cos(angle);
    const y = cy + (r * d.val / 100) * Math.sin(angle);
    return { x, y, d, angle };
  });
  const userPolygonPath = userPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Tips for improvement
  const tips: string[] = [];
  if (accuracy < 70) tips.push('Take MCQ sets in the Quiz Center to improve your Fact Accuracy.');
  if (recall < 70) tips.push('Answer Short questions in the Quiz Center to test and lock in Concept Recall.');
  if (solving < 70) tips.push('Attempt Essay questions and submit them to AURA for deep analytical grading.');
  if (retention < 70) tips.push('Visit the Flashcard Deck daily to review pending spaced-repetition cards.');
  if (focus < 60) tips.push('Select text in the reader to add custom highlights and annotations.');
  if (tips.length === 0) tips.push('Phenomenal scores! Maintain your revision schedule to ace all exams.');

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight">Your Skill Profile</h2>
        <p className="text-apple-gray text-sm mt-1">Reflective analysis of your concept mastery and learning habits.</p>
      </div>

      {/* Spider Graph Component */}
      <div className="apple-glass rounded-2xl border border-white/5 p-6 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-base font-semibold text-white">Skill Status</h3>
            <p className="text-xs text-apple-gray">Context-based evaluation of your active study performance.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Spider Graph SVG */}
          <div className="flex flex-col items-center justify-center p-4 bg-black/20 border border-white/5 rounded-xl min-h-[340px]">
            <svg width="320" height="320" viewBox="0 0 320 320" className="max-w-full">
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0071e3" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8625e9" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              {/* Draw Glowing Center Zone */}
              <circle cx="150" cy="150" r="90" fill="url(#radarGlow)" pointerEvents="none" />

              {/* Draw Grid Concentric Pentagons */}
              {gridPolygons.map((pointsStr, idx) => (
                <polygon
                  key={idx}
                  points={pointsStr}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              ))}

              {/* Draw Axis Lines */}
              {userPoints.map((_, idx) => {
                const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
                const xOuter = cx + r * Math.cos(angle);
                const yOuter = cy + r * Math.sin(angle);
                return (
                  <line
                    key={idx}
                    x1={cx}
                    y1={cy}
                    x2={xOuter}
                    y2={yOuter}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                );
              })}

              {/* User Performance Polygon */}
              <polygon
                points={userPolygonPath}
                fill="rgba(134, 37, 233, 0.25)"
                stroke="#8625e9"
                strokeWidth="2"
                className="drop-shadow-[0_0_8px_rgba(134,37,233,0.5)]"
              />

              {/* Glowing Vertices */}
              {userPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke={p.d.color}
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                />
              ))}

              {/* Labels with Offset Alignment */}
              {userPoints.map((p, idx) => {
                const labelRadius = r + 24;
                const xLabel = cx + labelRadius * Math.cos(p.angle);
                const yLabel = cy + labelRadius * Math.sin(p.angle) + 4;

                let textAnchor: 'middle' | 'start' | 'end' = 'middle';
                if (Math.cos(p.angle) > 0.1) textAnchor = 'start';
                if (Math.cos(p.angle) < -0.1) textAnchor = 'end';

                return (
                  <text
                    key={idx}
                    x={xLabel}
                    y={yLabel}
                    textAnchor={textAnchor}
                    fill="#a1a1a6"
                    className="text-[10px] font-semibold tracking-tight uppercase"
                  >
                    {p.d.name}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Metrics Explanations & Suggestions */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dimensions.map((dim, idx) => (
                <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white/95">{dim.name}</span>
                    <span style={{ color: dim.color }} className="text-xs font-bold">{dim.val}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dim.val}%`, backgroundColor: dim.color }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                  <p className="text-[10px] text-apple-gray leading-normal">{dim.desc}</p>
                </div>
              ))}
            </div>

            {/* Smart Study Tips */}
            <div className="p-4 bg-gradient-to-r from-purple-950/20 to-transparent border border-purple-500/10 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive Study Recommendation
              </h4>
              <ul className="space-y-1">
                {tips.map((tip, idx) => (
                  <li key={idx} className="text-[11px] text-apple-gray leading-relaxed flex items-start gap-2">
                    <span className="text-purple-400 mt-1 shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
