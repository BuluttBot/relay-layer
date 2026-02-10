export const theme = {
  colors: {
    bg: { primary: '#191B23', secondary: '#1E2028', tertiary: '#252831', surface: '#2A2D37' },
    text: { primary: '#E2E4E9', secondary: '#8B8FA3', tertiary: '#5E6272' },
    accent: { purple: '#7C5CFC', teal: '#2DD4BF', blue: '#3B82F6', amber: '#F59E0B', red: '#EF4444', pink: '#EC4899' },
    status: { active: '#2DD4BF', idle: '#F59E0B', offline: '#5E6272' },
    column: {
      inbox: '#7C5CFC', assigned: '#3B82F6', in_progress: '#2DD4BF', review: '#F59E0B',
      done: '#10B981', burak: '#EC4899', published: '#8B5CF6',
    },
  },
} as const;
