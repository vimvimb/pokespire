/**
 * Tutorial completion persistence.
 * localStorage key: pokespire_tutorial_complete
 */

const TUTORIAL_COMPLETE_KEY = "pokespire_tutorial_complete";

export function isTutorialComplete(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_COMPLETE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setTutorialComplete(): void {
  try {
    localStorage.setItem(TUTORIAL_COMPLETE_KEY, "true");
  } catch (e) {
    console.warn("Failed to save tutorial completion", e);
  }
}

export function resetTutorial(): void {
  try {
    localStorage.removeItem(TUTORIAL_COMPLETE_KEY);
  } catch (e) {
    console.warn("Failed to reset tutorial", e);
  }
}
