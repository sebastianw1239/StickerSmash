// SameTime Branding Theme
export const theme = {
  colors: {
    // Primary Colors
    primary: '#5CB3FF', // Vibrant blue - trust, clarity, tech-forward
    accent: '#FFAD1F', // Energetic orange - urgency, fun, calls to action
    
    // Secondary Colors
    secondary: '#F4F4F8', // Warm gray
    white: '#FFFFFF',
    success: '#7ED957', // Soft green for sync/status
    
    // Semantic Colors
    background: '#FFFFFF',
    surface: '#F4F4F8',
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#FFFFFF'
    },
    status: {
      online: '#7ED957',
      offline: '#FF6B6B',
      warning: '#FFAD1F',
      info: '#5CB3FF'
    }
  },
  
  typography: {
    // Rounded, approachable typeface
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System'
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6
    }
  }
};

// Brand messaging
export const brandMessages = {
  taglines: [
    "Make Plans. Arrive Together. Stress Never.",
    "End the 'Where Are You?' Anxiety.",
    "SameTime: Because Showing Up Shouldn't Be a Guessing Game.",
    "Sync Up. Show Up. Celebrate Together."
  ],
  
  voice: {
    casual: "We'll get you all there at the same time—no more awkward 'I'm here, where are you?' texts.",
    together: "Together, not tethered.",
    privacy: "Privacy-first location sharing.",
    celebrate: "Celebrate the perfect sync with every meet-up."
  },
  
  copy: {
    welcome: "Welcome to SameTime",
    subtitle: "Where everyone arrives together",
    createEvent: "Create your first event",
    joinEvent: "Join an event",
    tracking: "Real-time sync in progress",
    arrival: "You're almost there!",
    celebration: "Everyone's here! 🎉"
  }
}; 