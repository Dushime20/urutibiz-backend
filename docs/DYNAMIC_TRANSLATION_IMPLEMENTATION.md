# Dynamic Translation System Implementation

## Overview

This document describes the implementation of a dynamic translation system that automatically translates your application into multiple languages without requiring manual JSON files for each language. The system uses i18next with HTTP backend to fetch translations dynamically from your backend API, which generates translations on-demand using a translation service (LibreTranslate).

## Supported Languages

The system now supports **19 languages**:

1. **English** (en) - Source language
2. **French** (fr)
3. **Swahili** (sw)
4. **Spanish** (es)
5. **Chinese** (zh)
6. **Arabic** (ar)
7. **Hindi** (hi)
8. **Portuguese** (pt)
9. **German** (de)
10. **Japanese** (ja)
11. **Korean** (ko)
12. **Italian** (it)
13. **Russian** (ru)
14. **Turkish** (tr)
15. **Kinyarwanda** (rw)
16. **Vietnamese** (vi)
17. **Thai** (th)
18. **Dutch** (nl)
19. **Polish** (pl)

## Architecture

### Frontend (React + i18next)

**Location**: `urutibz-frontend/src/i18n/config.ts`

- Uses `i18next-http-backend` to load translations from API
- Uses `i18next-browser-languagedetector` to detect user's language
- Automatically falls back to English if translation fails
- Supports all 19 languages

**Key Features**:
- Dynamic language detection from browser/localStorage
- Automatic fallback to English
- Language code mapping (e.g., `en-US` → `en`)
- Error handling with graceful degradation

### Backend (Node.js + Express)

**Location**: `urutibiz-backend/src/services/localization/DynamicTranslationService.ts`

**How It Works**:

1. **Request for translations** (e.g., `/api/v1/translations/fr`)
2. **Check cache** - If translations exist in database, return immediately
3. **If cache miss**:
   - Load source English translations from `en.json`
   - Flatten nested JSON structure to key-value pairs
   - Translate each string using TranslationProvider API
   - Reconstruct nested JSON structure
   - Cache results in database
   - Return translated JSON

**Caching**:
- Translations are cached in `ui_translations_cache` table
- First request per language takes 10-30 seconds (translates all strings)
- Subsequent requests are instant (< 100ms)
- Cache can be cleared via API endpoint

## Files Created/Modified

### Backend Files

1. **`src/services/localization/DynamicTranslationService.ts`** (NEW)
   - Core service for dynamic translation
   - Handles caching, translation, and JSON structure conversion

2. **`src/controllers/translation.controller.ts`** (MODIFIED)
   - Updated `getTranslations()` to use DynamicTranslationService
   - Added `clearCache()` endpoint
   - Added `getSupportedLanguages()` endpoint
   - Added SUPPORTED_LANGUAGES constant

3. **`src/routes/translation.routes.ts`** (MODIFIED)
   - Added route for clearing cache
   - Added route for getting supported languages list

### Frontend Files

1. **`src/i18n/config.ts`** (MODIFIED)
   - Added SUPPORTED_LANGUAGES constant
   - Updated supportedLngs to include all 19 languages
   - Enhanced language detection with code mapping
   - Improved error handling with fallback

2. **`src/components/layout/Header.tsx`** (MODIFIED)
   - Updated languages array to include all 19 languages with flags
   - Removed hardcoded language type restrictions
   - Updated to use SUPPORTED_LANGUAGES from config

## API Endpoints

### Get Translations
```
GET /api/v1/translations/:language
```
Returns all translations for the specified language. If not cached, generates translations dynamically.

**Example**:
```bash
GET /api/v1/translations/fr
```

**Response**:
```json
{
  "success": true,
  "data": {
    "common": {
      "welcome": "Bienvenue",
      "search": "Rechercher"
    },
    ...
  }
}
```

### Clear Cache
```
POST /api/v1/translations/:language/clear-cache
```
Clears the cached translations for a language, forcing re-translation on next request.

**Example**:
```bash
POST /api/v1/translations/fr/clear-cache
```

### Get Supported Languages
```
GET /api/v1/translations/languages/list
```
Returns list of all supported languages.

**Response**:
```json
{
  "success": true,
  "data": {
    "en": "English",
    "fr": "French",
    "sw": "Swahili",
    ...
  }
}
```

## Database Schema

### ui_translations_cache Table

Automatically created on first use:

```sql
CREATE TABLE ui_translations_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locale VARCHAR(10) NOT NULL,
  translation_key VARCHAR(255) NOT NULL,
  translation_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(locale, translation_key),
  INDEX(locale)
);
```

## Usage in Components

### Basic Usage

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('fr')}>
        Switch to French
      </button>
    </div>
  );
}
```

### Changing Language

```typescript
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/config';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (langCode: string) => {
    if (Object.keys(SUPPORTED_LANGUAGES).includes(langCode)) {
      i18n.changeLanguage(langCode);
      localStorage.setItem('language', langCode);
    }
  };
  
  return (
    <select onChange={(e) => changeLanguage(e.target.value)}>
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
}
```

## Configuration

### Backend Environment Variables

Ensure these are set in your `.env` file:

```env
TRANSLATE_API_URL=https://libretranslate.de/translate
TRANSLATE_API_KEY=your_api_key_here  # Optional, but recommended
```

### Frontend Environment Variables

```env
VITE_BACKEND_URL=http://localhost:3000
```

## Performance Considerations

### First Translation Request
- **Time**: 10-30 seconds (depends on number of strings and API speed)
- **API Calls**: ~60 calls (batches of 5 strings)
- **Database**: Creates cache table if needed, inserts all translations

### Subsequent Requests
- **Time**: < 100ms
- **API Calls**: 0 (uses cache)
- **Database**: 1 SELECT query

### Optimization Tips

1. **Pre-warm cache**: Call translation endpoints for common languages on server startup
2. **Batch size**: Adjust `maxConcurrent` in `DynamicTranslationService.translateObject()` (default: 5)
3. **Cache TTL**: Consider adding expiration logic if translations need updates
4. **CDN**: Consider caching translated JSON files in CDN for even faster access

## Troubleshooting

### Translations not loading

1. Check backend logs for errors
2. Verify `TRANSLATE_API_URL` is set correctly
3. Check if translation API is accessible
4. Verify database connection

### Slow first load

- This is normal for the first request per language
- Translations are cached after first load
- Consider pre-warming cache for common languages

### Translation quality

- LibreTranslate provides good quality but may not be perfect
- Consider using professional translation services for production
- You can manually edit cached translations in database if needed

## Future Enhancements

1. **Translation Management UI**: Admin panel to review/edit translations
2. **Translation Versioning**: Track changes and allow rollback
3. **Partial Updates**: Only translate changed strings
4. **Multi-provider Support**: Fallback to different translation APIs
5. **Translation Memory**: Reuse translations for similar strings
6. **Quality Scoring**: Rate translation quality and flag for review

## Notes

- English (`en.json`) remains the source of truth
- All other languages are generated dynamically
- Cache persists across server restarts
- Translations are generated on-demand (lazy loading)
- System automatically handles missing translations with fallback to English

