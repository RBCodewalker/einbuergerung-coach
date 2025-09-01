import { useMemo, useRef, useEffect } from "react";
import { gsap } from "gsap";
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
  Tabs,
  RingProgress,
  SimpleGrid,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../contexts/QuizContext";
import { useMediaQuery } from "@mantine/hooks";
import { Clock2, FunnelX, GraduationCap, LibraryBig, ListTodo, Flag, TrendingUp, Play, Target, Award, BookOpen, Zap, Settings, Info } from "lucide-react";
import { AIModelStatus } from "../components/AIModelStatus";
import { StorageDebug } from "../components/StorageDebug";
import { AnimatedRingProgress } from "../components/AnimatedRingProgress";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { AnimatedStatsCard } from "../components/AnimatedStatsCard";
import { AnimatedModeCard } from "../components/AnimatedModeCard";

export function DashboardPage() {
  const {
    learnSet,
    enhancedLearnSet,
    stats,
    startNewQuiz,
    quizDuration,
    setQuizDuration,
    excludeCorrect,
    setExcludeCorrect,
    getFlaggedQuestions,
  } = useQuiz();

  const navigate = useNavigate();

  // Memoized thumb icons to prevent re-rendering
  const thumbIcons = useMemo(() => ({
    active: <FunnelX size={12} color="var(--mantine-color-orange-6)" />,
    inactive: <Target size={12} color="var(--mantine-color-gray-6)" />
  }), []);

  // Memoized switch handler to prevent re-renders
  const handleExcludeCorrectChange = useMemo(() => 
    (e) => setExcludeCorrect(e.currentTarget.checked),
    [setExcludeCorrect]
  );

  // Memoized switch styles to prevent re-renders
  const switchStyles = useMemo(() => ({
    input: { cursor: "pointer" },
    label: { cursor: "pointer" }
  }), []);

  // Memoized grid and style objects to prevent re-renders
  const gridConfigs = useMemo(() => ({
    progressGrid: { base: 1, md: 2 },
    statsGrid: { base: 2, md: 4 },
    modesGrid: { base: 1, md: 2 },
    settingsGrid: { base: 1, sm: 2 }
  }), []);

  const commonStyles = useMemo(() => ({
    centerText: { textAlign: "center" },
    pointer: { cursor: "pointer" },
    pointerWithTransition: { 
      cursor: "pointer",
      transition: "transform 0.2s ease"
    }
  }), []);

  // Memoized tooltip events to prevent re-renders
  const tooltipEvents = useMemo(() => ({
    disabled: { hover: false, focus: false, touch: false }
  }), []);

  // Move dynamic styles after calculations

  // Memoized mode card styles
  const modeCardStyles = useMemo(() => ({
    learnMode: {
      cursor: "pointer",
      transition: "all 0.3s ease",
      background: 'light-dark(linear-gradient(135deg, var(--mantine-color-emerald-0) 0%, var(--mantine-color-green-0) 100%), linear-gradient(135deg, var(--mantine-color-emerald-9) 0%, var(--mantine-color-green-9) 100%))'
    },
    quizMode: (isEnabled) => ({
      cursor: isEnabled ? "pointer" : "default",
      transition: "all 0.3s ease",
      background: isEnabled 
        ? 'light-dark(linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-cyan-0) 100%), linear-gradient(135deg, var(--mantine-color-blue-9) 0%, var(--mantine-color-cyan-9) 100%))'
        : 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
      opacity: isEnabled ? 1 : 0.6
    })
  }), []);

  const { colorScheme } = useMantineColorScheme();
  const isXs = useMediaQuery('(max-width: 450px)');

  const handleStartQuiz = () => {
    startNewQuiz();
    navigate("/quiz/1");
  };

  const handleLearnMode = () => {
    navigate("/lernen/themenbereiche");
  };

  // Memoized calculations to prevent excessive re-renders
  const calculations = useMemo(() => {
    // Calculate available questions for quiz (use enhanced learn set for total count)
    const totalQuestions = enhancedLearnSet?.length || learnSet.length;
    const availableQuestionsCount = excludeCorrect
      ? (enhancedLearnSet || learnSet).filter((q) => !stats?.correctAnswers?.[q.id]).length
      : totalQuestions;

    const actualQuizSize = Math.min(33, availableQuestionsCount);

    // Get flagged questions count (with fallback for backward compatibility)
    const { totalFlagged } = getFlaggedQuestions() || { totalFlagged: 0 };

    // Calculate additional stats for visual representation
    const attemptedCount = Object.keys(stats.attempted).length;
    const unattemptedCount = totalQuestions - attemptedCount;
    
    // Data validation and sanitization
    const actualCorrect = Object.keys(stats.correctAnswers || {}).length;
    const actualWrong = Object.keys(stats.incorrectAnswers || {}).length;
    const actualAttempted = Object.keys(stats.attempted || {}).length;
    
    // Validate data consistency
    const maxPossibleCorrect = Math.min(actualAttempted, actualCorrect);
    const sanitizedCorrect = Math.min(stats.correct, maxPossibleCorrect, actualCorrect);
    
    // Debug logging to track issues
    if (stats.correct !== actualCorrect || stats.wrong !== actualWrong || attemptedCount !== actualAttempted) {
      console.warn('Stats inconsistency detected:', {
        stored: { correct: stats.correct, wrong: stats.wrong, attempted: attemptedCount },
        actual: { correct: actualCorrect, wrong: actualWrong, attempted: actualAttempted },
        totalQuestions,
        willUseCorrect: sanitizedCorrect
      });
    }
    
    // Calculate percentages with sanitized data
    const safeAttemptedCount = Math.max(actualAttempted, sanitizedCorrect + actualWrong);
    const progressPercentage = totalQuestions > 0 ? Math.min(100, Math.round((safeAttemptedCount / totalQuestions) * 100)) : 0;
    const accuracyPercentage = safeAttemptedCount > 0 ? Math.min(100, Math.round((sanitizedCorrect / safeAttemptedCount) * 100)) : 0;

    return {
      totalQuestions,
      availableQuestionsCount,
      actualQuizSize,
      totalFlagged,
      attemptedCount: safeAttemptedCount,
      unattemptedCount: totalQuestions - safeAttemptedCount,
      progressPercentage,
      accuracyPercentage,
      sanitizedCorrect,
      actualCorrect,
      actualWrong
    };
  }, [enhancedLearnSet, learnSet, excludeCorrect, stats, getFlaggedQuestions]);

  const {
    totalQuestions,
    availableQuestionsCount,
    actualQuizSize,
    totalFlagged,
    attemptedCount,
    unattemptedCount,
    progressPercentage,
    accuracyPercentage,
    sanitizedCorrect,
    actualCorrect,
    actualWrong
  } = calculations;

  // Memoized dynamic styles based on sanitized stats
  const dynamicStyles = useMemo(() => ({
    correctPaper: {
      textAlign: "center",
      cursor: sanitizedCorrect > 0 ? "pointer" : "default",
      transition: "transform 0.2s ease"
    },
    wrongPaper: {
      textAlign: "center", 
      cursor: actualWrong > 0 ? "pointer" : "default",
      transition: "transform 0.2s ease"
    }
  }), [sanitizedCorrect, actualWrong]);

  // Memoized event handlers with GSAP animations (defined after calculations to access actualQuizSize)
  const eventHandlers = useMemo(() => ({
    correctClick: () => sanitizedCorrect > 0 && navigate("/review-correct"),
    wrongClick: () => actualWrong > 0 && navigate("/review-incorrect"),
    correctMouseEnter: (e) => sanitizedCorrect > 0 && gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2, ease: "power2.out" }),
    correctMouseLeave: (e) => sanitizedCorrect > 0 && gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: "power2.out" }),
    wrongMouseEnter: (e) => actualWrong > 0 && gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2, ease: "power2.out" }),
    wrongMouseLeave: (e) => actualWrong > 0 && gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: "power2.out" }),
    learnMouseEnter: (e) => gsap.to(e.currentTarget, { y: -4, duration: 0.3, ease: "power2.out" }),
    learnMouseLeave: (e) => gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: "power2.out" }),
    quizMouseEnter: (e) => actualQuizSize > 0 && gsap.to(e.currentTarget, { y: -4, duration: 0.3, ease: "power2.out" }),
    quizMouseLeave: (e) => actualQuizSize > 0 && gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: "power2.out" }),
    quizClick: () => actualQuizSize > 0 && handleStartQuiz()
  }), [sanitizedCorrect, actualWrong, navigate, actualQuizSize, handleStartQuiz]);

  return (
    <Stack gap="xl">
      {/* AI Model Status */}
      <AIModelStatus />
      
      {/* Storage Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && <StorageDebug />}
      
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
                fontFamily: "Nunito, system-ui, -apple-system, sans-serif",
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
                fontFamily: "Nunito, system-ui, -apple-system, sans-serif",
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="loslegen" orientation="horizontal">
        <Tabs.List grow>
          <Tabs.Tab value="loslegen" leftSection={<Play size={16} />}>
            Loslegen
          </Tabs.Tab>
          <Tabs.Tab value="fortschritt" leftSection={<TrendingUp size={16} />}>
            Fortschritt
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="fortschritt" pt="lg">
          <Stack gap="xl">
            {/* Progress Overview with Visual Charts */}
            <Paper withBorder p="xl" radius="lg" shadow="sm">
              <Title order={2} size="h3" mb="xl" ta="center">
                Dein Lernfortschritt
              </Title>
              
              <SimpleGrid cols={gridConfigs.progressGrid} spacing="xl">
                {/* Overall Progress Ring */}
                <Center>
                  <Stack align="center" gap="md">
                    <AnimatedRingProgress
                      size={200}
                      thickness={16}
                      sections={[
                        { value: progressPercentage, color: 'blue', tooltip: `${attemptedCount} von ${totalQuestions} Fragen bearbeitet` }
                      ]}
                      delay={0.2}
                      label={
                        <Center>
                          <Stack align="center" gap={2}>
                            <Target size={32} color="var(--mantine-color-blue-6)" />
                            <AnimatedNumber value={progressPercentage} delay={0.5} suffix="%" />
                            <Text size="sm" c="dimmed" ta="center">Fortschritt</Text>
                          </Stack>
                        </Center>
                      }
                    />
                    {/* <Text size="sm" c="dimmed" ta="center" fw={500}>
                      <AnimatedNumber value={attemptedCount} delay={0.7} size="sm" fw={500} /> von {totalQuestions} Fragen bearbeitet
                    </Text> */}
                  </Stack>
                </Center>

                {/* Accuracy Ring */}
                <Center>
                  <Stack align="center" gap="md">
                    <AnimatedRingProgress
                      size={200}
                      thickness={16}
                      sections={[
                        { value: accuracyPercentage, color: 'emerald', tooltip: `${accuracyPercentage}% richtig beantwortet` }
                      ]}
                      delay={0.4}
                      label={
                        <Center>
                          <Stack align="center" gap={2}>
                            <Award size={32} color="var(--mantine-color-emerald-6)" />
                            <AnimatedNumber value={accuracyPercentage} delay={0.7} suffix="%" />
                            <Text size="sm" c="dimmed" ta="center">Erfolgsrate</Text>
                          </Stack>
                        </Center>
                      }
                    />
                    <Text size="sm" c="dimmed" ta="center" fw={500}>
                      {/* {attemptedCount > 0 ? (
                        <>
                          <AnimatedNumber value={sanitizedCorrect} delay={0.9} size="sm" fw={500} /> von <AnimatedNumber value={attemptedCount} delay={1.0} size="sm" fw={500} /> richtig
                        </>
                      ) : 'Noch keine Fragen beantwortet'} */}
                    </Text>
                  </Stack>
                </Center>
              </SimpleGrid>
            </Paper>

            {/* Detailed Stats Grid */}
            <SimpleGrid cols={gridConfigs.statsGrid} spacing="lg">
              <AnimatedStatsCard
                icon={<BookOpen size={24} />}
                iconColor="blue"
                value={attemptedCount}
                label="Bearbeitet"
                delay={0.1}
              />

              <Tooltip
                label="Richtig beantwortete Fragen anzeigen"
                withArrow
                events={stats.correct > 0 ? undefined : tooltipEvents.disabled}
              >
                <AnimatedStatsCard
                  icon={<Award size={24} />}
                  iconColor="emerald"
                  value={sanitizedCorrect}
                  label="Richtig"
                  color="emerald"
                  delay={0.2}
                  onClick={eventHandlers.correctClick}
                  onMouseEnter={eventHandlers.correctMouseEnter}
                  onMouseLeave={eventHandlers.correctMouseLeave}
                  style={dynamicStyles.correctPaper}
                />
              </Tooltip>

              <Tooltip
                label="Falsch beantwortete Fragen anzeigen"
                withArrow
                events={stats.wrong > 0 ? undefined : tooltipEvents.disabled}
              >
                <AnimatedStatsCard
                  icon={<Target size={24} />}
                  iconColor="red"
                  value={actualWrong}
                  label="Falsch"
                  color="red"
                  delay={0.3}
                  onClick={eventHandlers.wrongClick}
                  onMouseEnter={eventHandlers.wrongMouseEnter}
                  onMouseLeave={eventHandlers.wrongMouseLeave}
                  style={dynamicStyles.wrongPaper}
                />
              </Tooltip>

              <AnimatedStatsCard
                icon={<TrendingUp size={24} />}
                iconColor="gray"
                value={stats.totalSessions}
                label="Quiz-Sessions"
                delay={0.4}
              />
            </SimpleGrid>

            {/* Flagged Questions Section */}
            {totalFlagged > 0 && (
              <Paper withBorder p="xl" radius="lg" shadow="sm">
                <Group justify="space-between" align="center" mb="sm">
                  <Group gap="xs">
                    <ThemeIcon size="lg" variant="light" color="yellow">
                      <Flag />
                    </ThemeIcon>
                    <Title order={2} size="h3">
                      Markierte Fragen
                    </Title>
                  </Group>
                  <Badge variant="light" color="yellow" size="lg">
                    {totalFlagged}
                  </Badge>
                </Group>

                <Divider
                  label="Wichtige Fragen zum Wiederholen"
                  labelPosition="left"
                  my="md"
                  variant="dashed"
                />

                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                    Du hast {totalFlagged} Frage{totalFlagged !== 1 ? 'n' : ''} als wichtig markiert. 
                    Diese kannst du hier wiederholen und verwalten.
                  </Text>
                  <Button
                    onClick={() => navigate("/review-flagged")}
                    variant="light"
                    color="yellow"
                    leftSection={<Flag size={16} />}
                  >
                    Markierte Fragen ansehen
                  </Button>
                </Group>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="loslegen" pt="lg">
          <Stack gap="xl">
            {/* Learning Modes Section */}
            <Paper withBorder p="xl" radius="lg" shadow="sm">
              <Group justify="center" align="center" mb="lg">
                <ThemeIcon size="xl" variant="light" color="blue">
                  <GraduationCap size={28} />
                </ThemeIcon>
                <Title order={1} size="h3">
                  Wähle deinen Lernmodus
                </Title>
              </Group>

              <SimpleGrid cols={gridConfigs.progressGrid} spacing="xl">
                {/* Learn Mode Card */}
                <AnimatedModeCard
                  icon={<LibraryBig size={isXs ? 32 : 40} />}
                  iconColor="emerald"
                  title="Lern-Modus"
                  badgeText="Entspannt lernen"
                  badgeColor="emerald"
                  description={
                    <>
                      Lerne nach <Text span fw={600}>Themenbereichen</Text> organisiert. 
                      Wähle gezielt Kategorien aus und tracke deinen Fortschritt.
                    </>
                  }
                  features={[
                    { icon: <Zap size={12} />, text: "Thematisch organisiert", color: "emerald" },
                    { icon: <BookOpen size={12} />, text: "Gezieltes Lernen", color: "emerald" }
                  ]}
                  buttonText="Themenbereiche"
                  buttonIcon={<LibraryBig size={20} />}
                  buttonColor="emerald"
                  buttonVariant="light"
                  style={modeCardStyles.learnMode}
                  onClick={handleLearnMode}
                  onMouseEnter={eventHandlers.learnMouseEnter}
                  onMouseLeave={eventHandlers.learnMouseLeave}
                  delay={0.2}
                />

                {/* Quiz Mode Card */}
                <AnimatedModeCard
                  icon={<ListTodo size={isXs ? 32 : 40} />}
                  iconColor={actualQuizSize > 0 ? "blue" : "gray"}
                  title="Quiz-Modus"
                  badgeText={actualQuizSize > 0 ? "Prüfung simulieren" : "Nicht verfügbar"}
                  badgeColor={actualQuizSize > 0 ? "blue" : "gray"}
                  description={
                    <>
                      Simuliere die echte Prüfung mit <Text span fw={600}>{actualQuizSize} zufälligen Fragen</Text>. 
                      {actualQuizSize > 0 ? "Teste dein Wissen unter realen Bedingungen." : "Siehe Einstellungen unten."}
                    </>
                  }
                  features={[
                    { icon: <Target size={12} />, text: "Prüfungsformat", color: actualQuizSize > 0 ? "blue" : "gray" },
                    { icon: <Clock2 size={12} />, text: "Optional mit Timer", color: actualQuizSize > 0 ? "blue" : "gray" }
                  ]}
                  buttonText={actualQuizSize > 0 ? `Quiz starten (${actualQuizSize})` : "Nicht verfügbar"}
                  buttonIcon={<ListTodo size={20} />}
                  buttonColor={actualQuizSize > 0 ? "blue" : "gray"}
                  buttonVariant="filled"
                  isEnabled={actualQuizSize > 0}
                  style={modeCardStyles.quizMode(actualQuizSize > 0)}
                  onClick={eventHandlers.quizClick}
                  onMouseEnter={eventHandlers.quizMouseEnter}
                  onMouseLeave={eventHandlers.quizMouseLeave}
                  delay={0.4}
                />
              </SimpleGrid>
            </Paper>

            {/* Quiz Settings Section - Separated and Enhanced */}
            <Paper withBorder p="xl" radius="lg" shadow="sm" style={{ background: 'light-dark(var(--mantine-color-light-0), var(--mantine-color-dark-6))' }}>
              <Group justify="space-between" align="center" mb="lg">
                <Group gap="sm">
                  <ThemeIcon size="lg" variant="filled" color="blue">
                    <Settings size={20} />
                  </ThemeIcon>
                  <Title order={2} size="h3">
                    Quiz-Einstellungen
                  </Title>
                </Group>
                {/* <Badge variant="light" color="blue" leftSection={<Info size={14} />}>
                  Nur für Quiz-Modus
                </Badge> */}
              </Group>

              {/* <Text size="sm" c="dimmed" mb="lg" ta="center" style={{ fontStyle: 'italic' }}>
                Diese Einstellungen gelten nur für den Quiz-Modus und werden automatisch gespeichert.
              </Text> */}

              <SimpleGrid cols={gridConfigs.settingsGrid} spacing="lg">
                {/* Timer Setting */}
                <Paper withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="blue" size="md">
                        <Clock2 size={18} />
                      </ThemeIcon>
                      <Text fw={600} size="md">Zeitlimit</Text>
                    </Group>
                    
                    <Text size="sm" c="dimmed">
                      Setze ein Zeitlimit für den gesamten Quiz. 0 = unbegrenzte Zeit.
                    </Text>
                    
                    <Group justify="space-between" align="center">
                      <Text size="sm" c="dimmed">Minuten:</Text>
                      <NumberInput
                        min={0}
                        max={120}
                        value={quizDuration}
                        onChange={(value) => setQuizDuration(value || 0)}
                        w={120}
                        size="md"
                        placeholder="0 = Unbegrenzt"
                      />
                    </Group>
                    
                    {quizDuration > 0 && (
                      <Text size="xs" c="blue" ta="center" fw={500}>
                        ⏱️ Timer läuft automatisch mit
                      </Text>
                    )}
                  </Stack>
                </Paper>

                {/* Filter Setting */}
                <Paper withBorder p="lg" radius="md">
                  <Stack gap="md">
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="orange" size="md">
                        <FunnelX size={18} />
                      </ThemeIcon>
                      <Text fw={600} size="md">Smart-Filter</Text>
                    </Group>
                    
                    <Text size="sm" c="dimmed">
                      Schließe bereits richtig beantwortete Fragen aus dem Quiz aus.
                    </Text>
                    
                    <Group justify="space-between" align="center">
                      <Text size="sm" c="dimmed">Nur schwere Fragen:</Text>
                      <Switch
                        checked={excludeCorrect}
                        onChange={handleExcludeCorrectChange}
                        size="lg"
                        color="orange"
                        styles={switchStyles}
                        thumbIcon={excludeCorrect ? thumbIcons.active : thumbIcons.inactive}
                      />
                    </Group>

                    {excludeCorrect && (
                      <Text size="xs" c="orange" ta="center" fw={500}>
                        🎯 Fokus auf schwere Fragen
                      </Text>
                    )}

                    {excludeCorrect && actualQuizSize === 0 && (
                      <Text size="xs" c="green" ta="center" fw={500}>
                        🎉 Alle Fragen beherrscht!
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </SimpleGrid>

              {/* Info Footer */}
              <Paper withBorder p="md" radius="md" mt="lg" bg="light-dark(var(--mantine-color-blue-0), var(--mantine-color-gray-9))">
                <Group gap="sm" justify="center">
                  <Info size={16} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" c="blue" ta="center">
                    <Text span fw={600}>Tipp:</Text> Starte mit dem Lern-Modus, dann teste dich mit dem Quiz-Modus
                  </Text>
                </Group>
              </Paper>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
