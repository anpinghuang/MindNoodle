MindNoodle Documentation
===============================================

Table of Contents
-----------------

1.  [Introduction](#introduction)
2.  [Features](#features)
3.  [Installation and Setup](#installation-and-setup)
4.  [Usage Guide](#usage-guide)
    -   [Launching the Application](#launching-the-application)
    -   [Creating and Editing Mindmaps](#creating-and-editing-mindmaps)
    -   [Using the Toolbar](#using-the-toolbar)
    -   [Managing Settings](#managing-settings)
    -   [Saving and Loading Mindmaps](#saving-and-loading-mindmaps)
5.  [Detailed Code Documentation](#detailed-code-documentation)
    -   [index.html](#indexhtml)
    -   [settings.html](#settingshtml)
    -   [preload.js](#preloadjs)
    -   [main.js](#mainjs)
    -   [renderer.js](#renderersjs)
6.  [Troubleshooting](#troubleshooting)
7.  [Contributing](#contributing)
8.  [License](#license)

* * * * *

Introduction
------------

Welcome to the **MindNoodle Software** documentation. This desktop application is designed to help users create, edit, and manage mindmaps efficiently. Built using [Electron](https://www.electronjs.org/), it offers a seamless cross-platform experience with features such as drag-and-drop image integration, customizable settings, undo/redo functionalities, and more. Whether you're brainstorming ideas, planning projects, or organizing information, this application provides a user-friendly interface to visualize your thoughts effectively.

* * * * *

Features
--------

The Mindmap Application is packed with features aimed at enhancing user productivity and experience:

-   **Interactive Canvas:** A responsive canvas that supports panning, zooming, and dynamic node manipulation.
-   **Node Management:**
    -   **Post-It Notes:** Add, move, resize, and edit content within post-it notes.
    -   **Images:** Integrate images via drag-and-drop or clipboard paste, with automatic scaling and aspect ratio maintenance.
-   **Connection Routing:** Link nodes using different styles:
    -   **Bezier Curves:** Smooth, flowing connections.
    -   **Orthogonal Lines:** Right-angle connections.
    -   **Straight Lines:** Direct connections.
-   **Color Customization:** Use an integrated color picker to select colors for nodes and connections.
-   **Pre-Made Themes:** Apply predefined themes to instantly change the visual appearance of your mindmap, affecting grid lines, post-it colors, connection lines, and background.
-   **Undo/Redo Functionality:** Revert or reapply actions with comprehensive undo and redo support.
-   **Settings Window:** Access and modify application settings through a dedicated interface.
-   **Save and Load Mindmaps:** Save your mindmap to a `.mindmap` file and load existing mindmaps effortlessly, with support for embedded images.
-   **Single Instance Lock:** Ensures only one instance of the application runs at a time, handling multiple file openings gracefully.
-   **UUID Generation:** Assigns unique identifiers to nodes, ensuring consistency across operations.
-   **Selection Tools:** Select multiple nodes or connections using selection rectangles or shift-clicking for batch operations.
-   **Responsive Design:** Automatically adjusts the canvas size based on window dimensions, ensuring optimal display across various screen sizes.

* * * * *

Installation and Setup
----------------------

### Prerequisites

Before installing the Mindmap Application, ensure that your system meets the following prerequisites:

-   **Node.js:** Version 14 or higher. Download from [Node.js Official Website](https://nodejs.org/).
-   **npm:** Comes bundled with Node.js.

### Installation Steps

1.  **Clone the Repository:**

    Open your terminal or command prompt and execute:

    ```
    git clone https://github.com/anpinghuang/MindNoodle.git

    ```

2.  **Navigate to the Project Directory:**

    ```
    cd MindNoodle

    ```

3.  **Install Dependencies:**

    ```
    npm install

    ```

    This command installs all necessary packages, including Electron, AdmZip, UUID, Pickr (for color picking), and TinyColor.

4.  **Run the Application:**

    ```
    npm start

    ```

    This command launches the Electron application.

5.  **Packaging for Distribution (Optional):**

    To distribute the application, you can package it using tools like [Electron Packager](https://github.com/electron/electron-packager) or [Electron Builder](https://www.electron.build/). Here's an example using Electron Packager:

    ```
    npm install --save-dev electron-packager
    npx electron-packager . MindmapApp --platform=win32 --arch=x64 --out=dist/

    ```

    Adjust the `--platform` and `--arch` flags based on your target operating systems and architectures.

* * * * *

Usage Guide
-----------

### Launching the Application

After installation, launch the application using the following command in your terminal:

```
npm start

```

Alternatively, if you've packaged the application, run the executable from the `dist/` directory.

### Creating and Editing Mindmaps

1.  **Adding Nodes:**

    -   **Post-It Notes:**
        -   Click the **"Add Post-It"** button in the toolbar to add a new post-it note at the center of the canvas.
        -   Double-click on a post-it note to edit its content.
    -   **Images:**
        -   **Drag-and-Drop:** Drag an image file from your file explorer and drop it onto the canvas to create a new image node.
        -   **Clipboard Paste:** Copy an image to your clipboard and press `Ctrl+V` (or `Cmd+V` on macOS) to paste it into the canvas.
2.  **Moving Nodes:**

    -   Click and drag a node to move it around the canvas.
    -   Use the mouse wheel or touch gestures to zoom in and out for better navigation.
3.  **Resizing Nodes:**

    -   Select a node by clicking on it.
    -   Drag the resize handle (located at the bottom-right corner of the node) to adjust its size.
    -   The application maintains the aspect ratio for image nodes during resizing.
4.  **Editing Node Content:**

    -   Double-click on a post-it note to open a text editor where you can modify its content.
    -   Click outside the editor or press `Enter` to save changes.
5.  **Connecting Nodes:**

    -   Click on a connection circle (small red circles on the edges of nodes) to start creating a connection.
    -   Drag the connection line to another node's connection circle to establish a link.
6.  **Deleting Nodes and Connections:**

    -   Select nodes or connections and press `Backspace` or `Delete` to remove them.
    -   Alternatively, use the **"Delete"** option from the context menu if available.

### Using the Toolbar

The toolbar provides quick access to essential actions:

-   **Pick Color:** Opens a color picker to change the color of the selected node.
-   **Undo:** Reverts the last action.
-   **Redo:** Reapplies the last undone action.
-   **Save:** Saves the current mindmap to a `.mindmap` file.
-   **Load:** Loads an existing mindmap from a `.mindmap` file.
-   **Add Post-It:** Adds a new post-it note to the canvas.
-   **Settings:** Opens the settings window to customize application preferences.

### Managing Settings

Access the settings window by clicking the **"Settings"** button in the toolbar. Here, you can customize various aspects of the application:

-   **Connection Routing:** Choose between `None`, `Orthogonal`, and `Bezier` styles for connections.
-   **Pre-Made Themes:** Select from predefined themes that adjust grid lines, post-it colors, connection lines, and background colors.
-   **Grid Size:** Adjust the grid size in pixels using the slider.
-   **Background Color:** Use the color picker to set the canvas background color.
-   **Apply Changes:** Click the **"Update Settings"** button to apply and save your customizations.

### Saving and Loading Mindmaps

-   **Saving:**

    -   Click the **"Save"** button in the toolbar or use the `Ctrl+S` (or `Cmd+S`) shortcut.
    -   Choose a destination and filename with the `.mindmap` extension.
    -   The mindmap, including embedded images, will be saved as a ZIP archive containing `mindmap.json` and image files.
-   **Loading:**

    -   Click the **"Load"** button in the toolbar or use the `Ctrl+O` (or `Cmd+O`) shortcut.
    -   Select a `.mindmap` file to load your previously saved mindmap.
    -   The application will parse the file and render the mindmap accordingly.

* * * * *

Detailed Code Documentation
---------------------------

This section delves into the core components of the Mindmap Application, explaining the functionality and interplay of each code segment.

### index.html

**Purpose:** Serves as the main user interface for the Mindmap Application, containing the canvas for the mindmap, toolbar for actions, and integration points for settings and color pickers.

**Key Components:**

1.  **Loading Overlay:**

    -   A hidden overlay with a spinner, displayed during long-running operations like loading or saving mindmaps.
    -   Controlled via JavaScript to show or hide based on application state.
2.  **Toolbar:**

    -   Fixed at the top-left corner.
    -   Contains buttons for color picking, undo, redo, save, load, adding post-it notes, and accessing settings.
    -   **Color Picker:** Utilizes [Pickr](https://simonwep.github.io/pickr/) for selecting colors, integrated via the `pickr-button`.
3.  **Canvas:**

    -   The main area (`<canvas id="mindmap">`) where the mindmap is rendered.
    -   Sized to cover the full window, responsive to window resizing.
4.  **Scripts and Styles:**

    -   **Pickr CSS and JS:** Included via CDN for the color picker functionality.
    -   **TinyColor JS:** Included via CDN for color manipulation.
    -   **Renderer Script:** `renderer.js` handles the frontend logic for rendering and interacting with the mindmap.

**Interactions:**

-   The **Settings Button** triggers the `openSettings` function exposed by the `preload.js` script, opening the settings window.

### settings.html

**Purpose:** Provides a dedicated interface for users to customize application settings, including connection routing, themes, grid size, and background color.

**Key Components:**

1.  **Connection Routing Options:**

    -   Radio buttons allowing users to select between `None`, `Orthogonal`, and `Bezier` connection styles.
2.  **Pre-Made Themes:**

    -   A dropdown (`<select id="theme-select">`) populated dynamically with predefined themes.
    -   Selecting a theme applies its settings to the application.
3.  **Grid Size Slider:**

    -   A range input (`<input type="range" id="grid-size">`) to adjust the grid size in pixels.
    -   Displays the current grid size value dynamically.
4.  **Background Color Picker:**

    -   Utilizes Pickr for selecting the canvas background color.
5.  **Update Settings Button:**

    -   Disabled by default, becomes active when changes are detected.
    -   Sends updated settings to the main process upon clicking.

**Scripts and Styles:**

-   **Pickr Integration:** Included via CDN for the background color picker.
-   **JavaScript Logic:**
    -   Handles user interactions, such as changing connection routing, selecting themes, adjusting grid size, and picking background colors.
    -   Communicates with the main process using IPC to send and receive settings data.

**Interactions:**

-   Upon loading, the settings window requests the current settings from the main process.
-   Changes in settings enable the **Update Settings** button, allowing users to save their customizations.

### preload.js

**Purpose:** Acts as a secure bridge between the renderer processes (frontend) and the main process, exposing specific APIs while maintaining context isolation for security.

**Key Exposed APIs:**

1.  **Window Management:**
    -   `openSettings`: Opens the settings window.
2.  **Settings Management:**
    -   `onSettingsChanged`: Listens for settings changes from the main process.
    -   `requestSettings`: Requests the current settings from the main process.
    -   `updateSettings`: Sends updated settings to the main process.
    -   `sendCurrentSettings`: Sends the current settings to the main process upon request.
    -   `onRequestCurrentSettings`: Listens for requests to send current settings.
3.  **Mindmap Operations:**
    -   `saveMap`: Saves the current mindmap data, invoking the `save-map` handler in the main process.
    -   `loadMap`: Loads an existing mindmap, invoking the `load-map` handler in the main process.
4.  **UUID Generation:**
    -   `generateUUID`: Requests the main process to generate a unique UUID, ensuring each node has a unique identifier.
5.  **File Handling:**
    -   `onOpenMindmap`: Listens for events to open a `.mindmap` file.
    -   `onMindmapData`: Receives mindmap data from the main process.
    -   `onMindmapError`: Receives error messages related to mindmap operations.

**Security Measures:**

-   **Context Isolation:** Enabled to prevent the renderer process from having direct access to Node.js APIs, enhancing security.
-   **Selective API Exposure:** Only necessary functions are exposed to the renderer, minimizing potential attack vectors.

**Example Usage:** In `index.html`, the settings button uses `window.electronAPI.openSettings()` to trigger the settings window.

### main.js

**Purpose:** Serves as the main process in the Electron application, managing window creation, inter-process communication (IPC), file operations (saving/loading mindmaps), and application lifecycle events.

**Key Functionalities:**

1.  **Window Creation:**

    -   **Main Window:** Created via `createMainWindow`, loading `index.html`.
    -   **Settings Window:** Created via `openSettingsWindow`, loading `settings.html`. Ensures only one settings window exists at a time.
2.  **IPC Handlers:**

    -   **Settings Management:**
        -   Listens for `open-settings` to open the settings window.
        -   Handles `request-settings` by sending current settings to the renderer.
        -   Processes `update-settings` to update and broadcast new settings.
    -   **Mindmap Operations:**
        -   **Saving Mindmap (`save-map`):**
            -   Packages `mindmap.json` and embedded images into a ZIP archive using [AdmZip](https://www.npmjs.com/package/adm-zip).
            -   Prompts the user to choose a save location via a save dialog.
            -   Handles success and error responses.
        -   **Loading Mindmap (`load-map`):**
            -   Opens a dialog for the user to select a `.mindmap` file.
            -   Extracts and parses `mindmap.json` and embedded images.
            -   Sends the parsed data back to the renderer process.
    -   **UUID Generation (`generate-uuid`):**
        -   Generates a unique identifier using the [UUID](https://www.npmjs.com/package/uuid) library, ensuring each node has a distinct ID.
3.  **File Handling:**

    -   **Single Instance Lock:** Ensures only one instance of the application runs at a time. Handles opening files from command-line arguments or OS-specific file open events.
    -   **Opening Mindmaps:**
        -   Parses the `.mindmap` ZIP archive.
        -   Extracts `mindmap.json` and images, embedding image data as base64 strings.
        -   Sends mindmap data to the renderer process for rendering.
4.  **Application Lifecycle:**

    -   **Event Listeners:**
        -   `second-instance`: Handles additional instances attempting to open files.
        -   `open-file`: macOS-specific event for opening files.
        -   `activate`: macOS behavior for reactivating the application.
        -   `window-all-closed`: Quits the application except on macOS.

**Example Workflow: Saving a Mindmap**

1.  Renderer calls `electronAPI.saveMap(mindmapData)`.
2.  Main process handles `save-map`, packaging data and images into a ZIP.
3.  User selects a save location.
4.  Main process writes the ZIP file and returns success or error.
5.  Renderer logs the result accordingly.

### renderer.js

**Purpose:** Handles the frontend logic of the Mindmap Application, including rendering the mindmap on the canvas, managing user interactions (like dragging, zooming, selecting), and communicating with the main process via IPC.

**Key Functionalities:**

1.  **Canvas Initialization:**

    -   Sets up the canvas dimensions to match the window size.
    -   Listens for window resize events to adjust the canvas accordingly.
2.  **Data Structures:**

    -   **Nodes:** Represents individual elements (post-it notes or images) in the mindmap.
    -   **Connections:** Represents links between nodes.
    -   **Settings:** Stores application settings like connection routing, grid size, and colors.
3.  **Event Handling:**

    -   **Pointer Events:**

        -   `pointerdown`: Initiates actions like dragging, resizing, connecting, or selecting.
        -   `pointermove`: Updates positions during dragging, panning, or resizing.
        -   `pointerup`: Finalizes actions like dropping nodes or completing connections.
        -   `pointercancel`: Handles interruptions in pointer interactions.
    -   **Keyboard Events:**

        -   **Shortcuts:**
            -   `Ctrl+Z` / `Cmd+Z`: Undo.
            -   `Ctrl+Y` / `Cmd+Y`: Redo.
            -   `Ctrl+S` / `Cmd+S`: Save.
            -   `Ctrl+O` / `Cmd+O`: Load.
        -   **Delete Keys:** Remove selected nodes or connections.
    -   **Mouse Wheel:**

        -   Handles zooming in and out, adjusting the scale and offsets to center zoom around the cursor.
    -   **Drag-and-Drop & Paste:**

        -   Supports adding image nodes via drag-and-drop or clipboard paste, automatically scaling images to fit predefined dimensions.
4.  **Rendering Logic:**

    -   **drawMap Function:**

        -   Clears and redraws the entire canvas based on current nodes, connections, and settings.
        -   Draws grid lines based on the grid size and color settings.
        -   Renders connections first (so they appear beneath nodes).
        -   Renders nodes (post-it notes and images), applying colors and borders based on selection.
        -   Draws connection circles for linking nodes.
        -   Handles temporary connection lines during connection creation.
        -   Displays selection rectangles for multi-select operations.
    -   **Drawing Utilities:**

        -   **drawGrid:** Renders the background grid.
        -   **drawResizeHandles:** Renders handles for resizing nodes.
        -   **drawText:** Handles text wrapping and rendering within post-it notes.
        -   **getEdgeCircles:** Calculates positions for connection circles on nodes.
5.  **State Management:**

    -   **Undo/Redo Stacks:** Maintains history of actions to allow users to revert or reapply changes.
    -   **Selection States:** Tracks selected nodes and connections for batch operations.
    -   **Image Cache:** Preloads and caches images to optimize rendering performance.
6.  **Settings Integration:**

    -   Listens for `settings-changed` events from the main process to update rendering based on new settings.
    -   Applies settings like connection routing, grid size, and colors dynamically.
7.  **Inter-Process Communication:**

    -   Utilizes the exposed `electronAPI` from `preload.js` to communicate with the main process.
    -   Listens for events like `mindmap-data` and `mindmap-error` to handle file operations.

**Example Workflow: Adding a Post-It Note**

1.  User clicks the **"Add Post-It"** button.
2.  `renderer.js` saves the current state for undo functionality.
3.  Calculates a non-overlapping position based on the grid.
4.  Creates a new node object with default dimensions and content.
5.  Adds the node to the `nodes` array and redraws the canvas.

* * * * *

Troubleshooting
---------------

While the Mindmap Application is designed to be robust, you might encounter issues. Below are some common problems and their solutions:

1.  **Application Doesn't Launch:**

    -   **Cause:** Missing dependencies or incorrect installation steps.
    -   **Solution:** Ensure Node.js and npm are installed. Re-run `npm install` to install all dependencies.
2.  **Cannot Open `.mindmap` Files:**

    -   **Cause:** Corrupted or improperly formatted `.mindmap` files.
    -   **Solution:** Verify the integrity of the `.mindmap` file. Ensure it was saved correctly using the application.
3.  **Images Not Displaying Correctly:**

    -   **Cause:** Issues with image encoding or unsupported formats.
    -   **Solution:** Ensure images are in supported formats (e.g., PNG). Try re-adding the image.
4.  **Settings Not Applying:**

    -   **Cause:** Failure in IPC communication or corrupted settings data.
    -   **Solution:** Restart the application. If the issue persists, consider resetting settings by deleting configuration files (if accessible).
5.  **Performance Lag with Large Mindmaps:**

    -   **Cause:** Rendering a vast number of nodes and connections.
    -   **Solution:** Optimize the mindmap by reducing the number of elements or simplifying connections. Ensure your system meets the recommended specifications.
6.  **Undo/Redo Not Working:**

    -   **Cause:** Exceeding the maximum history limit or state corruption.
    -   **Solution:** Try performing fewer actions. Restarting the application can reset the history stacks.

* * * * *

Contributing
------------

Contributions are welcome! Follow these guidelines to contribute to the Mindmap Application:

1.  **Fork the Repository:**

    -   Click the **"Fork"** button on the repository's GitHub page to create your copy.
2.  **Clone Your Fork:**

    ```
    git clone https://github.com/anpinghuang/MindNoodle.git
    cd MindNoodle

    ```

3.  **Create a Branch:**

    ```
    git checkout -b feature/your-feature-name

    ```

4.  **Make Your Changes:**

    -   Implement your feature or bug fix.
5.  **Commit Your Changes:**

    ```
    git commit -m "Add feature: Your feature description"

    ```

6.  **Push to Your Fork:**

    ```
    git push origin feature/your-feature-name

    ```

7.  **Create a Pull Request:**

    -   Navigate to the original repository and create a pull request from your fork.
8.  **Follow Code Standards:**

    -   Ensure your code adheres to the project's coding standards and passes all tests.
9.  **Documentation:**

    -   Update documentation if your changes affect usage or setup.

**Note:** Please ensure that your contributions are compatible with the existing codebase and do not introduce security vulnerabilities.

* * * * *

License
-------

The Mindmap Application is released under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, and distribute the software, provided you include the original license and attribution in your copies or substantial portions of the software.

* * * * *

Appendix
--------

### Dependencies

-   **Electron:** Framework for building cross-platform desktop applications using web technologies.
-   **AdmZip:** Library for ZIP file creation and extraction, used for saving and loading mindmaps.
-   **UUID:** Generates unique identifiers for nodes, ensuring each node has a distinct ID.
-   **Pickr:** Lightweight and customizable color picker used for selecting node and background colors.
-   **TinyColor:** JavaScript library for color manipulation and conversion.

### File Structure

-   **index.html:** Main interface containing the canvas and toolbar.
-   **settings.html:** Settings window for customizing application preferences.
-   **preload.js:** Bridges communication between the renderer and main processes securely.
-   **main.js:** Main Electron process managing window creation, IPC, and file operations.
-   **renderer.js:** Frontend logic for rendering the mindmap and handling user interactions.

* * * * *

Detailed Code Documentation
===========================

Understanding the interplay between different code segments is crucial for comprehending how the Mindmap Application functions. Below is an in-depth look at each primary file and its core components.

index.html
----------

**Purpose:** Acts as the primary user interface, hosting the canvas where the mindmap is rendered and the toolbar that provides various action buttons.

**Key Sections:**

1.  **Loading Overlay:**

    ```
    <div id="loading-overlay">
        <div class="spinner"></div>
    </div>

    ```

    -   **Function:** Displays a loading spinner during operations like saving or loading mindmaps.
    -   **Behavior:** Initially hidden (`display: none`). Controlled via JavaScript (`renderer.js`) to show or hide as needed.
2.  **Toolbar:**

    ```
    <div id="toolbar">
        <button id="pickr-button">Pick Color</button>
        <button id="undo">Undo</button>
        <button id="redo">Redo</button>
        <button id="save-map">Save</button>
        <button id="load-map">Load</button>
        <button id="add-post-it">Add Post-It</button>
        <button id="settingsBtn">Settings</button>
    </div>

    ```

    -   **Components:**
        -   **Pick Color:** Opens the color picker for node customization.
        -   **Undo/Redo:** Reverts or reapplies actions.
        -   **Save/Load:** Saves the current mindmap or loads an existing one.
        -   **Add Post-It:** Inserts a new post-it note into the canvas.
        -   **Settings:** Opens the settings window.
3.  **Canvas:**

    ```
    <canvas id="mindmap" tabindex="0"></canvas>

    ```

    -   **Attributes:**
        -   `id="mindmap"`: Identifies the canvas for rendering.
        -   `tabindex="0"`: Makes the canvas focusable for keyboard interactions.
4.  **Scripts:**

    ```
    <script src="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.6.0/tinycolor.min.js"></script>
    <script src="renderer.js"></script>

    ```

    -   **Pickr:** Enables color picking functionality.
    -   **TinyColor:** Assists in color conversions and manipulations.
    -   **renderer.js:** Contains the frontend logic for rendering and interactions.
5.  **Settings Button Interaction:**

    ```
    <script>
        document.getElementById('settingsBtn').addEventListener('click', () => {
          window.electronAPI.openSettings();
        });
    </script>

    ```

    -   **Function:** Listens for clicks on the **"Settings"** button and invokes the `openSettings` method from `preload.js` to open the settings window.

**Styling:**

-   The toolbar is styled to be fixed at the top-left with a semi-transparent background and subtle shadow for aesthetics.
-   The canvas covers the entire window, ensuring ample space for mindmap creation.

settings.html
-------------

**Purpose:** Provides a dedicated interface for users to customize various application settings, enhancing personalization and workflow efficiency.

**Key Sections:**

1.  **Connection Routing Options:**

    ```
    <div class="section">
        <label>Connection Routing:</label>
        <div class="routing-container">
            <input type="radio" id="routing-none" name="connectionRouting" value="none">
            <label for="routing-none">None</label>
            <input type="radio" id="routing-orthogonal" name="connectionRouting" value="orthogonal">
            <label for="routing-orthogonal">Orthogonal</label>
            <input type="radio" id="routing-bezier" name="connectionRouting" value="bezier">
            <label for="routing-bezier">Bezier</label>
        </div>
    </div>

    ```

    -   **Function:** Allows users to select the style of connections between nodes.
    -   **Options:**
        -   **None:** No connections.
        -   **Orthogonal:** Right-angle connections.
        -   **Bezier:** Smooth, curved connections.
2.  **Pre-Made Themes:**

    ```
    <div class="section theme-container">
        <label for="theme-select">Pre-Made Themes:</label>
        <select id="theme-select">
            <option value="">-- Select a Theme --</option>
            <!-- Themes populated dynamically -->
        </select>
    </div>

    ```

    -   **Function:** Users can choose from predefined themes that adjust various visual aspects like grid lines, post-it colors, connection lines, and background colors.
    -   **Population:** Themes are dynamically injected via JavaScript based on a predefined array.
3.  **Grid Size Slider:**

    ```
    <div class="section">
        <label for="grid-size">Grid Size (px):</label>
        <div class="slider-container">
            <input type="range" id="grid-size" name="grid-size" min="5" max="50" step="5" list="tickmarks">
            <datalist id="tickmarks">
                <option value="5"></option>
                <option value="10"></option>
                <option value="50"></option>
            </datalist>
            <span class="slider-value" id="grid-size-value">50</span>
        </div>
    </div>

    ```

    -   **Function:** Adjusts the grid size displayed on the canvas, aiding in alignment and placement of nodes.
    -   **Behavior:** Slider snaps to predefined values (5, 10, 50) to maintain consistency.
4.  **Background Color Picker:**

    ```
    <div class="section">
        <label for="background-color">Background Color:</label>
        <div id="background-color-picker"></div>
    </div>

    ```

    -   **Function:** Allows users to select the canvas's background color using Pickr.
5.  **Update Settings Button:**

    ```
    <button id="update-settings" disabled>Update Settings</button>

    ```

    -   **Function:** Applies and saves the changes made in the settings window.
    -   **Behavior:** Initially disabled, becomes active when changes are detected.
6.  **Scripts:**

    ```
    <script src="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js"></script>
    <script>
        // JavaScript logic for handling settings interactions
    </script>

    ```

    -   **Pickr:** Facilitates color picking for the background.
    -   **JavaScript Logic:**
        -   Defines pre-made themes.
        -   Handles user interactions like changing connection routing, selecting themes, adjusting grid size, and picking background colors.
        -   Communicates with the main process via IPC to retrieve and update settings.

**Styling:**

-   Organized sections with clear labels and inputs.
-   Consistent spacing and alignment for a clean user experience.

preload.js
----------

**Purpose:** Acts as a secure intermediary between the renderer processes (frontend) and the main process, exposing only specific APIs to the renderer while maintaining context isolation for enhanced security.

**Key Exposed APIs:**

1.  **Window Management:**

    -   `openSettings`: Sends an IPC message (`open-settings`) to open the settings window.
2.  **Settings Management:**

    -   `onSettingsChanged`: Listens for `settings-changed` events from the main process to update the renderer's settings.
    -   `requestSettings`: Sends an IPC message (`request-settings`) to request the current settings.
    -   `updateSettings`: Sends updated settings via IPC (`update-settings`) to the main process.
    -   `sendCurrentSettings`: Sends the current settings via IPC (`current-settings`) when requested.
    -   `onRequestCurrentSettings`: Listens for `send-current-settings` events to respond with current settings.
3.  **Mindmap Operations:**

    -   `saveMap`: Invokes the `save-map` IPC handler in the main process with mindmap data.
    -   `loadMap`: Invokes the `load-map` IPC handler to retrieve mindmap data.
4.  **UUID Generation:**

    -   `generateUUID`: Invokes the `generate-uuid` IPC handler to obtain a unique identifier for nodes.
5.  **File Handling:**

    -   `onOpenMindmap`: Listens for `open-mindmap` events to handle opening `.mindmap` files.
    -   `onMindmapData`: Receives `mindmap-data` from the main process.
    -   `onMindmapError`: Receives `mindmap-error` messages in case of failures.

**Security Considerations:**

-   **Context Isolation:** Enabled (`contextIsolation: true`) to prevent the renderer from accessing Node.js APIs directly.
-   **Selective Exposure:** Only necessary APIs are exposed, minimizing potential security risks.

**Example Usage:** In `renderer.js`, to open the settings window:

```
window.electronAPI.openSettings();

```

main.js
-------

**Purpose:** Serves as the backbone of the Electron application, managing window creation, handling IPC communications, performing file operations (saving/loading mindmaps), and overseeing the application's lifecycle events.

**Key Functionalities:**

1.  **Window Creation:**

    -   **Main Window (`createMainWindow`):**
        -   Dimensions: 1200x800 pixels.
        -   Loads `index.html`.
        -   Disables Node.js integration and enables context isolation for security.
    -   **Settings Window (`openSettingsWindow`):**
        -   Dimensions: 400x400 pixels.
        -   Modal window parented to the main window.
        -   Loads `settings.html`.
        -   Ensures only one settings window exists at a time.
2.  **Default Settings:**

    ```
    let defaultSettings = {
        connectionRouting: 'bezier',
        gridSize: 50,
        backgroundColor: '#ffffff'
    };

    ```

    -   **Purpose:** Provides baseline settings that can be customized by the user.
3.  **IPC Handlers:**

    -   **Opening Settings:**

        ```
        ipcMain.on('open-settings', () => {
            openSettingsWindow();
        });

        ```

        -   Listens for `open-settings` messages to open the settings window.
    -   **Settings Management:**

        -   **Requesting Settings:**

            ```
            ipcMain.on('request-settings', () => {
                if (mainWindow) {
                    mainWindow.webContents.send('send-current-settings', defaultSettings);
                }
            });

            ```

            -   Sends current settings to the renderer upon request.
        -   **Receiving Current Settings:**

            ```
            ipcMain.on('current-settings', (event, settings) => {
                if (settingsWindow) {
                    settingsWindow.webContents.send('settings-changed', settings);
                } else {
                    defaultSettings = { ...defaultSettings, ...settings };
                }
            });

            ```

            -   Updates settings based on renderer's response.
        -   **Updating Settings:**

            ```
            ipcMain.on('update-settings', (event, newSettings) => {
                defaultSettings = { ...defaultSettings, ...newSettings };
                if (mainWindow) {
                    mainWindow.webContents.send('settings-changed', newSettings);
                }
            });

            ```

            -   Receives new settings and broadcasts changes to the main window.
    -   **Mindmap Operations:**

        -   **Saving Mindmap (`save-map`):**

            ```
            ipcMain.handle('save-map', async (event, mindmapData) => {
                // Packaging logic using AdmZip
                // Prompts user for save location
                // Returns success or error response
            });

            ```

            -   Packages `mindmap.json` and images into a ZIP archive.
            -   Uses Electron's `dialog` module to prompt the user for a save location.
        -   **Loading Mindmap (`load-map`):**

            ```
            ipcMain.handle('load-map', async () => {
                // Loading logic using AdmZip
                // Parses `mindmap.json` and images
                // Returns mindmap data or error
            });

            ```

            -   Extracts and parses a `.mindmap` ZIP archive.
            -   Sends the parsed data back to the renderer.
    -   **UUID Generation (`generate-uuid`):**

        ```
        ipcMain.handle('generate-uuid', () => {
            return uuidv4();
        });

        ```

        -   Generates and returns a unique identifier for nodes.
4.  **File Handling:**

    -   **Single Instance Lock:**
        -   Ensures only one instance of the application runs at a time.
        -   Handles additional instances attempting to open `.mindmap` files gracefully.
    -   **Opening Mindmap Files (`handleOpenMindmapFile`):**

        ```
        async function handleOpenMindmapFile(event, filePath) {
            // Parses the ZIP archive
            // Extracts and embeds image data
            // Sends mindmap data to the renderer
            // Handles errors gracefully
        }

        ```

        -   Processes `.mindmap` files, extracting necessary data for rendering.
5.  **Application Lifecycle:**

    -   **Event Listeners:**
        -   `app.on('second-instance')`: Handles attempts to open additional instances.
        -   `app.on('open-file')`: macOS-specific event for opening files.
        -   `app.whenReady()`: Initializes the main window or opens a mindmap file if provided.
        -   `app.on('activate')`: macOS behavior for reactivating the app.
        -   `app.on('window-all-closed')`: Quits the application except on macOS.

**Example Workflow: Loading a Mindmap**

1.  User selects **"Load"** from the toolbar.
2.  Renderer invokes `electronAPI.loadMap()`.
3.  Main process handles `load-map`, prompting the user to select a file.
4.  Parses the selected `.mindmap` file, extracting `mindmap.json` and images.
5.  Sends the parsed data back to the renderer.
6.  Renderer updates the canvas with the loaded mindmap.

renderer.js
-----------

**Purpose:** Manages the frontend logic, including rendering the mindmap on the canvas, handling user interactions (dragging, zooming, selecting), managing undo/redo operations, and communicating with the main process via IPC.

**Key Components:**

1.  **Canvas Initialization:**

    ```
    const canvas = document.getElementById('mindmap');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ```

    -   Sets up the canvas to fill the entire window.
    -   Adjusts dimensions on window resize.
2.  **Data Structures:**

    -   **Nodes (`nodes`):** Array holding all nodes (post-it notes and images).
    -   **Connections (`connections`):** Array holding all connections between nodes.
    -   **Settings (`settings`):** Object holding current application settings like connection routing, grid size, and colors.
    -   **Undo/Redo Stacks (`undoStack`, `redoStack`):** Arrays managing the history of actions for undoing or redoing.
3.  **User Interactions:**

    -   **Adding Nodes:**
        -   **Post-It Notes:** Triggered via the **"Add Post-It"** button, creating a new node with default dimensions and content.
        -   **Images:** Added via drag-and-drop or paste, with automatic scaling to predefined maximum dimensions.
    -   **Dragging and Panning:**
        -   Nodes can be dragged across the canvas.
        -   Panning is achieved by middle mouse button dragging or two-finger gestures on touch devices.
    -   **Zooming:**
        -   Handled via the mouse wheel, adjusting the `scale` and `offsetX/Y` to zoom around the cursor position.
        -   Clamped between predefined minimum and maximum scales to prevent excessive zooming.
    -   **Resizing Nodes:**
        -   Nodes have resize handles (small squares) at their bottom-right corner.
        -   Dragging these handles adjusts the node's dimensions, maintaining aspect ratios for images.
    -   **Connecting Nodes:**
        -   Connection circles on node edges can be clicked and dragged to create connections.
        -   Supports different routing styles (Bezier, Orthogonal) based on settings.
    -   **Selecting Multiple Nodes/Connections:**
        -   Use selection rectangles by dragging the mouse to encompass multiple elements.
        -   Shift-clicking allows for adding or removing individual elements from the selection.
    -   **Editing Node Content:**
        -   Double-clicking a post-it note opens an editable textarea overlay for content modification.
4.  **Rendering Logic:**

    -   **drawMap Function:**
        -   Clears and redraws the canvas based on the current state.
        -   Renders the grid, connections, nodes, connection circles, and selection rectangles.
        -   Ensures proper layering (connections beneath nodes).
        -   Applies visual feedback like highlighting hovered elements or selected nodes.
    -   **Helper Functions:**
        -   **getEdgeCircles:** Calculates positions for connection circles on node edges.
        -   **drawResizeHandles:** Renders resize handles for nodes.
        -   **drawText:** Handles text rendering within post-it notes, including wrapping and truncation.
        -   **isPointNearLine:** Determines if a point is near a connection line for selection.
        -   **snapToGrid:** Aligns positions and sizes to the grid for consistency.
5.  **Undo/Redo Functionality:**

    -   **saveState:** Saves the current state before any change, adding it to the undo stack.
    -   **undo:** Reverts to the previous state by popping from the undo stack and pushing the current state to the redo stack.
    -   **redo:** Reapplies a reverted state by popping from the redo stack and pushing the current state back to the undo stack.
    -   **State Limiting:** The history is limited (`MAX_HISTORY`) to prevent excessive memory usage.
6.  **Color Customization:**

    -   **Pickr Integration:**
        -   The **"Pick Color"** button opens a color picker.
        -   Selecting a color updates the color of the selected node.
    -   **Settings Integration:**
        -   Listens for `settings-changed` events to apply global color settings (e.g., post-it colors).
7.  **Inter-Process Communication:**

    -   **Receiving Mindmap Data:**
        -   Listens for `mindmap-data` events to load and render mindmaps.
    -   **Handling Errors:**
        -   Listens for `mindmap-error` events to alert users of issues during file operations.
    -   **Settings Synchronization:**
        -   Requests current settings upon loading.
        -   Updates settings based on changes from the settings window.
8.  **Event Listeners:**

    -   **Pointer Events:**
        -   Unified handling for mouse and touch interactions via pointer events.
    -   **Keyboard Shortcuts:**
        -   `Ctrl+Z` / `Cmd+Z`: Undo.
        -   `Ctrl+Y` / `Cmd+Y`: Redo.
        -   `Ctrl+S` / `Cmd+S`: Save.
        -   `Ctrl+O` / `Cmd+O`: Load.
        -   `Backspace` / `Delete`: Remove selected nodes or connections.
    -   **Canvas Interactions:**
        -   Double-clicking opens the content editor for post-it notes.
        -   Dragging and dropping images or pasting from the clipboard adds image nodes.

**Example Workflow: Editing Node Content**

1.  User double-clicks on a post-it note.
2.  An editable textarea appears over the node's position.
3.  User modifies the text and clicks outside the textarea or presses `Enter`.
4.  The node's content updates, and the textarea is removed.

* * * * *
