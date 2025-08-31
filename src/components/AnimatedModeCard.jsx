import { useEffect, useRef } from "react";
import {
  Paper,
  Stack,
  ThemeIcon,
  Title,
  Badge,
  Text,
  Group,
  Button,
} from "@mantine/core";
import { gsap } from "gsap";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { useIsMobile } from "../hooks/useIsMobile";

export function AnimatedModeCard({
  icon,
  iconColor,
  title,
  badgeText,
  badgeColor,
  description,
  features,
  buttonText,
  buttonIcon,
  buttonColor,
  buttonVariant = "light",
  isEnabled = true,
  delay = 0,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...paperProps
}) {
  const cardRef = useRef(null);
  const animationTriggered = useRef(false);
  const { targetRef, hasIntersected } = useIntersectionObserver();
  const isMobile = useIsMobile();

  const responsiveSizes = {
    iconSize: isMobile ? 60 : 80,
    titleSize: isMobile ? "h4" : "h3",
    badgeSize: isMobile ? "md" : "lg",
    textSize: isMobile ? "sm" : "md",
    buttonSize: isMobile ? "md" : "lg",
    featureIconSize: isMobile ? "xs" : "sm",
    featureTextSize: isMobile ? "xs" : "sm",
  };

  useEffect(() => {
    if (!cardRef.current || !hasIntersected || animationTriggered.current)
      return;
    animationTriggered.current = true;
    gsap.set(cardRef.current, { scale: 0.9, opacity: 0, y: 30 });
    gsap.to(cardRef.current, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay,
      ease: "back.out(1.2)",
    });
  }, [delay, hasIntersected]);

  useEffect(() => {
    if (cardRef.current && !animationTriggered.current) {
      gsap.set(cardRef.current, { scale: 0.9, opacity: 0, y: 30 });
    }
  }, []);

  return (
    <div ref={targetRef}>
      <Paper
        ref={cardRef}
        withBorder
        p="xl"
        radius="lg"
        shadow="md"
        style={{
          cursor: isEnabled && onClick ? "pointer" : "default",
          ...style,
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...paperProps}
      >
        <Stack gap={isMobile ? "md" : "lg"} align="center">
          <ThemeIcon
            size={responsiveSizes.iconSize}
            variant="light"
            color={iconColor}
            radius="xl"
          >
            {icon}
          </ThemeIcon>

        <Stack gap="sm" align="center">
          <Title order={2} size={responsiveSizes.titleSize} ta="center">
            {title}
          </Title>
          <Badge variant="light" color={badgeColor} size={responsiveSizes.badgeSize}>
            {badgeText}
          </Badge>
        </Stack>

          <Group gap={isMobile ? "md" : "lg"} justify="center">
            {features?.map((feature, index) => (
              <Group key={index} gap="xs">
                <ThemeIcon
                  size={responsiveSizes.featureIconSize}
                  variant="light"
                  color={feature.color || iconColor}
                >
                  {feature.icon}
                </ThemeIcon>
                <Text size={responsiveSizes.featureTextSize} c="dimmed">
                  {feature.text}
                </Text>
              </Group>
            ))}
          </Group>

          <Button
            size={responsiveSizes.buttonSize}
            variant={buttonVariant}
            color={buttonColor}
            fullWidth
            leftSection={buttonIcon}
            disabled={!isEnabled}
          >
            {buttonText}
          </Button>
        </Stack>
      </Paper>
    </div>
  );
}
