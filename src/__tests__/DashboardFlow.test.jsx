import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';

// Mock comprehensive dashboard functionality
describe('Dashboard Flow', () => {
  const TestWrapper = ({ children }) => (
    <MantineProvider>{children}</MantineProvider>
  );

  // Mock dashboard with full functionality
  const DashboardMock = ({ 
    stats = { attempted: 0, correct: 0, wrong: 0, total: 300 },
    onStartQuiz,
    onStartLearn,
    onReviewCorrect,
    onReviewIncorrect,
    onSettingsChange
  }) => {
    const [quizDuration, setQuizDuration] = React.useState(60);
    const [excludeCorrect, setExcludeCorrect] = React.useState(false);
    const [theme, setTheme] = React.useState('light');

    const availableQuestions = excludeCorrect 
      ? stats.total - stats.correct 
      : stats.total;

    const actualQuizSize = Math.min(33, availableQuestions);

    const handleQuizDurationChange = (value) => {
      setQuizDuration(value);
      onSettingsChange?.({ quizDuration: value, excludeCorrect, theme });
    };

    const handleExcludeCorrectChange = (checked) => {
      setExcludeCorrect(checked);
      onSettingsChange?.({ quizDuration, excludeCorrect: checked, theme });
    };

    const handleThemeToggle = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      onSettingsChange?.({ quizDuration, excludeCorrect, theme: newTheme });
    };

    return (
      <div>
        {/* Branding */}
        <div>
          <img 
            src={`/icons/einbu-coach-${theme}.png`} 
            alt="Einbürgerungstest Coach Icon"
            style={{ width: '100px' }}
          />
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 8vw, 3.5rem)', 
            color: theme === 'dark' ? 'white' : 'black' 
          }}>
            EINBÜRGERUNGSTEST
          </h1>
          <h2 style={{ 
            fontSize: 'clamp(1rem, 6vw, 2.5rem)', 
            color: '#e74c3c' 
          }}>
            COACH
          </h2>
        </div>

        {/* Statistics */}
        <div>
          <div>
            <span style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
              {stats.attempted}/{stats.total}
            </span>
            <div>Fragen gequizzt</div>
          </div>
          
          <div 
            onClick={() => stats.correct > 0 && onReviewCorrect?.()}
            style={{ cursor: stats.correct > 0 ? 'pointer' : 'default' }}
          >
            <span style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', color: 'green' }}>
              {stats.correct}
            </span>
            <div>Richtig insgesamt {stats.correct > 0 && '(klicken)'}</div>
          </div>
          
          <div 
            onClick={() => stats.wrong > 0 && onReviewIncorrect?.()}
            style={{ cursor: stats.wrong > 0 ? 'pointer' : 'default' }}
          >
            <span style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', color: 'red' }}>
              {stats.wrong}
            </span>
            <div>Falsch insgesamt {stats.wrong > 0 && '(klicken)'}</div>
          </div>
        </div>

        {/* Mode Selection */}
        <div>
          <h2>Modus wählen</h2>
          
          <div>
            <button onClick={() => onStartLearn?.()}>
              Learn Mode
            </button>
            
            <button 
              onClick={() => onStartQuiz?.()}
              disabled={actualQuizSize === 0}
            >
              Quiz Mode ({actualQuizSize})
            </button>
          </div>
        </div>

        {/* Quiz Settings */}
        <div>
          <h3>Quiz-Einstellungen</h3>
          
          <div>
            <label>Quiz-Dauer (Minuten)</label>
            <input 
              type="number" 
              value={quizDuration}
              onChange={(e) => handleQuizDurationChange(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={excludeCorrect}
                onChange={(e) => handleExcludeCorrectChange(e.target.checked)}
              />
              Richtige Antworten ausschließen
            </label>
            <div>Quiz enthält nur falsch oder nicht beantwortete Fragen.</div>
            
            {excludeCorrect && actualQuizSize === 0 && (
              <div style={{ color: 'green' }}>
                🎉 Alle Fragen richtig beantwortet! Nichts mehr zu quizen.
              </div>
            )}
          </div>
        </div>

        {/* Theme Toggle */}
        <button onClick={handleThemeToggle}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>
    );
  };

  describe('Dashboard Rendering', () => {
    it('should render branding and main elements', () => {
      render(
        <TestWrapper>
          <DashboardMock />
        </TestWrapper>
      );

      expect(screen.getByText('EINBÜRGERUNGSTEST')).toBeInTheDocument();
      expect(screen.getByText('COACH')).toBeInTheDocument();
      expect(screen.getByAltText('Einbürgerungstest Coach Icon')).toBeInTheDocument();
      expect(screen.getByText('Modus wählen')).toBeInTheDocument();
    });

    it('should display statistics correctly', () => {
      const mockStats = {
        attempted: 50,
        correct: 35, 
        wrong: 15,
        total: 300
      };

      render(
        <TestWrapper>
          <DashboardMock stats={mockStats} />
        </TestWrapper>
      );

      expect(screen.getByText('50/300')).toBeInTheDocument();
      expect(screen.getByText('Fragen gequizzt')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('Richtig insgesamt (klicken)')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Falsch insgesamt (klicken)')).toBeInTheDocument();
    });

    it('should show mode selection buttons', () => {
      render(
        <TestWrapper>
          <DashboardMock />
        </TestWrapper>
      );

      expect(screen.getByText('Learn Mode')).toBeInTheDocument();
      expect(screen.getByText('Quiz Mode (33)')).toBeInTheDocument();
    });
  });

  describe('Statistics Interaction', () => {
    it('should handle clicking correct stats when available', async () => {
      const mockOnReviewCorrect = jest.fn();
      const user = userEvent.setup();
      
      const statsWithCorrect = { attempted: 10, correct: 5, wrong: 2, total: 300 };

      render(
        <TestWrapper>
          <DashboardMock 
            stats={statsWithCorrect}
            onReviewCorrect={mockOnReviewCorrect}
          />
        </TestWrapper>
      );

      await user.click(screen.getByText('Richtig insgesamt (klicken)').closest('div'));
      expect(mockOnReviewCorrect).toHaveBeenCalled();
    });

    it('should handle clicking wrong stats when available', async () => {
      const mockOnReviewIncorrect = jest.fn();
      const user = userEvent.setup();
      
      const statsWithWrong = { attempted: 10, correct: 3, wrong: 4, total: 300 };

      render(
        <TestWrapper>
          <DashboardMock 
            stats={statsWithWrong}
            onReviewIncorrect={mockOnReviewIncorrect}
          />
        </TestWrapper>
      );

      await user.click(screen.getByText('Falsch insgesamt (klicken)').closest('div'));
      expect(mockOnReviewIncorrect).toHaveBeenCalled();
    });

    it('should not be clickable when stats are zero', () => {
      const zeroStats = { attempted: 0, correct: 0, wrong: 0, total: 300 };

      render(
        <TestWrapper>
          <DashboardMock stats={zeroStats} />
        </TestWrapper>
      );

      expect(screen.queryByText('(klicken)')).not.toBeInTheDocument();
    });
  });

  describe('Mode Selection', () => {
    it('should handle learn mode start', async () => {
      const mockOnStartLearn = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardMock onStartLearn={mockOnStartLearn} />
        </TestWrapper>
      );

      await user.click(screen.getByText('Learn Mode'));
      expect(mockOnStartLearn).toHaveBeenCalled();
    });

    it('should handle quiz mode start', async () => {
      const mockOnStartQuiz = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardMock onStartQuiz={mockOnStartQuiz} />
        </TestWrapper>
      );

      await user.click(screen.getByText('Quiz Mode (33)'));
      expect(mockOnStartQuiz).toHaveBeenCalled();
    });

    it('should show correct quiz count based on settings', () => {
      const allCorrectStats = { attempted: 300, correct: 300, wrong: 0, total: 300 };

      render(
        <TestWrapper>
          <DashboardMock stats={allCorrectStats} />
        </TestWrapper>
      );

      // Should show min of 33 and total available (300)
      expect(screen.getByText('Quiz Mode (33)')).toBeInTheDocument();
    });
  });

  describe('Quiz Settings', () => {
    it('should handle quiz duration changes', async () => {
      const mockOnSettingsChange = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardMock onSettingsChange={mockOnSettingsChange} />
        </TestWrapper>
      );

      const durationInput = screen.getByDisplayValue('60');
      await user.clear(durationInput);
      await user.type(durationInput, '30');

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        quizDuration: 30,
        excludeCorrect: false,
        theme: 'light'
      });
    });

    it('should handle exclude correct toggle', async () => {
      const mockOnSettingsChange = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardMock onSettingsChange={mockOnSettingsChange} />
        </TestWrapper>
      );

      const excludeCheckbox = screen.getByLabelText(/Richtige Antworten ausschließen/);
      await user.click(excludeCheckbox);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        quizDuration: 60,
        excludeCorrect: true,
        theme: 'light'
      });
    });

    it('should show completion message when all questions correct and excluded', () => {
      const allCorrectStats = { attempted: 300, correct: 300, wrong: 0, total: 300 };

      render(
        <TestWrapper>
          <DashboardMock stats={allCorrectStats} />
        </TestWrapper>
      );

      // Enable exclude correct first
      const excludeCheckbox = screen.getByLabelText(/Richtige Antworten ausschließen/);
      excludeCheckbox.click();

      expect(screen.getByText('🎉 Alle Fragen richtig beantwortet! Nichts mehr zu quizen.')).toBeInTheDocument();
    });

    it('should update quiz count based on exclude setting', async () => {
      const partialStats = { attempted: 100, correct: 30, wrong: 20, total: 300 };
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardMock stats={partialStats} />
        </TestWrapper>
      );

      // Initially should show all questions available
      expect(screen.getByText('Quiz Mode (33)')).toBeInTheDocument(); // Min of 33 and 300

      // Enable exclude correct
      await user.click(screen.getByLabelText(/Richtige Antworten ausschließen/));

      // Should now show reduced count (300 - 30 = 270, min with 33 = 33)
      expect(screen.getByText('Quiz Mode (33)')).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('should handle theme switching', async () => {
      const mockOnSettingsChange = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardMock onSettingsChange={mockOnSettingsChange} />
        </TestWrapper>
      );

      const themeButton = screen.getByText('Dark');
      await user.click(themeButton);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        quizDuration: 60,
        excludeCorrect: false,
        theme: 'dark'
      });

      // Button text should change
      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
      });
    });

    it('should update branding colors based on theme', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardMock />
        </TestWrapper>
      );

      const heading = screen.getByText('EINBÜRGERUNGSTEST');
      expect(heading).toHaveStyle({ color: 'black' });

      await user.click(screen.getByText('Dark'));

      await waitFor(() => {
        expect(heading).toHaveStyle({ color: 'white' });
      });
    });
  });

  describe('Responsive Design Elements', () => {
    it('should use responsive font sizes', () => {
      render(
        <TestWrapper>
          <DashboardMock />
        </TestWrapper>
      );

      const mainHeading = screen.getByText('EINBÜRGERUNGSTEST');
      const subHeading = screen.getByText('COACH');

      expect(mainHeading).toHaveStyle({ 
        fontSize: 'clamp(1.5rem, 8vw, 3.5rem)' 
      });
      expect(subHeading).toHaveStyle({ 
        fontSize: 'clamp(1rem, 6vw, 2.5rem)' 
      });
    });

    it('should use responsive statistics display', () => {
      const mockStats = { attempted: 150, correct: 100, wrong: 50, total: 300 };

      render(
        <TestWrapper>
          <DashboardMock stats={mockStats} />
        </TestWrapper>
      );

      const statNumbers = screen.getAllByText('100')[0]; // First occurrence
      expect(statNumbers).toHaveStyle({ 
        fontSize: 'clamp(2rem, 8vw, 3rem)' 
      });
    });
  });

  describe('Settings Description and Help', () => {
    it('should show helpful descriptions for settings', () => {
      render(
        <TestWrapper>
          <DashboardMock />
        </TestWrapper>
      );

      expect(screen.getByText('Quiz-Einstellungen')).toBeInTheDocument();
      expect(screen.getByText('Quiz-Dauer (Minuten)')).toBeInTheDocument();
      expect(screen.getByText('Quiz enthält nur falsch oder nicht beantwortete Fragen.')).toBeInTheDocument();
    });
  });
});