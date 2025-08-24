import { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Text,
  Paper,
  Group,
  Switch,
  Loader,
  Alert,
  Badge,
} from "@mantine/core";
import { Brain, Languages } from "lucide-react";
import { aiExplanationService } from "../services/aiExplanations";
import { useAI } from "../contexts/AIContext";

export function AIExplanation({
  question,
  options,
  correctIndex,
  userIndex = null,
  disabled = false,
}) {
  const { isModelReady, isModelLoading } = useAI();
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState(() => {
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("aiExplanationLanguage="));
    return saved ? saved.split("=")[1] : "de";
  });
  const [hasExplanation, setHasExplanation] = useState(false);
  const lastGeneratedFor = useRef(null);

  const handleGenerateExplanation = useCallback(async () => {
    if (isLoading) return; // prevent overlap
    if (!question || !options || correctIndex === undefined) {
      return;
    }

    const key = `${question?.id || "unknown"}-${userIndex}-${language}`;
    // mark BEFORE awaiting so rerenders don't retrigger
    lastGeneratedFor.current = {
      questionId: question?.id || "unknown",
      userIndex,
      language,
    };
    console.log(
      `Generating explanation in language: ${language}, userIndex: ${userIndex}`
    );

    setIsLoading(true);
    setError("");

    try {
      const result = await aiExplanationService.generateExplanation(
        question.question || question,
        question.options || options,
        correctIndex,
        userIndex,
        language
      );

      console.log(
        `Generated explanation in ${language}:`,
        result.substring(0, 50) + "..."
      );

      setExplanation(result);
      setHasExplanation(true);
      // lastGeneratedFor.current = {
      //   questionId: question?.id || "unknown",
      //   userIndex,
      //   language,
      // };
    } catch (err) {
      console.error("AI explanation failed:", err);

      // More specific error messages based on the error
      let errorMessage;
      if (
        err.message.includes("AI model not available") ||
        err.message.includes("not properly initialized")
      ) {
        errorMessage =
          language === "de"
            ? "KI-Modell nicht verfügbar"
            : "AI model not available";
      } else if (err.message.includes("timeout")) {
        errorMessage =
          language === "de"
            ? "Anfrage-Timeout (Modell überlastet)"
            : "Request timeout (model overloaded)";
      } else if (err.message.includes("became unavailable")) {
        errorMessage =
          language === "de"
            ? "KI-Modell wurde unterbrochen"
            : "AI model was interrupted";
      } else if (err.message.includes("too short or empty")) {
        errorMessage =
          language === "de"
            ? "Unvollständige Antwort erhalten"
            : "Incomplete response received";
      } else if (err.message.includes("Image questions not supported")) {
        errorMessage =
          language === "de"
            ? "KI-Erklärungen für Bildfragen noch nicht verfügbar"
            : "AI explanations not available for image questions";
      } else {
        errorMessage =
          language === "de"
            ? "Erklärung konnte nicht generiert werden"
            : "Could not generate explanation";
      }

      setError(errorMessage);
      setExplanation("");
      setHasExplanation(false);
    } finally {
      setIsLoading(false);
    }
  }, [question?.id, options, correctIndex, userIndex, language, isLoading]);

  // Auto-generate explanation when option is selected or question/language changes
  useEffect(() => {
    if (userIndex !== null && !disabled) {
      const currentKey = `${
        question?.id || "unknown"
      }-${userIndex}-${language}`;
      const lastKey = lastGeneratedFor.current
        ? `${lastGeneratedFor.current.questionId}-${lastGeneratedFor.current.userIndex}-${lastGeneratedFor.current.language}`
        : "";

      if (currentKey !== lastKey && !isLoading) {
        handleGenerateExplanation();
      }
    }
  }, [userIndex, question?.id, language, disabled, isLoading]);

  const toggleLanguage = () => {
    if (isLoading) return; // Don't allow language switching while loading

    const newLanguage = language === "de" ? "en" : "de";

    // Save preference to cookie (expires in 1 year)
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    document.cookie = `aiExplanationLanguage=${newLanguage}; expires=${expiry.toUTCString()}; path=/`;

    // Clear current explanation and error immediately
    setExplanation("");
    setHasExplanation(false);
    setError("");

    // Update language - this will trigger useEffect to regenerate
    setLanguage(newLanguage);
  };

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      bg="light-dark(gray.0, var(--mantine-color-dark-9))"
      style={{ marginTop: "1rem" }}
    >
      <Group justify="space-between" align="center" mb="sm">
        <Group gap="xs">
          <Brain size={16} />
          <Text size="sm" fw={500}>
            {language === "de" ? "KI-Erklärung (Beta)" : "AI Explanation (Beta)"}
          </Text>
          {isModelReady && (
            <Badge size="xs" color="green" variant="light">
              {language === "de" ? "Bereit" : "Ready"}
            </Badge>
          )}
          {isModelLoading && (
            <Badge size="xs" color="blue" variant="light">
              {language === "de" ? "Lädt..." : "Loading..."}
            </Badge>
          )}
        </Group>

        <Group gap="sm">
          <Group gap="xs" align="center">
            <Text size="xs" c="dimmed">
              DE
            </Text>
            <Switch
              size="sm"
              checked={language === "en"}
              onChange={toggleLanguage}
              disabled={isLoading || isModelLoading}
              color="blue"
            />
            <Text size="xs" c="dimmed">
              EN
            </Text>
            <Languages size={14} />
          </Group>

          {/* Only show button in learn mode or if no auto-generation */}
          {(userIndex === null || !hasExplanation) && (
            <Button
              size="xs"
              variant="light"
              onClick={handleGenerateExplanation}
              disabled={disabled || isLoading || isModelLoading}
              leftSection={
                isLoading ? <Loader size={12} /> : <Brain size={12} />
              }
            >
              {isLoading
                ? language === "de"
                  ? "Generiere..."
                  : "Generating..."
                : language === "de"
                ? "Erklären"
                : "Explain"}
            </Button>
          )}
        </Group>
      </Group>

      {isLoading && (
        <Group gap="xs" align="center">
          <Loader size="sm" />
          <Text size="sm" c="dimmed" style={{ fontStyle: "italic" }}>
            {aiExplanationService.getLoadingMessage(language)}
          </Text>
        </Group>
      )}

      {error && !isLoading && (
        <Alert
          color="orange"
          variant="light"
          size="sm"
          icon={<Brain size={14} />}
        >
          <Group justify="space-between" align="center">
            <Text size="sm">{error}</Text>
            <Button
              size="xs"
              variant="subtle"
              color="orange"
              onClick={() => {
                setError("");
                handleGenerateExplanation();
              }}
            >
              {language === "de" ? "Erneut versuchen" : "Try again"}
            </Button>
          </Group>
        </Alert>
      )}

      {explanation && !isLoading && (
        <>
          <Paper p="sm" bg="white, var(--mantine-color-gray-9))" radius="sm" withBorder>
            <Group justify="space-between" align="flex-start" mb="xs">
              <Text size="sm" lh={1.6} style={{ flex: 1 }}>
                {explanation}
              </Text>
              <Badge
                size="xs"
                variant="light"
                color={language === "de" ? "blue" : "green"}
              >
                {language.toUpperCase()}
              </Badge>
            </Group>
          </Paper>
          <Text size="xs" c="dimmed" ta="center" mt="xs" style={{ fontStyle: "italic" }}>
            {language === "de" 
              ? "⚠️ KI-Erklärungen können fehlerhaft sein. Fakten bitte überprüfen."
              : "⚠️ AI can be wrong sometimes. Please verify factual information."
            }
          </Text>
        </>
      )}
    </Paper>
  );
}
