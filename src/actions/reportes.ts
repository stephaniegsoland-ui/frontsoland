"use server";

import { cookies } from "next/headers";

const API_URL = "http://localhost:8000";

type JsonRecord = Record<string, unknown>;

async function fetchJson(path: string, token: string): Promise<unknown> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object") : [];
}

export async function fetchReportsData() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return {
    authenticated: false,
    adminOverview: null,
    companies: [],
    invoices: [],
    inventory: [],
    procurement: [],
    timesheets: [],
    security: [],
    fleet: [],
    peajes: [],
    environment: { talks: [], drills: [], documents: [] },
  };

  const [adminOverview, companies, invoices, inventory, procurement, timesheets, security, fleet, peajes, environmentTalks, environmentDrills, environmentDocuments] = await Promise.all([
    fetchJson("/api/admin/overview", token),
    fetchJson("/api/admin/companies/", token),
    fetchJson("/api/admin/invoices", token),
    fetchJson("/api/inventary/items", token),
    fetchJson("/api/procura/", token),
    fetchJson("/api/timesheet/", token),
    fetchJson("/api/security/epp/history", token),
    fetchJson("/api/vehicle/", token),
    fetchJson("/api/admin/peaje/", token),
    fetchJson("/api/environment/talks", token),
    fetchJson("/api/environment/drills", token),
    fetchJson("/api/environment/documents", token),
  ]);

  return {
    authenticated: true,
    adminOverview: adminOverview && typeof adminOverview === "object" ? adminOverview as JsonRecord : null,
    companies: asArray(companies),
    invoices: asArray(invoices),
    inventory: asArray(inventory),
    procurement: asArray(procurement),
    timesheets: asArray(timesheets),
    security: asArray(security),
    fleet: asArray(fleet),
    peajes: asArray(peajes),
    environment: {
      talks: asArray(environmentTalks),
      drills: asArray(environmentDrills),
      documents: asArray(environmentDocuments),
    },
  };
}
