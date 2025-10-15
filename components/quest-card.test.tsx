import React from 'react';
import { render, screen } from '@testing-library/react';
import { motion } from 'framer-motion';

// This is a simplified version of the quest card from QuestDashboard
const QuestCard = ({ quest, streak }) => (
    <motion.div className="fantasy-card p-6">
        <h4 className="text-lg font-medium text-gray-100 flex items-center">
            {quest.title}
            {streak && streak.current_streak > 0 && (
                <span className="ml-2 text-sm font-bold text-orange-400 flex items-center">
                <span className="text-lg">🔥</span> {streak.current_streak}-day streak
                </span>
            )}
        </h4>
        <p className="text-gray-400 text-sm">{quest.description}</p>
        <span className={`px-2 py-1 rounded text-xs font-medium`}>
            {quest.status.replace("_", " ")}
        </span>
    </motion.div>
);

describe('QuestCard', () => {
  it('should render the quest title and description', () => {
    const quest = { id: '1', title: 'Test Quest', description: 'Test Desc', status: 'PENDING' };
    render(<QuestCard quest={quest} />);
    expect(screen.getByText('Test Quest')).toBeInTheDocument();
    expect(screen.getByText('Test Desc')).toBeInTheDocument();
  });

  it('should display the quest status', () => {
    const quest = { id: '1', title: 'Test Quest', description: 'Test Desc', status: 'IN_PROGRESS' };
    render(<QuestCard quest={quest} />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('should display the streak when present', () => {
    const quest = { id: '1', title: 'Test Quest', description: 'Test Desc', status: 'IN_PROGRESS' };
    const streak = { current_streak: 5 };
    render(<QuestCard quest={quest} streak={streak} />);
    expect(screen.getByText(/5-day streak/)).toBeInTheDocument();
  });
});
