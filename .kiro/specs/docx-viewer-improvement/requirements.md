# Requirements Document

## Introduction

This feature addresses two related issues with the DocxViewer component:

1. **Display Scaling Issue**: The document viewer currently uses a fixed `70vh` height that doesn't properly account for sidebar and other UI elements, resulting in documents being cut off or not showing the full page.

2. **Missing New Tab Link**: The viewer currently only shows the document filename as a static text element. Users cannot open the document in a new tab for independent viewing.

## Requirements

### Requirement 1: Full Page Display

**User Story:** As a user viewing a document, I want to see the full document page without it being cut off by sidebars or other UI elements, so that I can read the complete content.

#### Acceptance Criteria

1. The document viewer container SHALL dynamically calculate available height based on the current viewport minus header, footer, and sidebar elements
2. The viewer SHALL show at least one complete document page at a time without vertical scrolling of the viewer container itself
3. Document navigation (page forward/back) SHALL remain functional with the new scaling approach

### Requirement 2: New Tab Link

**User Story:** As a user, I want to open the document in a new browser tab for independent viewing, so that I can reference it alongside other documents or applications.

#### Acceptance Criteria

1. The viewer header SHALL include a "Open in New Tab" link button
2. Clicking the link SHALL open the document in a new browser tab using `window.open()`
3. The link SHALL generate a URL that displays the document using the same viewer component
4. The link SHALL work for both file uploads and base64/SFDT sources

### Requirement 3: Future-Proof URL Generation

**User Story:** As a developer, I want the URL generation to be upgradeable so that when real generated links are available, they can be easily integrated.

#### Acceptance Criteria

1. The URL generation logic SHALL be encapsulated in a separate function or hook
2. The current implementation SHALL use a placeholder URL that points to the viewer route
3. Future URL sources (generated links) SHALL be easily swapable without modifying the viewer component logic

### Requirement 4: Responsive Scaling

**User Story:** As a user with different screen sizes, I want the document viewer to adapt to available screen space, so that the document is usable on both desktop and laptop screens.

#### Acceptance Criteria

1. The viewer SHALL adjust its height when the browser window is resized
2. The viewer SHALL account for dynamic UI changes (sidebar expand/collapse)
3. The viewer SHALL maintain a minimum visible area so documents remain readable

## Non-Functional Requirements

1. The solution SHALL use existing Syncfusion DocumentEditorContainer component without requiring library changes
2. The solution SHALL maintain current document loading and rendering behavior
3. The solution SHALL be accessible (keyboard navigation, screen reader support)
4. The solution SHALL work with both file uploads and base64/SFDT sources
