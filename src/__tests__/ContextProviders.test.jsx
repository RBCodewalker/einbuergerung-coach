import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';

// Mock comprehensive context provider functionality
describe('Context Providers', () => {
  const TestWrapper = ({ children }) => (
    <MantineProvider>{children}</MantineProvider>
  );

  // Mock questions data
  const mockQuestions = [
    {
      id: 1,
      question: 'Was ist die Hauptstadt von Deutschland?',
      options: ['Berlin', 'München', 'Hamburg', 'Köln'],
      answerIndex: 0
    },
    {
      id: 2,
      question: 'Wann wurde das Grundgesetz verabschiedet?',
      options: ['1947', '1948', '1949', '1950'],
      answerIndex: 2
    },
    {
      id: 3,
      question: 'Wie viele Bundesländer hat Deutschland?',
      options: ['14', '15', '16', '17'],
      answerIndex: 2
    }
  ];

  // Mock Quiz Context Provider
  const QuizContextMock = React.createContext();

  const QuizProviderMock = ({ children, questions = mockQuestions }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [answers, setAnswers] = React.useState({});
    const [flaggedQuestions, setFlaggedQuestions] = React.useState(new Set());
    const [quizStartTime, setQuizStartTime] = React.useState(null);
    const [quizEndTime, setQuizEndTime] = React.useState(null);
    const [isQuizActive, setIsQuizActive] = React.useState(false);
    const [timeRemaining, setTimeRemaining] = React.useState(60 * 60); // 60 minutes in seconds

    const currentQuestion = questions[currentQuestionIndex];

    const selectAnswer = (questionId, answerIndex) => {
      setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    };

    const toggleFlag = (questionId) => {
      setFlaggedQuestions(prev => {
        const newFlags = new Set(prev);
        if (newFlags.has(questionId)) {
          newFlags.delete(questionId);
        } else {
          newFlags.add(questionId);
        }
        return newFlags;
      });
    };

    const navigateToQuestion = (index) => {
      if (index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index);
      }
    };

    const startQuiz = (duration = 60) => {
      setIsQuizActive(true);
      setQuizStartTime(Date.now());
      setTimeRemaining(duration * 60);
      setAnswers({});
      setFlaggedQuestions(new Set());
      setCurrentQuestionIndex(0);
    };

    const endQuiz = () => {
      setIsQuizActive(false);
      setQuizEndTime(Date.now());
    };

    const calculateResults = () => {
      let correct = 0;
      let attempted = 0;

      questions.forEach(question => {
        const userAnswer = answers[question.id];
        if (userAnswer !== undefined) {
          attempted++;
          if (userAnswer === question.answerIndex) {
            correct++;
          }
        }
      });

      return {
        correct,
        wrong: attempted - correct,
        attempted,
        total: questions.length,
        percentage: attempted > 0 ? Math.round((correct / attempted) * 100) : 0
      };
    };

    const contextValue = {
      // State
      currentQuestionIndex,
      currentQuestion,
      answers,
      flaggedQuestions,
      questions,
      quizStartTime,
      quizEndTime,
      isQuizActive,
      timeRemaining,

      // Actions
      selectAnswer,
      toggleFlag,
      navigateToQuestion,
      startQuiz,
      endQuiz,
      setTimeRemaining,

      // Computed
      results: calculateResults(),
      isAnswered: (questionId) => answers[questionId] !== undefined,
      isFlagged: (questionId) => flaggedQuestions.has(questionId),
      canNavigateNext: currentQuestionIndex < questions.length - 1,
      canNavigatePrev: currentQuestionIndex > 0
    };

    return (
      <QuizContextMock.Provider value={contextValue}>
        {children}
      </QuizContextMock.Provider>
    );
  };

  const useQuizContextMock = () => {
    const context = React.useContext(QuizContextMock);
    if (!context) {
      throw new Error('useQuizContext must be used within a QuizProvider');
    }
    return context;
  };

  // Mock Stats Context Provider
  const StatsContextMock = React.createContext();

  const StatsProviderMock = ({ children }) => {
    const [stats, setStats] = React.useState({
      totalAttempted: 0,
      totalCorrect: 0,
      totalWrong: 0,
      sessions: 0,
      averageScore: 0,
      bestScore: 0,
      questionHistory: {}
    });

    const updateStats = (quizResults) => {
      setStats(prev => ({
        totalAttempted: prev.totalAttempted + quizResults.attempted,
        totalCorrect: prev.totalCorrect + quizResults.correct,
        totalWrong: prev.totalWrong + quizResults.wrong,
        sessions: prev.sessions + 1,
        averageScore: Math.round(((prev.averageScore * prev.sessions + quizResults.percentage) / (prev.sessions + 1))),
        bestScore: Math.max(prev.bestScore, quizResults.percentage),
        questionHistory: {
          ...prev.questionHistory,
          ...quizResults.questionDetails
        }
      }));
    };

    const resetStats = () => {
      setStats({
        totalAttempted: 0,
        totalCorrect: 0,
        totalWrong: 0,
        sessions: 0,
        averageScore: 0,
        bestScore: 0,
        questionHistory: {}
      });
    };

    const getQuestionStats = (questionId) => {
      const history = stats.questionHistory[questionId];
      return {
        attempts: history?.attempts || 0,
        correct: history?.correct || 0,
        accuracy: history?.attempts > 0 ? Math.round((history.correct / history.attempts) * 100) : 0
      };
    };

    const contextValue = {
      stats,
      updateStats,
      resetStats,
      getQuestionStats
    };

    return (
      <StatsContextMock.Provider value={contextValue}>
        {children}
      </StatsContextMock.Provider>
    );
  };

  const useStatsContextMock = () => {
    const context = React.useContext(StatsContextMock);
    if (!context) {
      throw new Error('useStatsContext must be used within a StatsProvider');
    }
    return context;
  };

  // Mock Settings Context Provider
  const SettingsContextMock = React.createContext();

  const SettingsProviderMock = ({ children }) => {
    const [settings, setSettings] = React.useState({
      theme: 'light',
      quizDuration: 60,
      excludeCorrect: false,
      showImages: true,
      autoAdvance: false,
      playFeedbackSounds: true
    });

    const updateSetting = (key, value) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateSettings = (newSettings) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetToDefaults = () => {
      setSettings({
        theme: 'light',
        quizDuration: 60,
        excludeCorrect: false,
        showImages: true,
        autoAdvance: false,
        playFeedbackSounds: true
      });
    };

    const contextValue = {
      settings,
      updateSetting,
      updateSettings,
      resetToDefaults
    };

    return (
      <SettingsContextMock.Provider value={contextValue}>
        {children}
      </SettingsContextMock.Provider>
    );
  };

  const useSettingsContextMock = () => {
    const context = React.useContext(SettingsContextMock);
    if (!context) {
      throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
  };

  // Test component that uses Quiz Context
  const QuizConsumerMock = () => {
    const {
      currentQuestion,
      currentQuestionIndex,
      answers,
      flaggedQuestions,
      isQuizActive,
      timeRemaining,
      results,
      selectAnswer,
      toggleFlag,
      navigateToQuestion,
      startQuiz,
      endQuiz,
      canNavigateNext,
      canNavigatePrev
    } = useQuizContextMock();

    return (
      <div>
        <div>Quiz Active: {isQuizActive ? 'Yes' : 'No'}</div>
        <div>Time Remaining: {timeRemaining}</div>
        <div>Question {currentQuestionIndex + 1}: {currentQuestion?.question}</div>
        <div>
          Results: {results.correct}/{results.attempted} correct
        </div>
        
        {currentQuestion?.options.map((option, index) => (
          <button
            key={index}
            onClick={() => selectAnswer(currentQuestion.id, index)}
            style={{
              backgroundColor: answers[currentQuestion.id] === index ? 'lightblue' : 'white'
            }}
          >
            {option}
          </button>
        ))}
        
        <button 
          onClick={() => toggleFlag(currentQuestion?.id)}
          style={{
            backgroundColor: flaggedQuestions.has(currentQuestion?.id) ? 'yellow' : 'white'
          }}
        >
          {flaggedQuestions.has(currentQuestion?.id) ? 'Unflag' : 'Flag'}
        </button>
        
        <button onClick={() => navigateToQuestion(0)} disabled={!canNavigatePrev}>
          First
        </button>
        <button onClick={() => navigateToQuestion(currentQuestionIndex - 1)} disabled={!canNavigatePrev}>
          Previous
        </button>
        <button onClick={() => navigateToQuestion(currentQuestionIndex + 1)} disabled={!canNavigateNext}>
          Next
        </button>
        
        <button onClick={() => startQuiz(30)}>Start 30min Quiz</button>
        <button onClick={endQuiz}>End Quiz</button>
      </div>
    );
  };

  // Test component that uses Stats Context
  const StatsConsumerMock = () => {
    const { stats, updateStats, resetStats, getQuestionStats } = useStatsContextMock();

    const handleUpdateStats = () => {
      updateStats({
        attempted: 10,
        correct: 8,
        wrong: 2,
        percentage: 80,
        questionDetails: {
          1: { attempts: 1, correct: 1 },
          2: { attempts: 1, correct: 0 }
        }
      });
    };

    const question1Stats = getQuestionStats(1);

    return (
      <div>
        <div>Total Sessions: {stats.sessions}</div>
        <div>Total Correct: {stats.totalCorrect}</div>
        <div>Total Wrong: {stats.totalWrong}</div>
        <div>Average Score: {stats.averageScore}%</div>
        <div>Best Score: {stats.bestScore}%</div>
        <div>Question 1 Accuracy: {question1Stats.accuracy}%</div>
        
        <button onClick={handleUpdateStats}>Update Stats</button>
        <button onClick={resetStats}>Reset Stats</button>
      </div>
    );
  };

  // Test component that uses Settings Context
  const SettingsConsumerMock = () => {
    const { settings, updateSetting, updateSettings, resetToDefaults } = useSettingsContextMock();

    return (
      <div>
        <div>Theme: {settings.theme}</div>
        <div>Quiz Duration: {settings.quizDuration} minutes</div>
        <div>Exclude Correct: {settings.excludeCorrect ? 'Yes' : 'No'}</div>
        <div>Show Images: {settings.showImages ? 'Yes' : 'No'}</div>
        
        <button onClick={() => updateSetting('theme', 'dark')}>
          Switch to Dark
        </button>
        <button onClick={() => updateSetting('quizDuration', 45)}>
          Set 45min Duration
        </button>
        <button onClick={() => updateSettings({ theme: 'light', quizDuration: 30 })}>
          Update Multiple
        </button>
        <button onClick={resetToDefaults}>
          Reset to Defaults
        </button>
      </div>
    );
  };

  describe('Quiz Context Provider', () => {
    it('should provide quiz state and actions', () => {
      render(
        <TestWrapper>
          <QuizProviderMock>
            <QuizConsumerMock />
          </QuizProviderMock>
        </TestWrapper>
      );

      expect(screen.getByText('Quiz Active: No')).toBeInTheDocument();
      expect(screen.getByText('Time Remaining: 3600')).toBeInTheDocument();
      expect(screen.getByText(/Question 1:/)).toBeInTheDocument();
      expect(screen.getByText('Results: 0/0 correct')).toBeInTheDocument();
    });

    it('should handle answer selection', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <QuizProviderMock>
            <QuizConsumerMock />
          </QuizProviderMock>
        </TestWrapper>
      );

      const firstOption = screen.getByText('Berlin');
      await user.click(firstOption);

      expect(firstOption).toHaveStyle({ backgroundColor: 'lightblue' });
      expect(screen.getByText('Results: 1/1 correct')).toBeInTheDocument();
    });

    it('should handle question flagging', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <QuizProviderMock>
            <QuizConsumerMock />
          </QuizProviderMock>
        </TestWrapper>
      );

      const flagButton = screen.getByText('Flag');
      await user.click(flagButton);

      expect(screen.getByText('Unflag')).toBeInTheDocument();
      expect(flagButton).toHaveStyle({ backgroundColor: 'yellow' });
    });

    it('should handle quiz navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <QuizProviderMock>
            <QuizConsumerMock />
          </QuizProviderMock>
        </TestWrapper>
      );

      expect(screen.getByText('Previous')).toBeDisabled();
      
      await user.click(screen.getByText('Next'));
      expect(screen.getByText(/Question 2:/)).toBeInTheDocument();

      await user.click(screen.getByText('First'));
      expect(screen.getByText(/Question 1:/)).toBeInTheDocument();
    });

    it('should handle quiz start and end', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <QuizProviderMock>
            <QuizConsumerMock />
          </QuizProviderMock>
        </TestWrapper>
      );

      await user.click(screen.getByText('Start 30min Quiz'));
      
      await waitFor(() => {
        expect(screen.getByText('Quiz Active: Yes')).toBeInTheDocument();
        expect(screen.getByText('Time Remaining: 1800')).toBeInTheDocument(); // 30 * 60
      });

      await user.click(screen.getByText('End Quiz'));
      
      await waitFor(() => {
        expect(screen.getByText('Quiz Active: No')).toBeInTheDocument();
      });
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <TestWrapper>
            <QuizConsumerMock />
          </TestWrapper>
        );
      }).toThrow('useQuizContext must be used within a QuizProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Stats Context Provider', () => {
    it('should provide initial stats state', () => {
      render(
        <TestWrapper>
          <StatsProviderMock>
            <StatsConsumerMock />
          </StatsProviderMock>
        </TestWrapper>
      );

      expect(screen.getByText('Total Sessions: 0')).toBeInTheDocument();
      expect(screen.getByText('Total Correct: 0')).toBeInTheDocument();
      expect(screen.getByText('Average Score: 0%')).toBeInTheDocument();
      expect(screen.getByText('Question 1 Accuracy: 0%')).toBeInTheDocument();
    });

    it('should update stats correctly', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StatsProviderMock>
            <StatsConsumerMock />
          </StatsProviderMock>
        </TestWrapper>
      );

      await user.click(screen.getByText('Update Stats'));

      await waitFor(() => {
        expect(screen.getByText('Total Sessions: 1')).toBeInTheDocument();
        expect(screen.getByText('Total Correct: 8')).toBeInTheDocument();
        expect(screen.getByText('Total Wrong: 2')).toBeInTheDocument();
        expect(screen.getByText('Average Score: 80%')).toBeInTheDocument();
        expect(screen.getByText('Best Score: 80%')).toBeInTheDocument();
        expect(screen.getByText('Question 1 Accuracy: 100%')).toBeInTheDocument();
      });
    });

    it('should reset stats correctly', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StatsProviderMock>
            <StatsConsumerMock />
          </StatsProviderMock>
        </TestWrapper>
      );

      await user.click(screen.getByText('Update Stats'));
      await waitFor(() => {
        expect(screen.getByText('Total Sessions: 1')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reset Stats'));
      
      await waitFor(() => {
        expect(screen.getByText('Total Sessions: 0')).toBeInTheDocument();
        expect(screen.getByText('Total Correct: 0')).toBeInTheDocument();
        expect(screen.getByText('Average Score: 0%')).toBeInTheDocument();
      });
    });

    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <TestWrapper>
            <StatsConsumerMock />
          </TestWrapper>
        );
      }).toThrow('useStatsContext must be used within a StatsProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Settings Context Provider', () => {
    it('should provide initial settings state', () => {
      render(
        <TestWrapper>
          <SettingsProviderMock>
            <SettingsConsumerMock />
          </SettingsProviderMock>
        </TestWrapper>
      );

      expect(screen.getByText('Theme: light')).toBeInTheDocument();
      expect(screen.getByText('Quiz Duration: 60 minutes')).toBeInTheDocument();
      expect(screen.getByText('Exclude Correct: No')).toBeInTheDocument();
      expect(screen.getByText('Show Images: Yes')).toBeInTheDocument();
    });

    it('should handle individual setting updates', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SettingsProviderMock>
            <SettingsConsumerMock />
          </SettingsProviderMock>
        </TestWrapper>
      );

      await user.click(screen.getByText('Switch to Dark'));
      await waitFor(() => {
        expect(screen.getByText('Theme: dark')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Set 45min Duration'));
      await waitFor(() => {
        expect(screen.getByText('Quiz Duration: 45 minutes')).toBeInTheDocument();
      });
    });

    it('should handle multiple setting updates', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SettingsProviderMock>
            <SettingsConsumerMock />
          </SettingsProviderMock>
        </TestWrapper>
      );

      await user.click(screen.getByText('Update Multiple'));
      
      await waitFor(() => {
        expect(screen.getByText('Theme: light')).toBeInTheDocument();
        expect(screen.getByText('Quiz Duration: 30 minutes')).toBeInTheDocument();
      });
    });

    it('should reset to default settings', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SettingsProviderMock>
            <SettingsConsumerMock />
          </SettingsProviderMock>
        </TestWrapper>
      );

      // Change settings first
      await user.click(screen.getByText('Switch to Dark'));
      await user.click(screen.getByText('Set 45min Duration'));
      
      await waitFor(() => {
        expect(screen.getByText('Theme: dark')).toBeInTheDocument();
        expect(screen.getByText('Quiz Duration: 45 minutes')).toBeInTheDocument();
      });

      // Reset to defaults
      await user.click(screen.getByText('Reset to Defaults'));
      
      await waitFor(() => {
        expect(screen.getByText('Theme: light')).toBeInTheDocument();
        expect(screen.getByText('Quiz Duration: 60 minutes')).toBeInTheDocument();
        expect(screen.getByText('Exclude Correct: No')).toBeInTheDocument();
      });
    });

    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <TestWrapper>
            <SettingsConsumerMock />
          </TestWrapper>
        );
      }).toThrow('useSettingsContext must be used within a SettingsProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Combined Context Providers', () => {
    const CombinedConsumerMock = () => {
      const quiz = useQuizContextMock();
      const stats = useStatsContextMock();
      const settings = useSettingsContextMock();

      const handleCompleteQuiz = () => {
        const results = quiz.results;
        stats.updateStats({
          attempted: results.attempted,
          correct: results.correct,
          wrong: results.wrong,
          percentage: results.percentage,
          questionDetails: {}
        });
        quiz.endQuiz();
      };

      return (
        <div>
          <div>Current Theme: {settings.settings.theme}</div>
          <div>Quiz Duration Setting: {settings.settings.quizDuration}</div>
          <div>Quiz Active: {quiz.isQuizActive ? 'Yes' : 'No'}</div>
          <div>Total Sessions: {stats.stats.sessions}</div>
          
          <button onClick={() => quiz.startQuiz(settings.settings.quizDuration)}>
            Start Quiz with Setting Duration
          </button>
          <button onClick={handleCompleteQuiz}>
            Complete Quiz and Update Stats
          </button>
        </div>
      );
    };

    it('should work with multiple providers combined', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SettingsProviderMock>
            <StatsProviderMock>
              <QuizProviderMock>
                <CombinedConsumerMock />
              </QuizProviderMock>
            </StatsProviderMock>
          </SettingsProviderMock>
        </TestWrapper>
      );

      expect(screen.getByText('Current Theme: light')).toBeInTheDocument();
      expect(screen.getByText('Quiz Duration Setting: 60')).toBeInTheDocument();
      expect(screen.getByText('Quiz Active: No')).toBeInTheDocument();
      expect(screen.getByText('Total Sessions: 0')).toBeInTheDocument();

      await user.click(screen.getByText('Start Quiz with Setting Duration'));
      
      await waitFor(() => {
        expect(screen.getByText('Quiz Active: Yes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Quiz and Update Stats'));
      
      await waitFor(() => {
        expect(screen.getByText('Quiz Active: No')).toBeInTheDocument();
        expect(screen.getByText('Total Sessions: 1')).toBeInTheDocument();
      });
    });
  });
});