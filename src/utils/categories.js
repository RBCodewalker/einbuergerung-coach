/**
 * Categorize questions based on their ID ranges according to the CSV breakdown
 */
export function getQuestionCategory(questionId) {
  if (questionId >= 1 && questionId <= 68) {
    return {
      name: "Geschichte",
      color: "blue",
      description: "Deutsche Geschichte von der Antike bis zur Wiedervereinigung"
    };
  } else if (questionId >= 69 && questionId <= 98) {
    return {
      name: "Verfassung & Religion",
      color: "purple",
      description: "Grundgesetz, Feiertage, religiöse Vielfalt"
    };
  } else if (questionId >= 99 && questionId <= 133) {
    return {
      name: "Deutschland",
      color: "green",
      description: "Geographie, Bundesländer, Allgemeinwissen über Deutschland"
    };
  } else if (questionId >= 134 && questionId <= 213) {
    return {
      name: "Politisches System",
      color: "red",
      description: "Regierungsstruktur, Demokratie, Parteien, Wahlen"
    };
  } else if (questionId >= 214 && questionId <= 246) {
    return {
      name: "Rechtssystem & Arbeit",
      color: "orange",
      description: "Rechtssystem, Gerichte, Arbeitsrecht, Arbeitnehmerrechte"
    };
  } else if (questionId >= 247 && questionId <= 300) {
    return {
      name: "Bildung & EU",
      color: "teal",
      description: "Bildungssystem, Familienrecht, Europäische Union"
    };
  } else if (questionId > 300) {
    return {
      name: "Jüdisches Leben",
      color: "indigo",
      description: "Jüdisches Leben, Israel, Antisemitismus"
    };
  }
  
  // Default fallback
  return {
    name: "Allgemein",
    color: "gray",
    description: "Allgemeine Fragen"
  };
}

/**
 * Get a shorter version of category name for compact display
 */
export function getShortCategoryName(questionId) {
  const category = getQuestionCategory(questionId);
  
  const shortNames = {
    "Geschichte": "Geschichte",
    "Verfassung & Religion": "Verfassung",
    "Deutschland": "Deutschland", 
    "Politisches System": "Politik",
    "Rechtssystem & Arbeit": "Recht & Arbeit",
    "Bildung & EU": "Bildung & EU",
    "Jüdisches Leben": "Jüdisches Leben",
    "Allgemein": "Allgemein"
  };
  
  return shortNames[category.name] || category.name;
}