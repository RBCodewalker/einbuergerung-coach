/**
 * Kategorisiert Fragen basierend auf ihren ID-Bereichen nach der offiziellen Struktur
 */
export function getQuestionCategory(questionId) {
  if (questionId >= 1 && questionId <= 35) {
    return {
      name: "Geschichte Teil 1",
      color: "blue",
      description: "Fragen Teil-1.1 (1 - 35)",
      icon: "📚"
    };
  } else if (questionId >= 36 && questionId <= 68) {
    return {
      name: "Geschichte Teil 2", 
      color: "blue",
      description: "Fragen Teil-1.2 (36 - 68)",
      icon: "📖"
    };
  } else if (questionId >= 69 && questionId <= 98) {
    return {
      name: "Verfassung, Feiertage und Religion",
      color: "purple",
      description: "Fragen (69 - 98)",
      icon: "⚖️"
    };
  } else if (questionId >= 99 && questionId <= 133) {
    return {
      name: "Deutschland",
      color: "green",
      description: "Fragen (99 - 133)",
      icon: "🇩🇪"
    };
  } else if (questionId >= 134 && questionId <= 173) {
    return {
      name: "Politisches System Teil 1",
      color: "red", 
      description: "Fragen Teil-4.1 (134 -173)",
      icon: "🏛️"
    };
  } else if (questionId >= 174 && questionId <= 213) {
    return {
      name: "Politisches System Teil 2",
      color: "red",
      description: "Fragen Teil-4.2 (174 - 213)",
      icon: "🗳️"
    };
  } else if (questionId >= 214 && questionId <= 246) {
    return {
      name: "Rechtssystem und Arbeit",
      color: "orange",
      description: "Fragen (214 - 246)",
      icon: "💼"
    };
  } else if (questionId >= 247 && questionId <= 272) {
    return {
      name: "Bildung, Familie und EU Teil 1",
      color: "teal",
      description: "Fragen Teil-6.1 (247 - 272)",
      icon: "🎓"
    };
  } else if (questionId >= 273 && questionId <= 300) {
    return {
      name: "Bildung, Familie und EU Teil 2", 
      color: "teal",
      description: "Fragen Teil-6.2 (273 - 300)",
      icon: "👨‍👩‍👧‍👦"
    };
  } else if (questionId > 300) {
    return {
      name: "Landesfragen",
      color: "indigo", 
      description: "Bundeslandspezifische Fragen (301+)",
      icon: "📍"
    };
  }
  
  // Standard Fallback
  return {
    name: "Allgemein",
    color: "gray",
    description: "Allgemeine Fragen",
    icon: "❓"
  };
}

/**
 * Verkürzte Version der Kategorienamen für kompakte Anzeige
 */
export function getShortCategoryName(questionId) {
  const category = getQuestionCategory(questionId);
  
  const shortNames = {
    "Geschichte Teil 1": "Geschichte 1",
    "Geschichte Teil 2": "Geschichte 2", 
    "Verfassung, Feiertage und Religion": "Verfassung",
    "Deutschland": "Deutschland",
    "Politisches System Teil 1": "Politik 1",
    "Politisches System Teil 2": "Politik 2",
    "Rechtssystem und Arbeit": "Recht & Arbeit",
    "Bildung, Familie und EU Teil 1": "Bildung 1",
    "Bildung, Familie und EU Teil 2": "Bildung 2",
    "Landesfragen": "Bundesland",
    "Allgemein": "Allgemein"
  };
  
  return shortNames[category.name] || category.name;
}

/**
 * Alle verfügbaren Kategorien abrufen
 */
export function getAllCategories() {
  const categories = [];
  const ranges = [
    { start: 1, end: 35 },
    { start: 36, end: 68 },
    { start: 69, end: 98 },
    { start: 99, end: 133 },
    { start: 134, end: 173 },
    { start: 174, end: 213 },
    { start: 214, end: 246 },
    { start: 247, end: 272 },
    { start: 273, end: 300 },
    { start: 301, end: 999 } // Flexible range for state questions
  ];

  ranges.forEach(range => {
    const category = getQuestionCategory(range.start);
    if (!categories.find(cat => cat.name === category.name)) {
      // For state questions, we don't know the exact end range, so we'll calculate it dynamically
      const actualStartId = range.start;
      let actualEndId = range.end;
      
      // For categories 1-300, use the defined ranges
      if (range.start <= 300) {
        actualEndId = range.end;
      } else {
        // For state questions (301+), we'll set a flexible range
        actualEndId = 999; // This will be filtered properly in the components
      }

      categories.push({
        ...category,
        startId: actualStartId,
        endId: actualEndId,
        questionCount: actualEndId === 999 ? 0 : actualEndId - actualStartId + 1 // Will be calculated dynamically for state questions
      });
    }
  });

  return categories;
}