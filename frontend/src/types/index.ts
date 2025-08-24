export interface Hadith {
    id: number;
    text: string;
    companions: Companion[];
    sources: Source[];
}

export interface Companion {
    id: number;
    name: string;
}

export interface Source {
    id: number;
    name: string;
}

export interface CreateHadithRequest {
    text: string;
    companion_ids: number[];
    source_ids: number[];
}

export interface QuizQuestion {
  id: number;
  text: string;
  type: 'multiple_choice' | 'fill_blanks';
  companions?: Companion[];
  sources?: Source[];
  blank_text?: string;
  blank_words?: string[];
  blank_indices?: number[];
}

export interface CheckAnswerRequest {
  hadith_id: number;
  question_type: 'multiple_choice' | 'fill_blanks';
  companion_ids?: number[];
  source_ids?: number[];
  filled_words?: string[];
  blank_indices?: number[];
}

export interface CheckAnswerResponse {
  is_correct: boolean;
}

export interface GetCorrectAnswerResponse {
  correct_companions: Companion[];
  correct_sources: Source[];
  correct_words?: string[];
  full_text: string;
}

export interface QuizAnswer {
    companion_ids: number[];
    source_ids: number[];
    filled_words?: string[];
}
