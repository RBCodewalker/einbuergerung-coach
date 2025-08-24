export const QUESTIONS_URL = `${process.env.PUBLIC_URL}/json/LiDData.json`;

export const QUIZ_COUNT = 33;

export const DEMO_DATA = [
  {
    id: 1,
    question: "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil …",
    options: [
      "hier Religionsfreiheit gilt.",
      "die Menschen Steuern zahlen.",
      "die Menschen das Wahlrecht haben.",
      "hier Meinungsfreiheit gilt.",
    ],
    answerIndex: 3,
  },
  {
    id: 2,
    question: "In Deutschland können Eltern bis zum 14. Lebensjahr ihres Kindes entscheiden, ob es in der Schule am … teilnimmt.",
    options: [
      "Geschichtsunterricht",
      "Religionsunterricht", 
      "Politikunterricht",
      "Sprachunterricht",
    ],
    answerIndex: 1,
  },
];

export const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export const DEFAULT_COOKIE_DURATION = 365; // ~1 year

export const TIMER_WARNING_THRESHOLD = 5; // seconds