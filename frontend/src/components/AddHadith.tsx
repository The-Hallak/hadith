import React, { useState, useEffect } from 'react';
import { hadithApi } from '../services/api';
import { Companion, Source } from '../types';
import SearchableSelect from './SearchableSelect';

const AddHadith: React.FC = () => {
    const [text, setText] = useState('');
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [sources, setSources] = useState<Source[]>([]);
    const [selectedCompanions, setSelectedCompanions] = useState<number[]>([]);
    const [selectedSources, setSelectedSources] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadCompanionsAndSources();
    }, []);

    const loadCompanionsAndSources = async () => {
        try {
            const [companionsData, sourcesData] = await Promise.all([
                hadithApi.getCompanions(),
                hadithApi.getSources()
            ]);
            setCompanions(companionsData);
            setSources(sourcesData);
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل في تحميل البيانات' });
        }
    };

    const handleCompanionSelectionChange = (companionIds: number[]) => {
        setSelectedCompanions(companionIds);
    };

    const handleSourceSelectionChange = (sourceIds: number[]) => {
        setSelectedSources(sourceIds);
    };

    const addNewCompanion = async (name: string) => {
        try {
            const companion = await hadithApi.createCompanion({ name });
            setCompanions(prev => [...prev, companion]);
            setSelectedCompanions(prev => [...prev, companion.id]);
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل في إضافة الصحابي' });
        }
    };

    const addNewSource = async (name: string) => {
        try {
            const source = await hadithApi.createSource({ name });
            setSources(prev => [...prev, source]);
            setSelectedSources(prev => [...prev, source.id]);
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل في إضافة المخرج' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!text.trim()) {
            setMessage({ type: 'error', text: 'يرجى إدخال نص الحديث' });
            return;
        }

        if (selectedCompanions.length === 0) {
            setMessage({ type: 'error', text: 'يرجى اختيار صحابي واحد على الأقل' });
            return;
        }

        if (selectedSources.length === 0) {
            setMessage({ type: 'error', text: 'يرجى اختيار مخرج واحد على الأقل' });
            return;
        }

        try {
            setLoading(true);
            await hadithApi.createHadith({
                text,
                companion_ids: selectedCompanions,
                source_ids: selectedSources
            });

            setMessage({ type: 'success', text: 'تم إضافة الحديث بنجاح' });
            setText('');
            setSelectedCompanions([]);
            setSelectedSources([]);
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل في إضافة الحديث' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-hadith">
            <h2>إضافة حديث جديد</h2>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="hadith-form">
                <div className="form-group">
                    <label htmlFor="hadith-text">نص الحديث:</label>
                    <textarea
                        id="hadith-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="أدخل نص الحديث هنا..."
                        rows={5}
                        className="form-textarea"
                    />
                </div>

                <div className="form-group">
                    <SearchableSelect
                        options={companions}
                        selectedOptions={selectedCompanions}
                        onSelectionChange={handleCompanionSelectionChange}
                        placeholder="ابحث عن صحابي..."
                        label="الصحابة:"
                        onAddNew={addNewCompanion}
                        addNewPlaceholder="اسم الصحابي الجديد"
                    />
                </div>

                <div className="form-group">
                    <SearchableSelect
                        options={sources}
                        selectedOptions={selectedSources}
                        onSelectionChange={handleSourceSelectionChange}
                        placeholder="ابحث عن مخرج..."
                        label="المخرجون:"
                        onAddNew={addNewSource}
                        addNewPlaceholder="اسم المخرج الجديد"
                    />
                </div>

                <button type="submit" disabled={loading} className="btn-submit">
                    {loading ? 'جاري الإضافة...' : 'إضافة الحديث'}
                </button>
            </form>
        </div>
    );
};

export default AddHadith;
