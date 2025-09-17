# Developer Tools Documentation

## Overview
This document describes the comprehensive developer tools system implemented for the MyAnts simulation. These tools are designed to help diagnose issues, understand simulation behavior, and optimize performance.

## Components

### 1. DevToolsPanel (`src/renderer/components/DevToolsPanel.tsx`)

A comprehensive debug panel with multiple tabs for different diagnostic views:

#### Features:
- **Overview Tab**: General simulation status, ant statistics, spatial distribution
- **Ants Tab**: Detailed ant inspection, task analysis, visual overlay controls
- **Environment Tab**: Food sources, pheromone fields, weather conditions
- **Performance Tab**: Real-time metrics, performance history, simulation controls
- **Debug Tab**: Raw data export, debug console, technical information

#### Key Capabilities:
- Real-time performance monitoring with history tracking
- Individual ant inspection with detailed state information
- Task distribution analysis and caste breakdown
- Spatial distribution metrics (X/Z spread analysis)
- Memory usage tracking and trend analysis
- Simulation control interface (play, pause, step, speed control)

### 2. VisualDebugRenderer (`src/renderer/components/VisualDebugRenderer.ts`)

Provides visual debugging overlays in the 3D scene:

#### Visual Overlays:
- **Ant Paths**: Shows movement trails from nest to current position
- **Vision Cones**: Displays ant detection/vision ranges as 3D cones
- **Food Detection Ranges**: Circular overlays showing foraging detection radius
- **Ant Labels**: Text labels with ant ID, task, and carrying status
- **Task Colors**: Color-codes ants by their current task
- **Pheromone Trails**: Visualizes pheromone concentration fields
- **Ant Highlighting**: Special highlighting for selected ants with pulsing animation

#### Benefits:
- Immediate visual feedback on ant behavior
- Easy identification of pathfinding issues
- Clear visualization of ant decision-making ranges
- Debugging pheromone system effectiveness

### 3. Enhanced Renderer Integration

Modified `AdvancedThreeJSRenderer.tsx` to include:

#### Developer Features:
- Toggle button to show/hide dev tools
- Integration with visual debug renderer
- Enhanced ant selection with highlighting
- Task-based color coding system
- Improved debugging information display

## Usage Guide

### Accessing Developer Tools

1. **Toggle Dev Tools**: Click the "🔧 Show Dev Tools" button in the top-left corner
2. **Navigation**: Use the tab bar to switch between different diagnostic views
3. **Collapse**: Click the ✕ button or toggle button to hide the panel

### Diagnosing Common Issues

#### Ant Clustering Problems:
1. Check **Overview → Spatial Distribution** for X/Z spread values
2. Use **Ants → Visual Overlays → Vision Cones** to see detection ranges
3. Enable **Task Colors** to identify if ants are assigned proper tasks
4. Look at **Ants → Quick Stats** for task distribution

#### Performance Issues:
1. Monitor **Performance → Current Metrics** for FPS and frame time
2. Check **Performance History** for trends and spikes
3. Review **Memory Trend** for memory leaks
4. Use **Speed Control** to slow down simulation for analysis

#### Behavioral Analysis:
1. **Select individual ants** by clicking on them in the 3D view
2. Review **Selected Ant details** for current state
3. Enable **Ant Paths** to see movement patterns
4. Check **Food Detection** overlays to verify foraging behavior

### Visual Debugging Workflow

1. **Enable Task Colors**: Quickly identify what ants are doing
   - Green: Foraging
   - Brown: Construction  
   - Red: Defense
   - Gray: Resting
   - Yellow: Idle/Other

2. **Use Vision Cones**: Understand ant perception
   - Cone direction shows ant facing
   - Cone size shows detection range
   - Color matches task assignment

3. **Monitor Ant Paths**: Track movement patterns
   - Lines show paths from nest to current position
   - Color indicates task type
   - Helps identify stuck or inefficient ants

4. **Check Detection Ranges**: Verify foraging behavior
   - Circles show food detection radius
   - Green for foraging ants, gray for others
   - Helps debug why ants don't find food

### Data Export

The debug panel includes data export functionality:

- **Export Ant Data**: Downloads complete ant state as JSON
- **Performance Metrics**: Historical performance data
- **Debug Information**: Technical simulation state

### Performance Optimization

Using the tools to optimize performance:

1. **Monitor FPS**: Keep above 30 FPS for smooth simulation
2. **Track Memory**: Watch for increasing memory usage
3. **Analyze Frame Time**: Identify rendering bottlenecks
4. **Entity Count**: Balance ant count vs. performance
5. **Visual Overlays**: Disable unused overlays for better performance

## Technical Implementation

### Architecture:
- **Modular Design**: Each tool is a separate component
- **React Integration**: Uses React hooks for state management
- **Three.js Integration**: Visual overlays rendered directly in 3D scene
- **Performance Optimized**: Minimal impact on simulation performance

### Extension Points:
- **Custom Overlays**: Add new visual debugging in `VisualDebugRenderer`
- **New Metrics**: Extend performance tracking in `DevToolsPanel`
- **Additional Tabs**: Add new diagnostic views to the tab system
- **Data Export**: Extend export functionality for specific analysis needs

## Best Practices

### For Debugging:
1. Start with **Overview** tab to get general understanding
2. Use **Visual Overlays** to see behavior patterns
3. Select **individual ants** to investigate specific issues
4. **Export data** for external analysis when needed

### For Performance:
1. Monitor **Performance** tab during development
2. Use **Step debugging** for detailed analysis
3. **Adjust speed** to observe slow behaviors
4. **Track memory** for leak detection

### For Development:
1. Keep dev tools **open during development**
2. Use **visual feedback** to validate changes
3. **Export data** before and after changes for comparison
4. **Test with different ant counts** to validate scalability

## Troubleshooting

### Common Issues:

1. **Dev Tools Not Showing**: 
   - Check console for React errors
   - Verify component imports

2. **Visual Overlays Not Working**:
   - Ensure Three.js scene is properly initialized
   - Check WebGL context availability

3. **Performance Data Missing**:
   - Verify browser supports Performance API
   - Check memory API availability

4. **Export Not Working**:
   - Ensure browser supports Blob and download APIs
   - Check for popup blockers

## Future Enhancements

Potential improvements:
- **Network Analysis**: Visualize ant communication patterns
- **Heat Maps**: Show density and activity areas
- **Time-series Charts**: Graphical performance trends
- **A/B Testing**: Compare different simulation parameters
- **Replay System**: Record and replay simulation sessions
- **AI Decision Trees**: Visualize ant decision-making process

---

This developer tools system provides comprehensive insights into the ant simulation, enabling effective debugging, performance optimization, and behavioral analysis.