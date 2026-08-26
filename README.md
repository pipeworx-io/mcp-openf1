# mcp-openf1

OpenF1 MCP — real-time & historical Formula 1 data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/openf1/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Openf1 data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
