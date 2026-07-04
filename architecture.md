# System Architecture

## Overview

The application follows a layered architecture divided into four main layers:

- Presentation Layer
- Business Layer
- Persistence Layer
- Database Layer

This architecture separates the user interface, voice and text interaction, business logic, data modeling, and data storage concerns. Each layer has a clear responsibility and communicates with the layer directly below or above it.

## Architecture Diagram

```text
+--------------------------------------------------+
|                Presentation Layer                |
|  User interface, text input, voice input, map UI  |
|  text output, voice output, speech controls,      |
|  translations, summaries, recommendations         |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|                  Business Layer                  |
|  Shared request handling for text and voice,      |
|  recommendations, summaries, translation flow,    |
|  speech-to-text/text-to-speech coordination,      |
|  map result preparation, accessibility behavior   |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|                 Persistence Layer                |
|  Dataset model, CSV parsing, place entities,      |
|  repositories, data access methods, filtering     |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|                   Database Layer                 |
|  Stored public places data from the Montreal      |
|  public buildings and places dataset              |
+--------------------------------------------------+
```

## Presentation Layer

The Presentation Layer is responsible for everything the user interacts with directly. It provides the interface that supports the user specifications, including text communication, voice communication, interactive maps, translated text, summaries, and recommendations.

Text and voice should be treated as equal interaction methods. A user should be able to submit a request by typing or speaking, and the application should be able to return the result as written text, spoken audio, or both.

Main responsibilities:

- Provide a text input interface for users to ask questions or request information.
- Provide voice input so users can communicate with the assistant by speaking.
- Provide microphone controls for starting, stopping, and confirming voice input.
- Display assistant responses as text.
- Provide voice output so responses can be read aloud using text-to-speech.
- Allow users to access the same response content through text and voice formats.
- Display an interactive map showing relevant places and service locations.
- Display summaries of places in a clear and accessible format.
- Display translated text when users request information in another language.
- Present recommendations based on user activities or needs.

This layer should focus on usability and accessibility. The interface should support users who prefer reading, listening, typing, or speaking.

## Business Layer

The Business Layer contains the main application logic. It connects the user specifications to the features and workflows needed to support them.

The Business Layer should process user intent consistently whether the request started as typed text or spoken voice. Voice input should be converted into text before intent processing, then handled through the same workflow as a typed request. After the response is generated, the Business Layer can prepare the response for text output, voice output, or both.

Main responsibilities:

- Process text requests submitted by the user.
- Process voice requests after speech is converted to text.
- Normalize text and voice requests into a shared request format.
- Determine what the user is asking for, such as a place search, translation, summary, or recommendation.
- Generate summaries for public places using available dataset information.
- Prepare recommendation results based on user activities, service categories, or needs.
- Prepare data for the interactive map, including place names, descriptions, locations, and categories.
- Coordinate translation from one language to another.
- Coordinate speech-to-text for voice input.
- Coordinate text-to-speech when a response should be read aloud.
- Apply accessibility-focused behavior, such as clear responses and support for multiple output formats.

The Business Layer should not be responsible for directly rendering the user interface or storing raw data. Instead, it should receive user requests from the Presentation Layer, request data from the Persistence Layer, apply the required logic, and return structured results.

## Text and Voice Interaction Flow

Text and voice communication should follow the same core application workflow after input is captured:

```text
Text input --------------+
                         |
                         v
                  Shared user request
                         |
Voice input -> speech-to-text
                         |
                         v
                  Business processing
                         |
          +--------------+--------------+
          |                             |
          v                             v
      Text response              Voice response
                                text-to-speech
```

This approach prevents the application from having separate business rules for text and voice. The same user intent, recommendation logic, translation logic, summary logic, and map result logic should be reused for both interaction modes.

## Persistence Layer

The Persistence Layer manages the application data model and the access logic for the dataset. The application uses the Montreal open dataset for public places and buildings:

https://donnees.montreal.ca/dataset/lieux-batiments-vocation-publique

The dataset is available as a CSV file and should be modeled into application entities that can be searched, filtered, summarized, translated, and displayed on the map.

Main responsibilities:

- Load and parse the CSV dataset.
- Define the data model for public places and buildings.
- Convert raw CSV rows into structured place objects.
- Provide repository or service methods for accessing places.
- Support filtering by activity, category, location, accessibility information, or other available fields.
- Provide clean data to the Business Layer without exposing raw CSV handling details.

Example place model:

```text
Place
- id
- name
- description
- category
- address
- borough
- latitude
- longitude
- activityType
- accessibilityDetails
- sourceDataset
```

The exact fields should be adjusted based on the columns available in the CSV file. If the dataset contains additional useful information, such as public service type, building use, or geographic coordinates, those fields should also be included in the model.

## Database Layer

The Database Layer stores the structured data used by the application. This may include imported records from the Montreal public places dataset and any processed data needed by the application.

Main responsibilities:

- Store public place and building records.
- Store normalized location data from the CSV dataset.
- Support efficient queries for search, filtering, map display, and recommendations.
- Preserve source dataset references so data can be traced back to the original open data source.

Depending on the implementation, this layer may use a relational database, a document database, or a lightweight local database. The selected database should support location-based queries if map search and nearby recommendations are required.

## Layer Communication

Each layer communicates with adjacent layers only:

- The Presentation Layer sends typed requests, voice requests, and output preferences to the Business Layer.
- The Business Layer converts voice input into a shared request format, processes requests, and asks the Persistence Layer for data.
- The Persistence Layer retrieves and models data from the Database Layer.
- The Database Layer stores the imported and structured dataset records.

This separation makes the system easier to maintain, test, and extend. For example, the dataset source or database technology can change without requiring major changes to the user interface.

## Relationship to User Specifications

The layered architecture supports the user specifications as follows:

- Text communication is captured in the Presentation Layer and processed by the Business Layer.
- Voice communication is captured in the Presentation Layer, converted into text, and processed through the same Business Layer workflow as text input.
- Interactive map output is displayed in the Presentation Layer using structured place data prepared by the Business Layer.
- Text and voice outputs are controlled by the Presentation Layer based on responses prepared by the Business Layer.
- Place summaries are generated in the Business Layer using data from the Persistence Layer.
- Text translation is coordinated by the Business Layer and displayed in the Presentation Layer.
- Activity-based recommendations are calculated in the Business Layer using modeled dataset records from the Persistence Layer.

## Benefits of the Layered Architecture

- Clear separation of responsibilities between interface, logic, data access, and storage.
- Easier testing because each layer can be tested independently.
- Easier maintenance because changes in one layer have limited impact on other layers.
- Better support for accessibility because user interaction features are isolated in the Presentation Layer.
- Better support for future data changes because dataset parsing and modeling are isolated in the Persistence Layer.
