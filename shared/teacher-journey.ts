export type PreparedAssessmentInput = {
  autoImport: boolean;
  title: string;
  topic: string;
};

export function prepareAssessmentFromCompletedLessons(input: {
  className?: string | null;
  lessonTitles: string[];
  currentTitle: string;
  currentTopic: string;
}): PreparedAssessmentInput {
  const lessonTitles = input.lessonTitles.slice(0, 3).join("، ");
  return {
    autoImport: true,
    title: input.currentTitle || `تقويم تحصيلي — ${input.className || "القسم"}`,
    topic: input.currentTopic || `الدروس المنجزة: ${lessonTitles}`,
  };
}

export function prepareFirstResultInput(input: {
  totalStudents: number;
  participatedStudents: number;
  classSize?: number | null;
}) {
  const classSize = input.classSize || 0;
  return {
    totalStudents: input.totalStudents || classSize,
    participatedStudents: input.participatedStudents || classSize,
  };
}
