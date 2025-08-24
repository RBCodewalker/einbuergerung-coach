import { Button, Group, Badge, Text } from "@mantine/core";
import { Check, X } from "lucide-react";
import { ANSWER_LABELS } from "../constants";

export function QuizOption({
  option,
  index,
  isSelected,
  isCorrect,
  showResult,
  onSelect,
}) {
  return (
    <div style={{ transform: "scale(1)", transition: "transform 0.1s ease" }}>
      <Button
        onClick={() => onSelect(index)}
        variant={isSelected ? (isCorrect ? "light" : "light") : "default"}
        color={isSelected ? (isCorrect ? "emerald" : "red") : "gray"}
        justify="flex-start"
        fullWidth
        p="md"
        h="auto"
        // let the button shrink and the label wrap
        styles={{
          label: {
            whiteSpace: "normal",
            lineHeight: 1.4,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            minWidth: 0, // critical for shrinking in flex
            width: "100%", // so children (Group) get full line
          },
        }}
        style={{
          textAlign: "left",
          transform: "scale(1)",
          transition: "transform 0.1s ease",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Group gap="md" w="100%" style={{ minWidth: 0 }}>
          <Badge
            variant="outline"
            size="sm"
            color={isSelected ? (isCorrect ? "emerald" : "red") : "gray"}
            // prevent badge from forcing overflow
            style={{ flexShrink: 0 }}
          >
            {ANSWER_LABELS[index]}
          </Badge>

          <Text
            flex={1}
            style={{
              minWidth: 0, // allows shrinking next to Badge/icons
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {option}
          </Text>

          {showResult &&
            isSelected &&
            (isCorrect ? <Check size={18} /> : <X size={18} />)}
        </Group>
      </Button>
    </div>
  );
}
