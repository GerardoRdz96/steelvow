// Client-safe safety program labels — extracted from actions.ts to avoid "use server" serialization issues
import type { SafetyProgramType } from "@/types/database";

export const PROGRAM_LABELS: Record<SafetyProgramType, { en: string; es: string }> = {
  fall_protection: { en: "Fall Protection Program", es: "Programa de Protección contra Caídas" },
  hazcom: { en: "Hazard Communication Program", es: "Programa de Comunicación de Peligros" },
  respiratory: { en: "Respiratory Protection Program", es: "Programa de Protección Respiratoria" },
  loto: { en: "Lockout/Tagout Program", es: "Programa de Bloqueo/Etiquetado" },
  heat: { en: "Heat Illness Prevention Program", es: "Programa de Prevención de Enfermedades por Calor" },
};
