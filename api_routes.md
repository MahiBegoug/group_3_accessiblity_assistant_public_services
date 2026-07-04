# API Routes

## Overview

The backend API should be implemented with FastAPI and should expose routes that allow the React frontend to communicate with the Business Layer, multi-agent system, Persistence Layer, and Database Layer.

The API should return structured JSON responses so the frontend can display results as text, voice output, map markers, summaries, translations, and recommendations.

## Dataset Alignment

The API routes are aligned with the Montreal open dataset `Lieux et bâtiments à vocation publique`:

https://donnees.montreal.ca/dataset/lieux-batiments-vocation-publique

The dataset provides CSV resources in French and English. The API should use a clean application model while preserving the meaning of the original dataset columns.

Important source fields:

- `titre_lieu`: place title.
- `url_fiche`: official City of Montreal place page.
- `description`: place description.
- `arrondissements`: borough.
- `types`: type of place.
- `installations`: available installations.
- `activites`: activities offered.
- `commodites`: available amenities.
- `accessibilite`: universal accessibility services.
- `categories`: place categories.
- `statut_ouverture`: opening status or access conditions.
- `horaire_par_jour`: opening hours.
- `commentaires_horaire`: additional opening-hour notes.
- `reglementation`: applicable rules.
- `paiement`: accepted payment methods.
- `telephone`: phone number.
- `courriel`: email address.
- `adresse_principale`: main postal address.
- `adresse_secondaire`: additional address details.
- `code_postal`: postal code.
- `ville`: city.
- `lat`: latitude in WGS84.
- `long`: longitude in WGS84.
- `X`: projected X coordinate in MTM Zone 8.
- `Y`: projected Y coordinate in MTM Zone 8.

Recommended API field mapping:

- `id`: internal application identifier generated from the dataset row or source URL.
- `name`: mapped from `titre_lieu`.
- `officialUrl`: mapped from `url_fiche`.
- `description`: mapped from `description`.
- `borough`: mapped from `arrondissements`.
- `types`: mapped from `types`.
- `installations`: mapped from `installations`.
- `activities`: mapped from `activites`.
- `amenities`: mapped from `commodites`.
- `accessibility`: mapped from `accessibilite`.
- `categories`: mapped from `categories`.
- `openingStatus`: mapped from `statut_ouverture`.
- `openingHours`: mapped from `horaire_par_jour`.
- `openingHoursNotes`: mapped from `commentaires_horaire`.
- `rules`: mapped from `reglementation`.
- `paymentMethods`: mapped from `paiement`.
- `phone`: mapped from `telephone`.
- `email`: mapped from `courriel`.
- `address`: mapped from `adresse_principale`.
- `addressDetails`: mapped from `adresse_secondaire`.
- `postalCode`: mapped from `code_postal`.
- `city`: mapped from `ville`.
- `latitude`: mapped from `lat`.
- `longitude`: mapped from `long`.
- `sourceCoordinates`: can include `X` and `Y` when needed.

## Places Routes

### `GET /places`

Returns a list of public service places from the modeled dataset.

Purpose:

- Display places in lists.
- Provide data for the interactive map.
- Support basic browsing of available public services.

Expected response data:

- Place ID
- Name, mapped from `titre_lieu`
- Official URL, mapped from `url_fiche`
- Description
- Borough, mapped from `arrondissements`
- Types and categories, mapped from `types` and `categories`
- Address, postal code, and city
- Latitude and longitude, mapped from `lat` and `long`
- Accessibility details, mapped from `accessibilite`
- Opening status when available

### `GET /places/{place_id}`

Returns detailed information for one place.

Purpose:

- Display full place details after a user selects a result or map marker.
- Provide source data for summaries, translations, and voice output.

Expected response data:

- Place ID
- Name
- Official URL
- Description
- Types
- Installations
- Activities
- Amenities
- Categories
- Address
- Postal code
- City
- Borough
- Latitude
- Longitude
- Opening status
- Opening hours and opening-hour notes
- Accessibility details
- Contact information, including phone and email when available
- Rules and payment methods when available
- Source dataset reference

### `GET /places/search`

Searches places using query parameters.

Example query parameters:

