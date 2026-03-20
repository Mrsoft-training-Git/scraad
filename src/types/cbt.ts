export interface CBTExam {
  id: string;
  title: string;
  description: string | null;
  exam_type: 'course' | 'program';
  course_id: string | null;
  program_id: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  shuffle_questions: boolean;
  allow_retake: boolean;
  max_attempts: number;
  auto_submit: boolean;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CBTQuestion {
  id: string;
  exam_id: string;
  question_type: 'mcq' | 'theory';
  question_text: string;
  marks: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  options?: CBTOption[];
}

export interface CBTOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  option_label: string;
  created_at: string;
}

export interface CBTAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  status: 'in_progress' | 'submitted' | 'expired' | 'auto_submitted';
  started_at: string;
  submitted_at: string | null;
  time_remaining_seconds: number | null;
  tab_switch_count: number;
  created_at: string;
  updated_at: string;
}

export interface CBTAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  theory_answer: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
  created_at: string;
  updated_at: string;
}

export interface CBTResult {
  id: string;
  attempt_id: string;
  exam_id: string;
  user_id: string;
  total_marks: number;
  obtained_marks: number;
  mcq_score: number;
  theory_score: number;
  theory_graded: boolean;
  percentage: number;
  passed: boolean | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
}
