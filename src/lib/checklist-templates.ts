export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
}

export interface ChecklistTemplate {
  type: string;
  name: string;
  icon: string;
  description: string;
  items: ChecklistItem[];
}

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate> = {
  general: {
    type: "general",
    name: "General Safety",
    icon: "G",
    description: "Daily general jobsite safety walk-through",
    items: [
      { id: "g1", label: "Housekeeping — work area clean and organized", category: "General" },
      { id: "g2", label: "Walking/working surfaces free of debris and tripping hazards", category: "General" },
      { id: "g3", label: "Adequate lighting in all work areas", category: "General" },
      { id: "g4", label: "Emergency exits clear and marked", category: "General" },
      { id: "g5", label: "First aid kit accessible and stocked", category: "First Aid" },
      { id: "g6", label: "Fire extinguishers accessible and inspected", category: "Fire Safety" },
      { id: "g7", label: "Safety Data Sheets (SDS) available for chemicals on site", category: "HazCom" },
      { id: "g8", label: "All workers wearing required PPE", category: "PPE" },
      { id: "g9", label: "Hard hats worn in designated areas", category: "PPE" },
      { id: "g10", label: "Safety glasses/goggles worn where required", category: "PPE" },
      { id: "g11", label: "High-visibility vests worn near traffic/equipment", category: "PPE" },
      { id: "g12", label: "Hearing protection available in high-noise areas", category: "PPE" },
      { id: "g13", label: "Ladders inspected before use and properly secured", category: "Equipment" },
      { id: "g14", label: "Power tools in good condition with guards intact", category: "Equipment" },
      { id: "g15", label: "Extension cords free of damage, GFCI protected", category: "Electrical" },
      { id: "g16", label: "No unauthorized personnel in restricted areas", category: "Access" },
      { id: "g17", label: "Toolbox talk conducted today", category: "Training" },
      { id: "g18", label: "Weather conditions safe for work activities", category: "Environmental" },
    ],
  },

  fall_protection: {
    type: "fall_protection",
    name: "Fall Protection",
    icon: "F",
    description: "OSHA 1926 Subpart M — fall hazards above 6 feet",
    items: [
      { id: "f1", label: "Guardrails in place at all open edges above 6 feet", category: "Guardrails" },
      { id: "f2", label: "Guardrail top rail 42 inches (+/- 3 inches) above walking surface", category: "Guardrails" },
      { id: "f3", label: "Mid-rails installed at 21 inches", category: "Guardrails" },
      { id: "f4", label: "Toe boards in place where tools/materials could fall", category: "Guardrails" },
      { id: "f5", label: "Personal fall arrest systems (harness) inspected before use", category: "Harness" },
      { id: "f6", label: "Harness D-rings centered between shoulder blades", category: "Harness" },
      { id: "f7", label: "Lanyards connected to anchorage rated for 5,000 lbs", category: "Anchorage" },
      { id: "f8", label: "Self-retracting lifelines inspected and functional", category: "Equipment" },
      { id: "f9", label: "Safety nets installed where required", category: "Nets" },
      { id: "f10", label: "Floor holes covered and marked", category: "Openings" },
      { id: "f11", label: "Covers on floor openings secured and labeled", category: "Openings" },
      { id: "f12", label: "Workers trained on fall protection plan", category: "Training" },
      { id: "f13", label: "Rescue plan in place for fall arrest events", category: "Rescue" },
      { id: "f14", label: "No damaged or expired fall protection equipment in use", category: "Equipment" },
      { id: "f15", label: "Leading edge work has approved fall protection", category: "Leading Edge" },
    ],
  },

  scaffolding: {
    type: "scaffolding",
    name: "Scaffolding",
    icon: "S",
    description: "OSHA 1926 Subpart L — scaffold erection and use",
    items: [
      { id: "s1", label: "Scaffold erected on stable, level base", category: "Foundation" },
      { id: "s2", label: "Base plates and mudsills in place", category: "Foundation" },
      { id: "s3", label: "Scaffold plumb and level", category: "Structure" },
      { id: "s4", label: "Cross-bracing properly installed", category: "Structure" },
      { id: "s5", label: "Planking fully decked with no gaps over 1 inch", category: "Platform" },
      { id: "s6", label: "Planks extend 6-12 inches past supports", category: "Platform" },
      { id: "s7", label: "Guardrails on all open sides above 10 feet", category: "Fall Protection" },
      { id: "s8", label: "Access ladder or stairway provided", category: "Access" },
      { id: "s9", label: "Scaffold tagged by competent person (green/red tag)", category: "Inspection" },
      { id: "s10", label: "No scaffold use within 10 feet of power lines", category: "Electrical" },
      { id: "s11", label: "Scaffold secured to structure if height > 4:1 base ratio", category: "Tie-offs" },
      { id: "s12", label: "No damaged or missing components", category: "Condition" },
      { id: "s13", label: "Workers trained on scaffold hazards", category: "Training" },
      { id: "s14", label: "Load capacity not exceeded", category: "Load" },
    ],
  },
};

export const CHECKLIST_TYPES = Object.keys(CHECKLIST_TEMPLATES) as Array<keyof typeof CHECKLIST_TEMPLATES>;
