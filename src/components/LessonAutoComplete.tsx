'use client';

/**
 * Bridge component: dispatches 'lesson-auto-complete' event
 * when InteractiveMarkdown reports all tasks are done.
 * Used as the onAllTasksComplete callback.
 */
export function triggerLessonAutoComplete() {
  window.dispatchEvent(new CustomEvent('lesson-auto-complete'));
}
