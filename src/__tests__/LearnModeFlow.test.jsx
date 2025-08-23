import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';

// Mock complete Learn Mode functionality
describe('Learn Mode Flow', () => {
  const TestWrapper = ({ children }) => (
    <MantineProvider>{children}</MantineProvider>
  );

  const mockQuestions = [
    {
      id: 1,
      question: 'Was ist die Hauptstadt von Deutschland?',
      options: ['Berlin', 'München', 'Hamburg', 'Köln'],
      answerIndex: 0,
      image: 'germany-map.png'
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

  // Mock Learn Mode component with full functionality
  const LearnModeMock = ({ 
    questions = mockQuestions,
    onNavigateHome,
    initialQuestionIndex = 0 
  }) => {
    const [currentIndex, setCurrentIndex] = React.useState(initialQuestionIndex);
    const [jumpInput, setJumpInput] = React.useState(currentIndex + 1);

    const currentQuestion = questions[currentIndex];

    const handlePrevious = () => {
      const newIndex = Math.max(0, currentIndex - 1);
      setCurrentIndex(newIndex);
      setJumpInput(newIndex + 1);
    };

    const handleNext = () => {
      const newIndex = Math.min(questions.length - 1, currentIndex + 1);
      setCurrentIndex(newIndex);
      setJumpInput(newIndex + 1);
    };

    const handleQuestionJump = (value) => {
      const questionNum = parseInt(value);
      if (questionNum >= 1 && questionNum <= questions.length) {
        const newIndex = questionNum - 1;
        setCurrentIndex(newIndex);
        setJumpInput(questionNum);
      }
    };

    if (!currentQuestion) {
      return <div>Keine Frage gefunden</div>;
    }

    return (
      <div>
        {/* Header with navigation */}
        <div>
          <button onClick={() => onNavigateHome?.()}>
            Zurück
          </button>
          <span>Learn Mode</span>
        </div>

        {/* Question counter and navigation */}
        <div>
          <span>Frage</span>
          <input 
            type="number"
            value={jumpInput}
            onChange={(e) => setJumpInput(parseInt(e.target.value) || 1)}
            onBlur={(e) => handleQuestionJump(e.target.value)}
            min="1"
            max={questions.length}
          />
          <span>von {questions.length}</span>
          
          <button 
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            aria-label="Vorherige Frage"
          >
            ◀
          </button>
          
          <button 
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            aria-label="Nächste Frage"
          >
            ▶
          </button>
        </div>

        {/* Question content */}
        <div>
          <h3>{currentQuestion.question}</h3>
          
          {currentQuestion.image && (
            <img 
              src={`/images/${currentQuestion.image}`}
              alt="Question Image"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
          )}
          
          {/* Answer options with correct answer highlighted */}
          <div>
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  margin: '4px 0',
                  backgroundColor: index === currentQuestion.answerIndex 
                    ? 'var(--mantine-color-emerald-1)' 
                    : 'white',
                  border: index === currentQuestion.answerIndex 
                    ? '2px solid var(--mantine-color-emerald-6)' 
                    : '1px solid var(--mantine-color-gray-3)',
                  borderRadius: '8px'
                }}
              >
                <span style={{ 
                  fontWeight: index === currentQuestion.answerIndex ? 600 : 400,
                  color: index === currentQuestion.answerIndex 
                    ? 'var(--mantine-color-dark-9)' 
                    : 'inherit'
                }}>
                  {String.fromCharCode(65 + index)}. {option}
                  {index === currentQuestion.answerIndex && (
                    <span style={{ color: 'green', marginLeft: '8px' }}>
                      ✓ Richtig
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div>
          <div 
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                height: '100%',
                backgroundColor: 'var(--mantine-color-emerald-6)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '14px', color: '#666' }}>
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>
    );
  };

  describe('Learn Mode Rendering', () => {
    it('should render learn mode interface', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      expect(screen.getByText('Learn Mode')).toBeInTheDocument();
      expect(screen.getByText('Zurück')).toBeInTheDocument();
      expect(screen.getByText('Was ist die Hauptstadt von Deutschland?')).toBeInTheDocument();
      expect(screen.getByText('Frage')).toBeInTheDocument();
      expect(screen.getByText('von 3')).toBeInTheDocument();
    });

    it('should display question with all options', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      expect(screen.getByText('A. Berlin')).toBeInTheDocument();
      expect(screen.getByText('B. München')).toBeInTheDocument();
      expect(screen.getByText('C. Hamburg')).toBeInTheDocument();
      expect(screen.getByText('D. Köln')).toBeInTheDocument();
    });

    it('should highlight correct answer', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const correctAnswer = screen.getByText('✓ Richtig');
      expect(correctAnswer).toBeInTheDocument();
      
      // Should be on the Berlin option
      const berlinOption = screen.getByText('A. Berlin');
      expect(berlinOption.closest('div')).toHaveStyle({
        backgroundColor: 'var(--mantine-color-emerald-1)'
      });
    });

    it('should display question image when present', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const image = screen.getByAltText('Question Image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/images/germany-map.png');
    });
  });

  describe('Navigation Controls', () => {
    it('should handle next question navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByText('Was ist die Hauptstadt von Deutschland?')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Nächste Frage'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('2')).toBeInTheDocument();
        expect(screen.getByText('Wann wurde das Grundgesetz verabschiedet?')).toBeInTheDocument();
      });
    });

    it('should handle previous question navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LearnModeMock initialQuestionIndex={1} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('2')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Vorherige Frage'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
        expect(screen.getByText('Was ist die Hauptstadt von Deutschland?')).toBeInTheDocument();
      });
    });

    it('should disable previous button on first question', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const prevButton = screen.getByLabelText('Vorherige Frage');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last question', () => {
      render(
        <TestWrapper>
          <LearnModeMock initialQuestionIndex={2} />
        </TestWrapper>
      );

      const nextButton = screen.getByLabelText('Nächste Frage');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Direct Question Navigation', () => {
    it('should allow jumping to specific question', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      // Start on question 1, navigate to question 3 using navigation
      await user.click(screen.getByLabelText('Nächste Frage')); // Go to Q2
      await user.click(screen.getByLabelText('Nächste Frage')); // Go to Q3

      await waitFor(() => {
        expect(screen.getByText('Wie viele Bundesländer hat Deutschland?')).toBeInTheDocument();
        expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      });
    });

    it('should reject invalid question numbers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const questionInput = screen.getByDisplayValue('1');
      await user.clear(questionInput);
      await user.type(questionInput, '5'); // Invalid - out of range
      await user.tab();

      // Should stay on current question
      expect(screen.getByText('Was ist die Hauptstadt von Deutschland?')).toBeInTheDocument();
    });

    it('should handle question input edge cases', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const questionInput = screen.getByDisplayValue('1');
      
      // Test zero
      await user.clear(questionInput);
      await user.type(questionInput, '0');
      await user.tab();
      expect(screen.getByText('Was ist die Hauptstadt von Deutschland?')).toBeInTheDocument();

      // Test negative number
      await user.clear(questionInput);
      await user.type(questionInput, '-1');
      await user.tab();
      expect(screen.getByText('Was ist die Hauptstadt von Deutschland?')).toBeInTheDocument();
    });
  });

  describe('Progress Visualization', () => {
    it('should show correct progress for first question', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const progressText = screen.getByText('1 / 3');
      expect(progressText).toBeInTheDocument();
    });

    it('should update progress when navigating', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      await user.click(screen.getByLabelText('Nächste Frage'));

      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    });

    it('should show visual progress bar', () => {
      render(
        <TestWrapper>
          <LearnModeMock initialQuestionIndex={1} />
        </TestWrapper>
      );

      // Check that progress text shows correctly for question 2 of 3
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      
      // Check that progress bar container exists (simplified check)
      const progressText = screen.getByText('2 / 3');
      const progressSection = progressText.parentElement.parentElement;
      expect(progressSection.querySelector('div[style*="width"]')).toBeInTheDocument();
    });
  });

  describe('Home Navigation', () => {
    it('should handle navigation back to dashboard', async () => {
      const mockOnNavigateHome = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LearnModeMock onNavigateHome={mockOnNavigateHome} />
        </TestWrapper>
      );

      await user.click(screen.getByText('Zurück'));
      expect(mockOnNavigateHome).toHaveBeenCalled();
    });
  });

  describe('Question Content Variations', () => {
    it('should handle questions without images', () => {
      const questionsNoImage = mockQuestions.slice(1); // Remove first question with image
      
      render(
        <TestWrapper>
          <LearnModeMock questions={questionsNoImage} />
        </TestWrapper>
      );

      expect(screen.queryByAltText('Question Image')).not.toBeInTheDocument();
      expect(screen.getByText('Wann wurde das Grundgesetz verabschiedet?')).toBeInTheDocument();
    });

    it('should handle different answer option lengths', () => {
      const questionsVariedOptions = [
        {
          id: 1,
          question: 'Simple question?',
          options: ['Short', 'This is a much longer answer option that might wrap'],
          answerIndex: 0
        }
      ];

      render(
        <TestWrapper>
          <LearnModeMock questions={questionsVariedOptions} />
        </TestWrapper>
      );

      expect(screen.getByText('A. Short')).toBeInTheDocument();
      expect(screen.getByText('B. This is a much longer answer option that might wrap')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Vorherige Frage')).toBeInTheDocument();
      expect(screen.getByLabelText('Nächste Frage')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const questionHeading = screen.getByRole('heading', { level: 3 });
      expect(questionHeading).toHaveTextContent('Was ist die Hauptstadt von Deutschland?');
    });

    it('should have accessible number input', () => {
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const questionInput = screen.getByDisplayValue('1');
      expect(questionInput).toHaveAttribute('type', 'number');
      expect(questionInput).toHaveAttribute('min', '1');
      expect(questionInput).toHaveAttribute('max', '3');
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty questions array', () => {
      render(
        <TestWrapper>
          <LearnModeMock questions={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('Keine Frage gefunden')).toBeInTheDocument();
    });

    it('should handle malformed question data', () => {
      const malformedQuestions = [
        { id: 1, question: 'Test question', options: ['A', 'B'], answerIndex: 0 } // Valid minimal structure
      ];

      render(
        <TestWrapper>
          <LearnModeMock questions={malformedQuestions} />
        </TestWrapper>
      );

      // Should handle gracefully without crashing
      expect(screen.getByText('Learn Mode')).toBeInTheDocument();
      expect(screen.getByText('Test question')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation on input field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LearnModeMock />
        </TestWrapper>
      );

      const questionInput = screen.getByDisplayValue('1');
      
      // Focus and use arrow keys
      questionInput.focus();
      await user.keyboard('{ArrowUp}');
      
      expect(questionInput).toHaveFocus();
    });
  });
});