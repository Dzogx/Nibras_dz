# Nibras Audit Findings (Compiled from actual code)

## Git State
- Last checkpoint: 3ba56cd (HEAD -> main, origin/main) - "Added curriculum knowledge base RAG integration"
- Previous: 31c222e (National Rules Engine), c552c4f (Lesson Generator differentiation), 9517167 (MVP v1), 6d1dbe7 (bootstrap)
- Clean working tree, no uncommitted changes

## Database Schema (MySQL/TiDB via Drizzle)
Tables: users, teacherProfiles, academicYears, curriculumDocuments, classes, annualPlans, lessons, teachingNotes, aiResources, inspectorReviews, curriculumSearchIndex
- No seeded data found (no seed scripts, no INSERT statements)
- curriculumSearchIndex table defined in schema but NOT used anywhere in code
- No pgvector (this is MySQL, not PostgreSQL)

## Backend (server/routers.ts)
Routers: system, auth, profile, academicYears, curriculum, classes, annualPlans, lessons, teachingNotes, aiResources, inspector, ai
- ai router: generateLesson, generateAssessment, getAssessmentRules, getCompetencyCategories, getTeacherOSContext, searchCurriculum

## Critical Findings

### 1. generateLesson - NO curriculum RAG
- Accepts `curriculumDocs: z.any().optional()` in input BUT NEVER USES IT
- Prompts only say "استند دائماً إلى المنهج الرسمي الجزائري" (generic, no actual curriculum injection)
- The frontend LessonGenerator page passes curriculumDocs but the backend ignores it
- No getCurriculumForTopic call in generateLesson

### 2. generateAssessment - HAS curriculum RAG
- Calls getCurriculumForTopic(input.topic, input.gradeLevel, input.subject)
- Injects up to all found docs into prompt with strict citation instructions
- Returns curriculumCitations in response
- BUT: requires curriculum documents to exist in DB to be useful

### 3. Inspector - HAS curriculum RAG (partial)
- Calls getCurriculumDocuments with gradeLevel/subject filters
- Slices top 3 and injects into prompt
- Returns evaluation text

### 4. No real LLM model specified
- invokeLLM is called with only `messages` parameter
- No model, temperature, or maxTokens specified
- Uses default model from Manus built-in API

### 5. National Rules Engine (server/rules/nationalRules.ts)
- Complete: 1AM/2AM/3AM = 10+10, 4AM = 13+7, Civic Education = 20pts/1hr
- getAssessmentRule, getExamStructure, getBloomDistribution, buildAssessmentContext, getExamHeader, COMPETENCY_CATEGORIES
- All functions tested and working

### 6. Knowledge Base Status
- curriculumDocuments table exists with proper schema
- getCurriculumDocuments (search), getCurriculumForTopic (topic-based) both exist
- curriculumSearchIndex table defined but NEVER populated or queried
- NO OCR pipeline
- NO actual curriculum content seeded (empty tables at runtime)

### 7. Teacher OS
- classes: CRUD fully implemented (create, update, delete, list, get)
- annualPlans: CRUD implemented (create, list, get, update, delete)
- lessons: CRUD + toggleLessonCompleted implemented
- teachingNotes: CRUD implemented
- getTeacherOSContext: auto-imports completed lessons, derives competencies

### 8. Assessment
- generateAssessment: full pipeline with national rules + Teacher OS + curriculum RAG
- Returns: content, rulesApplied, pointDistribution, totalPoints, duration, curriculumCitations
- A4 print export in frontend (window.open with print styles)

### 9. Content Library
- aiResources: CRUD + duplicate + update + delete
- Types: lessonPlan, activity, homework, classQuestions, differentiation, quiz, exam, rubric, answerKey, inspectorReview

### 10. Inspector
- inspector.reviews, createReview (lesson + assessment)
- Uses LLM with structured criteria evaluation
- Saves to inspectorReviews table

### 11. Tests
- 32 tests passing (30 in routers.test.ts + 2 in auth.logout.test.ts)
- All tests use vi.mock for db and llm (no real DB connection)
- NO mock enforcement guard (no setup file that throws if getDb is called in test)

### 12. Frontend
- 16 pages: Dashboard, Curriculum, Classes, AnnualPlans(+detail), Lessons(+detail), LessonGenerator, Assessment, ContentLibrary(+detail), Inspector, Profile
- Home.tsx is still the TEMPLATE example (unused, redirects to /dashboard)
- DashboardLayout sidebar: 10 nav items in Arabic RTL
- Cairo + Noto Naskh Arabic fonts loaded

### 13. Missing / Not Implemented
- Student records/grades tracking (no table)
- Results analysis (no table, no feature)
- Treatment/remediation (no feature)
- Word/PDF export (only A4 print via window.print)
- Sections/messtas (المقاطع) as separate entities (annualPlans.content is just text)
- Situations/وضعية تعليمية (not a separate entity)
- Daily log/دفتر يومي (not implemented)
- OCR (not implemented)
- Analytics (not implemented)
- Notifications (not implemented)
- curriculumSearchIndex never used
- generateLesson does NOT actually use curriculum RAG despite accepting the param
