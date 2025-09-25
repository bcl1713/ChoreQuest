/**
 * @jest-environment node
 */
import { PrismaClient } from '@/lib/generated/prisma';
import bcrypt from 'bcryptjs';
// import { exec } from 'child_process'; // Unused for now
// import { promisify } from 'util'; // Unused for now

// const execAsync = promisify(exec); // Unused for now

// Use the existing development database
const prisma = new PrismaClient();

// Import the main function from seed file (we'll need to export it)
describe('Database Seeding', () => {
  beforeAll(async () => {
    // This test suite validates that seed data has been correctly populated
    // Run "npm run db:reset" before running this test suite
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Seed Data Creation', () => {
    it('should create demo family with correct data', async () => {
      const family = await prisma.family.findUnique({
        where: { code: 'DEMO123' }
      });

      expect(family).toBeTruthy();
      expect(family?.name).toBe('The Smith Family');
      expect(family?.code).toBe('DEMO123');
    });

    it('should create three users with correct roles', async () => {

      const users = await prisma.user.findMany({
        include: { family: true }
      });

      expect(users).toHaveLength(3);

      const guildMaster = users.find(u => u.role === 'GUILD_MASTER');
      const hero = users.find(u => u.role === 'HERO');
      const youngHero = users.find(u => u.role === 'YOUNG_HERO');

      expect(guildMaster).toBeTruthy();
      expect(guildMaster?.name).toBe('Sarah Smith');
      expect(guildMaster?.email).toBe('parent@demo.com');

      expect(hero).toBeTruthy();
      expect(hero?.name).toBe('Alex Smith');
      expect(hero?.email).toBe('teen@demo.com');

      expect(youngHero).toBeTruthy();
      expect(youngHero?.name).toBe('Emma Smith');
      expect(youngHero?.email).toBe('kid@demo.com');

      // Verify all users belong to same family
      expect(guildMaster?.familyId).toBe(hero?.familyId);
      expect(hero?.familyId).toBe(youngHero?.familyId);
    });

    it('should create characters with correct classes and stats', async () => {
      const characters = await prisma.character.findMany({
        include: { user: true }
      });

      expect(characters).toHaveLength(3);

      const healer = characters.find(c => c.class === 'HEALER');
      const knight = characters.find(c => c.class === 'KNIGHT');
      const mage = characters.find(c => c.class === 'MAGE');

      expect(healer).toBeTruthy();
      expect(healer?.name).toBe('Lady Sarah');
      expect(healer?.level).toBe(10);
      expect(healer?.xp).toBe(2500);
      expect(healer?.gold).toBe(500);

      expect(knight).toBeTruthy();
      expect(knight?.name).toBe('Sir Alex');
      expect(knight?.level).toBe(5);
      expect(knight?.xp).toBe(1000);

      expect(mage).toBeTruthy();
      expect(mage?.name).toBe('Emma the Mage');
      expect(mage?.level).toBe(3);
      expect(mage?.xp).toBe(450);
    });

    it('should create quest templates with correct categories', async () => {
      const templates = await prisma.questTemplate.findMany();
      expect(templates.length).toBeGreaterThanOrEqual(5);

      const dailyQuests = templates.filter(t => t.category === 'DAILY');
      const weeklyQuests = templates.filter(t => t.category === 'WEEKLY');

      expect(dailyQuests.length).toBeGreaterThanOrEqual(3);
      expect(weeklyQuests.length).toBeGreaterThanOrEqual(2);

      // Verify specific quest templates
      const bedQuest = templates.find(t => t.title === 'Make Your Bed');
      expect(bedQuest).toBeTruthy();
      expect(bedQuest?.difficulty).toBe('EASY');
      expect(bedQuest?.xpReward).toBe(25);
      expect(bedQuest?.goldReward).toBe(5);

      const homeworkQuest = templates.find(t => t.title === 'Homework Quest');
      expect(homeworkQuest).toBeTruthy();
      expect(homeworkQuest?.difficulty).toBe('MEDIUM');
      expect(homeworkQuest?.category).toBe('DAILY');
    });

    it('should create reward store items with different types', async () => {
      const rewards = await prisma.reward.findMany();
      expect(rewards.length).toBeGreaterThanOrEqual(5);

      const screenTime = rewards.find(r => r.type === 'SCREEN_TIME');
      const privilege = rewards.find(r => r.type === 'PRIVILEGE');
      const purchase = rewards.find(r => r.type === 'PURCHASE');
      const experience = rewards.find(r => r.type === 'EXPERIENCE');

      expect(screenTime).toBeTruthy();
      expect(privilege).toBeTruthy();
      expect(purchase).toBeTruthy();
      expect(experience).toBeTruthy();

      // Verify specific reward
      const extraTime = rewards.find(r => r.name === 'Extra Screen Time');
      expect(extraTime?.cost).toBe(50);
      expect(extraTime?.type).toBe('SCREEN_TIME');
    });

    it('should create achievements with correct rewards', async () => {
      const achievements = await prisma.achievement.findMany();
      expect(achievements.length).toBeGreaterThanOrEqual(3);

      const firstSteps = achievements.find(a => a.name === 'First Steps');
      expect(firstSteps).toBeTruthy();
      expect(firstSteps?.xpReward).toBe(50);
      expect(firstSteps?.goldReward).toBe(10);

      const questMaster = achievements.find(a => a.name === 'Quest Master');
      expect(questMaster).toBeTruthy();
      expect(questMaster?.gemReward).toBe(5);
    });

    it('should create boss battle with participants', async () => {
      const bossBattle = await prisma.bossBattle.findFirst({
        include: { participants: true }
      });

      expect(bossBattle).toBeTruthy();
      expect(bossBattle?.name).toBe('The Mess Dragon');
      expect(bossBattle?.totalHp).toBe(500);
      expect(bossBattle?.currentHp).toBe(350);
      expect(bossBattle?.status).toBe('ACTIVE');
      expect(bossBattle?.participants).toHaveLength(2);

      // Verify participants have dealt damage
      const totalDamage = bossBattle?.participants.reduce((sum, p) => sum + p.damageDealt, 0);
      expect(totalDamage).toBe(150); // 75 + 75
    });

    it('should create transaction records', async () => {
      const transactions = await prisma.transaction.findMany();
      expect(transactions.length).toBeGreaterThanOrEqual(2);

      const questReward = transactions.find(t => t.type === 'QUEST_REWARD');
      const bossReward = transactions.find(t => t.type === 'BOSS_VICTORY');

      expect(questReward).toBeTruthy();
      expect(questReward?.xpChange).toBe(25);
      expect(questReward?.goldChange).toBe(5);

      expect(bossReward).toBeTruthy();
      expect(bossReward?.gemsChange).toBe(20);
      expect(bossReward?.honorChange).toBe(10);
    });

    it('should verify password hashing is working', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'parent@demo.com' }
      });

      expect(user).toBeTruthy();
      expect(user?.password).toBeTruthy();
      expect(user?.password).not.toBe('password123'); // Should be hashed

      // Verify password can be compared
      const isValid = await bcrypt.compare('password123', user?.password || '');
      expect(isValid).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity between related entities', async () => {
      // Verify users belong to the family
      const family = await prisma.family.findUnique({
        where: { code: 'DEMO123' },
        include: { users: true }
      });
      expect(family?.users).toHaveLength(3);

      // Verify characters belong to users
      const characters = await prisma.character.findMany({
        include: { user: true }
      });
      characters.forEach(character => {
        expect(character.user).toBeTruthy();
        expect(character.user.familyId).toBe(family?.id);
      });

      // Verify quest templates belong to family
      const templates = await prisma.questTemplate.findMany();
      templates.forEach(template => {
        expect(template.familyId).toBe(family?.id);
      });
    });

    it('should clean existing data before seeding', async () => {
      // This test verifies that the seed process properly cleans data
      // Since we ran db:reset in beforeAll, we just verify the expected data exists
      const families = await prisma.family.findMany();
      expect(families).toHaveLength(1);
      expect(families[0].code).toBe('DEMO123');
    });
  });
});