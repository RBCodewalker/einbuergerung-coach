import { Component } from 'react';
import { Stack, Title, Text, Button, Paper } from '@mantine/core';
import { Home, AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  componentDidMount() {
    // Listen for window focus to detect when user returns from another tab
    window.addEventListener('focus', this.handleWindowFocus);
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', this.handlePopState);
  }

  componentWillUnmount() {
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('popstate', this.handlePopState);
  }

  handleWindowFocus = () => {
    // Check if we're on a page that might have server errors
    const currentPath = window.location.pathname;
    if (currentPath.includes('/quiz/') || currentPath.includes('/learn/')) {
      // Check if the page content is showing a server error
      const bodyText = document.body.textContent || '';
      if (bodyText.includes('404: NOT_FOUND') || bodyText.includes('Code: NOT_FOUND')) {
        // Redirect to home page to avoid the server error
        window.location.href = '/';
      }
    }
  };

  handlePopState = () => {
    // Clear error state when navigating
    if (this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Stack align="center" justify="center" style={{ minHeight: '60vh' }} gap="xl">
          <Paper withBorder p="xl" radius="lg" shadow="sm" style={{ textAlign: 'center' }}>
            <Stack gap="lg" align="center">
              <AlertCircle size={64} color="var(--mantine-color-red-6)" />
              
              <Stack gap="sm" align="center">
                <Title order={1} size="h2">
                  Etwas ist schiefgelaufen
                </Title>
                <Text c="dimmed" size="lg">
                  Es gab ein Problem beim Laden der Seite. Versuche es erneut oder kehre zur Startseite zurück.
                </Text>
              </Stack>
              
              <Stack gap="sm">
                <Button
                  onClick={() => window.location.reload()}
                  leftSection={<RefreshCw size={16} />}
                  variant="filled"
                >
                  Seite neu laden
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  leftSection={<Home size={16} />}
                  variant="outline"
                >
                  Zur Startseite
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;