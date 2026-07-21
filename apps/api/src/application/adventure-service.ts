/**
 * @fileoverview Adventure play application service.
 *
 * **What:** List / current scene / choose / restart + completion XP/streak.
 * **Why:** Coordinates store + domain so HTTP stays thin (constitution IV).
 */

import type { AdventureSceneView, AdventureSummary } from '@lab/shared';
import {
  takeawaysFromTags,
  xpForAdventureCompletion,
} from '../domain/adventure.js';
import {
  levelFromXp,
  nextStreak,
  titleForLevel,
  todayUtc,
  xpIntoLevel,
  xpToNextLevel,
} from '../domain/progression.js';
import type { AdventureStore, ChoiceRow } from '../data/adventure-store.js';
import {
  mapAdventureSummary,
  mapSceneView,
} from '../data/mappers.js';
import type { LabDb } from '../data/db.js';
import type { UserStore } from '../data/user-store.js';
import { HttpError } from '../http/http-error.js';

export class AdventureService {
  constructor(
    private readonly db: LabDb,
    private readonly adventures: AdventureStore,
    private readonly users: UserStore,
  ) {}

  list(userId: number): AdventureSummary[] {
    return this.adventures.listAdventures().map((row) => {
      const progress = this.adventures.getProgress(userId, row.id);
      return mapAdventureSummary(row, progress);
    });
  }

  getScene(userId: number, adventureId: number): AdventureSceneView {
    const adventure = this.requireAdventure(adventureId);
    let progress = this.adventures.getProgress(userId, adventureId);
    if (!progress) {
      progress = this.startProgress(userId, adventure);
    }
    return this.sceneViewForProgress(adventure.id, progress, {
      includeProgression: false,
    });
  }

  choose(
    userId: number,
    adventureId: number,
    choiceId: number,
  ): AdventureSceneView {
    const adventure = this.requireAdventure(adventureId);
    let progress = this.adventures.getProgress(userId, adventureId);
    if (!progress) {
      progress = this.startProgress(userId, adventure);
    }
    if (progress.status === 'completed') {
      throw new HttpError(400, 'Adventure completed — restart to play again');
    }

    const choice = this.adventures.getChoice(choiceId);
    if (!choice || choice.scene_id !== progress.current_scene_id) {
      throw new HttpError(400, 'Choice not available on current scene');
    }

    const nextScene = this.adventures.getScene(choice.next_scene_id);
    if (!nextScene || nextScene.adventure_id !== adventureId) {
      throw new HttpError(500, 'Choice target scene missing');
    }

    const chosenIds = [
      ...(JSON.parse(progress.chosen_choice_ids_json) as number[]),
      choice.id,
    ];
    const isEnding = Boolean(nextScene.is_ending);
    const awardAlready = Boolean(progress.award_granted);
    let xpAwarded = 0;
    let progression:
      | {
          totalXp: number;
          level: number;
          title: string;
          currentStreak: number;
          xpIntoLevel: number;
          xpToNextLevel: number;
        }
      | undefined;

    const commit = this.db.transaction(() => {
      let awardGranted = awardAlready;
      if (isEnding) {
        xpAwarded = xpForAdventureCompletion(awardAlready);
        const user = this.requireUser(userId);
        const day = todayUtc();
        const currentStreak = nextStreak({
          lastPracticeDate: user.last_practice_date,
          todayUtc: day,
          currentStreak: user.current_streak,
        });
        const totalXp = user.total_xp + xpAwarded;
        this.users.updateProgress(userId, {
          totalXp,
          currentStreak,
          lastPracticeDate: day,
        });
        awardGranted = true;
        const level = levelFromXp(totalXp);
        progression = {
          totalXp,
          level,
          title: titleForLevel(level),
          currentStreak,
          xpIntoLevel: xpIntoLevel(totalXp),
          xpToNextLevel: xpToNextLevel(totalXp),
        };
      }

      progress = this.adventures.upsertProgress({
        userId,
        adventureId,
        status: isEnding ? 'completed' : 'in_progress',
        currentSceneId: nextScene.id,
        awardGranted,
        chosenChoiceIds: chosenIds,
        updatedAt: new Date().toISOString(),
      });
    });
    commit();

    const viewOpts: {
      includeProgression: boolean;
      xpAwarded?: number;
      progression?: {
        totalXp: number;
        level: number;
        title: string;
        currentStreak: number;
        xpIntoLevel: number;
        xpToNextLevel: number;
      };
    } = {
      includeProgression: Boolean(progression),
    };
    if (isEnding) viewOpts.xpAwarded = xpAwarded;
    if (progression) viewOpts.progression = progression;

    return this.sceneViewForProgress(adventureId, progress!, viewOpts);
  }

