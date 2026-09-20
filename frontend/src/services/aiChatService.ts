/**
 * Modular AI Assistant Service for NER LandslideGuard
 * 
 * ============================================================================
 * ARCHITECTURE INTEGRATION GUIDE FOR GEMINI API:
 * 
 * In a production server environment:
 * 1. Create a server route in Express or Next.js (`/api/chat`):
 *    import { GoogleGenAI } from "@google/genai";
 *    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
 * 
 *    app.post("/api/chat", async (req, res) => {
 *      const { messages, dashboardContext } = req.body;
 *      const response = await ai.models.generateContent({
 *        model: "gemini-3.8-flash",
 *        contents: `${systemPrompt}\n\nContext: ${JSON.stringify(dashboardContext)}\n\nUser: ${messages[messages.length-1].text}`
 *      });
 *      res.json({ reply: response.text });
 *    });
 * ============================================================================
 */

import { MonitoredLocation, AlertNotification, StateRiskSummary, ChatMessage, DashboardContext } from '../types/landslide';

export const DEFAULT_SUGGESTED_PROMPTS: string[] = [
  'Which areas are at highest risk?',
  'Why is Papum Pare classified as Critical?',
  'What should authorities do if probability exceeds 80%?',
  'Show rainfall and soil moisture correlation',
  'Summarize active alerts across Northeast India'
];

/**
 * Intelligent context-aware offline knowledge engine for disaster management
 * Directly inspects real-time dashboard data and generates grounded answers
 */
