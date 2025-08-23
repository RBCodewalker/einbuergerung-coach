import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  RefreshCcw,
  Flag,
  Moon,
  Sun,
  RotateCcw,
  Home,
} from "lucide-react";
import {
  Container,
  Paper,
  Button,
  Text,
  Title,
  Grid,
  Group,
  Stack,
  Progress,
  NumberInput,
  ActionIcon,
  Badge,
  useMantineColorScheme,
  Image,
} from "@mantine/core";

const QUESTIONS_URL = `${process.env.PUBLIC_URL}/LiDData.json`;

function setCookie(name, value, days = 36500) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${d.toUTCString()};path=/`;
}
function getCookie(name) {
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function useCookieState(key, initial, enabled) {
  const [val, setVal] = useState(() => {
    if (!enabled) return initial;
    const c = getCookie(key);
    if (!c) return initial;
    try {
      return JSON.parse(c);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    if (!enabled) return;
    try {
      setCookie(key, JSON.stringify(val));
    } catch {}
  }, [key, val, enabled]);
  return [val, setVal];
}

const demoData = [
  {
    id: 1,
    question:
      "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil …",
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
    question:
      "In Deutschland können Eltern bis zum 14. Lebensjahr ihres Kindes entscheiden, ob es in der Schule am … teilnimmt.",
    options: [
      "Geschichtsunterricht",
      "Religionsunterricht",
      "Politikunterricht",
      "Sprachunterricht",
    ],
    answerIndex: 1,
  },
];

export default function App() {
  const [consent, setConsent] = useState(
    () => getCookie("lid.consent") || "ask"
  );
  const cookiesEnabled = consent === "all";

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [dark, setDark] = useCookieState(
    "lid.dark",
    colorScheme === "dark",
    true
  );

  useEffect(() => {
    if (colorScheme !== (dark ? "dark" : "light")) {
      toggleColorScheme();
    }
  }, [dark]);

  const handleToggleDark = () => {
    setDark((d) => !d);
    toggleColorScheme();
  };

  const [allData, setAllData] = useState(demoData);

  const [mode, setMode] = useCookieState(
    "lid.mode",
    "dashboard",
    cookiesEnabled
  );
  const [quizSeed, setQuizSeed] = useState(0);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useCookieState(
    "lid.answers",
    [],
    cookiesEnabled
  );
  const [flags, setFlags] = useCookieState("lid.flags", [], cookiesEnabled);
  const [showReview, setShowReview] = useState(false);
  const [timePerQ, setTimePerQ] = useCookieState("lid.tpq", 0, cookiesEnabled);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  const statsInit = { attempted: {}, correct: 0, wrong: 0, totalSessions: 0 };
  const [stats, setStats] = useCookieState(
    "lid.stats",
    statsInit,
    cookiesEnabled
  );

  useEffect(() => {
    fetch(QUESTIONS_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        setAllData(Array.isArray(json) && json.length ? json : demoData);
      })
      .catch(() => setAllData(demoData));
  }, []);

  const QUIZ_COUNT = 34;

  const learnSet = useMemo(
    () =>
      allData.filter(
        (q) => q && q.options?.length === 4 && q.answerIndex !== null
      ),
    [allData]
  );
  const quizSet = useMemo(() => {
    const list = learnSet.slice();
    const rng = mulberry32(quizSeed || Date.now());
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, Math.min(QUIZ_COUNT, list.length));
  }, [learnSet, quizSeed]);

  const questions = mode === "quiz" ? quizSet : learnSet;
  const currentQA = questions[current];
  const progress = questions.length
    ? ((current + 1) / questions.length) * 100
    : 0;

  useEffect(() => {
    if (mode !== "quiz") return;
    setAnswers(Array(questions.length).fill(-1));
    setFlags([]);
    setCurrent(0);
    setShowReview(false);
    setRemaining(timePerQ > 0 ? timePerQ : 0);
  }, [mode, quizSeed]);

  useEffect(() => {
    if (mode !== "quiz" || timePerQ <= 0 || showReview) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, timePerQ, showReview]);

  useEffect(() => {
    if (!(mode === "quiz" && timePerQ > 0 && remaining === 0 && !showReview))
      return;
    if (current < questions.length - 1) {
      setCurrent((c) => Math.min(c + 1, questions.length - 1));
      setRemaining(timePerQ);
    } else {
      setShowReview(true);
      setRemaining(0);
    }
  }, [remaining, mode, timePerQ, showReview, current, questions.length]);

  function handleAnswer(idx) {
    if (mode !== "quiz") return;
    const prev = answers[current] ?? -1;
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
    const isPrevCorrect = prev !== -1 && prev === currentQA.answerIndex;
    const isNextCorrect = idx === currentQA.answerIndex;
    if (prev === -1) {
      setStats((s) => ({
        ...s,
        attempted: { ...s.attempted, [currentQA.id]: true },
        correct: s.correct + (isNextCorrect ? 1 : 0),
        wrong: s.wrong + (!isNextCorrect ? 1 : 0),
      }));
    } else if (isPrevCorrect !== isNextCorrect) {
      setStats((s) => ({
        ...s,
        correct: s.correct + (isNextCorrect ? 1 : -1),
        wrong: s.wrong + (isNextCorrect ? -1 : 1),
      }));
    }
  }

  function handleNext() {
    setCurrent((c) => Math.min(c + 1, questions.length - 1));
    if (mode === "quiz" && timePerQ > 0) setRemaining(timePerQ);
  }
  function handlePrev() {
    setCurrent((c) => Math.max(c - 1, 0));
    if (mode === "quiz" && timePerQ > 0) setRemaining(timePerQ);
  }

  function completeQuiz() {
    const newAttempted = { ...stats.attempted };
    questions.forEach((q, i) => {
      if (answers[i] !== -1) newAttempted[q.id] = true;
    });
    setStats((s) => ({
      ...s,
      attempted: newAttempted,
      totalSessions: s.totalSessions + 1,
    }));
  }

  function scoreSummary() {
    let correct = 0,
      wrong = 0,
      empty = 0;
    questions.forEach((q, i) => {
      if (answers[i] === -1) empty++;
      else if (answers[i] === q.answerIndex) correct++;
      else wrong++;
    });
    return { correct, wrong, empty, total: questions.length };
  }

  const { correct, wrong, empty, total } = scoreSummary();

  const dashboard = (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={1} size="h1">
          Dashboard
        </Title>
      </Group>

      <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Text size="3rem" fw={700} lh={1}>
              {Object.keys(stats.attempted).length}/{learnSet.length}
            </Text>
            <Text c="dimmed">Fragen gequizzt</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Text size="3rem" fw={700} lh={1} c="emerald">
              {stats.correct}
            </Text>
            <Text c="dimmed">Richtig insgesamt</Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Text size="3rem" fw={700} lh={1} c="red">
              {stats.wrong}
            </Text>
            <Text c="dimmed">Falsch insgesamt</Text>
          </Grid.Col>
        </Grid>
      </Paper>

      <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Title order={2} size="h3" mb="md">
          Modus wählen
        </Title>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Button
              onClick={() => setMode("learn")}
              variant="default"
              size="md"
            >
              Learn Mode
            </Button>
            <Button
              onClick={() => {
                setQuizSeed(Date.now());
                setMode("quiz");
              }}
              variant="default"
              size="md"
            >
              Quiz Mode (34)
            </Button>
          </Group>
          <Group align="center" gap="sm">
            <Text size="sm" c="dimmed">
              Timer pro Frage (s)
            </Text>
            <NumberInput
              min={0}
              value={timePerQ}
              onChange={(value) => setTimePerQ(value || 0)}
              w={100}
              size="sm"
            />
          </Group>
        </Group>
      </Paper>

      <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Title order={3} size="h4">
          Fragenübersicht
        </Title>
        <Stack gap="xs" mt="md">
          <Text size="sm" c="dimmed">
            Gesamt: {learnSet.length}
          </Text>
          <Text size="sm" c="dimmed">
            Gequizzt: {Object.keys(stats.attempted).length}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );

  if (consent === "ask") {
    return (
      <Container size="sm" style={{ minHeight: "100vh" }} py="xl">
        <Paper withBorder p="xl" radius="lg" shadow="sm" maw={600} mx="auto">
          <Title order={2}>Cookies</Title>
          <Text c="dimmed" mt="sm" size="sm">
            Möchtest du Einstellungen und Fortschritt in Cookies speichern?
          </Text>
          <Group mt="lg" gap="md">
            <Button
              onClick={() => {
                setConsent("necessary");
                setCookie("lid.consent", "necessary");
              }}
              variant="default"
            >
              Nur notwendig
            </Button>
            <Button
              onClick={() => {
                setConsent("all");
                setCookie("lid.consent", "all");
              }}
              variant="filled"
            >
              Alle akzeptieren
            </Button>
          </Group>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" style={{ minHeight: "100vh" }} py="md">
      <Group justify="space-between" align="center" mb="xl">
        <Group align="center" gap="md">
          <Button
            onClick={() => setMode("dashboard")}
            variant="default"
            leftSection={<Home size={16} />}
          >
            Dashboard
          </Button>
          <Title order={1} size="h1">
            LiD 300
          </Title>
        </Group>
        <Group gap="sm">
          <Button
            onClick={handleToggleDark}
            variant="default"
            leftSection={
              colorScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />
            }
            visibleFrom="sm"
          >
            {colorScheme === "dark" ? "Light" : "Dark"}
          </Button>
          <ActionIcon
            onClick={handleToggleDark}
            variant="default"
            size="lg"
            hiddenFrom="sm"
          >
            {colorScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </ActionIcon>
        </Group>
      </Group>

      {mode === "dashboard" && dashboard}

      {mode === "learn" && (
        <Paper withBorder p="xl" radius="lg" shadow="sm" mt="xl">
          <Group justify="space-between" align="center" mb="lg">
            <Title order={2} size="h3">
              Learn Mode
            </Title>
            <Button onClick={() => setMode("dashboard")} variant="default">
              Zurück
            </Button>
          </Group>
          <LearnBrowser data={learnSet} />
        </Paper>
      )}

      {mode === "quiz" && (
        <Stack mt="xl" gap="lg">
          <Progress value={progress} color="emerald" size="sm" radius="xl" />
          <Group justify="space-between" align="center">
            <Group align="center" gap="sm">
              <Text size="sm" c="dimmed">
                Frage {current + 1} / {questions.length}
              </Text>
              {flags.includes(current) && (
                <Badge
                  color="yellow"
                  variant="light"
                  leftSection={<Flag size={14} />}
                  size="sm"
                >
                  flagged
                </Badge>
              )}
            </Group>
            {timePerQ > 0 && (
              <Badge
                color={remaining <= 5 ? "red" : "gray"}
                variant="light"
                size="lg"
              >
                ⏱ {remaining}s
              </Badge>
            )}
          </Group>
          <Paper withBorder p="xl" radius="lg" shadow="sm">
            <Title order={2} size="h3" mb="lg">
              {currentQA?.question}
            </Title>
            {currentQA?.image && (
              <Image
                src={getImageSrc(currentQA)}
                alt="Frage Bild"
                mah={300}
                fit="contain"
                radius="md"
                mb="lg"
              />
            )}
            <Stack gap="md">
              {currentQA?.options?.map((opt, i) => {
                const picked = answers[current] === i;
                const correctOpt = currentQA.answerIndex === i;
                const showState = picked;
                return (
                  <motion.div key={i} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleAnswer(i)}
                      variant={
                        picked ? (correctOpt ? "light" : "light") : "default"
                      }
                      color={picked ? (correctOpt ? "emerald" : "red") : "gray"}
                      justify="flex-start"
                      fullWidth
                      p="md"
                      h="auto"
                      style={{ textAlign: "left" }}
                    >
                      <Group gap="md" w="100%">
                        <Badge
                          variant="outline"
                          size="sm"
                          color={
                            picked ? (correctOpt ? "emerald" : "red") : "gray"
                          }
                        >
                          {"ABCD"[i]}
                        </Badge>
                        <Text flex={1}>{opt}</Text>
                        {showState &&
                          (currentQA.answerIndex === i ? (
                            <Check size={18} />
                          ) : (
                            <X size={18} />
                          ))}
                      </Group>
                    </Button>
                  </motion.div>
                );
              })}
            </Stack>
            <Group justify="space-between" mt="lg">
              <Group gap="sm">
                <Button onClick={handlePrev} variant="default" visibleFrom="sm">
                  Zurück
                </Button>
                <ActionIcon
                  onClick={handlePrev}
                  variant="default"
                  size="lg"
                  hiddenFrom="sm"
                >
                  ◀
                </ActionIcon>
                <Button onClick={handleNext} variant="default" visibleFrom="sm">
                  Weiter
                </Button>
                <ActionIcon
                  onClick={handleNext}
                  variant="default"
                  size="lg"
                  hiddenFrom="sm"
                >
                  ▶
                </ActionIcon>
              </Group>
              <Group gap="sm">
                <Button
                  onClick={() =>
                    setFlags((f) =>
                      f.includes(current)
                        ? f.filter((x) => x !== current)
                        : [...f, current]
                    )
                  }
                  variant={flags.includes(current) ? "light" : "default"}
                  color={flags.includes(current) ? "yellow" : "gray"}
                  leftSection={<Flag size={16} />}
                >
                  Flag
                </Button>
                <Button
                  onClick={() => {
                    setShowReview(true);
                    completeQuiz();
                  }}
                  variant="default"
                  leftSection={<RefreshCcw size={16} />}
                >
                  Review
                </Button>
              </Group>
            </Group>
          </Paper>
        </Stack>
      )}

      {mode === "quiz" && showReview && (
        <Stack mt="xl" gap="lg">
          <Paper withBorder p="xl" radius="lg" shadow="sm">
            <Title order={2} mb="md">
              Ergebnis
            </Title>
            <Grid>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <Pill label="Richtig" value={correct} tone="emerald" />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <Pill label="Falsch" value={wrong} tone="rose" />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <Pill label="Offen" value={empty} tone="zinc" />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <Pill label="Gesamt" value={total} tone="sky" />
              </Grid.Col>
            </Grid>
            <Group mt="lg" gap="md">
              <Button
                onClick={() => {
                  setMode("dashboard");
                }}
                variant="default"
                leftSection={<RotateCcw size={16} />}
              >
                Zurück zum Dashboard
              </Button>
              <Button
                onClick={() => {
                  setQuizSeed(Date.now());
                  setMode("quiz");
                }}
                variant="filled"
              >
                Neue Quizrunde
              </Button>
            </Group>
          </Paper>

          <Paper withBorder p="xl" radius="lg" shadow="sm">
            <Title order={3} size="h4" mb="lg">
              Durchsicht
            </Title>
            <Stack gap="md">
              {questions.map((q, i) => (
                <Paper key={i} withBorder p="lg" radius="md">
                  <Group justify="space-between" align="flex-start" mb="sm">
                    <Text fw={500}>
                      {i + 1}. {q.question}
                    </Text>
                    <Badge
                      color={
                        answers[i] === q.answerIndex
                          ? "emerald"
                          : answers[i] === -1
                          ? "gray"
                          : "red"
                      }
                      variant="light"
                      size="sm"
                    >
                      {answers[i] === q.answerIndex
                        ? "richtig"
                        : answers[i] === -1
                        ? "offen"
                        : "falsch"}
                    </Badge>
                  </Group>
                  {q.image && (
                    <Image
                      src={getImageSrc(q)}
                      alt="Bild"
                      mah={240}
                      fit="contain"
                      radius="sm"
                      mb="sm"
                    />
                  )}
                  <Stack gap="xs">
                    {q.options.map((o, j) => (
                      <Paper
                        key={j}
                        p="xs"
                        radius="sm"
                        bg={
                          j === q.answerIndex
                            ? "var(--mantine-color-emerald-1)"
                            : j === answers[i] && j !== q.answerIndex
                            ? "var(--mantine-color-red-1)"
                            : undefined
                        }
                      >
                        <Text size="sm">
                          {"ABCD"[j]}. {o}
                        </Text>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Stack>
      )}

      <Text size="xs" c="dimmed" mt="xl" ta="center">
        Platzieren Sie eine lokale questions.json im Projekt-Root. Die Datei
        muss Felder id, question, options[4], answerIndex und optional image
        enthalten.
      </Text>
    </Container>
  );
}

function Pill({ label, value, tone }) {
  const colorMap = {
    emerald: "emerald",
    rose: "red",
    zinc: "gray",
    sky: "blue",
  };
  return (
    <Paper p="md" radius="lg" bg={`var(--mantine-color-${colorMap[tone]}-1)`}>
      <Text size="xs" c="dimmed" mb={4}>
        {label}
      </Text>
      <Text size="xl" fw={700}>
        {value}
      </Text>
    </Paper>
  );
}
function LearnBrowser({ data }) {
  const [idx, setIdx] = useState(0);
  const q = data[idx];
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          {idx + 1} / {data.length}
        </Text>
        <Group gap="sm">
          <ActionIcon
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            variant="default"
            size="lg"
          >
            ◀
          </ActionIcon>
          <ActionIcon
            onClick={() => setIdx((i) => Math.min(data.length - 1, i + 1))}
            variant="default"
            size="lg"
          >
            ▶
          </ActionIcon>
        </Group>
      </Group>
      <Stack gap="lg">
        <Title order={3} size="h4">
          {q?.question}
        </Title>
        {q?.image && (
          <Image
            src={getImageSrc(q)}
            alt="Bild"
            mah={300}
            fit="contain"
            radius="md"
          />
        )}
        <Stack gap="sm">
          {q?.options?.map((o, i) => (
            <Paper
              key={i}
              p="md"
              radius="lg"
              withBorder={i === q.answerIndex}
              bg={
                i === q.answerIndex
                  ? "var(--mantine-color-emerald-1)"
                  : undefined
              }
              style={{
                borderColor:
                  i === q.answerIndex
                    ? "var(--mantine-color-emerald-6)"
                    : undefined,
              }}
            >
              <Text fw={i === q.answerIndex ? 600 : 400}>
                {"ABCD"[i]}. {o}
              </Text>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
function getImageSrc(item) {
  if (!item || !item.image) return null;
  const v = item.image;
  if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;

  return `${process.env.PUBLIC_URL}/images/image-${item.id}.png`;
}
function mulberry32(a) {
  let t = a >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
