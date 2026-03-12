# PlantUML diagrams

If the VS Code preview does not render `.puml` files, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\scripts\render_diagrams.ps1
```

By default this renders all diagrams from `docs/diagrams` into `.tmp/diagrams`.

Workspace settings also force UTF-8 and pass `-charset UTF-8` to PlantUML preview.
