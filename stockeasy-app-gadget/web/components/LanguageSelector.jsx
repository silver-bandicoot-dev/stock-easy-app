import { useCallback } from 'react';

const LANGUAGES = [
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'es', label: '🇪🇸 Español' }
];

export const LanguageSelector = ({ currentLanguage, onChangeLanguage }) => {
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    if (onChangeLanguage && typeof onChangeLanguage === 'function') {
      onChangeLanguage(value);
    }
  }, [onChangeLanguage]);

  return (
    <select
      value={currentLanguage || 'en'}
      onChange={handleChange}
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #c9cccf',
        backgroundColor: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
        minWidth: '140px',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23637381' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: '30px'
      }}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;
