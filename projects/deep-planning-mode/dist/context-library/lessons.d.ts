/**
 * DEEP PLANNING MODE - Lessons Learned
 *
 * Incorporates lessons from Trident Brain v3.0 development
 * to prevent repeat bugs and architectural violations.
 *
 * These lessons are MANDATORY for building modes following
 * the Trident v3.0 proven process.
 */
import { Severity } from './types';
export declare const LESSON_CATEGORIES: {
    readonly REGEX_BUGS: "Regex Bugs";
    readonly LOOP_SAFETY: "Loop Safety";
    readonly UI_CLEANLINESS: "UI Cleanliness";
    readonly ARCHITECTURE: "Architecture";
    readonly TESTING: "Testing";
    readonly DEPLOYMENT: "Deployment";
};
export type LessonCategory = typeof LESSON_CATEGORIES[keyof typeof LESSON_CATEGORIES];
export interface Lesson {
    id: string;
    category: LessonCategory;
    severity: Severity;
    title: string;
    problem: string;
    symptom: string;
    rootCause: string;
    fix: string;
    codeExample: {
        bad: string;
        good: string;
    };
    detection?: string;
    prevention?: string;
}
export declare const LESSONS: Lesson[];
export declare function getLessonsByCategory(category: LessonCategory): Lesson[];
export declare function getLessonsBySeverity(severity: Severity): Lesson[];
export declare function getCriticalLessons(): Lesson[];
export declare function formatLessonChecklist(): string;
//# sourceMappingURL=lessons.d.ts.map