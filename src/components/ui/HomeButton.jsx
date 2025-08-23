import { Button, ActionIcon, Group } from "@mantine/core";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HomeButton() {
  const navigate = useNavigate();
  return (
    <Group gap="sm">
      <Button
        onClick={() => navigate("/")}
        variant="default"
        leftSection={<Home size={18} />}
        visibleFrom="sm"
      >
        Home
      </Button>
      <ActionIcon
        onClick={() => navigate("/")}
        variant="default"
        size="lg"
        hiddenFrom="sm"
      >
        <Home size={18} />
      </ActionIcon>
    </Group>
  );
}
