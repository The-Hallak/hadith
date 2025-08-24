import React, { useState, useRef, useEffect } from 'react';

interface Option {
    id: number;
    name: string;
}

interface SearchableSelectProps {
    options: Option[];
    selectedOptions: number[];
    onSelectionChange: (selectedIds: number[]) => void;
    placeholder: string;
    label: string;
    onAddNew?: (name: string) => Promise<void>;
    addNewPlaceholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    selectedOptions,
    onSelectionChange,
    placeholder,
    label,
    onAddNew,
    addNewPlaceholder
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showAddNew, setShowAddNew] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOptionObjects = options.filter(option =>
        selectedOptions.includes(option.id)
    );

    const handleOptionToggle = (optionId: number) => {
        const newSelection = selectedOptions.includes(optionId)
            ? selectedOptions.filter(id => id !== optionId)
            : [...selectedOptions, optionId];
        onSelectionChange(newSelection);
    };

    const handleAddNew = async () => {
        if (newItemName.trim() && onAddNew) {
            await onAddNew(newItemName.trim());
            setNewItemName('');
            setShowAddNew(false);
            setSearchTerm('');
        }
    };

    const removeSelected = (optionId: number) => {
        const newSelection = selectedOptions.filter(id => id !== optionId);
        onSelectionChange(newSelection);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowAddNew(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="searchable-select" ref={dropdownRef}>
            <label className="searchable-select-label">{label}</label>

            {/* Selected items display */}
            <div className="selected-items">
                {selectedOptionObjects.map(option => (
                    <span key={option.id} className="selected-tag">
                        {option.name}
                        <button
                            type="button"
                            onClick={() => removeSelected(option.id)}
                            className="remove-tag"
                        >
                            ✕
                        </button>
                    </span>
                ))}
            </div>

            {/* Search input */}
            <div className="search-input-container">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="search-input"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="dropdown-toggle"
                >
                    ▼
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="dropdown-menu">
                    {filteredOptions.length > 0 ? (
                        <div className="options-list">
                            {filteredOptions.map(option => (
                                <div
                                    key={option.id}
                                    className={`option-item ${selectedOptions.includes(option.id) ? 'selected' : ''}`}
                                    onClick={() => handleOptionToggle(option.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedOptions.includes(option.id)}
                                        onChange={() => handleOptionToggle(option.id)}
                                        className="option-checkbox"
                                    />
                                    <span className="option-label">{option.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-options">لا توجد نتائج للبحث</div>
                    )}

                    {/* Add new option */}
                    {onAddNew && (
                        <div className="add-new-section">
                            {!showAddNew ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAddNew(true)}
                                    className="btn-show-add-new"
                                >
                                    + إضافة جديد
                                </button>
                            ) : (
                                <div className="add-new-form">
                                    <input
                                        type="text"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        placeholder={addNewPlaceholder}
                                        className="add-new-input"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddNew()}
                                    />
                                    <div className="add-new-buttons">
                                        <button
                                            type="button"
                                            onClick={handleAddNew}
                                            className="btn-confirm-add"
                                            disabled={!newItemName.trim()}
                                        >
                                            إضافة
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddNew(false);
                                                setNewItemName('');
                                            }}
                                            className="btn-cancel-add"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
