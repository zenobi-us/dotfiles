---
name: obsidian-leaflet-mapping
description: Use when creating interactive maps in Obsidian using LeafletJS plugin - covers real-world maps, image maps, markers from notes, overlays, GeoJSON, GPX tracks, and common issues with bounds/zoom levels
---

# Obsidian Leaflet Mapping

## Overview

The Obsidian Leaflet plugin enables interactive maps using LeafletJS without writing JavaScript. Maps are defined in code blocks with YAML parameters and can display real-world locations (OpenStreetMap), custom images (fantasy maps, floor plans), or both layered together.

**Core principle:** Maps are defined declaratively in markdown code blocks. The plugin handles all JavaScript - you just configure parameters.

**Plugin:** https://github.com/javalent/obsidian-leaflet

## Prerequisites

**Required:**
- Obsidian Leaflet plugin (Community Plugins → Search "Leaflet")

**Optional (enables advanced features):**
- **Dataview plugin** - REQUIRED for `markerTag`, `filterTag`, `linksTo`, `linksFrom` features
- Basic understanding of YAML syntax for code blocks
- For real-world maps: coordinates from Google Maps, OpenStreetMap, or GPS devices
- For image maps: image file in vault, known reference measurements for scale

## Quick Start: Complete Working Example

**Goal:** Create a map showing all notes tagged `#visited`

**Step 1: Install plugins**
1. Settings → Community Plugins → Browse
2. Search "Leaflet" → Install → Enable
3. **Search "Dataview" → Install → Enable** (REQUIRED for tag-based markers)
4. Restart Obsidian (recommended after installing plugins)

**Step 2: Create a test note**

Create `New York.md`:
```yaml
---
location: [40.7128, -74.0060]
tags: visited
---

# New York

My trip notes...
```

**Step 3: Create the map**

Create `Travel Map.md`:
````markdown
```leaflet
id: my-travels
markerTag: #visited
height: 500px
```
````

**Expected result:** Map displays with one marker. Click marker → opens New York note.

**If markers don't appear:** See [troubleshooting checklist](#problem-markers-from-notes-not-appearing) below.

## When to Use

**Use this skill when:**
- Creating location-based navigation in vaults (world maps, city maps, building layouts)
- Visualizing geographic data from notes (locations with frontmatter)
- Displaying custom image maps with markers (RPG campaigns, story locations)
- Tracking routes with GPX files or GeoJSON
- Building interactive dashboards with spatial data

**Don't use for:**
- Simple image display (use standard markdown)
- Complex GIS analysis (use dedicated GIS tools)
- Real-time map editing (markers are saved to plugin data)

## Quick Reference

### Basic Map Structure

```markdown
\`\`\`leaflet
id: unique-map-id              # REQUIRED - any unique string
image: [[ImageFile.jpg]]       # Image map (omit for real-world map)
lat: 50                        # Initial latitude (center point)
long: 50                       # Initial longitude (center point)
height: 500px                  # Map container height
width: 100%                    # Map container width
minZoom: 1                     # Minimum zoom level
maxZoom: 10                    # Maximum zoom level
defaultZoom: 5                 # Initial zoom level
\`\`\`
```

### Map Types

| Type | Parameters | Use Case |
|------|-----------|----------|
| **Real-World Map** | Omit `image` parameter | OpenStreetMap, city maps, GPS data |
| **Image Map** | `image: [[File.jpg]]` | Fantasy maps, floor plans, custom artwork |
| **Multi-Layer Image** | `image: [[[Layer1]], [[Layer2]]]` | Maps with toggleable overlays |
| **Custom Tile Server** | `tileServer: <url>\|<alias>` | Alternative map styles (Dark, Satellite) |

### Creating Markers

| Method | Syntax | Editable | Use Case |
|--------|--------|----------|----------|
| **Right-click map** | Interactive UI | Yes | Manual marker placement |
| **Code block** | `marker: type,lat,long,link,desc` | No | Fixed markers in documentation |
| **From note frontmatter** | `markerFile: [[Note]]` | No | Single note as marker |
| **From folder** | `markerFolder: Path/To/Folder` | No | All notes in folder |
| **From tags** | `markerTag: #location` | No | All notes with tag (**Dataview required**) |
| **From links** | `linksTo: [[Note]]` | No | Notes linking to/from (**Dataview required**) |

## Real-World Maps

