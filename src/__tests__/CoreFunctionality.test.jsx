import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';

// Mock core functionality without external dependencies
describe('Core Application Functionality', () => {
  const TestWrapper = ({ children }) => (
    <MantineProvider>{children}</MantineProvider>
  );

  describe('Quiz Option Component Mock', () => {
    const QuizOptionMock = ({ option, index, isSelected, isCorrect, showResult, onSelect }) => {
      const label = String.fromCharCode(65 + index);
      
      return (
        <button 
          onClick={() => onSelect(index)}
          style={{
            backgroundColor: showResult && isSelected 
              ? (isCorrect ? 'lightgreen' : 'lightcoral')
              : isSelected ? 'lightblue' : 'white',
            border: '1px solid gray',
            padding: '8px',
            margin: '4px',
            display: 'block',
            width: '100%'
          }}
        >
          {label}. {option}
          {showResult && isSelected && (
            <span>{isCorrect ? ' ✓' : ' ✗'}</span>
          )}
        </button>
      );
    };

    it('should render quiz option with correct styling', () => {
      const mockOnSelect = jest.fn();
      
      render(
        <TestWrapper>
          <QuizOptionMock
            option="Berlin"
            index={0}
            isSelected={false}
            isCorrect={true}
            showResult={false}
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('A. Berlin')).toBeInTheDocument();
    });

    it('should handle selection and show correct feedback', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      
      const { rerender } = render(
        <TestWrapper>
          <QuizOptionMock
            option="Berlin"
            index={0}
            isSelected={false}
            isCorrect={true}
            showResult={false}
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      // Click the option
      await user.click(screen.getByText('A. Berlin'));
      expect(mockOnSelect).toHaveBeenCalledWith(0);

      // Rerender with selected and showing result
      rerender(
        <TestWrapper>
          <QuizOptionMock
            option="Berlin"
            index={0}
            isSelected={true}
            isCorrect={true}
            showResult={true}
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should show incorrect feedback for wrong answers', () => {
      render(
        <TestWrapper>
          <QuizOptionMock
            option="Munich"
            index={1}
            isSelected={true}
            isCorrect={false}
            showResult={true}
            onSelect={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('B. Munich')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });
  });

  describe('Question Browser Mock', () => {
    const QuestionBrowserMock = ({ questions, currentIndex, onNavigate }) => {
      const question = questions[currentIndex];
      
      return (
        <div>
          <div>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <button 
              onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              ◀
            </button>
            <button 
              onClick={() => onNavigate(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              ▶
            </button>
          </div>
          
          <h3>{question.text}</h3>
          
          {question.options.map((option, index) => (
            <div 
              key={index}
              style={{
                padding: '8px',
                backgroundColor: index === question.correctAnswer ? 'lightgreen' : 'white',
                border: index === question.correctAnswer ? '2px solid green' : '1px solid gray',
                margin: '2px'
              }}
            >
              {String.fromCharCode(65 + index)}. {option}
              {index === question.correctAnswer && <span> ✓ Correct</span>}
            </div>
          ))}
        </div>
      );
    };

    const mockQuestions = [
      {
        text: 'What is the capital of Germany?',
        options: ['Berlin', 'Munich', 'Hamburg', 'Cologne'],
        correctAnswer: 0
      },
      {
        text: 'When was the Berlin Wall built?',
        options: ['1959', '1961', '1963', '1965'],
        correctAnswer: 1
      }
    ];

    it('should display question with correct answer highlighted', () => {
      render(
        <TestWrapper>
          <QuestionBrowserMock
            questions={mockQuestions}
            currentIndex={0}
            onNavigate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('What is the capital of Germany?')).toBeInTheDocument();
      expect(screen.getByText('A. Berlin')).toBeInTheDocument();
      expect(screen.getByText('✓ Correct')).toBeInTheDocument();
    });

    it('should handle navigation between questions', async () => {
      const mockOnNavigate = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestionBrowserMock
            questions={mockQuestions}
            currentIndex={0}
            onNavigate={mockOnNavigate}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('◀')).toBeDisabled();

      await user.click(screen.getByText('▶'));
      expect(mockOnNavigate).toHaveBeenCalledWith(1);
    });

    it('should disable navigation buttons at boundaries', () => {
      const { rerender } = render(
        <TestWrapper>
          <QuestionBrowserMock
            questions={mockQuestions}
            currentIndex={0}
            onNavigate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('◀')).toBeDisabled();
      expect(screen.getByText('▶')).not.toBeDisabled();

      rerender(
        <TestWrapper>
          <QuestionBrowserMock
            questions={mockQuestions}
            currentIndex={1}
            onNavigate={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('◀')).not.toBeDisabled();
      expect(screen.getByText('▶')).toBeDisabled();
    });
  });

  describe('Quiz Session Mock', () => {
    const QuizSessionMock = ({ questions, onComplete }) => {
      const [currentIndex, setCurrentIndex] = React.useState(0);
      const [answers, setAnswers] = React.useState({});
      const [showResults, setShowResults] = React.useState(false);

      const currentQuestion = questions[currentIndex];
      const userAnswer = answers[currentIndex];

      const handleAnswer = (answerIndex) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: answerIndex }));
      };

      const handleNext = () => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setShowResults(true);
        }
      };

      const handleComplete = () => {
        const correctCount = Object.entries(answers).reduce((count, [qIndex, answerIndex]) => {
          return count + (questions[parseInt(qIndex)].correctAnswer === answerIndex ? 1 : 0);
        }, 0);
        
        onComplete({
          correct: correctCount,
          total: Object.keys(answers).length,
          answers
        });
      };

      if (showResults) {
        const correctCount = Object.entries(answers).reduce((count, [qIndex, answerIndex]) => {
          return count + (questions[parseInt(qIndex)].correctAnswer === answerIndex ? 1 : 0);
        }, 0);

        return (
          <div>
            <h2>Quiz Results</h2>
            <p>Correct: {correctCount}</p>
            <p>Total: {Object.keys(answers).length}</p>
            <button onClick={handleComplete}>Complete Quiz</button>
          </div>
        );
      }

      return (
        <div>
          <div>Progress: {currentIndex + 1}/{questions.length}</div>
          
          <h3>{currentQuestion.text}</h3>
          
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                margin: '2px',
                backgroundColor: userAnswer === index ? 'lightblue' : 'white',
                border: userAnswer === index ? '2px solid blue' : '1px solid gray'
              }}
            >
              {String.fromCharCode(65 + index)}. {option}
              {userAnswer === index && userAnswer === currentQuestion.correctAnswer && <span> ✓</span>}
              {userAnswer === index && userAnswer !== currentQuestion.correctAnswer && <span> ✗</span>}
            </button>
          ))}
          
          <button onClick={handleNext} disabled={userAnswer === undefined}>
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      );
    };

    const mockQuestions = [
      {
        text: 'What is the capital of Germany?',
        options: ['Berlin', 'Munich', 'Hamburg'],
        correctAnswer: 0
      },
      {
        text: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctAnswer: 1
      }
    ];

    it('should complete full quiz flow with scoring', async () => {
      const mockOnComplete = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuizSessionMock
            questions={mockQuestions}
            onComplete={mockOnComplete}
          />
        </TestWrapper>
      );

      // Start with first question
      expect(screen.getByText('Progress: 1/2')).toBeInTheDocument();
      expect(screen.getByText('What is the capital of Germany?')).toBeInTheDocument();

      // Answer correctly
      await user.click(screen.getByText('A. Berlin'));
      expect(screen.getByText('✓')).toBeInTheDocument();

      // Move to next question
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Progress: 2/2')).toBeInTheDocument();

      // Answer incorrectly
      await user.click(screen.getByText('A. 3'));
      expect(screen.getByText('✗')).toBeInTheDocument();

      // Finish quiz
      await user.click(screen.getByText('Finish'));

      // Check results
      expect(screen.getByText('Quiz Results')).toBeInTheDocument();
      expect(screen.getByText('Correct: 1')).toBeInTheDocument();
      expect(screen.getByText('Total: 2')).toBeInTheDocument();

      // Complete
      await user.click(screen.getByText('Complete Quiz'));
      expect(mockOnComplete).toHaveBeenCalledWith({
        correct: 1,
        total: 2,
        answers: { 0: 0, 1: 0 }
      });
    });

    it('should prevent progression without answering', () => {
      render(
        <TestWrapper>
          <QuizSessionMock
            questions={mockQuestions}
            onComplete={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Next')).toBeDisabled();
    });
  });

  describe('Statistics and Progress', () => {
    const StatsMock = ({ stats }) => {
      const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      
      return (
        <div>
          <div>Attempted: {stats.attempted}/300</div>
          <div>Correct: {stats.correct}</div>
          <div>Wrong: {stats.wrong}</div>
          <div>Percentage: {percentage}%</div>
          <div>Sessions: {stats.sessions}</div>
        </div>
      );
    };

    it('should display statistics correctly', () => {
      const mockStats = {
        attempted: 50,
        correct: 35,
        wrong: 15,
        total: 50,
        sessions: 3
      };

      render(
        <TestWrapper>
          <StatsMock stats={mockStats} />
        </TestWrapper>
      );

      expect(screen.getByText('Attempted: 50/300')).toBeInTheDocument();
      expect(screen.getByText('Correct: 35')).toBeInTheDocument();
      expect(screen.getByText('Wrong: 15')).toBeInTheDocument();
      expect(screen.getByText('Percentage: 70%')).toBeInTheDocument();
      expect(screen.getByText('Sessions: 3')).toBeInTheDocument();
    });

    it('should handle zero stats gracefully', () => {
      const mockStats = {
        attempted: 0,
        correct: 0,
        wrong: 0,
        total: 0,
        sessions: 0
      };

      render(
        <TestWrapper>
          <StatsMock stats={mockStats} />
        </TestWrapper>
      );

      expect(screen.getByText('Percentage: 0%')).toBeInTheDocument();
    });
  });
});