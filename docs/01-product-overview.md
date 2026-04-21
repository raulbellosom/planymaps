# 01 - Product Overview

## Product name

Working name: **Planymaps - Collaborative Canvas**

## Product purpose

Provide teams with a collaborative visual workspace where they can:

- annotate plans or operational layouts
- place pins and markers
- manage layered visual information
- collaborate on the same board
- support desktop, tablet, and mobile workflows
- optionally work against a map or a georeferenced image

## Primary use cases

1. Upload a layout image and annotate it
2. Place operational pins with notes and statuses
3. Draw zones, routes, or issue areas
4. Organize content into layers
5. Lock or hide layers and objects
6. Control opacity of layers and objects
7. Reorder visual elements using a layer/object panel
8. Use touch gestures on phones and tablets
9. Optionally capture or assign geolocation to uploaded photos
10. Later, switch a board to map-aware mode

## User roles

- Workspace owner
- Workspace admin
- Editor
- Viewer

## Product modes

### Mode A - Visual board

A pure visual board that can use:

- a blank canvas
- a background image
- a reference plan
- layers and shapes
- notes and pins

### Mode B - Geo-aware board

A board with optional geographic awareness:

- map base layer
- coordinate-aware pins
- optional geolocated photos
- optional polygons/paths

## Success criteria

- The editor feels responsive on desktop and mobile
- Layers and object ordering are understandable and reliable
- Touch gestures do not conflict with selection and editing
- Image-heavy boards remain usable
- The backend model supports future map and collaboration growth

## Constraints

- Prefer free, self-hostable, production-safe choices
- Maps may become the only paid dependency later, but the first implementation must use free options when possible
- The app must not be architected as one giant unstructured canvas state blob
