import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  order_index: number;
}

interface KnowledgeCheckBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export const KnowledgeCheckBuilder = ({ questions, onChange }: KnowledgeCheckBuilderProps) => {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      explanation: "",
      order_index: questions.length,
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[questionIndex].options];
    newOptions[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => (q.order_index = i));
    onChange(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length < 6) {
      updated[questionIndex].options = [...updated[questionIndex].options, ""];
      onChange(updated);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
      if (updated[questionIndex].correct_answer >= updated[questionIndex].options.length) {
        updated[questionIndex].correct_answer = 0;
      }
      onChange(updated);
    }
  };

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="mb-4">No questions added yet</p>
          <Button onClick={addQuestion} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add First Question
          </Button>
        </div>
      ) : (
        questions.map((q, qIndex) => (
          <Card key={qIndex} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  Question {qIndex + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question *</Label>
                <Textarea
                  placeholder="Enter your question"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Answer Options (select the correct answer)</Label>
                <RadioGroup
                  value={String(q.correct_answer)}
                  onValueChange={(value) => updateQuestion(qIndex, "correct_answer", parseInt(value))}
                >
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <RadioGroupItem value={String(oIndex)} id={`q${qIndex}-o${oIndex}`} />
                      <Input
                        placeholder={`Option ${oIndex + 1}`}
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        className="flex-1"
                      />
                      {q.options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </RadioGroup>
                {q.options.length < 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => addOption(qIndex)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Explanation (shown after answering)</Label>
                <Textarea
                  placeholder="Explain why this answer is correct (optional)"
                  value={q.explanation || ""}
                  onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {questions.length > 0 && (
        <Button onClick={addQuestion} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      )}
    </div>
  );
};
