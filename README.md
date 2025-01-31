# Chrome Extension Documentation

## Overview

This Chrome extension enables automated browser interactions through a scripting system. It consists of background and content scripts that work together to execute commands like clicking, inputting text, fetching data, and performing automated workflows.

## Architecture

### Background Script (background/index.ts)

The background script serves as the extension's control center, handling:

- Script parsing and execution
- Port communication management
- Tab management
- User authentication
- State management

Key components:

- `ScriptState`: Tracks execution state (PAUSED, RUNNING, FINISHED)
- `executeActions()`: Main execution engine for parsed script commands
- `parseScript()`: Converts raw script text into executable actions
- Message handling for script execution, user creation, and LLM inference

### Content Script (content/index.ts)

Handles direct webpage interactions:

- DOM manipulation
- Event handling
- Data scraping
- Browser automation tasks

Core functions:

- `performClick()`: Executes click events
- `performInput()`: Handles text input
- `performFetch()`: Extracts data from webpage
- `performInfer()`: Processes LLM inference requests
- `performSelect()`: Manages dropdown selections

## Script Language

### Supported Commands

```
open [url]              - Navigate to URL
open-tab [url]         - Open URL in new tab
input [selector] [text] - Enter text into element
click [selector]       - Click element
fetch [selector] [method] - Extract data (html/text)
select [selector] [value] - Choose dropdown option
wait                   - Wait for page load
infer [selector] [prompt] - Run LLM inference
```

### Control Structures

```
while [selector] [iterations]
  [nested commands]
end while
```

### Example Script

```
open-tab#https://example.com
wait
input#.search-box#searchterm
click#.submit-button
fetch#.results#text
```

## State Management

- Uses Chrome's storage API for persistence
- Maintains script execution state
- Tracks user session data
- Stores scraped content

## Error Handling

- Comprehensive error capture in action execution
- Status updates through port messaging
- Graceful handling of disconnections
- Tab validation checks

## Security Features

- Session state validation
- Credential management
- Secure message passing
- Safe DOM interactions

## Extension Integration

- Implements side panel behavior
- Manages tab lifecycle
- Handles extension events
- Supports background-content script communication

## Best Practices

1. Use unique, specific selectors
2. Implement appropriate wait times
3. Handle state transitions properly
4. Validate user input
5. Implement proper error handling
6. Follow security protocols

## API Integration

- Score submission endpoint
- Script execution tracking
- User authentication
- LLM inference requests
