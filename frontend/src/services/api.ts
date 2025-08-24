import axios from 'axios';
import { Hadith, Companion, Source, CreateHadithRequest, QuizQuestion, CheckAnswerRequest, CheckAnswerResponse, GetCorrectAnswerResponse } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const hadithApi = {
    // Hadith operations
    getHadiths: (): Promise<Hadith[]> =>
        api.get('/hadiths').then(response => response.data),

    getHadith: (id: number): Promise<Hadith> =>
        api.get(`/hadiths/${id}`).then(response => response.data),

    createHadith: (hadith: CreateHadithRequest): Promise<Hadith> =>
        api.post('/hadiths', hadith).then(response => response.data),

    // Companion operations
    getCompanions: (): Promise<Companion[]> =>
        api.get('/companions').then(response => response.data),

    createCompanion: (companion: { name: string }): Promise<Companion> =>
        api.post('/companions', companion).then(response => response.data),

    // Source operations
    getSources: (): Promise<Source[]> =>
        api.get('/sources').then(response => response.data),

    createSource: (source: { name: string }): Promise<Source> =>
        api.post('/sources', source).then(response => response.data),

      // Quiz operations
  getRandomQuiz: (questionTypes?: string[]): Promise<QuizQuestion> => {
    const params = questionTypes && questionTypes.length > 0 
      ? `?types=${questionTypes.join(',')}` 
      : '';
    return api.get(`/quiz/random${params}`).then(response => response.data);
  },

      checkAnswer: (request: CheckAnswerRequest): Promise<CheckAnswerResponse> =>
    api.post('/quiz/check', request).then(response => response.data),
  
  getCorrectAnswer: (hadithId: number, questionType: string, blankIndices?: number[]): Promise<GetCorrectAnswerResponse> => {
    let url = `/quiz/answer/${hadithId}?type=${questionType}`;
    if (blankIndices && blankIndices.length > 0) {
      url += `&blank_indices=${blankIndices.join(',')}`;
    }
    return api.get(url).then(response => response.data);
  },
};
