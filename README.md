# mcp-openf1

OpenF1 MCP — real-time & historical Formula 1 data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_meetings` | List Formula 1 meetings (Grand Prix weekends). Live race data source. Filter by year and/or country. Returns meeting_key, official name, country, circuit, location, date. |
| `get_sessions` | List F1 sessions (a Race, Qualifying, or Practice within a Grand Prix weekend). Use to find the session_key needed for drivers/laps. Filter by year, country, session_name ("Race","Qualifying","Practice 1"), or meeting_key. |
| `get_drivers` | List F1 drivers entered in a session (live race data): number, full name, 3-letter acronym, team, team colour, country, headshot. session_key="latest" for the most recent / ongoing session. |
| `get_laps` | Lap times / telemetry for an F1 session: per-lap duration, sector times, speed-trap, pit-out flag. Live race data. session_key="latest" for the most recent / ongoing session. Optionally filter by driver_number or lap_number. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "openf1": {
      "url": "https://gateway.pipeworx.io/openf1/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Openf1 data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
