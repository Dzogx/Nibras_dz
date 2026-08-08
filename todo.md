# Nibras MVP - TODO

## Core Infrastructure
- [x] Design and create database schema with all tables
- [x] Generate migrations and apply to database
- [x] Build backend API routes for all features
- [x] Configure RTL Arabic-first styling with Cairo font
- [x] Build DashboardLayout adapted for RTL with Arabic navigation

## Teacher Profile & Workspace
- [x] Teacher profile with name, subject, and academic year
- [x] Academic year selection (العام الدراسي)
- [x] Subject configuration (الدراسات الاجتماعية)

## Curriculum Knowledge Base
- [x] Database tables for curriculum documents
- [x] API routes for CRUD on curriculum documents
- [x] Curriculum document list and search with citations
- [x] Fast keyword search across documents

## Teacher OS
- [x] Classes management (create, edit, list classes)
- [x] Annual plans builder
- [x] Lessons management (create, edit, track completion)
- [x] Teaching notes recording
- [x] Lesson completion tracking

## Lesson Generator (AI)
- [x] AI-powered lesson plan generation
- [x] Active learning activities generation
- [x] Homework generation
- [x] Classroom questions generation
- [x] Differentiation strategies generation
- [x] Enhanced differentiation options in Lesson Generator (student-level controls)
- [x] RAG-based curriculum alignment for all generations

## Assessment Studio
- [x] Quiz generation
- [x] Exam generation
- [x] Rubric generation
- [x] Answer key generation
- [x] A4 printable document export

## Content Library
- [x] Store all generated resources
- [x] Edit existing resources
- [x] Duplicate resources
- [x] Reuse resources across lessons

## Inspector Mode
- [x] Lesson review with AI evaluation
- [x] Curriculum alignment check
- [x] Learning objectives evaluation
- [x] Assessment quality review
- [x] Bloom's taxonomy assessment
- [x] Active learning integration evaluation

## UI Polish
- [x] Responsive design for mobile and desktop
- [x] Arabic typography with Noto Naskh Arabic
- [x] Modern clean design with proper RTL support
- [x] Loading states and error handling
- [x] Empty states for all pages

## National Assessment Rules Engine
- [x] Design and create National Rules Engine module (server/rules/nationalRules.ts)
- [x] Store official assessment rules in centralized engine (point distribution, duration, structure)
- [x] Year 1: History 10pts + Geography 10pts
- [x] Year 2: History 10pts + Geography 10pts
- [x] Year 3: History 10pts + Geography 10pts
- [x] Year 4: History 13pts + Geography 7pts
- [x] Civic Education: independent exam, 20pts, 1 hour
- [x] History & Geography: combined exam, 1.5 hours
- [x] Rules updateable from single location without code changes
- [x] Integrate Teacher OS data flow: annual plan → sections → completed lessons → competencies → assessment
- [x] Auto-import completed lessons/competencies when creating assessment
- [x] Auto-determine covered competencies from completed lessons
- [x] Auto-apply point distribution based on national rules
- [x] Auto-suggest exam structure based on level and subject
- [x] Link each question to its competency being assessed
- [x] Updated Assessment Studio UI with Teacher OS integration
- [x] Assessment creation flow: choose level → select completed sections → auto-generate
- [x] Update vitest tests for new assessment engine

## Testing & Quality
- [x] Vitest tests for backend procedures
- [x] End-to-end verification of all features
- [x] Enhanced Lesson Generator differentiation UI with ability levels