- `q`: text search query for `titre_lieu`, `description`, `adresse_principale`, or `categories`
- `type`: filter using values from `types`
- `category`: filter using values from `categories`
- `borough`: filter using values from `arrondissements`
- `activity`: filter using values from `activites`
- `installation`: filter using values from `installations`
- `amenity`: filter using values from `commodites`
- `accessibility`: filter using values from `accessibilite`
- `openingStatus`: filter using values from `statut_ouverture`
- `language`: dataset language, such as `fr` or `en`, when both CSV resources are available

Purpose:

- Search for public places by name, description, type, category, borough, activity, installation, amenity, or accessibility information.
- Return results that can be shown as text and map markers.

## Recommendation Routes

### `POST /recommendations`

Returns recommended places based on the user's activity, need, location, or preferences.

Purpose:

- Send the request to the Recommender Agent.
- Match user needs with relevant places from the modeled dataset.
- Return ranked or filtered recommendations.

Example request body:

```json
{
  "activity": "basketball",
  "borough": "Ville-Marie",
  "accessibility": "accessible en fauteuil roulant",
  "amenities": ["toilettes", "Wi-Fi gratuit"],
  "language": "en"
}
```

Expected response data:

- Recommended places
- Reason for recommendation based on dataset fields such as `activites`, `types`, `categories`, `commodites`, and `accessibilite`
- Place summaries
- Latitude and longitude for map display

## Summary Routes

### `POST /summaries`

Generates or returns a summary for one or more places.

Purpose:

- Send structured place data to the Summary Agent.
- Return concise summaries for search results, map markers, and voice responses.

Example request body:

```json
{
  "placeIds": ["place-001", "place-002"],
  "summaryLength": "short"
}
```

Expected response data:

- Place ID
- Generated summary
- Summary language
- Source fields used, such as `description`, `types`, `activites`, `commodites`, `accessibilite`, and `horaire_par_jour`

## Translation Routes

### `POST /translations`

Translates user-facing text from one language to another.

Purpose:

- Send text to the Translator Agent.
- Translate summaries, recommendations, place details, or assistant responses.

Example request body:

```json
{
  "text": "This library offers public services and reading spaces.",
  "sourceLanguage": "en",
  "targetLanguage": "fr"
}
```

Expected response data:

- Original text
- Translated text
- Source language
- Target language

## Voice Routes

### `POST /voice/transcribe`

Converts voice input into text.

Purpose:

- Support users who communicate by speaking.
- Convert audio input into text before sending it to the Business Layer request workflow.

Expected response data:

- Transcribed text
- Detected language when available
- Confidence score when available

### `POST /voice/speak`

Converts text output into speech.

Purpose:

- Support users who prefer or require voice output.
- Convert assistant responses, summaries, translations, or recommendations into audio.

Example request body:

```json
{
  "text": "Here are three recommended public places near you.",
  "language": "en",
  "voice": "default"
}
```

Expected response data:

- Audio file URL or encoded audio response
- Language
- Voice configuration

## Map Routes

### `GET /map/places`

Returns place records formatted for map display.

Purpose:

- Provide the React map component with marker-ready location data.
- Support filtering map results by category, type, activity, installation, amenity, accessibility, borough, or search query.

Expected response data:

- Place ID
- Name
- Types and categories
- Latitude and longitude from `lat` and `long`
- Borough
- Accessibility metadata
- Short summary
- Marker metadata

## Health and System Routes

### `GET /health`

Returns the current status of the backend service.

Purpose:

- Confirm that the FastAPI server is running.
- Support deployment checks and automated monitoring.

Expected response data:

- API status
- Version when available
- Timestamp

## API Design Notes

- All API responses should use JSON unless an endpoint specifically returns audio.
- Request and response models should be defined with Pydantic.
- API errors should return clear messages and appropriate HTTP status codes.
- Routes should avoid exposing raw CSV rows directly to the frontend.
- Routes should preserve traceability to the source dataset through `officialUrl`, source language, and dataset metadata where useful.
- Search, recommendation, and map filters should be based on actual dataset fields, especially `types`, `installations`, `activites`, `commodites`, `accessibilite`, `categories`, `arrondissements`, and `statut_ouverture`.
- The frontend should receive clean, structured data ready for text display, voice output, map markers, summaries, translations, and recommendations.