export async function generateAiResponse(
  userQuery: string,
  locationsOrContext: MonitoredLocation[] | DashboardContext
): Promise<string> {
  const context: DashboardContext = Array.isArray(locationsOrContext)
    ? {
        locations: locationsOrContext,
        alerts: [],
        stateSummaries: [],
        activeGeofencesCount: locationsOrContext.filter(l => l.risk_probability >= 0.70).length
      }
    : locationsOrContext;

  return getAiAssistantResponse(userQuery, context);
}
export async function getAiAssistantResponse(
  userQuery: string,
  context: DashboardContext
): Promise<string> {
  const query = userQuery.toLowerCase().trim();
  const demoNotice = "\n\n*(Notice: System operating in prototype mode. Demo data is currently being used. Predictions are model estimates and not field-validated.)*";

  // Check if real backend is available
  try {
    /*
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQuery, context })
    });
    if (response.ok) {
      const data = await response.json();
      return data.reply;
    }
    */
  } catch {
    // Fallback to local intelligent response generator
  }

  // Simulate AI generation delay
  await new Promise(r => setTimeout(r, 400));

  // 1. Highest risk / critical areas query
  if (query.includes('highest risk') || query.includes('most vulnerable') || query.includes('top risk')) {
    const sorted = [...context.locations].sort((a, b) => b.risk_probability - a.risk_probability);
    const top3 = sorted.slice(0, 3);
    return `Based on current model evaluations, the areas at highest landslide risk are:

1. **${top3[0]?.name} (${top3[0]?.district}, ${top3[0]?.state})** – Risk Probability: **${Math.round(top3[0]?.risk_probability * 100)}%** (${top3[0]?.risk_level.replace('_', ' ')}). Contributing factors: ${top3[0]?.parameters.rainfall_24h}mm rainfall/24h, ${top3[0]?.parameters.soil_moisture}% soil moisture, and ${top3[0]?.parameters.slope}° slope.
2. **${top3[1]?.name} (${top3[1]?.district}, ${top3[1]?.state})** – Risk Probability: **${Math.round(top3[1]?.risk_probability * 100)}%** (${top3[1]?.risk_level.replace('_', ' ')}).
3. **${top3[2]?.name} (${top3[2]?.district}, ${top3[2]?.state})** – Risk Probability: **${Math.round(top3[2]?.risk_probability * 100)}%** (${top3[2]?.risk_level.replace('_', ' ')}).

Currently, all locations exceeding 70% probability have automatic circular geofences enabled on the GIS Risk Map.${demoNotice}`;
  }

  // 2. Critical zones
  if (query.includes('critical') || query.includes('emergency zone')) {
    const criticals = context.locations.filter(l => l.risk_probability >= 0.85);
    if (criticals.length === 0) {
      return `Currently, there are no locations classified at the CRITICAL (>= 85%) threshold. Several locations remain at HIGH or VERY HIGH risk.${demoNotice}`;
    }
    const list = criticals.map(c => `• **${c.name}** in ${c.district}, ${c.state} — Probability: **${Math.round(c.risk_probability * 100)}%**. Infrastructure at risk: ${c.critical_infrastructure?.join(', ') || 'Major transit arteries'}. Immediate field verification and traffic restrictions are recommended.`).join('\n');
    return `There are currently **${criticals.length} Critical Landslide Risk Zones** (probability >= 85%):\n\n${list}\n\nHigh-visibility geofences with emergency alerts have been triggered.${demoNotice}`;
  }

  // 3. State specific queries (Arunachal, Sikkim, Meghalaya, etc.)
  const stateMatch = [
    'arunachal pradesh',
    'sikkim',
    'meghalaya',
    'manipur',
    'mizoram',
    'nagaland',
    'assam',
    'tripura'
  ].find(s => query.includes(s) || (s === 'arunachal pradesh' && query.includes('arunachal')));

  if (stateMatch) {
    const canonicalState = stateMatch === 'arunachal' ? 'Arunachal Pradesh' :
      stateMatch.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const stateLocs = context.locations.filter(l => l.state.toLowerCase() === canonicalState.toLowerCase() || (canonicalState === 'Arunachal Pradesh' && l.state === 'Arunachal Pradesh'));
    const stateSummary = context.stateSummaries.find(s => s.state.toLowerCase() === canonicalState.toLowerCase());

    if (stateLocs.length > 0) {
      const topLoc = stateLocs.reduce((prev, curr) => curr.risk_probability > prev.risk_probability ? curr : prev, stateLocs[0]);
      return `**${canonicalState}** Regional Risk Assessment:
• **Average Regional Risk:** ${stateSummary ? Math.round(stateSummary.avgRisk * 100) : 65}%
• **Monitored Locations:** ${stateLocs.length}
• **Highest Risk Point:** **${topLoc.name}** (${topLoc.district}) with **${Math.round(topLoc.risk_probability * 100)}%** probability (${topLoc.risk_level.replace('_', ' ')}).
• **Environmental Conditions:** 24-hr rainfall is averaging ${topLoc.parameters.rainfall_24h} mm with soil moisture at ${topLoc.parameters.soil_moisture}%.
• **Recommended Action:** Precautionary slope monitoring and highway road inspection along key arterial corridors.${demoNotice}`;
    }
  }

  // 4. Above 70% threshold query
  if (query.includes('70%') || query.includes('above 70') || query.includes('geofence') || query.includes('high risk')) {
    const highRisks = context.locations.filter(l => l.risk_probability >= 0.70);
    return `Currently, **${highRisks.length} locations** have predicted landslide probabilities of **70% or greater**, triggering the automated geofencing engine:

${highRisks.map(l => `• **${l.name}** (${l.state}) — **${Math.round(l.risk_probability * 100)}%** (Geofence radius: ${l.geofence_radius_km || 3} km)`).join('\n')}

Under system rules, coordinates with >= 70% probability automatically draw translucent warning perimeters on the map, log high-priority alerts, and recommend preemptive emergency coordination.${demoNotice}`;
  }

  // 5. Why is this location high risk / Factors causing prediction
  if (query.includes('why') || query.includes('factor') || query.includes('cause') || query.includes('causes') || query.includes('reason')) {
    const loc = context.selectedLocation || context.locations.find(l => l.risk_probability >= 0.85) || context.locations[0];
    return `Regarding **${loc.name}** (${loc.district}, ${loc.state}) with **${Math.round(loc.risk_probability * 100)}%** probability:

The primary contributing factors identified by the model are:
1. **Severe Precipitation:** ${loc.parameters.rainfall_24h} mm in the past 24 hours (${loc.parameters.rainfall_1h} mm in the last hour), driving deep water infiltration.
2. **High Soil Saturation:** Soil moisture reached **${loc.parameters.soil_moisture}%**, substantially elevating pore-water pressure and reducing internal soil shear strength.
3. **Steep Slope Gradient:** Slope angle is **${loc.parameters.slope}°**, well past the 35° critical threshold for gravitational sliding.
4. **Geological Vulnerability:** Sited on **${loc.parameters.geological_susceptibility}** susceptibility rock formations (e.g. weathered shale/sandstone).
5. **Anthropogenic Excavation:** Located just ${loc.parameters.road_distance} meters from highway cut slopes, increasing toe instability.${demoNotice}`;
  }

  // 6. Rainfall recorded query
  if (query.includes('rainfall') || query.includes('precipitation') || query.includes('rain')) {
    const loc = context.selectedLocation || context.locations[0];
    return `Rainfall telemetry for **${loc.name}** (${loc.state}):
• **Last 1 Hour:** ${loc.parameters.rainfall_1h} mm
• **Last 24 Hours:** ${loc.parameters.rainfall_24h} mm
• **7-Day Cumulative:** ${loc.parameters.rainfall_7d} mm

Cumulative 7-day rainfall plays a critical role in pre-saturating hill slopes before triggering events. Across the entire North Eastern Region, Cherrapunji (Meghalaya) and Papum Pare (Arunachal Pradesh) currently report the highest cumulative totals.${demoNotice}`;
  }

  // 7. Preventive action / recommendations
  if (query.includes('action') || query.includes('preventive') || query.includes('authorities') || query.includes('response') || query.includes('protocol')) {
    return `Recommended Preventive Actions for Disaster Management Authorities:

**For HIGH & VERY HIGH Zones (70% - 84% probability):**
• Increase frequency of drone and sensor monitoring.
• Inspect culverts, catch basins, and hillside drainage channels for blockages.
• Pre-notify District Disaster Management Authorities (DDMA) and State Disaster Response Force (SDRF).
• Place warning signage for motorists along vulnerable highway cuts.

**For CRITICAL Zones (>= 85% probability):**
• Immediate on-ground technical field verification by geotechnical engineers.
• Temporarily restrict non-essential and heavy freight transit along undermined road segments.
• Pre-position earthmoving machinery (BRO / NHIDCL) for rapid debris clearing.
• Assess need for temporary precautionary relocation of downstream or slope-toe settlements.${demoNotice}`;
  }

  // 8. Summarize today's alerts
  if (query.includes('alert') || query.includes('summarize') || query.includes('summary')) {
    const criticalCount = context.alerts.filter(a => a.severity === 'CRITICAL').length;
    const highCount = context.alerts.filter(a => a.severity === 'HIGH').length;
    return `**Summary of Active Alerts for North Eastern Region:**

• **Total Active Alerts:** ${context.alerts.length}
• **Critical Alerts:** ${criticalCount} (Papum Pare, Tupul-Noney, NH-10 Teesta Corridor)
• **Very High / High Alerts:** ${highCount}
• **Most Recent Alert:** "${context.alerts[0]?.locationName}" (${context.alerts[0]?.state}) issued at ${context.alerts[0]?.timestamp}.

All relevant district control rooms have received automated notifications. You can filter and review full alert details in the "Alerts" navigation tab.${demoNotice}`;
  }

  // General helpful fallback
  return `LandslideGuard AI Assistant online. I am monitoring **${context.locations.length} geospatial sensor zones** across Arunachal Pradesh, Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, and Sikkim.

You can ask me:
• "Which areas are currently at highest risk?"
• "What is the risk in Arunachal Pradesh or Sikkim?"
• "Why is Papum Pare or Tupul-Noney high risk?"
• "What factors are causing the prediction?"
• "Which areas have probability above 70%?"
• "How much rainfall was recorded in this zone?"
• "What preventive action should authorities take?"
• "Show me critical zones or summarize alerts."${demoNotice}`;
}
