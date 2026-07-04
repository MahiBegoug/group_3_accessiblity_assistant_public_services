# Testing Approach

The application should be tested from the perspective of software quality assurance. The testing strategy should confirm that each layer works independently and that the complete system works correctly when users interact through text, voice, maps, translations, summaries, and recommendations.

The main testing types are:

- Unit testing
- Integration testing
- Functional end-to-end testing

## Unit Testing

Unit testing verifies individual components in isolation. These tests should be fast, automated, and focused on one function, class, component, or agent behavior at a time.

What to test:

- Text request parsing and validation.
- Voice request normalization after speech-to-text conversion.
- Translator Agent behavior with sample source and target languages.
- Summary Agent behavior using sample place records.
- Recommender Agent behavior using sample activities and expected place matches.
- CSV row parsing and conversion into structured place objects.
- Filtering logic by category, borough, location, activity type, and accessibility details.
- Text-to-speech response preparation.
- Error handling for missing fields, empty inputs, unsupported languages, or invalid CSV rows.

Example unit test scenarios:

- Given a valid CSV row, the Persistence Layer should create a valid `Place` object.
- Given a user request for parks or libraries, the Recommender Agent should return matching places.
- Given a place record, the Summary Agent should generate a short and readable summary.
- Given source text and a target language, the Translator Agent should return translated text.
- Given voice input converted to text, the Business Layer should process it the same way as typed input.

## Integration Testing

Integration testing verifies that multiple layers or services work together correctly. These tests are important because the application communicates with APIs, speech services, translation services, and the CSV dataset.

What to test:

- Business Layer integration with the Persistence Layer.
- Persistence Layer integration with the CSV dataset from the Montreal open data source.
- CSV import into the Database Layer.
- Business Layer coordination with the Translator Agent, Summary Agent, and Recommender Agent.
- API communication for translation, speech-to-text, text-to-speech, or map services.
- Database queries for search, filtering, recommendations, and map display.
- Handling API failures, slow responses, invalid API responses, and unavailable services.
- Handling CSV updates, missing columns, malformed rows, or changed dataset structure.

Example integration test scenarios:

- Load the CSV file, convert rows into `Place` objects, store them, and retrieve them through the Persistence Layer.
- Request recommendations from the Business Layer and verify that the Recommender Agent uses real modeled dataset records.
- Translate a generated place summary and verify that the translated result can be returned to the Presentation Layer.
- Convert a voice request to text, process it through the Business Layer, and return a text and voice-ready response.
- Query places for map display and verify that results include valid latitude and longitude values.

## Functional End-to-End Testing

Functional end-to-end testing verifies the complete user workflow from the user interface to the database and back to the user. These tests should reflect real user behavior and confirm that the application satisfies the user specifications.

What to test:

- A user submits a text request and receives relevant text results.
- A user submits a voice request and receives the correct response.
- A user searches for places and sees them on the interactive map.
- A user selects a map marker and sees a clear place summary.
- A user requests translation and sees the translated text.
- A user requests voice output and hears the response read aloud.
- A user asks for activity-based recommendations and receives relevant places.
- A user can complete the same main tasks using accessible text and voice workflows.

Example end-to-end test scenarios:

- Text workflow: the user types a request for nearby public places, receives recommendations, opens a place summary, and views the place on the map.
- Voice workflow: the user speaks a request, the system converts it to text, recommends places, and reads the result aloud.
- Translation workflow: the user requests a place summary in another language and receives translated output.
- Recommendation workflow: the user asks for places based on an activity and receives ranked results with summaries and map markers.
- Accessibility workflow: the user interacts with the application using voice output and text alternatives for map information.

## Test Data and Mocking

Testing should use both controlled test data and representative records from the Montreal public places dataset.

- Unit tests should use small mock place records and mock agent responses.
- Integration tests should use a sample CSV file with realistic columns and edge cases.
- End-to-end tests should use a stable test dataset so expected results are predictable.
- External APIs should be mocked in unit tests and may be tested with real calls in controlled integration environments.
- API keys, credentials, and private configuration should not be stored in test files.

## Testing Quality Goals

The testing approach should verify:

- Correctness: the system returns accurate places, summaries, translations, and recommendations.
- Reliability: the system handles API errors, CSV issues, and missing data gracefully.
- Accessibility: users can complete tasks using text, voice, and screen-reader-friendly information.
- Consistency: text input and voice input follow the same business logic.
- Maintainability: each layer and agent can be tested independently.
- Performance: map results, recommendations, and dataset queries respond within an acceptable time.
