import React from 'react';
import { Users, Repeat, Sparkles } from 'lucide-react';
import { QuestInstance, Character, RecurrencePattern } from '@/lib/types/database';

interface FamilyQuestClaimingProps {
  quests: QuestInstance[];
  character: Character;
  onClaimQuest: (questId: string) => void;
}

const FamilyQuestClaiming: React.FC<FamilyQuestClaimingProps> = ({ quests, character, onClaimQuest }) => {
  const heroHasActiveFamilyQuest = !!character.active_family_quest_id;

  const recurrenceLabels: Record<RecurrencePattern, string> = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    CUSTOM: 'Custom',
  };

  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-3 flex items-center"><Users className="mr-2 h-6 w-6 text-green-400"/> Available Family Quests (Pick one!)</h3>
      
      {heroHasActiveFamilyQuest && (
        <div className="mb-4 text-center text-yellow-400 bg-yellow-900/50 p-3 rounded-lg">
          You already have an active family quest. Complete or release it first to claim another.
        </div>
      )}

      <div className="space-y-4">
        {quests.map((quest) => (
          <div key={quest.id} className={`p-4 rounded-lg ${quest.assigned_to_id || heroHasActiveFamilyQuest ? 'bg-gray-700 opacity-50' : 'bg-gray-900'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Repeat className="h-5 w-5 text-blue-400" />
                  <span className="font-bold text-xl">{quest.title}</span>
                  {quest.recurrence_pattern ? (
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      {recurrenceLabels[quest.recurrence_pattern] ?? quest.recurrence_pattern}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-gray-400">
                  Rewards: {quest.xp_reward} XP + {quest.gold_reward} Gold (+20% volunteer bonus!)
                </p>
                {quest.assigned_to_id && <p className="text-sm text-yellow-400">Assigned to another hero.</p>}
              </div>
              {!quest.assigned_to_id && (
                <button 
                  onClick={() => onClaimQuest(quest.id)} 
                  className={`flex items-center font-bold py-2 px-4 rounded-lg transition duration-300 ${
                    heroHasActiveFamilyQuest 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={heroHasActiveFamilyQuest}
                >
                  <Sparkles className="mr-2 h-5 w-5" /> Claim Quest
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamilyQuestClaiming;
