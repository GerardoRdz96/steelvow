export type Locale = "en" | "es";

export const translations = {
  // Navigation
  "nav.home": { en: "Home", es: "Inicio" },
  "nav.inspect": { en: "Inspect", es: "Inspeccionar" },
  "nav.report": { en: "Report", es: "Reportar" },
  "nav.profile": { en: "Perfil", es: "Perfil" },
  "nav.workers": { en: "Workers", es: "Trabajadores" },
  "nav.projects": { en: "Projects", es: "Proyectos" },
  "nav.inspections": { en: "Inspections", es: "Inspecciones" },
  "nav.incidents": { en: "Incidents", es: "Incidentes" },
  "nav.osha_logs": { en: "OSHA Logs", es: "Registros OSHA" },
  "nav.safety_programs": { en: "Safety Programs", es: "Programas de Seguridad" },
  "nav.pricing": { en: "Pricing", es: "Precios" },
  "nav.more": { en: "More", es: "Más" },

  // Common
  "common.loading": { en: "Loading...", es: "Cargando..." },
  "common.save": { en: "Save", es: "Guardar" },
  "common.cancel": { en: "Cancel", es: "Cancelar" },
  "common.delete": { en: "Delete", es: "Eliminar" },
  "common.edit": { en: "Edit", es: "Editar" },
  "common.back": { en: "Back", es: "Atrás" },
  "common.submit": { en: "Submit", es: "Enviar" },
  "common.search": { en: "Search", es: "Buscar" },
  "common.no_results": { en: "No results found", es: "No se encontraron resultados" },
  "common.error": { en: "Something went wrong", es: "Algo salió mal" },
  "common.required": { en: "Required", es: "Requerido" },
  "common.optional": { en: "Optional", es: "Opcional" },
  "common.language": { en: "Language", es: "Idioma" },
  "common.english": { en: "English", es: "Inglés" },
  "common.spanish": { en: "Spanish", es: "Español" },

  // Dashboard
  "dashboard.title": { en: "Dashboard", es: "Panel de Control" },
  "dashboard.compliance_score": { en: "Compliance Score", es: "Puntuación de Cumplimiento" },
  "dashboard.upcoming_expirations": { en: "Upcoming Expirations", es: "Vencimientos Próximos" },
  "dashboard.recent_incidents": { en: "Recent Incidents", es: "Incidentes Recientes" },
  "dashboard.active_projects": { en: "Active Projects", es: "Proyectos Activos" },
  "dashboard.total_workers": { en: "Total Workers", es: "Total de Trabajadores" },
  "dashboard.inspections_this_week": { en: "Inspections This Week", es: "Inspecciones Esta Semana" },

  // Inspections
  "inspect.title": { en: "Inspections", es: "Inspecciones" },
  "inspect.select_type": { en: "Select inspection type", es: "Selecciona tipo de inspección" },
  "inspect.start": { en: "Start Inspection", es: "Iniciar Inspección" },
  "inspect.pass": { en: "Pass", es: "Aprobado" },
  "inspect.fail": { en: "Fail", es: "Falla" },
  "inspect.na": { en: "N/A", es: "N/A" },
  "inspect.notes": { en: "Notes", es: "Notas" },
  "inspect.photo": { en: "Add Photo", es: "Agregar Foto" },
  "inspect.complete": { en: "Complete Inspection", es: "Completar Inspección" },
  "inspect.saved": { en: "Inspection saved", es: "Inspección guardada" },

  // Checklist types
  "checklist.general": { en: "General Safety", es: "Seguridad General" },
  "checklist.fall_protection": { en: "Fall Protection", es: "Protección contra Caídas" },
  "checklist.scaffolding": { en: "Scaffolding", es: "Andamios" },
  "checklist.excavation": { en: "Excavation", es: "Excavación" },
  "checklist.electrical": { en: "Electrical", es: "Eléctrico" },
  "checklist.ppe": { en: "PPE", es: "EPP" },

  // Incidents
  "incident.title": { en: "Report Incident", es: "Reportar Incidente" },
  "incident.type": { en: "Incident Type", es: "Tipo de Incidente" },
  "incident.injury": { en: "Injury", es: "Lesión" },
  "incident.near_miss": { en: "Near Miss", es: "Casi Accidente" },
  "incident.property_damage": { en: "Property Damage", es: "Daño a Propiedad" },
  "incident.severity": { en: "Severity", es: "Severidad" },
  "incident.minor": { en: "Minor", es: "Menor" },
  "incident.serious": { en: "Serious", es: "Serio" },
  "incident.fatal": { en: "Fatal", es: "Fatal" },
  "incident.description": { en: "What happened?", es: "¿Qué ocurrió?" },
  "incident.location": { en: "Location", es: "Ubicación" },
  "incident.date_time": { en: "Date & Time", es: "Fecha y Hora" },

  // Toolbox Talks
  "talk.title": { en: "Toolbox Talk", es: "Charla de Seguridad" },
  "talk.topic": { en: "Topic", es: "Tema" },
  "talk.duration": { en: "Duration (minutes)", es: "Duración (minutos)" },
  "talk.attendees": { en: "Attendees", es: "Asistentes" },
  "talk.start": { en: "Start Talk", es: "Iniciar Charla" },

  // Workers
  "workers.title": { en: "Workers", es: "Trabajadores" },
  "workers.add": { en: "Add Worker", es: "Agregar Trabajador" },
  "workers.name": { en: "Name", es: "Nombre" },
  "workers.role": { en: "Role", es: "Rol" },
  "workers.phone": { en: "Phone", es: "Teléfono" },
  "workers.certifications": { en: "Certifications", es: "Certificaciones" },
  "workers.expires": { en: "Expires", es: "Vence" },
  "workers.expired": { en: "Expired", es: "Vencido" },

  // Projects
  "projects.title": { en: "Projects", es: "Proyectos" },
  "projects.new": { en: "New Project", es: "Nuevo Proyecto" },
  "projects.active": { en: "Active", es: "Activo" },
  "projects.completed": { en: "Completed", es: "Completado" },
  "projects.paused": { en: "Paused", es: "Pausado" },
  "projects.select": { en: "Select Project", es: "Seleccionar Proyecto" },

  // Safety Programs
  "safety.title": { en: "Written Safety Programs", es: "Programas de Seguridad Escritos" },
  "safety.generate": { en: "Generate", es: "Generar" },
  "safety.generate_section_title": { en: "Generate Safety Programs", es: "Generar Programas de Seguridad" },
  "safety.generate_description": { en: "AI generates OSHA-compliant written safety programs customized for your company. Available in English and Spanish.", es: "La IA genera programas de seguridad escritos y conformes con OSHA personalizados para su empresa. Disponible en inglés y español." },
  "safety.generating": { en: "Generating...", es: "Generando..." },
  "safety.regenerate": { en: "Regenerate", es: "Regenerar" },
  "safety.regenerating": { en: "Regenerating...", es: "Regenerando..." },
  "safety.version": { en: "Version", es: "Versión" },
  "safety.your_programs": { en: "Your Programs", es: "Tus Programas" },
  "safety.back_to_programs": { en: "Back to Programs", es: "Volver a Programas" },
  "safety.generated_by_ai": { en: "Generated by AI", es: "Generado por IA" },
  "safety.never_reviewed": { en: "Never reviewed", es: "Sin revisar" },
  "safety.delete_confirm": { en: "Delete this safety program? This cannot be undone.", es: "¿Eliminar este programa de seguridad? Esta acción no se puede deshacer." },
  "safety.subtitle": { en: "AI-generated OSHA-compliant safety programs for", es: "Programas de seguridad conformes con OSHA generados por IA para" },

  // Profile
  "profile.title": { en: "Profile", es: "Perfil" },
  "profile.sign_out": { en: "Sign Out", es: "Cerrar Sesión" },
  "profile.language_toggle": { en: "Language", es: "Idioma" },
  "profile.company": { en: "Company", es: "Empresa" },

  // Pricing
  "pricing.title": { en: "Choose Your Plan", es: "Elige Tu Plan" },
  "pricing.subtitle": { en: "14-day free trial. No credit card required to start.", es: "Prueba gratuita de 14 días. No se requiere tarjeta de crédito." },
  "pricing.most_popular": { en: "Most Popular", es: "Más Popular" },
  "pricing.tier_starter": { en: "Starter", es: "Básico" },
  "pricing.tier_pro": { en: "Pro", es: "Pro" },
  "pricing.tier_business": { en: "Business", es: "Empresarial" },
  "pricing.workers": { en: "workers", es: "trabajadores" },
  "pricing.projects": { en: "projects", es: "proyectos" },
  "pricing.unlimited": { en: "Unlimited", es: "Ilimitados" },
  "pricing.current_plan": { en: "Current Plan", es: "Plan Actual" },
  "pricing.select_plan": { en: "Start Free Trial", es: "Iniciar Prueba Gratis" },
  "pricing.trial_note": { en: "All plans include a 14-day free trial. Cancel anytime.", es: "Todos los planes incluyen 14 días de prueba gratis. Cancela cuando quieras." },

  // Auth
  "auth.login": { en: "Sign In", es: "Iniciar Sesión" },
  "auth.email": { en: "Email", es: "Correo Electrónico" },
  "auth.magic_link": { en: "Send Magic Link", es: "Enviar Enlace Mágico" },
  "auth.check_email": { en: "Check your email for the login link", es: "Revisa tu correo para el enlace de acceso" },

  // Worker Profile Required
  "worker_required.title": { en: "Worker Profile Required", es: "Perfil de Trabajador Requerido" },
  "worker_required.message": { en: "An admin needs to add you as a worker.", es: "Un administrador necesita agregarte como trabajador." },

  // Footer
  "footer.attribution": { en: "A product by Penguin Alley", es: "Un producto de Penguin Alley" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key];
  return entry?.[locale] || entry?.en || key;
}
