import { cookies } from "next/headers";
import AdminTimesheetDashboard from "@/components/timesheet/AdminTimesheetDashboard";

export default async function AdminTimesheetPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const now = new Date();

  if (!token) {
    return (
      <AdminTimesheetDashboard
        initialEntries={[]}
        initialUsers={[]}
        initialError="No autorizado. Inicia sesión."
        initialPeriodYear={now.getFullYear()}
        initialPeriodMonth={now.getMonth()}
      />
    );
  }

  let entries = [];
  let users = [];
  let error: string | null = null;
  let usersError: string | null = null;

  try {
    const [timesheetsRes, usersRes] = await Promise.all([
      fetch("http://localhost:8000/api/timesheet/", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }),
      fetch("http://localhost:8000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }),
    ]);

    if (timesheetsRes.ok) {
      const rawEntries = await timesheetsRes.json();
      entries = Array.isArray(rawEntries)
        ? rawEntries.map((entry: any) => ({
            ...entry,
            username: entry.user_name || entry.username || "Usuario",
            date: entry.entries?.[0]?.date || entry.period_start || entry.created_at,
            activities: entry.entries || entry.activities || [],
          }))
        : [];
    } else {
      error = `No se pudo cargar el resumen. ${timesheetsRes.status} ${timesheetsRes.statusText}`;
    }

    if (usersRes.ok) {
      users = await usersRes.json();
    } else {
      usersError = `No se pudo cargar la lista de usuarios. ${usersRes.status} ${usersRes.statusText}`;
    }
  } catch (fetchError) {
    const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
    error = `Error de conexión con el backend. ${message}`;
    usersError = usersError || `Error de conexión con el backend. ${message}`;
  }

  return (
    <AdminTimesheetDashboard
      initialEntries={entries}
      initialUsers={users}
      initialError={error}
      initialUsersError={usersError}
      initialPeriodYear={now.getFullYear()}
      initialPeriodMonth={now.getMonth()}
    />
  );
}