  restart(userId: number, adventureId: number): AdventureSceneView {
    const adventure = this.requireAdventure(adventureId);
    if (adventure.start_scene_id == null) {
      throw new HttpError(500, 'Adventure missing start scene');
    }
    const existing = this.adventures.getProgress(userId, adventureId);
    const progress = this.adventures.upsertProgress({
      userId,
      adventureId,
      status: 'in_progress',
      currentSceneId: adventure.start_scene_id,
      awardGranted: Boolean(existing?.award_granted),
      chosenChoiceIds: [],
      updatedAt: new Date().toISOString(),
    });
    return this.sceneViewForProgress(adventureId, progress, {
      includeProgression: false,
    });
  }

  private startProgress(
    userId: number,
    adventure: { id: number; start_scene_id: number | null },
  ) {
    if (adventure.start_scene_id == null) {
      throw new HttpError(500, 'Adventure missing start scene');
    }
    return this.adventures.upsertProgress({
      userId,
      adventureId: adventure.id,
      status: 'in_progress',
      currentSceneId: adventure.start_scene_id,
      awardGranted: false,
      chosenChoiceIds: [],
      updatedAt: new Date().toISOString(),
    });
  }

  private sceneViewForProgress(
    adventureId: number,
    progress: {
      current_scene_id: number;
      chosen_choice_ids_json: string;
      status: string;
    },
    opts: {
      includeProgression: boolean;
      xpAwarded?: number;
      progression?: {
        totalXp: number;
        level: number;
        title: string;
        currentStreak: number;
        xpIntoLevel: number;
        xpToNextLevel: number;
      };
    },
  ): AdventureSceneView {
    const scene = this.adventures.getScene(progress.current_scene_id);
    if (!scene) throw new HttpError(500, 'Current scene missing');
    const choices = scene.is_ending
      ? []
      : this.adventures.listChoices(scene.id);

    const extras: Parameters<typeof mapSceneView>[3] = {};
    if (scene.is_ending) {
      extras.takeaways = this.takeawaysForPath(
        JSON.parse(progress.chosen_choice_ids_json) as number[],
        scene.ending_tone,
      );
    }
    if (opts.xpAwarded !== undefined) extras.xpAwarded = opts.xpAwarded;
    if (opts.progression) {
      extras.totalXp = opts.progression.totalXp;
      extras.level = opts.progression.level;
      extras.title = opts.progression.title;
      extras.currentStreak = opts.progression.currentStreak;
      extras.xpIntoLevel = opts.progression.xpIntoLevel;
      extras.xpToNextLevel = opts.progression.xpToNextLevel;
    }

    return mapSceneView(adventureId, scene, choices, extras);
  }

  private takeawaysForPath(
    choiceIds: number[],
    endingTone: string | null,
  ) {
    const tags: string[] = [];
    for (const id of choiceIds) {
      const choice: ChoiceRow | null = this.adventures.getChoice(id);
      if (!choice) continue;
      const lessonTags = JSON.parse(choice.lesson_tags_json) as string[];
      tags.push(...lessonTags);
    }
    if (endingTone === 'strong') tags.push('evidence');
    if (endingTone === 'weak') tags.push('flake-risk');
    return takeawaysFromTags(tags, 'evidence');
  }

  private requireAdventure(id: number) {
    const adventure = this.adventures.findById(id);
    if (!adventure) throw new HttpError(404, 'Adventure not found');
    return adventure;
  }

  private requireUser(userId: number) {
    const user = this.users.findById(userId);
    if (!user) throw new HttpError(401, 'Unauthorized');
    return user;
  }
}