Default tile server is OpenStreetMap. Add custom tile servers for different styles:

```markdown
\`\`\`leaflet
id: city-map
tileServer: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png|Dark
tileServer: https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png|Hills
osmLayer: false                # Turn off default OpenStreetMap layer
\`\`\`
```

**Tile overlays** (instead of full layer replacement):

```markdown
tileOverlay: https://tiles.example.com/{z}/{x}/{y}.png|Overlay Name|on
```

Append `|on` to enable overlay by default.

## Image Maps

### Critical First Step: Set Bounds

**Before adding markers, define bounds to prevent coordinate confusion:**

```markdown
\`\`\`leaflet
id: fantasy-map
image: [[WorldMap.jpg]]
bounds:
  - [0, 0]           # Top-left corner
  - [100, 100]       # Bottom-right corner
\`\`\`
```

Without bounds, the image stretches to fit arbitrary coordinates. With bounds, latitude/longitude map predictably to image pixels.

**Common bound strategies:**
- `[0,0] to [100,100]` - Percentage-based (lat/long are percentages)
- `[0,0] to [width,height]` - Pixel-based (match image dimensions)
- Custom coordinate system matching your source material

### Multi-Layer Image Maps

Stack multiple images with independent marker sets:

```markdown
\`\`\`leaflet
id: layered-map
image:
  - [[BaseMap.jpg|Base Layer]]
  - [[Roads.png|Roads]]
  - [[Buildings.png|Buildings]]
\`\`\`
```

Layer control box (top-right) toggles layers. Markers saved per-layer.

### Zoom Levels on Image Maps

**Counter-intuitive behavior:** Higher `maxZoom` makes map START farther away.

**Why:** Image is placed at `[0,0]` and stretched to fit. Zoom levels control the *underlying map*, not the image scale.

**Solution:** Set bounds first, then adjust zoom to taste.

```markdown
bounds: [[0,0], [100,100]]
minZoom: 1
maxZoom: 6
defaultZoom: 3
zoomDelta: 0.5          # Finer zoom control
```

## Markers from Notes

**Marker behavior:** Clicking a linked marker opens the note (Ctrl/Cmd-click for new pane). Markers automatically link to their source note when created via frontmatter.

### Finding Coordinates

**Real-world maps:**
- Google Maps: Right-click location → First line shows coordinates
- OpenStreetMap: Share button → "Geo URI" contains coordinates
- GPS device: Export waypoint coordinates

**Image maps:**
- Use `bounds: [[0,0], [100,100]]` for percentage system
- Right-click map after bounds set → coordinates shown on click
- Trial-and-error: Place marker, adjust coordinates in frontmatter

### Note Frontmatter Format

```yaml
---
location: [lat, long]           # REQUIRED for automatic markers (array format only)
mapmarker: custom-icon          # Optional: marker type from settings
mapzoom: [minZoom, maxZoom]     # Optional: visibility breakpoints
mapmarkers:                     # Optional: additional markers
  - [type, [lat, long], "Description", minZoom, maxZoom]
  - [type, [lat, long], "Another marker"]
---
```

**Coordinate format:** Must be array `[lat, long]`. Strings like `"40.7128, -74.0060"` will NOT work.

### Marker Methods

**Single note:**
```markdown
markerFile: [[LocationNote]]
```

**Folder (all notes):**
```markdown
markerFolder: Locations/Cities
markerFolder: Locations/Cities/    # Limit to top-level only (one slash)
```

**By tags (⚠️ REQUIRES DATAVIEW PLUGIN):**
```markdown
markerTag: #location               # Notes with this tag
markerTag: [#city, #visited]       # Notes with BOTH tags
markerTag:
  - #location                      # Notes with #location OR
  - [#city, #capital]              # Notes with both #city AND #capital
```

**For OR logic:** Use separate `markerTag` lines. For AND logic: Use array `[#tag1, #tag2]`.

**Filter results:**
```markdown
markerFolder: Locations
filterTag: #important              # Only show important locations
```

**From link relationships (⚠️ REQUIRES DATAVIEW PLUGIN):**
```markdown
linksTo: [[MainCity]]              # All notes linking to MainCity
linksFrom: [[TravelLog]]           # All notes linked from TravelLog
```

Multiple files: `linksTo: [[[File1]], [[File2]]]`

### Custom Marker Types

Define in plugin settings or `markers.json` in same directory:

```json
[
  {
    "type": "city",
    "icon": "building",
    "color": "#FF0000",
    "layer": true
  },
  {
    "type": "dungeon",
    "icon": "dungeon",
    "color": "#8B4513",
    "layer": true
  }
]
```

Then use in frontmatter: `mapmarker: city`

## Overlays

Circular overlays for areas of effect, regions, etc.

### Interactive Creation

Shift + Right-click → drag → click to set radius

### Code Block Definition

```markdown
overlay: [color, [lat, long], radius unit, "description"]
```

Examples:
```markdown
overlay: [blue, [32, -89], 25 mi, 'Capital region']
overlay:
  - ['rgb(255,0,0)', [50, 50], 10 km, 'Danger zone']
  - ['#00FF00', [60, 60], 500 ft, 'Safe area']
```

**Note:** Overlays draw in order. Smaller overlays behind larger ones become non-interactive.

### Overlays from Note Frontmatter

```yaml
---
location: [50, 50]
mapoverlay: [blue, [50, 50], 25 km, "Influence zone"]
---
```

Or auto-generate from distance tag:

```markdown
\`\`\`leaflet
overlayTag: influence
overlayColor: rgba(0,100,255,0.3)
\`\`\`
```

Note frontmatter: `influence: 50 km`

## GeoJSON and GPX

### GeoJSON

```markdown
geojson: [[File.geojson]]|Optional Alias
geojson:
  - [[Routes.geojson]]
  - [[Regions.geojson]]|Regions|[[LinkedNote]]
geojsonColor: #FF0000            # Default color
```

GeoJSON features can include:
- `title`, `description`, or `name` → tooltip
- MapBox SimpleStyle properties → styling
- Drawn in order specified (layer order matters)

### GPX (GPS tracks)

```markdown
gpx: [[Track.gpx]]
gpx:
  - [[Hike1.gpx]]
  - [[Hike2.gpx]]
gpxColor: #00FF00
gpxMarkers:
  start: start-marker-type       # From plugin settings
  waypoint: waypoint-type
```

GPX files show:
- Route line (colored by speed/elevation/heartrate if data present)
- Optional start/end/waypoint markers
- Interactive datapoint display (click track)

## Common Patterns

### Campaign Map with Location Notes

```markdown
\`\`\`leaflet
id: campaign-world
image: [[WorldMap.jpg]]
bounds: [[0,0], [100,100]]
markerFolder: Locations/Cities
markerFolder: Locations/Dungeons
markerTag: #location
filterTag: #visited
defaultZoom: 3
\`\`\`
```

### Travel Dashboard with GPX

```markdown
\`\`\`leaflet
id: travel-routes
lat: 40
long: -100
gpxFolder: Travel/2024
gpxColor: #FF6600
gpxMarkers:
  start: trip-start
  waypoint: stop
\`\`\`
```

### Multi-Layer Fantasy Map

```markdown
\`\`\`leaflet
id: kingdom-map
image:
  - [[Base.jpg|Terrain]]
  - [[Political.png|Borders]]
  - [[Trade.png|Routes]]
bounds: [[0,0], [1000,1000]]
markerTag: #city
overlayTag: territory
overlayColor: rgba(100,100,255,0.2)
\`\`\`
```

## Common Mistakes

### Problem: Markers appear in wrong locations on image maps

**Cause:** No bounds defined. Without bounds, Leaflet uses arbitrary coordinate space and your image stretches unpredictably.

**Why this happens:** Image maps overlay images onto Leaflet's default coordinate system. Without explicit bounds, the plugin has no way to map your coordinates (e.g., `[50, 50]`) to specific pixels on your image.

