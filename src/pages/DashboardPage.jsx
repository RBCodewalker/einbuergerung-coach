import {
  Stack,
  Group,
  Title,
  Paper,
  Grid,
  Text,
  Button,
  NumberInput,
  Center,
  Box,
  useMantineColorScheme,
  Switch,
  Fieldset,
  Badge,
  ThemeIcon,
  Divider,
  Tooltip,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../contexts/QuizContext";
import { useMediaQuery } from "@mantine/hooks";
import { Clock2, FunnelX, GraduationCap, LibraryBig, ListTodo } from "lucide-react";

export function DashboardPage() {
  const {
    learnSet,
    stats,
    startNewQuiz,
    quizDuration,
    setQuizDuration,
    excludeCorrect,
    setExcludeCorrect,
  } = useQuiz();

  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  const isXs = useMediaQuery('(max-width: 450px)');

  const handleStartQuiz = () => {
    startNewQuiz();
    navigate("/quiz/1");
  };

  const handleLearnMode = () => {
    navigate("/learn/1");
  };

  // Calculate available questions for quiz
  const availableQuestionsCount = excludeCorrect
    ? learnSet.filter((q) => !stats?.correctAnswers?.[q.id]).length
    : learnSet.length;

  const actualQuizSize = Math.min(33, availableQuestionsCount);

  return (
    <Stack gap="xl">
      {/* Branding Section */}
      <Center>
        <Stack gap={{ base: "md", sm: "lg", md: "xl" }} align="center">
          <img
            src={`${process.env.PUBLIC_URL}/icons/einbu-coach-${colorScheme}.png`}
            alt="Einbürgerungstest Coach Icon"
            style={{
              width: "clamp(50px, 20vw, 150px)",
              height: "auto",
              maxWidth: "90vw",
            }}
          />

          {/* Brand text */}
          <Stack gap={4} style={{ marginTop: "-30px" }} align="center">
            <Text
              fw={900}
              lh={0.9}
              ta="center"
              c={colorScheme === "dark" ? "white" : "black"}
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontSize: "clamp(1.5rem, 8vw, 3.5rem)",
                maxWidth: "95vw",
              }}
            >
              EINBÜRGERUNGSTEST
            </Text>
            <Text
              fw={700}
              lh={1}
              ta="center"
              c="#e74c3c"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontSize: "clamp(1rem, 6vw, 2.5rem)",
                maxWidth: "90vw",
              }}
            >
              COACH
            </Text>
          </Stack>
        </Stack>
      </Center>

      <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Grid style={{ textAlign: "center" }}>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Text size="clamp(2rem, 8vw, 3rem)" fw={700} lh={1}>
              {Object.keys(stats.attempted).length}/{learnSet.length}
            </Text>
            <Text size="clamp(0.7rem, 3vw, 1.2rem)" c="dimmed">Fragen gequizzt</Text>
          </Grid.Col>
          <Tooltip
            label={ stats.correct > 0 && "Richtig beantwortete Fragen überprüfen." }
            withArrow
          >
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box
                style={{ cursor: stats.correct > 0 ? "pointer" : "default" }}
                onClick={() => stats.correct > 0 && navigate("/review-correct")}
              >
                <Text size="clamp(2rem, 8vw, 3rem)" fw={700} lh={1} c="emerald">
                  {stats.correct}
                </Text>
                <Text size="clamp(0.7rem, 3vw, 1.2rem)" c="dimmed">
                  Richtig insgesamt {stats.correct > 0 && "(klicken)"}
                </Text>
              </Box>
            </Grid.Col>
          </Tooltip>
          <Tooltip
            label={ stats.wrong > 0 && "Falsch beantwortete Fragen überprüfen." }
            withArrow
          >
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box
                style={{ cursor: stats.wrong > 0 ? "pointer" : "default" }}
                onClick={() => stats.wrong > 0 && navigate("/review-incorrect")}
              >
                <Text size="clamp(2rem, 8vw, 3rem)" fw={700} lh={1} c="red">
                  {stats.wrong}
                </Text>
                <Text size="clamp(0.7rem, 3vw, 1.2rem)" c="dimmed">
                  Falsch insgesamt {stats.wrong > 0 && "(klicken)"}
                </Text>
              </Box>
            </Grid.Col>
          </Tooltip>
        </Grid>
      </Paper>

      {/* Modus wählen */}
      <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <ThemeIcon size="lg" variant="light">
              <GraduationCap />
            </ThemeIcon>
            <Title order={2} size="h3">
              Modus wählen
            </Title>
          </Group>
          {/* <Badge variant="light" radius="sm">
            Wichtig
          </Badge> */}
        </Group>

        <Divider
          label="Bitte wähle einen Modus"
          labelPosition="left"
          my="md"
          variant="dashed"
        />

        <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
          {/* Actions */}
          <Stack gap="sm" style={{ minWidth: 220 }}>
            <Tooltip label="Alle Fragen und Antworten anzeigen" withArrow>
              <Button
                onClick={handleLearnMode}
                size="xl"
                variant="default"
                leftSection={<LibraryBig size={18} />}
              >
                Learn Mode
              </Button>
            </Tooltip>

            <Tooltip
              label={
                actualQuizSize > 0
                  ? `Startet ein Quiz mit ${actualQuizSize} Fragen`
                  : "Keine verfügbaren Fragen (siehe Einstellungen)"
              }
              withArrow
            >
              <Button
                onClick={handleStartQuiz}
                size="xl"
                variant="filled"
                leftSection={<ListTodo size={18} />}
                disabled={actualQuizSize === 0}
              >
                Quiz Mode ({actualQuizSize})
              </Button>
            </Tooltip>

            {/* <Text size="xs" c="dimmed">
              Learn Mode: ohne Timer, freies Üben.
            </Text> */}
          </Stack>

          {/* Quiz-only settings */}
          <Fieldset
            legend="Quiz-Einstellungen"
            style={{
              minWidth: isXs ? 150 : 330,
              maxWidth: 420,
              flex: 1,
            }}
          >
            <Stack gap="sm">
              <Group align="center" gap="sm" justify="space-between">
                <Group gap={6}>
                  <Clock2 size={16} />
                  <Text size="sm" c="dimmed">
                    Quiz-Dauer (Minuten)
                  </Text>
                </Group>
                <NumberInput
                  min={0}
                  value={quizDuration}
                  onChange={(value) => setQuizDuration(value || 0)}
                  w={110}
                  size="sm"
                />
              </Group>

              <Group align="flex-start" justify="space-between">
                <Stack gap={2} style={{ flex: 1 }}>
                  <Group gap={6}>
                    <FunnelX size={16} />
                    <Text size="sm" c="dimmed">
                      Richtige Antworten ausschließen
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Quiz enthält nur falsch oder nicht beantwortete Fragen.
                  </Text>
                </Stack>

                <Switch
                  checked={excludeCorrect}
                  onChange={(e) => setExcludeCorrect(e.currentTarget.checked)}
                  size="sm"
                  onLabel="ON"
                  offLabel="OFF"
                  style={{ cursor: "pointer" }}
                  aria-label="Richtige Antworten ausschließen"
                />
              </Group>

              {excludeCorrect && actualQuizSize === 0 && (
                <Text size="xs" c="green" ta="left">
                  🎉 Alle Fragen richtig beantwortet! Nichts mehr zu quizen.
                </Text>
              )}
            </Stack>
          </Fieldset>
        </Group>
      </Paper>
      {/* <Paper withBorder p="xl" radius="lg" shadow="sm">
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
      </Paper> */}
    </Stack>
  );
}
