# Current Lift data audit

Audit source: backup exported `2026-07-21T00:04:43.325Z` (schema version 1). No data was changed by this audit.

## Verified inventory

- 63 exercise definitions
- 101 workouts, spanning 2026-02-18 through 2026-07-20 local time
- 1,225 sets: 1,221 completed and 4 incomplete
- All 101 workouts have valid start/end intervals and at least one completed set
- Duration range: about 25.8 minutes to 118 minutes
- No duplicate workout, set, or exercise IDs
- No orphan set relationships
- No exact duplicate intervals or substantial Lift-to-Lift overlaps
- No populated set-level RPE, workout notes, exercise notes, effort, wellbeing, inhaler, symptom, HealthKit-link, or outbox data

The supplied expectations were close but stale: the live backup contains 101 workouts and 1,225 sets, not about 100 and 1,210. Four incomplete sets occur across two Chest Day workouts, not three in only one.

## Historical backfill result

All 101 workout summaries are structurally eligible for reviewed backfill as `traditionalStrengthTraining`. Incomplete individual sets do not block the two affected summaries. The app still queries live Apple Health during the user-initiated preview, so accessible Lift matches or external overlaps can reduce the final selected count.

The two Cardio Day records are resistance workouts by content and are proposed as Traditional Strength Training:

- `1b12f143-e1f0-40ae-89cd-a676cf9d25f7`: Shoulder Press (Machine Plates), Chest Fly, Triceps Pushdown
- `94600e64-3b5c-4b07-9f5c-c4c9d3fc9ed3`: Incline Bench Press, Skullcrusher, Seated Shoulder Press

No historical effort, mood, wellbeing, asthma, inhaler, calories, distance, heart rate, repetitions, set count, or lifted-weight quantities are inferred for Apple Health.

## Non-destructive cleanup recommendations

Review only; none were automatically renamed, recategorized, merged, or deleted:

- Torso Rotation (`908afa65-dd94-4e58-a169-6711b1109b89`) uses the unknown category `Abs`; consider whether `Core` is intended.
- Five normalized exercise names each have two definitions: Skullcrusher, Decline Bench Press, Squat, Incline Bench Press, and Lat Pulldown. Compare equipment/category and every set reference before any merge.
- Review the two Cardio Day display names if they are misleading; the name does not change their proposed HealthKit type.
- Preserve all four incomplete sets unless the user explicitly chooses cleanup after a fresh backup.
- Null-only legacy set RPE is deprecated from future backup output. Older backups still decode it, and any non-null RPE is always preserved.

The Data tab can export the current structural cleanup findings as a separate JSON report. Declining cleanup does not affect valid HealthKit backfill.
