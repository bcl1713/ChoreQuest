/**
 * QuestTemplateService integration-style tests using mocked Supabase client.
 * These verify that the service issues the expected Supabase queries and
 * correctly interprets the returned data without requiring a live database.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CreateQuestTemplateInput } from "@/lib/types/database";
import { supabase } from "@/lib/supabase";
import { QuestTemplateService } from "@/lib/quest-template-service";

const supabaseFromSpy = jest.spyOn(supabase, "from");

type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string } }
  | { data: null; error: null };

type MockQueryBuilder<T> = {
  insert: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  select: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  update: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  delete: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  eq: jest.Mock<MockQueryBuilder<T>, [string, unknown]>;
  order: jest.Mock<MockQueryBuilder<T>, [string, { ascending: boolean }?]>;
  single: jest.Mock<Promise<QueryResult<T>>, []>;
} & PromiseLike<QueryResult<T>>;

const createQueryBuilder = <T>(
  result: QueryResult<T>,
  singleResult?: QueryResult<T>
): MockQueryBuilder<T> => {
  const promise = Promise.resolve(result);
  const builder: Partial<MockQueryBuilder<T>> = {};

  builder.insert = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.select = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.update = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.delete = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.eq = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.order = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.single = jest.fn(() =>
    Promise.resolve(singleResult ?? result)
  );

  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);

  return builder as MockQueryBuilder<T>;
};

describe("QuestTemplateService (mocked Supabase)", () => {
  const service = new QuestTemplateService();
  const testFamilyId = "family-123";
  const testTemplateId = "template-456";
  const testUserId = "user-789";

  beforeEach(() => {
    supabaseFromSpy.mockReset();
  });

  describe("createTemplate", () => {
    it("should create a quest template with all fields", async () => {
      const input: CreateQuestTemplateInput = {
        title: "Integration Test Quest",
        description: "This is an integration test",
        xp_reward: 100,
        gold_reward: 50,
        difficulty: "MEDIUM",
        category: "DAILY",
        family_id: testFamilyId,
        is_active: true,
        class_bonuses: {
          KNIGHT: { xp: 1.05, gold: 1.05 },
          MAGE: { xp: 1.2, gold: 1.0 },
        },
      };

      const createdTemplate = {
        ...input,
        id: testTemplateId,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        recurrence_pattern: null,
        quest_type: "INDIVIDUAL",
        assigned_character_ids: [],
        is_paused: false,
      };

      const insertBuilder = createQueryBuilder<{ id: string }>(
        { data: null, error: null },
        { data: createdTemplate, error: null }
      );

      supabaseFromSpy.mockImplementationOnce((table: string) => {
        expect(table).toBe("quest_templates");
        return insertBuilder;
      });

      const result = await service.createTemplate(input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.xp_reward).toBe(input.xp_reward);
      expect(result.family_id).toBe(testFamilyId);
      expect(result.class_bonuses).toEqual(input.class_bonuses);
      expect(insertBuilder.insert).toHaveBeenCalledWith(input);
    });
  });

  describe("getTemplatesForFamily", () => {
    it("should retrieve templates for a family", async () => {
      const templatesForFamily = [
        {
          id: testTemplateId,
          title: "Integration Test Quest",
          description: "This is an integration test",
          xp_reward: 100,
          gold_reward: 50,
          difficulty: "MEDIUM",
          category: "DAILY",
          family_id: testFamilyId,
          is_active: true,
          quest_type: "INDIVIDUAL",
          recurrence_pattern: null,
          assigned_character_ids: [],
          is_paused: false,
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ];

      const selectBuilder = createQueryBuilder({
        data: templatesForFamily,
        error: null,
      });

      supabaseFromSpy.mockImplementationOnce((table: string) => {
        expect(table).toBe("quest_templates");
        return selectBuilder;
      });

      const templates = await service.getTemplatesForFamily(testFamilyId);

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].family_id).toBe(testFamilyId);
      expect(selectBuilder.select).toHaveBeenCalledWith("*");
      expect(selectBuilder.eq).toHaveBeenNthCalledWith(1, "family_id", testFamilyId);
      expect(selectBuilder.eq).toHaveBeenNthCalledWith(2, "is_active", true);
    });
  });

  describe("updateTemplate", () => {
    it("should update a template", async () => {
      const updatedTemplate = {
        id: testTemplateId,
        xp_reward: 200,
        title: "Updated Integration Test Quest",
        description: "Updated",
        family_id: testFamilyId,
        difficulty: "MEDIUM",
        category: "DAILY",
        is_active: true,
        quest_type: "INDIVIDUAL",
        recurrence_pattern: null,
        assigned_character_ids: [],
        is_paused: false,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      };

      const updateBuilder = createQueryBuilder(
        { data: null, error: null },
        { data: updatedTemplate, error: null }
      );

      supabaseFromSpy.mockImplementationOnce((table: string) => {
        expect(table).toBe("quest_templates");
        return updateBuilder;
      });

      const updated = await service.updateTemplate(testTemplateId, {
        xp_reward: 200,
        title: "Updated Integration Test Quest",
      });

      expect(updated.id).toBe(testTemplateId);
      expect(updated.xp_reward).toBe(200);
      expect(updated.title).toBe("Updated Integration Test Quest");
      expect(updateBuilder.update).toHaveBeenCalledWith({
        xp_reward: 200,
        title: "Updated Integration Test Quest",
      });
      expect(updateBuilder.eq).toHaveBeenCalledWith("id", testTemplateId);
    });
  });

  describe("deleteTemplate (soft delete)", () => {
    it("should soft delete a template", async () => {
      const deletedTemplate = {
        id: testTemplateId,
        is_active: false,
      };

      const deleteBuilder = createQueryBuilder(
        { data: null, error: null },
        { data: deletedTemplate, error: null }
      );

      supabaseFromSpy.mockImplementationOnce((table: string) => {
        expect(table).toBe("quest_templates");
        return deleteBuilder;
      });

      const deleted = await service.deleteTemplate(testTemplateId);

      expect(deleted.id).toBe(testTemplateId);
      expect(deleted.is_active).toBe(false);
      expect(deleteBuilder.update).toHaveBeenCalledWith({ is_active: false });
    });
  });

  describe("activateTemplate", () => {
    it("should reactivate a template", async () => {
      const activatedTemplate = {
        id: testTemplateId,
        is_active: true,
      };

      const activateBuilder = createQueryBuilder(
        { data: null, error: null },
        { data: activatedTemplate, error: null }
      );

      supabaseFromSpy.mockImplementationOnce((table: string) => {
        expect(table).toBe("quest_templates");
        return activateBuilder;
      });

      const activated = await service.activateTemplate(testTemplateId);

      expect(activated.id).toBe(testTemplateId);
      expect(activated.is_active).toBe(true);
      expect(activateBuilder.update).toHaveBeenCalledWith({ is_active: true });
    });
  });

  describe("createQuestFromTemplate", () => {
    it("should create a quest instance from template", async () => {
      const template = {
        id: testTemplateId,
        title: "Integration Test Quest",
        description: "This is an integration test",
        xp_reward: 100,
        gold_reward: 50,
        difficulty: "MEDIUM",
        category: "DAILY",
        family_id: testFamilyId,
        is_active: true,
        quest_type: "INDIVIDUAL",
        recurrence_pattern: null,
        assigned_character_ids: [],
        is_paused: false,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };

      const createdQuest = {
        id: "quest-123",
        template_id: testTemplateId,
        created_by_id: testUserId,
        family_id: testFamilyId,
        title: template.title,
        description: template.description,
        xp_reward: template.xp_reward,
        gold_reward: template.gold_reward,
        difficulty: template.difficulty,
        category: template.category,
        status: "PENDING",
        assigned_to_id: null,
        due_date: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      };

      const fetchTemplateBuilder = createQueryBuilder(
        { data: template, error: null },
        { data: template, error: null }
      );

      const insertQuestBuilder = createQueryBuilder(
        { data: createdQuest, error: null },
        { data: createdQuest, error: null }
      );

      supabaseFromSpy
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("quest_templates");
          return fetchTemplateBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("quest_instances");
          return insertQuestBuilder;
        });

      const quest = await service.createQuestFromTemplate(testTemplateId, testUserId);

      expect(quest).toBeDefined();
      expect(quest.template_id).toBe(testTemplateId);
      expect(quest.created_by_id).toBe(testUserId);
      expect(quest.family_id).toBe(testFamilyId);
      expect(quest.status).toBe("PENDING");
      expect(insertQuestBuilder.insert).toHaveBeenCalled();
    });
  });
});
