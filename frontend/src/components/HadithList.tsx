import React, { useState, useEffect } from 'react';
import { hadithApi } from '../services/api';
import { Hadith } from '../types';

const HadithList: React.FC = () => {
    const [hadiths, setHadiths] = useState<Hadith[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHadiths();
    }, []);

    const loadHadiths = async () => {
        try {
            setLoading(true);
            const data = await hadithApi.getHadiths();
            setHadiths(data);
        } catch (err) {
            setError('فشل في تحميل الأحاديث');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">جاري التحميل...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="hadith-list">
            <h2>قائمة الأحاديث</h2>
            {hadiths.length === 0 ? (
                <p className="no-hadiths">لا توجد أحاديث مضافة بعد</p>
            ) : (
                <div className="hadiths-container">
                    {hadiths.map((hadith) => (
                        <div key={hadith.id} className="hadith-card">
                            <div className="hadith-text">{hadith.text}</div>
                            <div className="hadith-meta">
                                <div className="companions">
                                    <strong>الصحابة:</strong>
                                    {hadith.companions.map((companion, index) => (
                                        <span key={companion.id} className="companion-tag">
                                            {companion.name}
                                            {index < hadith.companions.length - 1 && ', '}
                                        </span>
                                    ))}
                                </div>
                                <div className="sources">
                                    <strong>المخرجون:</strong>
                                    {hadith.sources.map((source, index) => (
                                        <span key={source.id} className="source-tag">
                                            {source.name}
                                            {index < hadith.sources.length - 1 && ', '}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HadithList;
