export type SeasonSetupResumeStep = 1 | 2 | 3 | 5;

type SetupProfile = {
  displayName?: string | null;
  school?: string | null;
  academicYear?: string | null;
};

/** يفتح أول صفحة منطقية ناقصة عند عودة الأستاذ إلى تهيئة الموسم. */
export function getSeasonSetupResumeStep(input: {
  profile: SetupProfile | null | undefined;
  classCount: number;
  savedScheduleCount: number;
}): SeasonSetupResumeStep {
  const profileIsComplete = Boolean(
    input.profile?.displayName?.trim()
    && input.profile?.school?.trim()
    && input.profile?.academicYear?.trim(),
  );
  if (!profileIsComplete) return 1;
  if (input.classCount === 0) return 2;
  if (input.savedScheduleCount === 0) return 3;
  return 5;
}
