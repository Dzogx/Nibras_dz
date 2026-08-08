# Nibras Architecture Notes

## Assessment Engine Architecture (2024-08-06)

### File: server/rules/nationalRules.ts
- Central rules engine for Algerian assessment rules
- Contains: getAssessmentRule(), getExamStructure(), getBloomDistribution(), buildAssessmentContext(), getExamHeader()
- COMPETENCY_CATEGORIES: knowledge, methodology, social_citizenship, historical_analysis
- BLOOM_LEVELS: remember(0.2), understand(0.2), apply(0.2), analyze(0.15), evaluate(0.15), create(0.1)

### Rules stored:
- "السنة الأولى متوسط:التاريخ والجغرافيا" → 10+10, 1.5h, combined
- "السنة الثانية متوسط:التاريخ والجغرافيا" → 10+10, 1.5h, combined
- "السنة الثالثة متوسط:التاريخ والجغرافيا" → 10+10, 1.5h, combined
- "السنة الرابعة متوسط:التاريخ والجغرافيا" → 13+7, 1.5h, combined (BEM)
- "التربية المدنية" (any level) → 20pts, 1h, independent

### Backend changes in routers.ts:
- Added import for national rules functions
- generateAssessment now accepts: lessonIds, competencyIds, autoImport, useNationalRules
- Auto-imports completed lessons from Teacher OS
- Builds rules context (point distribution, duration, exam structure, bloom distribution)
- Returns: resourceId, content, rulesApplied, pointDistribution, totalPoints, duration
- Added new procedures: getAssessmentRules (query), getCompetencyCategories (query), getTeacherOSContext (query)

### Remaining TODO:
- Phase 4: Build enhanced Assessment UI (client/src/pages/Assessment.tsx)
- Need to add Teacher OS integration to Assessment page
- Phase 5: Verify, test, save checkpoint
- Phase 6: Deliver

### User preferences for tests:
- Must use db-mock.ts / mock layer exclusively
- No direct DB connections in tests
- Use test-utils.createCaller only
- Must run full test suite after changes
