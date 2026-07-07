// Vault: spring presets (values from the research playbook — do not improvise).
export const SPRING_EDITORIAL = { stiffness: 60, damping: 24, mass: 1 }; // premium, slow settle
export const SPRING_STANDARD = { stiffness: 120, damping: 14, mass: 1 }; // most-used enter
export const SPRING_SNAPPY = { stiffness: 250, damping: 11, mass: 0.5 }; // UI pop, slight overshoot
export const SPRING_LOGO = { stiffness: 180, damping: 10, mass: 1 }; // logo bounce
export const SPRING_UI_CLAMPED = { stiffness: 80, damping: 12, mass: 0.8, overshootClamping: true };
export const SPRING_CAMERA = { stiffness: 80, damping: 20, mass: 1 }; // continuous-pan camera
