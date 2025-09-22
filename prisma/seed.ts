import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in development)
  console.log('🧹 Cleaning existing data...');
  await prisma.userAchievement.deleteMany();
  await prisma.sOSRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.bossBattleParticipant.deleteMany();
  await prisma.bossBattle.deleteMany();
  await prisma.questInstance.deleteMany();
  await prisma.questTemplate.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.character.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();
  await prisma.achievement.deleteMany();

  // Create achievements (global)
  console.log('🏆 Creating achievements...');
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        name: "First Steps",
        description: "Complete your first quest",
        condition: { quests_completed: 1 },
        xpReward: 50,
        goldReward: 10,
        gemReward: 0,
      },
    }),
    prisma.achievement.create({
      data: {
        name: "Quest Master",
        description: "Complete 10 quests",
        condition: { quests_completed: 10 },
        xpReward: 200,
        goldReward: 50,
        gemReward: 5,
      },
    }),
    prisma.achievement.create({
      data: {
        name: "Level Up!",
        description: "Reach level 5",
        condition: { level: 5 },
        xpReward: 0,
        goldReward: 100,
        gemReward: 10,
      },
    }),
  ]);

  // Create demo family
  console.log('👨‍👩‍👧‍👦 Creating demo family...');
  const demoFamily = await prisma.family.create({
    data: {
      name: "The Smith Family",
      code: "DEMO123",
    },
  });

  // Create demo users
  console.log('👤 Creating demo users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const guildMaster = await prisma.user.create({
    data: {
      email: 'parent@demo.com',
      name: 'Sarah Smith',
      password: hashedPassword,
      role: 'GUILD_MASTER',
      familyId: demoFamily.id,
    },
  });

  const hero = await prisma.user.create({
    data: {
      email: 'teen@demo.com',
      name: 'Alex Smith',
      password: hashedPassword,
      role: 'HERO',
      familyId: demoFamily.id,
    },
  });

  const youngHero = await prisma.user.create({
    data: {
      email: 'kid@demo.com',
      name: 'Emma Smith',
      password: hashedPassword,
      role: 'YOUNG_HERO',
      familyId: demoFamily.id,
    },
  });

  // Create characters
  console.log('🧙‍♀️ Creating demo characters...');
  await Promise.all([
    prisma.character.create({
      data: {
        userId: guildMaster.id,
        name: 'Lady Sarah',
        class: 'HEALER',
        level: 10,
        xp: 2500,
        gold: 500,
        gems: 50,
        honorPoints: 100,
      },
    }),
    prisma.character.create({
      data: {
        userId: hero.id,
        name: 'Sir Alex',
        class: 'KNIGHT',
        level: 5,
        xp: 1000,
        gold: 200,
        gems: 20,
        honorPoints: 50,
      },
    }),
    prisma.character.create({
      data: {
        userId: youngHero.id,
        name: 'Emma the Mage',
        class: 'MAGE',
        level: 3,
        xp: 450,
        gold: 75,
        gems: 5,
        honorPoints: 25,
      },
    }),
  ]);

  // Create quest templates
  console.log('📜 Creating quest templates...');
  await Promise.all([
    // Daily quests
    prisma.questTemplate.create({
      data: {
        title: "Make Your Bed",
        description: "Tidy up your room by making your bed neatly",
        xpReward: 25,
        goldReward: 5,
        difficulty: 'EASY',
        category: 'DAILY',
        familyId: demoFamily.id,
        classBonuses: {
          KNIGHT: 5,
          MAGE: 0,
          RANGER: 0,
          ROGUE: 2,
          HEALER: 0,
        },
      },
    }),
    prisma.questTemplate.create({
      data: {
        title: "Brush Your Teeth",
        description: "Maintain your oral hygiene by brushing thoroughly",
        xpReward: 15,
        goldReward: 3,
        difficulty: 'EASY',
        category: 'DAILY',
        familyId: demoFamily.id,
        classBonuses: {
          KNIGHT: 0,
          MAGE: 0,
          RANGER: 0,
          ROGUE: 0,
          HEALER: 5,
        },
      },
    }),
    prisma.questTemplate.create({
      data: {
        title: "Homework Quest",
        description: "Complete your daily homework assignments",
        xpReward: 50,
        goldReward: 10,
        difficulty: 'MEDIUM',
        category: 'DAILY',
        familyId: demoFamily.id,
        classBonuses: {
          KNIGHT: 0,
          MAGE: 15,
          RANGER: 0,
          ROGUE: 0,
          HEALER: 5,
        },
      },
    }),
    // Weekly quests
    prisma.questTemplate.create({
      data: {
        title: "Vacuum the Living Room",
        description: "Deep clean the living room with the vacuum cleaner",
        xpReward: 100,
        goldReward: 25,
        difficulty: 'MEDIUM',
        category: 'WEEKLY',
        familyId: demoFamily.id,
        classBonuses: {
          KNIGHT: 10,
          MAGE: 0,
          RANGER: 5,
          ROGUE: 0,
          HEALER: 0,
        },
      },
    }),
    prisma.questTemplate.create({
      data: {
        title: "Yard Maintenance",
        description: "Rake leaves, pull weeds, and tidy up the yard",
        xpReward: 150,
        goldReward: 40,
        difficulty: 'HARD',
        category: 'WEEKLY',
        familyId: demoFamily.id,
        classBonuses: {
          KNIGHT: 5,
          MAGE: 0,
          RANGER: 20,
          ROGUE: 0,
          HEALER: 0,
        },
      },
    }),
  ]);

  // Create reward store items
  console.log('🏪 Creating reward store items...');
  await Promise.all([
    prisma.reward.create({
      data: {
        name: "Extra Screen Time",
        description: "30 minutes of additional device/TV time",
        type: 'SCREEN_TIME',
        cost: 50,
        familyId: demoFamily.id,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Stay Up 30 Minutes Later",
        description: "Extend bedtime by 30 minutes on weekend",
        type: 'PRIVILEGE',
        cost: 75,
        familyId: demoFamily.id,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Friend Sleepover",
        description: "Have a friend over for a sleepover",
        type: 'PRIVILEGE',
        cost: 200,
        familyId: demoFamily.id,
      },
    }),
    prisma.reward.create({
      data: {
        name: "$5 Spending Money",
        description: "Five dollars to spend on anything you want",
        type: 'PURCHASE',
        cost: 100,
        familyId: demoFamily.id,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Special Outing",
        description: "Choose a special activity for the family to do together",
        type: 'EXPERIENCE',
        cost: 300,
        familyId: demoFamily.id,
      },
    }),
  ]);

  // Create some quest instances
  console.log('⚔️ Creating demo quest instances...');
  const questTemplate = await prisma.questTemplate.findFirst({
    where: { title: "Make Your Bed" },
  });

  if (questTemplate) {
    await prisma.questInstance.create({
      data: {
        title: questTemplate.title,
        description: questTemplate.description,
        xpReward: questTemplate.xpReward,
        goldReward: questTemplate.goldReward,
        difficulty: questTemplate.difficulty,
        category: questTemplate.category,
        status: 'COMPLETED',
        assignedToId: youngHero.id,
        createdById: guildMaster.id,
        familyId: demoFamily.id,
        templateId: questTemplate.id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        completedAt: new Date(),
      },
    });
  }

  // Create a boss battle
  console.log('🐉 Creating demo boss battle...');
  const bossBattle = await prisma.bossBattle.create({
    data: {
      name: "The Mess Dragon",
      description: "A fearsome dragon has made a mess of the house! Work together to defeat it by completing cleaning quests.",
      totalHp: 500,
      currentHp: 350,
      familyId: demoFamily.id,
      gemReward: 100,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
    },
  });

  // Add boss battle participants
  await Promise.all([
    prisma.bossBattleParticipant.create({
      data: {
        bossBattleId: bossBattle.id,
        userId: hero.id,
        damageDealt: 75,
      },
    }),
    prisma.bossBattleParticipant.create({
      data: {
        bossBattleId: bossBattle.id,
        userId: youngHero.id,
        damageDealt: 75,
      },
    }),
  ]);

  // Create some transactions
  console.log('💰 Creating demo transactions...');
  await Promise.all([
    prisma.transaction.create({
      data: {
        userId: youngHero.id,
        type: 'QUEST_REWARD',
        xpChange: 25,
        goldChange: 5,
        description: 'Completed: Make Your Bed',
        relatedId: questTemplate?.id,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: hero.id,
        type: 'BOSS_VICTORY',
        gemsChange: 20,
        honorChange: 10,
        description: 'Participated in boss battle: The Mess Dragon',
        relatedId: bossBattle.id,
      },
    }),
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Created:
- 1 Demo family (The Smith Family)
- 3 Demo users (Guild Master, Hero, Young Hero)
- 3 Characters with different classes
- 5 Quest templates (daily and weekly)
- 5 Reward store items
- 1 Completed quest instance
- 1 Active boss battle with participants
- 3 Global achievements
- 2 Transaction records

🔐 Demo login credentials:
- Parent: parent@demo.com / password123
- Teen: teen@demo.com / password123
- Child: kid@demo.com / password123
`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });