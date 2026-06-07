interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * OpenF1 MCP — real-time & historical Formula 1 data.
 *
 * OpenF1 exposes live / session-level F1 timing & telemetry: Grand Prix
 * weekends (meetings), sessions (Race / Qualifying / Practice), drivers,
 * and lap-by-lap timing. Keyless, all GET, responses are arrays.
 */


const BASE = 'https://api.openf1.org/v1';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_meetings',
    description:
      'List Formula 1 meetings (Grand Prix weekends). Live race data source. Filter by year and/or country. Returns meeting_key, official name, country, circuit, location, date.',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Season year, e.g. 2024.' },
        country_name: { type: 'string', description: 'Host country, e.g. "Bahrain", "Italy".' },
      },
    },
  },
  {
    name: 'get_sessions',
    description:
      'List F1 sessions (a Race, Qualifying, or Practice within a Grand Prix weekend). Use to find the session_key needed for drivers/laps. Filter by year, country, session_name ("Race","Qualifying","Practice 1"), or meeting_key.',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Season year, e.g. 2024.' },
        country_name: { type: 'string', description: 'Host country, e.g. "Bahrain".' },
        session_name: { type: 'string', description: "e.g. 'Race', 'Qualifying', 'Practice 1'." },
        meeting_key: { type: 'number', description: 'Restrict to one Grand Prix weekend (from get_meetings).' },
      },
    },
  },
  {
    name: 'get_drivers',
    description:
      'List F1 drivers entered in a session (live race data): number, full name, 3-letter acronym, team, team colour, country, headshot. session_key="latest" for the most recent / ongoing session.',
    inputSchema: {
      type: 'object',
      properties: {
        session_key: {
          type: ['number', 'string'],
          description: "Session key, or 'latest' for the most recent session. Default 'latest'.",
        },
        driver_number: { type: 'number', description: 'Restrict to a single driver, e.g. 1, 44.' },
      },
    },
  },
  {
    name: 'get_laps',
    description:
      'Lap times / telemetry for an F1 session: per-lap duration, sector times, speed-trap, pit-out flag. Live race data. session_key="latest" for the most recent / ongoing session. Optionally filter by driver_number or lap_number.',
    inputSchema: {
      type: 'object',
      properties: {
        session_key: {
          type: ['number', 'string'],
          description: "Session key, or 'latest' for the most recent session. Required.",
        },
        driver_number: { type: 'number', description: 'Restrict to a single driver, e.g. 1, 44.' },
        lap_number: { type: 'number', description: 'Restrict to a single lap.' },
      },
      required: ['session_key'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_meetings': {
      const qs = buildQuery({ year: args.year, country_name: args.country_name });
      const data = await f1Get(`/meetings${qs}`);
      if (isError(data)) return data;
      return (asArray(data)).map((m) => ({
        meeting_key: m.meeting_key,
        name: m.meeting_official_name || m.meeting_name,
        country: m.country_name,
        circuit: m.circuit_short_name,
        location: m.location,
        date_start: m.date_start,
        year: m.year,
      }));
    }
    case 'get_sessions': {
      const qs = buildQuery({
        year: args.year,
        country_name: args.country_name,
        session_name: args.session_name,
        meeting_key: args.meeting_key,
      });
      const data = await f1Get(`/sessions${qs}`);
      if (isError(data)) return data;
      return (asArray(data)).map((s) => ({
        session_key: s.session_key,
        meeting_key: s.meeting_key,
        session_name: s.session_name,
        session_type: s.session_type,
        country: s.country_name,
        circuit: s.circuit_short_name,
        date_start: s.date_start,
        date_end: s.date_end,
        year: s.year,
      }));
    }
    case 'get_drivers': {
      const sessionKey = args.session_key ?? 'latest';
      const qs = buildQuery({ session_key: sessionKey, driver_number: args.driver_number });
      const data = await f1Get(`/drivers${qs}`);
      if (isError(data)) return data;
      return (asArray(data)).map((d) => ({
        driver_number: d.driver_number,
        full_name: d.full_name,
        acronym: d.name_acronym,
        team: d.team_name,
        team_colour: d.team_colour,
        country: d.country_code,
        headshot: d.headshot_url,
      }));
    }
    case 'get_laps': {
      const sessionKey = args.session_key;
      if (sessionKey === undefined || sessionKey === null || sessionKey === '') {
        throw new Error("Required argument \"session_key\" is missing. Pass a session key or 'latest'.");
      }
      const qs = buildQuery({
        session_key: sessionKey,
        driver_number: args.driver_number,
        lap_number: args.lap_number,
      });
      const data = await f1Get(`/laps${qs}`);
      if (isError(data)) return data;
      return {
        laps: (asArray(data)).slice(0, 200).map((l) => ({
          driver_number: l.driver_number,
          lap_number: l.lap_number,
          lap_duration: l.lap_duration ?? null,
          is_pit_out_lap: l.is_pit_out_lap,
          st_speed: l.st_speed,
          sector_1: l.duration_sector_1 ?? null,
          sector_2: l.duration_sector_2 ?? null,
          sector_3: l.duration_sector_3 ?? null,
        })),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function f1Get(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    const message = await res.text().then((t) => t.slice(0, 500)).catch(() => '');
    return { error: res.status, message };
  }
  return res.json();
}

function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

function asArray(data: unknown): Array<Record<string, any>> {
  return Array.isArray(data) ? (data as Array<Record<string, any>>) : [];
}

function isError(data: unknown): data is { error: number; message: string } {
  return typeof data === 'object' && data !== null && 'error' in (data as Record<string, unknown>);
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
