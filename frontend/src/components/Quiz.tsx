import React, { useState, useEffect } from 'react';
import { hadithApi } from '../services/api';
import { QuizQuestion, CheckAnswerResponse, GetCorrectAnswerResponse } from '../types';
import SearchableSelect from './SearchableSelect';

const Quiz: React.FC = () => {
    const [question, setQuestion] = useState<QuizQuestion | null>(null);
    const [selectedCompanions, setSelectedCompanions] = useState<number[]>([]);
    const [selectedSources, setSelectedSources] = useState<number[]>([]);
    const [fillInputs, setFillInputs] = useState<string[]>([]);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
      const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [answerResponse, setAnswerResponse] = useState<CheckAnswerResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswerData, setCorrectAnswerData] = useState<GetCorrectAnswerResponse | null>(null);
  const [loadingCorrectAnswer, setLoadingCorrectAnswer] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple_choice', 'fill_blanks']);
  const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        loadRandomQuestion();
    }, []);

    const loadRandomQuestion = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await hadithApi.getRandomQuiz(selectedQuestionTypes);
            setQuestion(data);
            setSelectedCompanions([]);
            setSelectedSources([]);
            setFillInputs(data.blank_words ? new Array(data.blank_words.length).fill('') : []);
            setShowAnswer(false);
            setIsCorrect(null);
                  setHasAnswered(false);
      setAnswerResponse(null);
      setShowResult(false);
      setCorrectAnswerData(null);
      setCanRetry(false);
        } catch (err) {
            setError('فشل في تحميل السؤال');
        } finally {
            setLoading(false);
        }
    };

    const handleCompanionSelectionChange = (companionIds: number[]) => {
        setSelectedCompanions(companionIds);
    };

    const handleSourceSelectionChange = (sourceIds: number[]) => {
        setSelectedSources(sourceIds);
    };

    const handleFillInputChange = (index: number, value: string) => {
        setFillInputs(prev => {
            const newInputs = [...prev];
            newInputs[index] = value;
            return newInputs;
        });
    };

    const checkAnswer = async () => {
        if (!question) return;

        setCheckingAnswer(true);
        setHasAnswered(true);

        try {
                  const request = {
        hadith_id: question.id,
        question_type: question.type,
        companion_ids: question.type === 'multiple_choice' ? selectedCompanions : undefined,
        source_ids: question.type === 'multiple_choice' ? selectedSources : undefined,
        filled_words: question.type === 'fill_blanks' ? fillInputs : undefined,
        blank_indices: question.type === 'fill_blanks' ? question.blank_indices : undefined,
      };

                  const response = await hadithApi.checkAnswer(request);
      setAnswerResponse(response);
      setIsCorrect(response.is_correct);
      setShowResult(true); // Show result immediately (correct/incorrect)
      
      // If answer is incorrect, allow retry
      if (!response.is_correct) {
        setCanRetry(true);
      }
        } catch (err) {
            setError('فشل في التحقق من الإجابة');
        } finally {
            setCheckingAnswer(false);
        }
    };

      const showCorrectAnswer = async () => {
    if (!question) return;
    
    setLoadingCorrectAnswer(true);
    try {
      const correctAnswer = await hadithApi.getCorrectAnswer(
        question.id, 
        question.type, 
        question.blank_indices
      );
      setCorrectAnswerData(correctAnswer);
      setShowAnswer(true);
    } catch (err) {
      setError('فشل في تحميل الإجابة الصحيحة');
    } finally {
      setLoadingCorrectAnswer(false);
    }
  };

  const tryAgain = () => {
    setHasAnswered(false);
    setShowResult(false);
    setAnswerResponse(null);
    setCanRetry(false);
    setShowAnswer(false);
    setCorrectAnswerData(null);
    // Keep the same question, just reset the user's answers
    setSelectedCompanions([]);
    setSelectedSources([]);
    if (question?.blank_words) {
      setFillInputs(new Array(question.blank_words.length).fill(''));
    }
  };

  const handleQuestionTypeChange = (type: string) => {
    const newTypes = selectedQuestionTypes.includes(type)
      ? selectedQuestionTypes.filter(t => t !== type)
      : [...selectedQuestionTypes, type];
    
    if (newTypes.length > 0) {
      setSelectedQuestionTypes(newTypes);
    }
  };

  const applySettings = () => {
    setShowSettings(false);
    loadRandomQuestion();
  };

    // Note: These functions would be used in a full implementation to show correct answers
    // const getCorrectCompanions = (): Companion[] => {
    //   if (!question) return [];
    //   // In a real app, we'd get the correct answer from the API
    //   return [];
    // };

    // const getCorrectSources = (): Source[] => {
    //   if (!question) return [];
    //   // Similar to companions, we'd get this from the API
    //   return [];
    // };

    if (loading) return <div className="loading">جاري تحميل السؤال...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!question) return <div className="error">لا يوجد سؤال متاح</div>;

    return (
        <div className="quiz">
                  <div className="quiz-header">
        <h2>اختبار حفظ الأحاديث</h2>
        <div className="quiz-controls">
          <button onClick={() => setShowSettings(!showSettings)} className="btn-settings">
            ⚙️ إعدادات
          </button>
          <button onClick={loadRandomQuestion} className="btn-new-question">
            سؤال جديد
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="quiz-settings">
          <h3>نوع الأسئلة:</h3>
          <div className="question-type-options">
            <label className="type-option">
              <input
                type="checkbox"
                checked={selectedQuestionTypes.includes('multiple_choice')}
                onChange={() => handleQuestionTypeChange('multiple_choice')}
              />
              اختيار متعدد (اختيار الصحابي والمخرج)
            </label>
            <label className="type-option">
              <input
                type="checkbox"
                checked={selectedQuestionTypes.includes('fill_blanks')}
                onChange={() => handleQuestionTypeChange('fill_blanks')}
              />
              إكمال الحديث (تكملة الكلمات الناقصة)
            </label>
          </div>
          <div className="settings-actions">
            <button onClick={applySettings} className="btn-apply-settings">
              تطبيق الإعدادات
            </button>
          </div>
        </div>
      )}

            <div className="question-container">
                {question.type === 'multiple_choice' ? (
                    <div className="multiple-choice-question">
                        <div className="hadith-text">{question.text}</div>

                        <div className="selection-section">
                            <div className="companions-selection">
                                <SearchableSelect
                                    options={question.companions || []}
                                    selectedOptions={selectedCompanions}
                                    onSelectionChange={handleCompanionSelectionChange}
                                    placeholder="ابحث عن صحابي..."
                                    label="اختر الصحابي/الصحابة:"
                                />
                            </div>

                            <div className="sources-selection">
                                <SearchableSelect
                                    options={question.sources || []}
                                    selectedOptions={selectedSources}
                                    onSelectionChange={handleSourceSelectionChange}
                                    placeholder="ابحث عن مخرج..."
                                    label="اختر المخرج/المخرجين:"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="fill-blanks-question">
                        <h3>أكمل الكلمات المفقودة:</h3>
                        <div className="blank-text">
                            {question.blank_text?.split('____').map((part, index) => (
                                <React.Fragment key={index}>
                                    {part}
                                    {index < (question.blank_words?.length || 0) && (
                                        <input
                                            type="text"
                                            value={fillInputs[index] || ''}
                                            onChange={(e) => handleFillInputChange(index, e.target.value)}
                                            className="fill-input"
                                            disabled={showAnswer}
                                            placeholder="____"
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                <div className="quiz-actions">
                    {!hasAnswered ? (
                        <button
                            onClick={checkAnswer}
                            disabled={checkingAnswer}
                            className="btn-check"
                        >
                            {checkingAnswer ? 'جاري التحقق...' : 'فحص الإجابة'}
                        </button>
                              ) : (
            <div className="quiz-buttons">
              {!showAnswer && (
                <button 
                  onClick={showCorrectAnswer} 
                  disabled={loadingCorrectAnswer}
                  className="btn-show-result"
                >
                  {loadingCorrectAnswer ? 'جاري التحميل...' : 'عرض الإجابة الصحيحة'}
                </button>
              )}
              {canRetry && !showAnswer && (
                <button 
                  onClick={tryAgain} 
                  className="btn-try-again"
                >
                  حاول مرة أخرى
                </button>
              )}
              <button 
                onClick={loadRandomQuestion} 
                className="btn-new-question"
              >
                سؤال جديد
              </button>
            </div>
          )}
                </div>

                {hasAnswered && showResult && (
                    <div className={`result-section ${isCorrect ? 'correct' : 'incorrect'}`}>
                        <div className="result-header">
                            {isCorrect ? (
                                <div className="correct-result">
                                    <span className="result-icon">✅</span>
                                    <h3>إجابة صحيحة! أحسنت</h3>
                                </div>
                            ) : (
                                <div className="incorrect-result">
                                    <span className="result-icon">❌</span>
                                    <h3>إجابة خاطئة، حاول مرة أخرى</h3>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                        {showAnswer && correctAnswerData && (
          <div className="answer-section">
            <h3>الإجابة الصحيحة:</h3>
            {question.type === 'multiple_choice' ? (
              <div className="correct-answer">
                <div className="correct-companions">
                  <strong>الصحابة:</strong>
                  <div className="correct-items">
                    {correctAnswerData.correct_companions?.map((companion, index) => (
                      <span key={companion.id} className="correct-tag companion-correct">
                        {companion.name}
                        {index < (correctAnswerData.correct_companions?.length || 0) - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="correct-sources">
                  <strong>المخرجون:</strong>
                  <div className="correct-items">
                    {correctAnswerData.correct_sources?.map((source, index) => (
                      <span key={source.id} className="correct-tag source-correct">
                        {source.name}
                        {index < (correctAnswerData.correct_sources?.length || 0) - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="correct-words">
                <strong>الكلمات الصحيحة:</strong>
                <div className="correct-items">
                  {correctAnswerData.correct_words?.map((word, index) => (
                    <span key={index} className="correct-tag word-correct">
                      {word}
                      {index < (correctAnswerData.correct_words?.length || 0) - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="full-hadith">
              <strong>النص الكامل:</strong>
              <div className="hadith-text">{correctAnswerData.full_text}</div>
            </div>
          </div>
        )}
            </div>
        </div>
    );
};

export default Quiz;
