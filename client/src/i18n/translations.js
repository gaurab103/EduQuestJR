/**
 * Translations for Buddy Bear UI — English, Spanish, Nepali.
 */
export const BUDDY_TRANSLATIONS = {
  en: {
    headerName: 'Buddy the Bear',
    headerStatus: '🟢 Online',
    greetingWithName: (name) => `Hi ${name}! I'm Buddy the Bear! 🐻 I'm so happy to see you! What should we talk about today?`,
    greetingNoName: "Hi friend! I'm Buddy the Bear! 🐻 What should we talk about today?",
    placeholder: 'Talk to Buddy...',
    fallback: "Hmm, let me think about that! Can you ask me something else? 🤔",
    fallbackError: (name) => `That's a great question, ${name || 'friend'}! Let me think... Can you ask me something else? 🤔`,
    quickPrompts: [
      { emoji: '🦕', text: 'Tell me a fun fact!' },
      { emoji: '🎵', text: 'Sing me a short song!' },
      { emoji: '🧮', text: 'Give me a math puzzle!' },
      { emoji: '🌈', text: 'What colors make purple?' },
      { emoji: '🐾', text: 'Tell me about animals!' },
      { emoji: '🌟', text: "Let's play a word game!" },
    ],
  },
  es: {
    headerName: 'Buddy el Oso',
    headerStatus: '🟢 En línea',
    greetingWithName: (name) => `¡Hola ${name}! ¡Soy Buddy el Oso! 🐻 ¡Qué feliz estoy de verte! ¿De qué quieres hablar hoy?`,
    greetingNoName: "¡Hola amigo! ¡Soy Buddy el Oso! 🐻 ¿De qué quieres hablar hoy?",
    placeholder: 'Habla con Buddy...',
    fallback: "¡Hmm, déjame pensar! ¿Me preguntas otra cosa? 🤔",
    fallbackError: (name) => `¡Qué buena pregunta, ${name || 'amigo'}! Déjame pensar... ¿Me preguntas otra cosa? 🤔`,
    quickPrompts: [
      { emoji: '🦕', text: '¡Cuéntame un dato divertido!' },
      { emoji: '🎵', text: '¡Cántame una canción corta!' },
      { emoji: '🧮', text: '¡Dame un acertijo de matemáticas!' },
      { emoji: '🌈', text: '¿Qué colores hacen el morado?' },
      { emoji: '🐾', text: '¡Cuéntame sobre los animales!' },
      { emoji: '🌟', text: '¡Juguemos con palabras!' },
    ],
  },
  ne: {
    headerName: 'बडी भालु',
    headerStatus: '🟢 अनलाइन',
    greetingWithName: (name) => `नमस्ते ${name}! म बडी भालु हुँ! 🐻 तिमीलाई भेटेर धेरै खुशी लाग्यो! आज के कुरा गर्न चाहन्छौ?`,
    greetingNoName: "नमस्ते साथी! म बडी भालु हुँ! 🐻 आज के कुरा गर्न चाहन्छौ?",
    placeholder: 'बडीसँग कुरा गर...',
    fallback: "हम्म, मलाई सोच्न दिनुस्! अर्को केही सोध्न सक्नुहुन्छ? 🤔",
    fallbackError: (name) => `राम्रो प्रश्न, ${name || 'साथी'}! मलाई सोच्न दिनुस्... अर्को केही सोध्न सक्नुहुन्छ? 🤔`,
    quickPrompts: [
      { emoji: '🦕', text: 'मलाई रमाइलो तथ्य भन!' },
      { emoji: '🎵', text: 'मलाई छोटो गीत गाउ!' },
      { emoji: '🧮', text: 'मलाई गणितको पहेली दियोस्!' },
      { emoji: '🌈', text: 'कुन रंगहरूले बैजनी बनाउँछन्?' },
      { emoji: '🐾', text: 'मलाई जनावरहरूको बारेमा भन!' },
      { emoji: '🌟', text: 'शब्द खेल खेलौं!' },
    ],
  },
};
