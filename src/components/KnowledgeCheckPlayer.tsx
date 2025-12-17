import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, RotateCcw, Trophy, ArrowLeft } from "lucide-react";
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
  onComplete: (score: number, total: number, passed: boolean) => void;
  onProceed?: () => void;
  previousAttempt?: { score: number; total_questions: number } | null;
  passingScore?: number; // Default 80%
}

export const KnowledgeCheckPlayer = ({
  questions,
  contentTitle,
  onComplete,
  onProceed,
  previousAttempt,
  passingScore = 80,
}: KnowledgeCheckPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [quizCompleted, setQuizCompleted] = useState(false);

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
    setQuizCompleted(true);
    onComplete(finalScore, sortedQuestions.length, percentage >= passingScore);
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers(new Map());
    setQuizCompleted(false);
  };

  const allQuestionsAnswered = answers.size === sortedQuestions.length;
  const isLastQuestion = currentIndex === sortedQuestions.length - 1;

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No questions available for this knowledge check.</p>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const finalScore = calculateScore();
    const percentage = Math.round((finalScore / sortedQuestions.length) * 100);
    const passed = percentage >= passingScore;

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
            {passed ? "Congratulations!" : "Not Quite There Yet"}
          </CardTitle>
          <CardDescription>
            {passed
              ? "You've passed this knowledge check and can proceed to the next item."
              : `You need at least ${passingScore}% to pass. Please retry to continue.`}
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

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!passed && (
              <Button onClick={handleRetry} variant="default">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Quiz
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

      {/* Answered count */}
      <p className="text-center text-sm text-muted-foreground">
        {answers.size} of {sortedQuestions.length} questions answered
      </p>

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
