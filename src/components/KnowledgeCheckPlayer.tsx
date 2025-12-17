import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, RotateCcw, Trophy, ArrowLeft, Lock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  order_index: number;
}

interface KnowledgeCheckPlayerProps {
  questions: Question[];
  contentTitle: string;
  contentId: string;
  onComplete: (score: number, total: number, passed: boolean) => void;
  onProceed?: () => void;
  onGoBack?: () => void;
  previousAttempt?: { score: number; total_questions: number } | null;
  passingScore?: number;
}

const COOLDOWN_MINUTES = 5;
const MAX_ATTEMPTS = 3;

export const KnowledgeCheckPlayer = ({
  questions,
  contentTitle,
  contentId,
  onComplete,
  onProceed,
  onGoBack,
  previousAttempt,
  passingScore = 80,
}: KnowledgeCheckPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const storageKey = `quiz_attempts_${contentId}`;

  // Load attempt data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      setAttemptCount(data.attempts || 0);
      setLastAttemptTime(data.lastAttemptTime || null);
    }
  }, [storageKey]);

  // Check lock status and countdown
  useEffect(() => {
    if (attemptCount >= MAX_ATTEMPTS && lastAttemptTime) {
      const cooldownEnd = lastAttemptTime + COOLDOWN_MINUTES * 60 * 1000;
      const now = Date.now();
      
      if (now < cooldownEnd) {
        setIsLocked(true);
        setRemainingTime(Math.ceil((cooldownEnd - now) / 1000));
        
        const interval = setInterval(() => {
          const newRemaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
          if (newRemaining <= 0) {
            setIsLocked(false);
            setAttemptCount(0);
            localStorage.setItem(storageKey, JSON.stringify({ attempts: 0, lastAttemptTime: null }));
            clearInterval(interval);
          } else {
            setRemainingTime(newRemaining);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        // Cooldown expired, reset attempts
        setAttemptCount(0);
        setIsLocked(false);
        localStorage.setItem(storageKey, JSON.stringify({ attempts: 0, lastAttemptTime: null }));
      }
    }
  }, [attemptCount, lastAttemptTime, storageKey]);

  const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);
  const currentQuestion = sortedQuestions[currentIndex];
  const selectedAnswer = answers.get(currentQuestion?.id);

  const calculateScore = () => {
    let correct = 0;
    sortedQuestions.forEach((q) => {
      const answer = answers.get(q.id);
      if (answer === q.correct_answer) {
        correct++;
      }
    });
    return correct;
  };

  const handleSelectAnswer = (value: number) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, value);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < sortedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateScore();
    const percentage = Math.round((finalScore / sortedQuestions.length) * 100);
    const passed = percentage >= passingScore;
    
    setQuizCompleted(true);
    
    if (!passed) {
      const newAttemptCount = attemptCount + 1;
      const now = Date.now();
      setAttemptCount(newAttemptCount);
      setLastAttemptTime(now);
      localStorage.setItem(storageKey, JSON.stringify({ attempts: newAttemptCount, lastAttemptTime: now }));
    } else {
      // Reset attempts on pass
      localStorage.setItem(storageKey, JSON.stringify({ attempts: 0, lastAttemptTime: null }));
    }
    
    onComplete(finalScore, sortedQuestions.length, passed);
  };

  const handleRetry = () => {
    if (attemptCount >= MAX_ATTEMPTS) {
      return;
    }
    setCurrentIndex(0);
    setAnswers(new Map());
    setQuizCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const allQuestionsAnswered = answers.size === sortedQuestions.length;
  const isLastQuestion = currentIndex === sortedQuestions.length - 1;
  const attemptsRemaining = MAX_ATTEMPTS - attemptCount;

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No questions available for this knowledge check.</p>
        </CardContent>
      </Card>
    );
  }

  // Locked state - exceeded attempts and in cooldown
  if (isLocked) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <Lock className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl">Quiz Temporarily Locked</CardTitle>
          <CardDescription>
            You've used all {MAX_ATTEMPTS} attempts. Please review the course material before trying again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2 text-orange-600 dark:text-orange-400">
              {formatTime(remainingTime)}
            </div>
            <p className="text-muted-foreground">Time until you can retry</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Use this time to go back and review the course materials to better prepare for your next attempt.
            </p>
          </div>

          {onGoBack && (
            <Button onClick={onGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back to Study Material
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const finalScore = calculateScore();
    const percentage = Math.round((finalScore / sortedQuestions.length) * 100);
    const passed = percentage >= passingScore;
    const maxAttemptsReached = attemptCount >= MAX_ATTEMPTS;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-2">
          <div
            className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
              passed ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            <Trophy className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl">
            {passed ? "Congratulations!" : maxAttemptsReached ? "Maximum Attempts Reached" : "Not Quite There Yet"}
          </CardTitle>
          <CardDescription>
            {passed
              ? "You've passed this knowledge check and can proceed to the next item."
              : maxAttemptsReached
              ? `Please go back and study the material again. Quiz will be available in ${COOLDOWN_MINUTES} minutes.`
              : `You need at least ${passingScore}% to pass. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {finalScore}/{sortedQuestions.length}
            </div>
            <p className={cn("font-medium", passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              Score: {percentage}% {passed ? "✓ Passed" : `✗ Need ${passingScore}%`}
            </p>
          </div>

          <Progress value={percentage} className={cn("h-3", passed ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500")} />

          {!passed && !maxAttemptsReached && (
            <p className="text-center text-sm text-muted-foreground">
              Attempts used: {attemptCount} of {MAX_ATTEMPTS}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!passed && !maxAttemptsReached && (
              <Button onClick={handleRetry} variant="default">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Quiz ({attemptsRemaining} left)
              </Button>
            )}
            {!passed && maxAttemptsReached && onGoBack && (
              <Button onClick={onGoBack} variant="default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back to Study Material
              </Button>
            )}
            {passed && onProceed && (
              <Button onClick={onProceed}>
                Continue to Next Item
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {passed && (
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{contentTitle}</span>
        <span>
          Question {currentIndex + 1} of {sortedQuestions.length}
        </span>
      </div>
      <Progress value={((currentIndex + 1) / sortedQuestions.length) * 100} className="h-2" />

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedAnswer !== undefined ? String(selectedAnswer) : undefined}
            onValueChange={(val) => handleSelectAnswer(parseInt(val))}
          >
            {(currentQuestion.options as string[]).map((option, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors hover:bg-muted cursor-pointer",
                  selectedAnswer === index && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value={String(index)} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3">
              {!isLastQuestion ? (
                <Button onClick={handleNext} disabled={selectedAnswer === undefined}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmitQuiz} disabled={!allQuestionsAnswered}>
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answered count and attempts info */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          {answers.size} of {sortedQuestions.length} questions answered
        </p>
        {attemptCount > 0 && (
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Attempts used: {attemptCount} of {MAX_ATTEMPTS}
          </p>
        )}
      </div>

      {/* Previous Attempt Info */}
      {previousAttempt && (
        <p className="text-center text-sm text-muted-foreground">
          Previous attempt: {previousAttempt.score}/{previousAttempt.total_questions} (
          {Math.round((previousAttempt.score / previousAttempt.total_questions) * 100)}%)
        </p>
      )}
    </div>
  );
};