import React, { useState } from 'react';
import type { AuraDocument } from '../types';
import { Network, Calendar, Lightbulb, BookOpen, Volume2 } from 'lucide-react';

interface TimelineVisualizerProps {
  document: AuraDocument | null;
}

interface ConceptNode {
  id: string;
  label: string;
  x: number;
  y: number;
  desc: string;
  category: string;
  date?: string; // for timeline mode
}

interface NodeLink {
  source: string;
  target: string;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({ document }) => {
  const [viewMode, setViewMode] = useState<'map' | 'timeline'>('map');
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  // Generate nodes based on topic
  const getSyllabusVisualData = (): { nodes: ConceptNode[]; links: NodeLink[] } => {
    if (!document) return { nodes: [], links: [] };

    const topic = document.topicContext.toLowerCase();
    
    if (topic.includes('physics') || topic.includes('quantum')) {
      return {
        nodes: [
          { id: 'n1', label: 'Quantum Mechanics', x: 250, y: 150, desc: 'The branch of physics dealing with the mathematical description of the motion and interaction of subatomic particles.', category: 'Core Subject' },
          { id: 'n2', label: 'Wave-Particle Duality', x: 120, y: 80, desc: 'The exhibition of both wave-like and particle-like properties by electromagnetic radiation and matter.', category: 'Principle' },
          { id: 'n3', label: 'Planck\'s Constant (h)', x: 80, y: 220, desc: 'A fundamental constant relating the energy of light photons to their frequency: E = hf.', category: 'Constant' },
          { id: 'n4', label: 'Superposition Principle', x: 380, y: 80, desc: 'The ability of a quantum system to exist in multiple states or configurations simultaneously.', category: 'Principle' },
          { id: 'n5', label: 'Schrödinger\'s Cat', x: 420, y: 220, desc: 'A thought paradox illustrating superposition, where a cat is simultaneously alive and dead until observed.', category: 'Analogy' },
          { id: 'n6', label: 'Wave Function Collapse', x: 250, y: 260, desc: 'The process by which a wave function collapses into a single localized observable state upon measurement.', category: 'Mechanism' }
        ],
        links: [
          { source: 'n1', target: 'n2' },
          { source: 'n1', target: 'n4' },
          { source: 'n2', target: 'n3' },
          { source: 'n4', target: 'n5' },
          { source: 'n4', target: 'n6' },
          { source: 'n6', target: 'n1' }
        ]
      };
    }

    if (topic.includes('revolution') || topic.includes('history') || topic.includes('french')) {
      return {
        nodes: [
          { id: 'h1', label: 'Estates-General Called', x: 100, y: 150, desc: 'King Louis XVI summons assembly to resolve fiscal crisis, disputes on voting representation break out.', category: 'Event', date: 'May 5, 1789' },
          { id: 'h2', label: 'Tennis Court Oath', x: 200, y: 80, desc: 'Third Estate representatives swear not to disband until a new French Constitution is formed.', category: 'Event', date: 'June 20, 1789' },
          { id: 'h3', label: 'Storming of the Bastille', x: 300, y: 220, desc: 'Revolutionaries capture the fortress-prison, seizing ammunition and signaling the fall of royal absolutism.', category: 'Event', date: 'July 14, 1789' },
          { id: 'h4', label: 'Declaration of Rights', x: 400, y: 80, desc: 'National Assembly adopts the Declaration of the Rights of Man and of the Citizen, declaring equality and liberty.', category: 'Document', date: 'August 26, 1789' },
          { id: 'h5', label: 'Women\'s March on Versailles', x: 500, y: 150, desc: 'Market women march to the palace, forcing King Louis XVI and the royal family to return to Paris.', category: 'Event', date: 'October 5, 1789' }
        ],
        links: [
          { source: 'h1', target: 'h2' },
          { source: 'h2', target: 'h3' },
          { source: 'h3', target: 'h4' },
          { source: 'h4', target: 'h5' }
        ]
      };
    }

    if (topic.includes('gatsby') || topic.includes('literature') || topic.includes('story')) {
      return {
        nodes: [
          { id: 'l1', label: 'Nick Carraway\'s West Egg House', x: 250, y: 150, desc: 'Nick, our quiet narrator, rents a small cottage adjacent to Gatsby\'s massive, mysterious mansion.', category: 'Setting' },
          { id: 'l2', label: 'East Egg vs West Egg', x: 120, y: 80, desc: 'Contrast between West Egg (vibrant, new money) and East Egg (conservative, old money Daisy/Tom).', category: 'Conflict' },
          { id: 'l3', label: 'Daisy Buchanan', x: 80, y: 220, desc: 'Nick\'s cousin once removed, representing the unattainable object of Gatsby\'s ultimate desire.', category: 'Character' },
          { id: 'l4', label: 'The Green Light Motif', x: 380, y: 80, desc: 'A light at the end of Daisy\'s dock symbolizing Gatsby\'s hope, yearning, and the American Dream.', category: 'Motif' },
          { id: 'l5', label: 'Jay Gatsby\'s Shadow', x: 420, y: 220, desc: 'The mysterious host whom Nick sees standing in the dark, reaching out toward the bay.', category: 'Character' }
        ],
        links: [
          { source: 'l1', target: 'l2' },
          { source: 'l1', target: 'l3' },
          { source: 'l1', target: 'l5' },
          { source: 'l5', target: 'l4' },
          { source: 'l3', target: 'l4' }
        ]
      };
    }

    // Default concept nodes
    return {
      nodes: [
        { id: 'd1', label: 'Study Outline', x: 250, y: 150, desc: 'General topics compiled from the document.', category: 'Topic' },
        { id: 'd2', label: 'Key Terminology', x: 120, y: 80, desc: 'Definitions and vocab terms.', category: 'Detail' },
        { id: 'd3', label: 'Practice Section', x: 380, y: 80, desc: 'Flashcards and active testing modules.', category: 'Activity' }
      ],
      links: [
        { source: 'd1', target: 'd2' },
        { source: 'd1', target: 'd3' }
      ]
    };
  };

  const speakExplanation = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const { nodes, links } = getSyllabusVisualData();

  // Sorted nodes for chronological timeline
  const timelineNodes = [...nodes]
    .filter(n => n.date !== undefined)
    .sort((a, b) => {
      const dateA = new Date(a.date!);
      const dateB = new Date(b.date!);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Syllabus Mapping</h2>
          <p className="text-apple-gray text-sm mt-1">Visualize concepts dynamically as mind maps or timelines.</p>
        </div>

        {/* View toggles */}
        <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-lg">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold apple-transition flex items-center gap-1.5 ${
              viewMode === 'map' ? 'bg-apple-blue text-white' : 'text-apple-gray hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Mind Map
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold apple-transition flex items-center gap-1.5 ${
              viewMode === 'timeline' ? 'bg-apple-blue text-white' : 'text-apple-gray hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Timeline
          </button>
        </div>
      </div>

      {!document ? (
        <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
          <BookOpen className="w-10 h-10 text-apple-gray/20 mx-auto mb-3" />
          <p className="text-sm text-apple-gray">Please select a document to generate the syllabus map.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Visual Workspace */}
          <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex items-center justify-center relative min-h-[400px]">
            {viewMode === 'map' ? (
              <svg width="100%" height="350" className="max-w-xl">
                {/* Links */}
                {links.map((link, idx) => {
                  const sourceNode = nodes.find(n => n.id === link.source);
                  const targetNode = nodes.find(n => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;
                  return (
                    <line
                      key={idx}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  let nodeColor = 'fill-apple-blue';
                  if (node.category === 'Constant') nodeColor = 'fill-green-500';
                  if (node.category === 'Analogy') nodeColor = 'fill-yellow-500';
                  if (node.category === 'Motif') nodeColor = 'fill-purple-500';

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 32 : 26}
                        className={`${nodeColor} opacity-20 group-hover:opacity-30 transition-all duration-300`}
                      />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 10 : 7}
                        className={`${nodeColor} opacity-90 transition-all`}
                      />
                      <text
                        x={node.x}
                        y={node.y + 42}
                        textAnchor="middle"
                        fill="white"
                        className="text-[10px] font-semibold tracking-tight"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              /* Timeline view (horizontal path or vertical list depending on dates) */
              <div className="w-full flex flex-col justify-start items-center space-y-8 py-8 pl-4">
                {timelineNodes.length === 0 ? (
                  <div className="text-center text-apple-gray text-xs py-12">
                    No chronological events detected in this document type. Try the "French Revolution" sandbox template for a full timeline!
                  </div>
                ) : (
                  <div className="relative border-l border-white/10 w-full pl-6 space-y-8">
                    {timelineNodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`relative cursor-pointer group text-left p-3 rounded-xl transition-all ${
                            isSelected ? 'bg-white/5 border border-white/10' : 'border border-transparent hover:bg-white/[0.01]'
                          }`}
                        >
                          <div className={`absolute -left-[31px] top-4 w-2 h-2 rounded-full border border-black transition-all ${
                            isSelected ? 'bg-apple-blue scale-125' : 'bg-apple-gray group-hover:bg-white'
                          }`} />
                          <div className="text-[10px] text-apple-blue font-bold uppercase">{node.date}</div>
                          <h4 className="text-xs font-semibold text-white/95 mt-1 group-hover:text-apple-blue transition-colors">
                            {node.label}
                          </h4>
                          <p className="text-[11px] text-apple-gray mt-1 leading-relaxed max-w-md">
                            {node.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Node detail display panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider">Concept Explorer</h3>
            
            {selectedNode ? (
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 apple-transition">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-apple-blue tracking-wider">
                      {selectedNode.category}
                    </span>
                    <h4 className="text-sm font-semibold text-white tracking-tight mt-1">{selectedNode.label}</h4>
                  </div>
                  <button
                    onClick={() => speakExplanation(selectedNode.desc)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-apple-gray hover:text-white transition-colors"
                    title="Speak Concept"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-apple-gray leading-relaxed font-sans prose prose-invert">
                  {selectedNode.desc}
                </p>

                {selectedNode.date && (
                  <div className="text-[10px] text-purple-400 bg-purple-950/20 border border-purple-500/10 p-2 rounded-lg font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Chronology: {selectedNode.date}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <Lightbulb className="w-8 h-8 text-apple-gray/25 mx-auto mb-2" />
                <p className="text-xs text-apple-gray">Click on any visual concept node or timeline event to inspect key insights.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
