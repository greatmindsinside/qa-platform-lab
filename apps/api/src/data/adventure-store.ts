/**
 * @fileoverview Adventure graph + per-user progress persistence.
 *
 * **What:** CRUD for adventures/scenes/choices and adventure_progress.
 * **Why:** Isolates SQL from adventure application service (DIP / SRP).
 */

import type { LabDb } from './db.js';

export type AdventureRow = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  start_scene_id: number | null;
  learning_themes_json: string;
};

export type SceneRow = {
  id: number;
  adventure_id: number;
  scene_key: string;
  body: string;
  is_ending: number;
  ending_tone: 'strong' | 'weak' | null;
};

export type ChoiceRow = {
  id: number;
  scene_id: number;
  label: string;
  next_scene_id: number;
  lesson_tags_json: string;
  sort_order: number;
};

export type AdventureProgressRow = {
  user_id: number;
  adventure_id: number;
  status: 'in_progress' | 'completed';
  current_scene_id: number;
  award_granted: number;
  chosen_choice_ids_json: string;
  updated_at: string;
};

export class AdventureStore {
  constructor(private readonly db: LabDb) {}

  listAdventures(): AdventureRow[] {
    return this.db
      .prepare(
        `SELECT id, slug, title, blurb, start_scene_id, learning_themes_json
         FROM adventures
         ORDER BY id ASC`,
      )
      .all() as AdventureRow[];
  }

  findById(id: number): AdventureRow | null {
    return (
      (this.db
        .prepare(
          `SELECT id, slug, title, blurb, start_scene_id, learning_themes_json
           FROM adventures WHERE id = ?`,
        )
        .get(id) as AdventureRow | undefined) ?? null
    );
  }

  findBySlug(slug: string): AdventureRow | null {
    return (
      (this.db
        .prepare(
          `SELECT id, slug, title, blurb, start_scene_id, learning_themes_json
           FROM adventures WHERE slug = ?`,
        )
        .get(slug) as AdventureRow | undefined) ?? null
    );
  }

  insertAdventure(input: {
    slug: string;
    title: string;
    blurb: string;
    learningThemes: string[];
  }): AdventureRow {
    const result = this.db
      .prepare(
        `INSERT INTO adventures (slug, title, blurb, learning_themes_json)
         VALUES (@slug, @title, @blurb, @themes)`,
      )
      .run({
        slug: input.slug,
        title: input.title,
        blurb: input.blurb,
        themes: JSON.stringify(input.learningThemes),
      });
    const row = this.findById(Number(result.lastInsertRowid));
    if (!row) throw new Error('Adventure missing after insert');
    return row;
  }

  setStartScene(adventureId: number, startSceneId: number): void {
    this.db
      .prepare(`UPDATE adventures SET start_scene_id = ? WHERE id = ?`)
      .run(startSceneId, adventureId);
  }

  insertScene(input: {
    adventureId: number;
    sceneKey: string;
    body: string;
    isEnding?: boolean;
    endingTone?: 'strong' | 'weak' | null;
  }): SceneRow {
    const result = this.db
      .prepare(
        `INSERT INTO scenes (adventure_id, scene_key, body, is_ending, ending_tone)
         VALUES (@adventureId, @sceneKey, @body, @isEnding, @endingTone)`,
      )
      .run({
        adventureId: input.adventureId,
        sceneKey: input.sceneKey,
        body: input.body,
        isEnding: input.isEnding ? 1 : 0,
        endingTone: input.endingTone ?? null,
      });
    const row = this.getScene(Number(result.lastInsertRowid));
    if (!row) throw new Error('Scene missing after insert');
    return row;
  }

  getScene(id: number): SceneRow | null {
    return (
      (this.db
        .prepare(
          `SELECT id, adventure_id, scene_key, body, is_ending, ending_tone
           FROM scenes WHERE id = ?`,
        )
        .get(id) as SceneRow | undefined) ?? null
    );
  }

  listScenes(adventureId: number): SceneRow[] {
    return this.db
      .prepare(
        `SELECT id, adventure_id, scene_key, body, is_ending, ending_tone
         FROM scenes WHERE adventure_id = ? ORDER BY id ASC`,
      )
      .all(adventureId) as SceneRow[];
  }

  insertChoice(input: {
    sceneId: number;
    label: string;
    nextSceneId: number;
    lessonTags?: string[];
    sortOrder?: number;
  }): ChoiceRow {
    const result = this.db
      .prepare(
        `INSERT INTO choices (scene_id, label, next_scene_id, lesson_tags_json, sort_order)
         VALUES (@sceneId, @label, @nextSceneId, @tags, @sortOrder)`,
      )
      .run({
        sceneId: input.sceneId,
        label: input.label,
        nextSceneId: input.nextSceneId,
        tags: JSON.stringify(input.lessonTags ?? []),
        sortOrder: input.sortOrder ?? 0,
      });
    const row = this.getChoice(Number(result.lastInsertRowid));
    if (!row) throw new Error('Choice missing after insert');
    return row;
  }

  getChoice(id: number): ChoiceRow | null {
    return (
      (this.db
        .prepare(
          `SELECT id, scene_id, label, next_scene_id, lesson_tags_json, sort_order
           FROM choices WHERE id = ?`,
        )
        .get(id) as ChoiceRow | undefined) ?? null
    );
  }

  listChoices(sceneId: number): ChoiceRow[] {
    return this.db
      .prepare(
        `SELECT id, scene_id, label, next_scene_id, lesson_tags_json, sort_order
         FROM choices WHERE scene_id = ? ORDER BY sort_order ASC, id ASC`,
      )
      .all(sceneId) as ChoiceRow[];
  }

  getProgress(
    userId: number,
    adventureId: number,
  ): AdventureProgressRow | null {
    return (
      (this.db
        .prepare(
          `SELECT user_id, adventure_id, status, current_scene_id, award_granted,
                  chosen_choice_ids_json, updated_at
           FROM adventure_progress
           WHERE user_id = ? AND adventure_id = ?`,
        )
        .get(userId, adventureId) as AdventureProgressRow | undefined) ?? null
    );
  }

  upsertProgress(input: {
    userId: number;
    adventureId: number;
    status: 'in_progress' | 'completed';
    currentSceneId: number;
    awardGranted: boolean;
    chosenChoiceIds: number[];
    updatedAt: string;
  }): AdventureProgressRow {
    this.db
      .prepare(
        `INSERT INTO adventure_progress (
           user_id, adventure_id, status, current_scene_id, award_granted,
           chosen_choice_ids_json, updated_at
         ) VALUES (
           @userId, @adventureId, @status, @currentSceneId, @awardGranted,
           @chosen, @updatedAt
         )
         ON CONFLICT(user_id, adventure_id) DO UPDATE SET
           status = excluded.status,
           current_scene_id = excluded.current_scene_id,
           award_granted = excluded.award_granted,
           chosen_choice_ids_json = excluded.chosen_choice_ids_json,
           updated_at = excluded.updated_at`,
      )
      .run({
        userId: input.userId,
        adventureId: input.adventureId,
        status: input.status,
        currentSceneId: input.currentSceneId,
        awardGranted: input.awardGranted ? 1 : 0,
        chosen: JSON.stringify(input.chosenChoiceIds),
        updatedAt: input.updatedAt,
      });
    const row = this.getProgress(input.userId, input.adventureId);
    if (!row) throw new Error('Progress missing after upsert');
    return row;
  }
}