**Fix:** 
1. Set bounds FIRST before placing any markers:
```markdown
bounds: [[0,0], [100,100]]
```
2. Delete existing markers (they're in wrong coordinate system)
3. Place markers again - they'll now appear where you click

**Finding correct coordinates on image:** After setting bounds, Shift+click map to see coordinates, use those in frontmatter.

### Problem: Can't zoom in enough / Map starts too far away

**Cause:** Image maps: zoom controls underlying map, not image scale

**Fix:** 
1. Set bounds to match coordinate system
2. Adjust `maxZoom` (lower number = closer default view)
3. Use `zoomDelta: 0.5` for finer control

### Problem: Markers from notes not appearing

**Quick diagnostic:**
1. Open note with location → does frontmatter show `location: [40.7128, -74.0060]`? (array format)
2. Using `markerTag`/`filterTag`/`linksTo`/`linksFrom`? → Is Dataview plugin installed AND enabled?
3. Try restarting Obsidian (plugins sometimes need restart to activate)

**Full checklist:**
- [ ] Note has `location: [lat, long]` in frontmatter (exact format - array only, not string)
- [ ] Tags work for both YAML (`tags: visited`) and inline (`#visited` in note body)
- [ ] Coordinates are within map bounds (check min/max lat/long)
- [ ] Using `markerTag`, `filterTag`, `linksTo`, or `linksFrom`? **Dataview plugin must be installed and enabled** (hard dependency)
- [ ] Verify Dataview works: Create a note with `dataview` code block to confirm plugin active
- [ ] Using `filterTag`? Check note has ALL required tags
- [ ] Marker zoom breakpoints (`mapzoom`) within map's `minZoom`/`maxZoom`?
- [ ] For real-world maps: valid lat/long (lat: -90 to 90, long: -180 to 180)
- [ ] For image maps: coordinates match your bounds system
- [ ] Map doesn't specify `lat`/`long`/`defaultZoom`? Default centers on [50% world map]. Add `showAllMarkers: true` to auto-fit all markers.

### Problem: GeoJSON/GPX files not loading

**Causes:**
- File path incorrect (use wikilink `[[file.geojson]]` or relative path)
- Large files slow rendering (check console for errors)
- JSON syntax errors in GeoJSON

**Fix:** Validate GeoJSON at https://geojsonlint.com/

### Problem: Overlays not interactive / Markers hidden under overlay

**Cause:** Drawing order matters. Overlays and markers drawn later appear on top.

**Fix:** 
- Overlays obscuring other overlays: Reorder in code block (larger overlays last)
- Overlays obscuring markers: Use semi-transparent colors `rgba(255,0,0,0.3)` or reduce overlay radius
- Markers below overlay: Markers from `markerTag`/`markerFolder` draw AFTER overlays in code block

### Problem: Custom tile server not working

**Checklist:**
- [ ] URL contains `{z}`, `{x}`, `{y}` placeholders
- [ ] Server allows public access (no API key required)
- [ ] Using `tileOverlay` instead of `tileServer` if layering over base map
- [ ] Check browser console for CORS or 404 errors

## Distances and Measurements

**Display distance between two points:**
- Shift/Alt + click location 1
- Shift/Alt + click location 2
- Distance appears in bottom-left control box

**Scale and units:**
```markdown
unit: miles               # Display unit
scale: 1.5               # Scale factor for image maps
```

For image maps, measure a known distance on your image, calculate scale:
`scale = real_distance / measured_pixel_distance`

## Advanced Features

### Initial View from Note

```markdown
coordinates: [[CityNote]]        # Note with location frontmatter
zoomTag: viewDistance           # Read zoom from note's frontmatter
```

CityNote frontmatter:
```yaml
location: [40, -100]
viewDistance: 50 miles
```

### Marker Zoom Breakpoints

Show/hide markers at zoom levels (prevent clutter):

```yaml
mapzoom: [3, 7]          # Only visible between zoom 3-7
```

Or per-marker in code block:
```markdown
marker: city,40,-100,[[Note]],"Description",3,7
```

### Draw Mode

```markdown
draw: true               # Enable drawing tools
drawColor: #FF0000       # Default shape color
```

Right-click drawn shapes to edit/delete. Shapes saved to map instance.

### Dark Mode

```markdown
darkMode: true           # CSS filter inversion
```

Customize in CSS snippet targeting `.leaflet-container .dark-mode`

## Real-World Impact

**Use cases from community:**
- **TTRPG campaigns:** World maps with 100+ location notes, auto-updating as players discover areas
- **Research:** GeoJSON datasets visualized with linked analysis notes
- **Travel journals:** GPX tracks from Apple Health + journal entries as markers
- **Urban planning:** Building layouts with image overlays for different floors
- **Story writing:** Character location tracking across plot timeline

**Performance notes:**
- 50+ markers: Minimal impact
- 200+ markers: Noticeable load time
- Large GeoJSON/GPX: Consider splitting files
- Multiple maps per note: Works fine, independent instances
