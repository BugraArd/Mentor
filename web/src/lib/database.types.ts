// supabase/schema.sql ile elle senkronize tutulan tip tanımları.
// Gerçek bir Supabase projesi bağlandığında `npx supabase gen types typescript`
// ile otomatik üretilen dosyayla değiştirilebilir.

export type UserRole = "teacher" | "student" | "admin";
export type AssignmentStatus = "draft" | "scheduled" | "active" | "closed";
export type SubmissionStatus =
  | "pending"
  | "submitted"
  | "needs_revision"
  | "evaluated";

export interface RubricCriterion {
  label: string;
  points: number;
}

export interface RubricScore extends RubricCriterion {
  score: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      mentor_relations: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string | null;
          invite_code: string;
          status: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id?: string | null;
          invite_code: string;
          status?: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["mentor_relations"]["Insert"]
        >;
      };
      assignments: {
        Row: {
          id: string;
          teacher_id: string;
          title: string;
          instructions: string | null;
          voice_note_url: string | null;
          attachment_url: string | null;
          rubric: RubricCriterion[] | null;
          starts_at: string | null;
          ends_at: string | null;
          status: AssignmentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          title: string;
          instructions?: string | null;
          voice_note_url?: string | null;
          attachment_url?: string | null;
          rubric?: RubricCriterion[] | null;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: AssignmentStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["assignments"]["Insert"]>;
      };
      assignment_assignees: {
        Row: { assignment_id: string; student_id: string };
        Insert: { assignment_id: string; student_id: string };
        Update: Partial<
          Database["public"]["Tables"]["assignment_assignees"]["Insert"]
        >;
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          version: number;
          body: string | null;
          attachment_url: string | null;
          status: SubmissionStatus;
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          version?: number;
          body?: string | null;
          attachment_url?: string | null;
          status?: SubmissionStatus;
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
      };
      evaluations: {
        Row: {
          id: string;
          submission_id: string;
          rubric_scores: RubricScore[] | null;
          feedback: string | null;
          voice_feedback_url: string | null;
          requires_revision: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          rubric_scores?: RubricScore[] | null;
          feedback?: string | null;
          voice_feedback_url?: string | null;
          requires_revision?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["evaluations"]["Insert"]>;
      };
      private_notes: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id: string;
          note: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["private_notes"]["Insert"]
        >;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notifications"]["Insert"]
        >;
      };
    };
    Functions: {
      redeem_invite_code: {
        Args: { p_code: string };
        Returns: Database["public"]["Tables"]["mentor_relations"]["Row"];
      };
    };
  };
}
