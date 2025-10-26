import React from 'react';
import { QuestInstance, Character } from '@/lib/types/database';
import QuestCard from '@/components/quests/quest-card';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/animations/variants';

interface FamilyQuestClaimingProps {
  quests: QuestInstance[];
  character: Character;
  onClaimQuest: (questId: string) => void;
}

const FamilyQuestClaiming: React.FC<FamilyQuestClaimingProps> = ({ quests, character, onClaimQuest }) => {
  const heroHasActiveFamilyQuest = !!character.active_family_quest_id;

  const handlePickup = (quest: QuestInstance) => {
    onClaimQuest(quest.id);
  };

  return (
    <section>
      <h3 className="text-xl font-fantasy text-gray-200 mb-6">
        👥 Available Family Quests
      </h3>

      {heroHasActiveFamilyQuest && (
        <div className="mb-4 text-center text-yellow-400 bg-yellow-900/50 p-3 rounded-lg">
          You already have an active family quest. Complete or release it first to claim another.
        </div>
      )}

      <motion.div
        className="space-y-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            viewMode="hero"
            onPickup={handlePickup}
            isPaused={heroHasActiveFamilyQuest}
          />
        ))}
      </motion.div>
    </section>
  );
};

export default FamilyQuestClaiming;
