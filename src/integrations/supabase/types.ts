export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_replies: {
        Row: {
          announcement_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_replies_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "course_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          code_content: string | null
          code_language: string | null
          created_at: string
          feedback: string | null
          file_urls: string[] | null
          graded_at: string | null
          graded_by: string | null
          id: string
          link_urls: string[] | null
          rubric_scores: Json | null
          score: number | null
          status: string | null
          student_id: string
          submitted_at: string | null
          text_content: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          code_content?: string | null
          code_language?: string | null
          created_at?: string
          feedback?: string | null
          file_urls?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          link_urls?: string[] | null
          rubric_scores?: Json | null
          score?: number | null
          status?: string | null
          student_id: string
          submitted_at?: string | null
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          code_content?: string | null
          code_language?: string | null
          created_at?: string
          feedback?: string | null
          file_urls?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          link_urls?: string[] | null
          rubric_scores?: Json | null
          score?: number | null
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          text_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string | null
          due_date: string
          id: string
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date: string
          id?: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string
          id?: string
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      cbt_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string
          selected_option_id: string | null
          theory_answer: string | null
          updated_at: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id: string
          selected_option_id?: string | null
          theory_answer?: string | null
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string
          selected_option_id?: string | null
          theory_answer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "cbt_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "cbt_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "cbt_options"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_attempts: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          started_at: string
          status: string
          submitted_at: string | null
          tab_switch_count: number
          time_remaining_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          tab_switch_count?: number
          time_remaining_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          tab_switch_count?: number
          time_remaining_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "cbt_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_exams: {
        Row: {
          allow_retake: boolean
          auto_submit: boolean
          course_id: string | null
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number
          end_time: string
          exam_type: string
          id: string
          is_published: boolean
          max_attempts: number
          program_id: string | null
          shuffle_questions: boolean
          start_time: string
          title: string
          track: string | null
          updated_at: string
        }
        Insert: {
          allow_retake?: boolean
          auto_submit?: boolean
          course_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number
          end_time: string
          exam_type: string
          id?: string
          is_published?: boolean
          max_attempts?: number
          program_id?: string | null
          shuffle_questions?: boolean
          start_time: string
          title: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          allow_retake?: boolean
          auto_submit?: boolean
          course_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number
          end_time?: string
          exam_type?: string
          id?: string
          is_published?: boolean
          max_attempts?: number
          program_id?: string | null
          shuffle_questions?: boolean
          start_time?: string
          title?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exams_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_label: string
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_label: string
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_label?: string
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "cbt_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_questions: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          marks: number
          order_index: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          marks?: number
          order_index?: number
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          marks?: number
          order_index?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "cbt_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_results: {
        Row: {
          attempt_id: string
          created_at: string
          exam_id: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          mcq_score: number
          obtained_marks: number
          passed: boolean | null
          percentage: number
          theory_graded: boolean
          theory_score: number
          total_marks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          exam_id: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          mcq_score?: number
          obtained_marks?: number
          passed?: boolean | null
          percentage?: number
          theory_graded?: boolean
          theory_score?: number
          total_marks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          exam_id?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          mcq_score?: number
          obtained_marks?: number
          passed?: boolean | null
          percentage?: number
          theory_graded?: boolean
          theory_score?: number
          total_marks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "cbt_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "cbt_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      content_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string
          id: string
          user_id: string
          watch_progress: number | null
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string
          id?: string
          user_id: string
          watch_progress?: number | null
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
          watch_progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_announcements: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          instructor_id: string
          is_pinned: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          instructor_id: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          allowed_types: string[] | null
          course_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          instructions: string | null
          instructor_id: string
          is_published: boolean | null
          max_score: number | null
          module_id: string | null
          rubric: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          allowed_types?: string[] | null
          course_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          instructions?: string | null
          instructor_id: string
          is_published?: boolean | null
          max_score?: number | null
          module_id?: string | null
          rubric?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          allowed_types?: string[] | null
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          instructions?: string | null
          instructor_id?: string
          is_published?: boolean | null
          max_score?: number | null
          module_id?: string | null
          rubric?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_content: {
        Row: {
          content_type: string
          content_url: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          id: string
          is_published: boolean | null
          module_id: string | null
          order_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type: string
          content_url?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_published?: boolean | null
          module_id?: string | null
          order_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_published?: boolean | null
          module_id?: string | null
          order_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_content_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          allows_part_payment: boolean
          category: string
          created_at: string | null
          description: string | null
          duration: string | null
          featured: boolean | null
          first_tranche_amount: number | null
          id: string
          image_url: string | null
          instructor: string | null
          instructor_id: string | null
          intro_video_url: string | null
          level: string | null
          overview: string | null
          pending_review: boolean | null
          price: number
          published: boolean | null
          requirements: string[] | null
          second_payment_due_days: number | null
          second_tranche_amount: number | null
          students_count: number | null
          syllabus: Json | null
          title: string
          top_rated: boolean | null
          updated_at: string | null
          what_you_learn: string[] | null
        }
        Insert: {
          allows_part_payment?: boolean
          category: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          first_tranche_amount?: number | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          instructor_id?: string | null
          intro_video_url?: string | null
          level?: string | null
          overview?: string | null
          pending_review?: boolean | null
          price: number
          published?: boolean | null
          requirements?: string[] | null
          second_payment_due_days?: number | null
          second_tranche_amount?: number | null
          students_count?: number | null
          syllabus?: Json | null
          title: string
          top_rated?: boolean | null
          updated_at?: string | null
          what_you_learn?: string[] | null
        }
        Update: {
          allows_part_payment?: boolean
          category?: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          first_tranche_amount?: number | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          instructor_id?: string | null
          intro_video_url?: string | null
          level?: string | null
          overview?: string | null
          pending_review?: boolean | null
          price?: number
          published?: boolean | null
          requirements?: string[] | null
          second_payment_due_days?: number | null
          second_tranche_amount?: number | null
          students_count?: number | null
          syllabus?: Json | null
          title?: string
          top_rated?: boolean | null
          updated_at?: string | null
          what_you_learn?: string[] | null
        }
        Relationships: []
      }
      discussion_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_answer: boolean | null
          thread_id: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_answer?: boolean | null
          thread_id: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_answer?: boolean | null
          thread_id?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "discussion_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_threads: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          is_pinned: boolean | null
          is_resolved: boolean | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_threads_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrolled_courses: {
        Row: {
          course_id: string | null
          course_name: string
          enrolled_at: string | null
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          course_name: string
          enrolled_at?: string | null
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          course_name?: string
          enrolled_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrolled_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          access_status: string
          course_id: string
          created_at: string
          first_payment_date: string | null
          id: string
          payment_status: string
          second_payment_date: string | null
          second_payment_due_date: string | null
          user_id: string
        }
        Insert: {
          access_status?: string
          course_id: string
          created_at?: string
          first_payment_date?: string | null
          id?: string
          payment_status?: string
          second_payment_date?: string | null
          second_payment_due_date?: string | null
          user_id: string
        }
        Update: {
          access_status?: string
          course_id?: string
          created_at?: string
          first_payment_date?: string | null
          id?: string
          payment_status?: string
          second_payment_date?: string | null
          second_payment_due_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          cover_letter: string | null
          created_at: string
          cv_url: string
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          cv_url: string
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          cv_url?: string
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          description: string | null
          id: string
          is_active: boolean | null
          location: string
          requirements: string[] | null
          responsibilities: string[] | null
          salary_range: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_check_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          content_id: string
          created_at: string
          id: string
          score: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          content_id: string
          created_at?: string
          id?: string
          score?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          content_id?: string
          created_at?: string
          id?: string
          score?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_check_attempts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_check_questions: {
        Row: {
          content_id: string
          correct_answer: number
          created_at: string
          explanation: string | null
          id: string
          options: Json
          order_index: number | null
          question: string
          updated_at: string
        }
        Insert: {
          content_id: string
          correct_answer: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          correct_answer?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_check_questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          instructor_id: string
          recording_url: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_password: string | null
          zoom_start_url: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          instructor_id: string
          recording_url?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_password?: string | null
          zoom_start_url?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          instructor_id?: string
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_password?: string | null
          zoom_start_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          device_type: string | null
          education_level: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          has_internet: boolean | null
          id: string
          phone: string | null
          weekly_hours: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          device_type?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_internet?: boolean | null
          id: string
          phone?: string | null
          weekly_hours?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          device_type?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_internet?: boolean | null
          id?: string
          phone?: string | null
          weekly_hours?: string | null
        }
        Relationships: []
      }
      program_applications: {
        Row: {
          address: string | null
          age: number | null
          created_at: string
          cv_url: string | null
          email: string
          experience_level: string | null
          full_name: string
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          motivation: string | null
          phone: string | null
          program_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          created_at?: string
          cv_url?: string | null
          email: string
          experience_level?: string | null
          full_name: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          motivation?: string | null
          phone?: string | null
          program_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          age?: number | null
          created_at?: string
          cv_url?: string | null
          email?: string
          experience_level?: string | null
          full_name?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          motivation?: string | null
          phone?: string | null
          program_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_assignments: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          max_score: number | null
          module_id: string | null
          program_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_score?: number | null
          module_id?: string | null
          program_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          max_score?: number | null
          module_id?: string | null
          program_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_enrollments: {
        Row: {
          access_status: string
          completed_at: string | null
          enrolled_at: string
          first_payment_date: string | null
          id: string
          payment_status: string
          program_id: string
          progress: number | null
          second_payment_date: string | null
          second_payment_due_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          access_status?: string
          completed_at?: string | null
          enrolled_at?: string
          first_payment_date?: string | null
          id?: string
          payment_status?: string
          program_id: string
          progress?: number | null
          second_payment_date?: string | null
          second_payment_due_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          access_status?: string
          completed_at?: string | null
          enrolled_at?: string
          first_payment_date?: string | null
          id?: string
          payment_status?: string
          program_id?: string
          progress?: number | null
          second_payment_date?: string | null
          second_payment_due_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_exam_results: {
        Row: {
          answers: Json
          completed_at: string
          exam_id: string
          id: string
          score: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          exam_id: string
          id?: string
          score?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          exam_id?: string
          id?: string
          score?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "program_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      program_exams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          program_id: string
          questions: Json
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          program_id: string
          questions?: Json
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          program_id?: string
          questions?: Json
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_exams_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_materials: {
        Row: {
          content_url: string | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          material_type: string
          module_id: string
          order_index: number | null
          program_id: string
          quiz_data: Json | null
          title: string
        }
        Insert: {
          content_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          material_type?: string
          module_id: string
          order_index?: number | null
          program_id: string
          quiz_data?: Json | null
          title: string
        }
        Update: {
          content_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          material_type?: string
          module_id?: string
          order_index?: number | null
          program_id?: string
          quiz_data?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_materials_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          program_id: string
          title: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          program_id: string
          title: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          program_id?: string
          title?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_urls: string[] | null
          graded_at: string | null
          id: string
          score: number | null
          status: string
          submitted_at: string
          text_content: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_urls?: string[] | null
          graded_at?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string
          text_content?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_urls?: string[] | null
          graded_at?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string
          text_content?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "program_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          allows_part_payment: boolean
          banner_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration: string | null
          end_date: string | null
          first_tranche_amount: number | null
          id: string
          instructor_id: string | null
          instructor_name: string | null
          intro_video_url: string | null
          learning_outcomes: string[] | null
          location: string | null
          max_participants: number | null
          mode: string
          price: number
          requirements: string[] | null
          schedule: Json | null
          second_payment_due_days: number | null
          second_tranche_amount: number | null
          short_description: string | null
          start_date: string | null
          status: string
          title: string
          track: string | null
          updated_at: string
        }
        Insert: {
          allows_part_payment?: boolean
          banner_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          first_tranche_amount?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          intro_video_url?: string | null
          learning_outcomes?: string[] | null
          location?: string | null
          max_participants?: number | null
          mode?: string
          price?: number
          requirements?: string[] | null
          schedule?: Json | null
          second_payment_due_days?: number | null
          second_tranche_amount?: number | null
          short_description?: string | null
          start_date?: string | null
          status?: string
          title: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          allows_part_payment?: boolean
          banner_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          end_date?: string | null
          first_tranche_amount?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          intro_video_url?: string | null
          learning_outcomes?: string[] | null
          location?: string | null
          max_participants?: number | null
          mode?: string
          price?: number
          requirements?: string[] | null
          schedule?: Json | null
          second_payment_due_days?: number | null
          second_tranche_amount?: number | null
          short_description?: string | null
          start_date?: string | null
          status?: string
          title?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zoom_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          id: string
          is_connected: boolean
          updated_at: string
          user_id: string
          zoom_access_token: string | null
          zoom_email: string | null
          zoom_expires_at: string | null
          zoom_refresh_token: string | null
          zoom_user_id: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          updated_at?: string
          user_id: string
          zoom_access_token?: string | null
          zoom_email?: string | null
          zoom_expires_at?: string | null
          zoom_refresh_token?: string | null
          zoom_user_id?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          updated_at?: string
          user_id?: string
          zoom_access_token?: string | null
          zoom_email?: string | null
          zoom_expires_at?: string | null
          zoom_refresh_token?: string | null
          zoom_user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_students_count: {
        Args: { course_id_input: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student" | "instructor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student", "instructor"],
    },
  },
} as const
