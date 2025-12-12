import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";
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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Map<string, { selected: number; correct: boolean }>>(new Map());
  const [quizCompleted, setQuizCompleted] = useState(false);

  const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);
  const currentQuestion = sortedQuestions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
  const score = Array.from(answers.values()).filter((a) => a.correct).length;

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      selected: selectedAnswer,
      correct: selectedAnswer === currentQuestion.correct_answer,
    });
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < sortedQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      const finalScore = score + (isCorrect ? 1 : 0);
      const percentage = Math.round((finalScore / sortedQuestions.length) * 100);
      onComplete(finalScore, sortedQuestions.length, percentage >= passingScore);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(new Map());
    setQuizCompleted(false);
  };

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
    const finalScore = score + (isCorrect ? 1 : 0);
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
            value={selectedAnswer !== null ? String(selectedAnswer) : undefined}
            onValueChange={(val) => !showResult && setSelectedAnswer(parseInt(val))}
            disabled={showResult}
          >
            {(currentQuestion.options as string[]).map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correct_answer;

              let optionClass = "";
              if (showResult) {
                if (isCorrectOption) {
                  optionClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                } else if (isSelected && !isCorrectOption) {
                  optionClass = "border-red-500 bg-red-50 dark:bg-red-950/30";
                }
              }

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                    !showResult && "hover:bg-muted cursor-pointer",
                    optionClass
                  )}
                >
                  <RadioGroupItem value={String(index)} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span>{option}</span>
                    {showResult && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {/* Explanation */}
          {showResult && currentQuestion.explanation && (
            <div className="p-4 rounded-lg bg-muted border">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            {!showResult ? (
              <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {currentIndex < sortedQuestions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "See Results"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
