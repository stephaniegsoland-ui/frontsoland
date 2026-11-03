"use client";

import { useEffect, useState, type FormEvent } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, Flex, Heading, HStack, Input, SimpleGrid, Text, Textarea, VStack } from "@chakra-ui/react";
import { Bell, Building2, ClipboardList, KeyRound, LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { changeCurrentPassword, disableCurrentMfa, enableCurrentMfa, getAuditLog, getSystemSettings, getUserPreferences, listUsersForSettings, logout, revokeCurrentUserSessions, saveSystemSettings, saveUserModulePermissions, saveUserPreferences, setupCurrentMfa, updateCurrentProfile, type AuditLogEntry, type MFASetupResponse, type SystemSettings, type UserPreferences, type UserProfileUpdate, type UserRead } from "@/actions/auth";
import { MODULE_OPTIONS } from "@/lib/permissions";
import { applyUiAccessibilityPreferences } from "@/components/ui/color-mode";

type EditableProfile = {
  username: string;
  email: string;
  nombre_completo: string;
  department: string;
  cargo: string;
  hoja_vida: string;
};

const defaultPreferences: UserPreferences = {
  notifications_enabled: true,
  browser_notifications: false,
  document_expiry_days: null,
  timezone: "America/Caracas",
  language: "es-VE",
  density: "comfortable",
  text_size: "normal",
  reduce_motion: false,
};

const defaultSystemSettings: SystemSettings = {
  company_name: "Soland",
  support_email: null,
  support_phone: null,
  company_address: null,
  default_timezone: "America/Caracas",
  expiry_reminder_days: [30, 7, 1],
  ocr_language: "auto",
  max_document_upload_mb: 15,
};
const reminderOptions = [60, 30, 14, 7, 1];
const timezoneOptions = ["America/Caracas", "America/Lima", "America/Bogota", "America/Santiago", "UTC"];

function profileFromUser(user: UserRead): EditableProfile {
  return {
    username: user.username || "",
    email: user.email || "",
    nombre_completo: user.nombre_completo || "",
    department: user.department || "",
    cargo: user.cargo || "",
    hoja_vida: user.hoja_vida || "",
  };
}

function roleLabel(user: UserRead) {
  if (user.is_superuser || user.level === 1) return "Administrador";
  if (user.level === 2) return "Supervisor";
  return "Operador";
}

export default function SettingsClient({ user }: { user: UserRead }) {
  const router = useRouter();
  const isAdmin = user.level === 1 || user.is_superuser;
  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [mfaSetup, setMfaSetup] = useState<MFASetupResponse | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(Boolean(user.mfa_enabled));
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
  const [mfaCurrentPassword, setMfaCurrentPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [mfaMessage, setMfaMessage] = useState("");
  const [sessionsRevoking, setSessionsRevoking] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [managedUsers, setManagedUsers] = useState<UserRead[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [modulePermissions, setModulePermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(isAdmin);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [permissionsMessage, setPermissionsMessage] = useState("");
  const [permissionsError, setPermissionsError] = useState("");
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [systemSaving, setSystemSaving] = useState(false);
  const [systemMessage, setSystemMessage] = useState("");
  const [systemError, setSystemError] = useState("");
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditError, setAuditError] = useState("");

  const allowedModules = user.level === 1 || user.permissions == null
    ? MODULE_OPTIONS
    : MODULE_OPTIONS.filter((module) => user.permissions?.includes(module.key));
  const effectiveReminderDays = preferences.document_expiry_days ?? systemSettings.expiry_reminder_days;

  useEffect(() => {
    let active = true;
    void Promise.all([getUserPreferences(), getSystemSettings()]).then(([result, systemResult]) => {
      if (!active) return;
      if ("data" in result && result.data) setPreferences(result.data);
      else if ("error" in result) setPreferencesError(result.error || "No se pudieron cargar tus preferencias.");
      if ("data" in systemResult && systemResult.data) setSystemSettings(systemResult.data);
      if ("data" in result && result.data) {
        localStorage.setItem("soland-ui-preferences", JSON.stringify(result.data));
        applyUiAccessibilityPreferences(result.data);
      }
      setPreferencesLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    void Promise.all([listUsersForSettings(), getAuditLog()]).then(([result, auditResult]) => {
      if (!active) return;
      if ("error" in result) {
        setPermissionsError(result.error || "No se pudieron cargar los usuarios.");
        setPermissionsLoading(false);
      } else {
        const otherUsers = result.users.filter((candidate) => candidate.id !== user.id);
        setManagedUsers(otherUsers);
        if (otherUsers[0]) {
          setSelectedUserId(otherUsers[0].id);
          setModulePermissions(otherUsers[0].permissions ?? MODULE_OPTIONS.map((module) => module.key));
        }
        setPermissionsLoading(false);
      }
      if ("data" in auditResult && auditResult.data) setAuditEntries(auditResult.data);
      if ("error" in auditResult) setAuditError(auditResult.error || "No se pudo cargar la bitácora.");
    });
    return () => { active = false; };
  }, [isAdmin, user.id]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    setProfileError("");
    const payload: UserProfileUpdate = {
      username: profile.username.trim(),
      email: profile.email.trim(),
      nombre_completo: profile.nombre_completo.trim(),
      department: profile.department.trim(),
      cargo: profile.cargo.trim(),
      hoja_vida: profile.hoja_vida.trim(),
    };
    try {
      const result = await updateCurrentProfile(payload);
      if ("error" in result) {
        setProfileError(result.error || "No se pudo guardar el perfil.");
        return;
      }
      if (result.user) setProfile(profileFromUser(result.user));
      setProfileMessage("Los datos del perfil se guardaron.");
      router.refresh();
    } catch (caught) {
      setProfileError(caught instanceof Error ? caught.message : "No se pudo guardar el perfil.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setPasswordSaving(true);
    try {
      const result = await changeCurrentPassword({ current_password: currentPassword, new_password: newPassword });
      if ("error" in result) {
        setPasswordError(result.error || "No se pudo cambiar la contraseña.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("La contraseña se actualizó correctamente.");
      await logout();
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : "No se pudo cambiar la contraseña.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const beginMfaSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMfaSaving(true);
    setMfaError("");
    setMfaMessage("");
    try {
      const result = await setupCurrentMfa(mfaCurrentPassword);
      if ("error" in result) {
        setMfaError(result.error || "No se pudo iniciar MFA.");
        return;
      }
      if (result.data) setMfaSetup(result.data);
      setMfaCode("");
    } catch (caught) {
      setMfaError(caught instanceof Error ? caught.message : "No se pudo iniciar MFA.");
    } finally {
      setMfaSaving(false);
    }
  };

  const confirmMfaSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMfaSaving(true);
    setMfaError("");
    try {
      const result = await enableCurrentMfa(mfaCode);
      if ("error" in result) {
        setMfaError(result.error || "No se pudo activar MFA.");
        return;
      }
      setMfaSetup(null);
      setMfaEnabled(true);
      setMfaRecoveryCodes(result.data?.recovery_codes || []);
      setMfaCode("");
      setMfaCurrentPassword("");
      setMfaMessage("La verificación en dos pasos quedó activa.");
    } catch (caught) {
      setMfaError(caught instanceof Error ? caught.message : "No se pudo activar MFA.");
    } finally {
      setMfaSaving(false);
    }
  };

  const disableMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMfaSaving(true);
    setMfaError("");
    try {
      const result = await disableCurrentMfa(mfaCurrentPassword, mfaCode);
      if ("error" in result) {
        setMfaError(result.error || "No se pudo desactivar MFA.");
        return;
      }
      await logout();
    } catch (caught) {
      setMfaError(caught instanceof Error ? caught.message : "No se pudo desactivar MFA.");
      setMfaSaving(false);
    }
  };

  const revokeSessions = async () => {
    setSessionsRevoking(true);
    setSessionsError("");
    const result = await revokeCurrentUserSessions();
    if ("error" in result) {
      setSessionsError(result.error || "No se pudieron cerrar las sesiones.");
      setSessionsRevoking(false);
      return;
    }
    await logout();
  };

  const savePreferences = async () => {
    setPreferencesSaving(true);
    setPreferencesMessage("");
    setPreferencesError("");
    try {
      const result = await saveUserPreferences(preferences);
      if ("error" in result) {
        setPreferencesError(result.error || "No se pudieron guardar tus preferencias.");
        return;
      }
      const saved = result.data || preferences;
      setPreferences(saved);
      localStorage.setItem("soland-ui-preferences", JSON.stringify(saved));
      applyUiAccessibilityPreferences(saved);
      window.dispatchEvent(new Event("soland-preferences-updated"));
      setPreferencesMessage("Preferencias guardadas.");
    } catch (caught) {
      setPreferencesError(caught instanceof Error ? caught.message : "No se pudieron guardar tus preferencias.");
    } finally {
      setPreferencesSaving(false);
    }
  };

  const saveGlobalSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSystemSaving(true);
    setSystemMessage("");
    setSystemError("");
    try {
      const result = await saveSystemSettings(systemSettings);
      if ("error" in result) {
        setSystemError(result.error || "No se pudo guardar la configuración global.");
        return;
      }
      if (result.data) setSystemSettings(result.data);
      setSystemMessage("Configuración global guardada.");
    } catch (caught) {
      setSystemError(caught instanceof Error ? caught.message : "No se pudo guardar la configuración global.");
    } finally {
      setSystemSaving(false);
    }
  };

  const setBrowserNotificationPreference = async (enabled: boolean) => {
    if (enabled && "Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPreferencesError("El navegador no concedió permiso para notificaciones.");
        return;
      }
    }
    setPreferencesError("");
    setPreferences((current) => ({ ...current, browser_notifications: enabled }));
  };

  const selectManagedUser = (userId: string) => {
    setSelectedUserId(userId);
    const selected = managedUsers.find((candidate) => candidate.id === userId);
    setModulePermissions(selected?.permissions ?? MODULE_OPTIONS.map((module) => module.key));
    setPermissionsMessage("");
    setPermissionsError("");
  };

  const savePermissions = async () => {
    if (!selectedUserId) return;
    setPermissionsSaving(true);
    setPermissionsMessage("");
    setPermissionsError("");
    try {
      const result = await saveUserModulePermissions(selectedUserId, modulePermissions);
      if ("error" in result) {
        setPermissionsError(result.error || "No se pudieron guardar los permisos.");
        return;
      }
      if (result.user) setManagedUsers((current) => current.map((candidate) => candidate.id === result.user?.id ? result.user! : candidate));
      setPermissionsMessage("Los permisos del usuario se actualizaron.");
    } catch (caught) {
      setPermissionsError(caught instanceof Error ? caught.message : "No se pudieron guardar los permisos.");
    } finally {
      setPermissionsSaving(false);
    }
  };

  return (
    <Box minH="100vh" bg="#090b0b" color="white" px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }}>
      <VStack align="stretch" gap={6} maxW="6xl" mx="auto">
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
          <Box>
            <Heading size="lg">Configuración</Heading>
            <Text mt={2} color="gray.400">Administra tu cuenta, seguridad y preferencias.</Text>
          </Box>
          <Button variant="outline" borderColor="whiteAlpha.300" onClick={() => void logout()} alignSelf={{ base: "flex-start", md: "auto" }}>
            <LogOut size={16} /> Cerrar sesión
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} alignItems="start">
          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <HStack gap={3} mb={5}>
              <UserRound size={19} color="#f6e05e" />
              <Box>
                <Heading size="sm">Perfil personal</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>Estos datos aparecen en el sistema.</Text>
              </Box>
            </HStack>
            <form onSubmit={handleProfileSubmit}>
              <VStack align="stretch" gap={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Nombre de usuario</Text>
                    <Input required minLength={3} maxLength={50} value={profile.username} onChange={(event) => setProfile((current) => ({ ...current, username: event.target.value }))} autoComplete="username" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Correo electrónico</Text>
                    <Input required type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} autoComplete="email" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Nombre completo</Text>
                    <Input value={profile.nombre_completo} onChange={(event) => setProfile((current) => ({ ...current, nombre_completo: event.target.value }))} autoComplete="name" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={1}>Departamento</Text>
                    <Input value={profile.department} onChange={(event) => setProfile((current) => ({ ...current, department: event.target.value }))} />
                  </Box>
                  <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                    <Text fontSize="sm" color="gray.400" mb={1}>Cargo</Text>
                    <Input value={profile.cargo} onChange={(event) => setProfile((current) => ({ ...current, cargo: event.target.value }))} />
                  </Box>
                </SimpleGrid>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>Descripción del perfil</Text>
                  <Textarea rows={4} maxLength={2000} value={profile.hoja_vida} onChange={(event) => setProfile((current) => ({ ...current, hoja_vida: event.target.value }))} resize="vertical" />
                </Box>
                {profileError && <Text role="alert" color="red.300" fontSize="sm">{profileError}</Text>}
                {profileMessage && <Text role="status" color="green.300" fontSize="sm">{profileMessage}</Text>}
                <Button type="submit" colorScheme="yellow" color="black" loading={profileSaving} alignSelf="flex-start">Guardar perfil</Button>
              </VStack>
            </form>
          </Box>

          <VStack align="stretch" gap={5}>
            <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
              <HStack gap={3} mb={5}>
                <KeyRound size={19} color="#f6e05e" />
                <Box>
                  <Heading size="sm">Seguridad</Heading>
                  <Text color="gray.500" fontSize="sm" mt={1}>Verifica la contraseña actual para cambiarla.</Text>
                </Box>
              </HStack>
              <form onSubmit={handlePasswordSubmit}>
                <VStack align="stretch" gap={3}>
                  <Input type="password" required maxLength={128} autoComplete="current-password" placeholder="Contraseña actual" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                  <Input type="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder="Nueva contraseña (mínimo 8 caracteres)" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                  <Input type="password" required minLength={8} maxLength={128} autoComplete="new-password" placeholder="Confirmar nueva contraseña" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                  {passwordError && <Text role="alert" color="red.300" fontSize="sm">{passwordError}</Text>}
                  {passwordMessage && <Text role="status" color="green.300" fontSize="sm">{passwordMessage}</Text>}
                  <Button type="submit" variant="outline" borderColor="whiteAlpha.300" loading={passwordSaving} alignSelf="flex-start">Actualizar contraseña</Button>
                </VStack>
              </form>
              <Box mt={5} pt={5} borderTop="1px solid" borderColor="whiteAlpha.100">
                <HStack justify="space-between" align="start" gap={3} wrap="wrap" mb={3}>
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">Verificación en dos pasos</Text>
                    <Text color="gray.500" fontSize="xs" mt={1}>Protege el login con una aplicación TOTP.</Text>
                  </Box>
                  <Badge colorScheme={mfaEnabled ? "green" : "gray"}>{mfaEnabled ? "Activa" : "Inactiva"}</Badge>
                </HStack>
                {mfaRecoveryCodes.length > 0 ? (
                  <VStack align="stretch" gap={3}>
                    <Text color="green.200" fontSize="sm">MFA está activo. Guarda estos códigos de recuperación; cada uno funciona una sola vez.</Text>
                    <SimpleGrid columns={{ base: 2, md: 4 }} gap={2}>
                      {mfaRecoveryCodes.map((code) => <Input key={code} readOnly value={code} aria-label="Código de recuperación MFA" />)}
                    </SimpleGrid>
                    <Button onClick={() => void logout()} colorScheme="yellow" color="black" alignSelf="flex-start">Ya los guardé, iniciar sesión</Button>
                  </VStack>
                ) : mfaEnabled ? (
                  <form onSubmit={disableMfa}>
                    <VStack align="stretch" gap={3}>
                      <Input type="password" required maxLength={128} autoComplete="current-password" placeholder="Contraseña actual" value={mfaCurrentPassword} onChange={(event) => setMfaCurrentPassword(event.target.value)} />
                      <Input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="Código TOTP" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} />
                      {mfaError && <Text role="alert" color="red.300" fontSize="sm">{mfaError}</Text>}
                      <Button type="submit" variant="outline" borderColor="whiteAlpha.300" loading={mfaSaving} alignSelf="flex-start">Desactivar MFA</Button>
                    </VStack>
                  </form>
                ) : mfaSetup ? (
                  <VStack align="stretch" gap={3}>
                    <Text color="gray.400" fontSize="sm">Añade esta clave a tu app de autenticación:</Text>
                    <Input readOnly value={mfaSetup.secret} aria-label="Clave de configuración TOTP" />
                    <Textarea readOnly rows={2} value={mfaSetup.provisioning_uri} aria-label="URI para aplicación autenticadora" resize="vertical" />
                    <form onSubmit={confirmMfaSetup}>
                      <VStack align="stretch" gap={3}>
                        <Input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="Código de 6 dígitos para confirmar" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} />
                        {mfaError && <Text role="alert" color="red.300" fontSize="sm">{mfaError}</Text>}
                        <Button type="submit" loading={mfaSaving} colorScheme="yellow" color="black" alignSelf="flex-start">Confirmar y activar MFA</Button>
                      </VStack>
                    </form>
                  </VStack>
                ) : (
                  <form onSubmit={beginMfaSetup}>
                    <VStack align="stretch" gap={3}>
                      <Input type="password" required maxLength={128} autoComplete="current-password" placeholder="Confirma tu contraseña para iniciar" value={mfaCurrentPassword} onChange={(event) => setMfaCurrentPassword(event.target.value)} />
                      {mfaError && <Text role="alert" color="red.300" fontSize="sm">{mfaError}</Text>}
                      {mfaMessage && <Text role="status" color="green.300" fontSize="sm">{mfaMessage}</Text>}
                      <Button type="submit" variant="outline" borderColor="whiteAlpha.300" loading={mfaSaving} alignSelf="flex-start">Configurar MFA</Button>
                    </VStack>
                  </form>
                )}
              </Box>
              <Box mt={5} pt={5} borderTop="1px solid" borderColor="whiteAlpha.100">
                <Text color="gray.400" fontSize="sm" mb={2}>
                  Último acceso: {user.last_login_at ? new Date(user.last_login_at).toLocaleString(preferences.language, { timeZone: preferences.timezone }) : "No disponible"}
                </Text>
                {sessionsError && <Text role="alert" color="red.300" fontSize="sm" mb={2}>{sessionsError}</Text>}
                <Button size="sm" variant="outline" borderColor="whiteAlpha.300" loading={sessionsRevoking} onClick={() => void revokeSessions()}>
                  Cerrar todas las sesiones
                </Button>
              </Box>
            </Box>
            <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
              <HStack gap={3} mb={4}>
                <Bell size={19} color="#f6e05e" />
                <Box>
                  <Heading size="sm">Notificaciones</Heading>
                  <Text color="gray.500" fontSize="sm" mt={1}>Configura los avisos de vencimiento.</Text>
                </Box>
              </HStack>
              {preferencesLoading ? <Text color="gray.500">Cargando preferencias...</Text> : (
                <VStack align="stretch" gap={4}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={preferences.notifications_enabled} onChange={(event) => setPreferences((current) => ({ ...current, notifications_enabled: event.target.checked }))} style={{ accentColor: "#f6e05e" }} />
                    <Text fontSize="sm" color="gray.200">Activar notificaciones del sistema</Text>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={preferences.browser_notifications} onChange={(event) => void setBrowserNotificationPreference(event.target.checked)} style={{ accentColor: "#f6e05e" }} />
                    <Text fontSize="sm" color="gray.200">Mostrar avisos en este navegador</Text>
                  </label>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={2}>Recordarme antes del vencimiento</Text>
                    <HStack gap={2} wrap="wrap">
                      {reminderOptions.map((days) => (
                        <label key={days} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4 }}>
                          <input type="checkbox" checked={effectiveReminderDays.includes(days)} onChange={(event) => {
                            const nextDays = event.target.checked ? [...effectiveReminderDays, days] : effectiveReminderDays.filter((value) => value !== days);
                            setPreferences((current) => ({ ...current, document_expiry_days: nextDays.length ? nextDays.sort((a, b) => b - a) : null }));
                          }} style={{ accentColor: "#f6e05e" }} />
                          <Text color="gray.300" fontSize="sm">{days} días</Text>
                        </label>
                      ))}
                    </HStack>
                    <Text color="gray.600" fontSize="xs" mt={2}>Sin selección se usan los intervalos establecidos por el administrador.</Text>
                  </Box>
                  {preferencesError && <Text role="alert" color="red.300" fontSize="sm">{preferencesError}</Text>}
                  {preferencesMessage && <Text role="status" color="green.300" fontSize="sm">{preferencesMessage}</Text>}
                  <Button onClick={() => void savePreferences()} loading={preferencesSaving} colorScheme="yellow" color="black" alignSelf="flex-start">Guardar notificaciones</Button>
                </VStack>
              )}
            </Box>
          </VStack>
        </SimpleGrid>

        <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
          <Heading size="sm" mb={1}>Preferencias y accesibilidad</Heading>
          <Text color="gray.500" fontSize="sm" mb={4}>Se guardan en tu cuenta y se aplican al sistema.</Text>
          {preferencesLoading ? <Text color="gray.500">Cargando preferencias...</Text> : (
            <VStack align="stretch" gap={4}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>Formato regional</Text>
                  <select value={preferences.language} onChange={(event) => setPreferences((current) => ({ ...current, language: event.target.value as UserPreferences["language"] }))} style={{ width: "100%", padding: "10px 12px", color: "white", background: "#090b0b", border: "1px solid #4a5568", borderRadius: 4 }}>
                    <option value="es-VE">Español · Venezuela</option>
                    <option value="es-PE">Español · Perú</option>
                  </select>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>Zona horaria</Text>
                  <select value={preferences.timezone} onChange={(event) => setPreferences((current) => ({ ...current, timezone: event.target.value }))} style={{ width: "100%", padding: "10px 12px", color: "white", background: "#090b0b", border: "1px solid #4a5568", borderRadius: 4 }}>
                    {timezoneOptions.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                  </select>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>Densidad</Text>
                  <HStack>
                    <Button size="sm" variant={preferences.density === "comfortable" ? "solid" : "outline"} onClick={() => setPreferences((current) => ({ ...current, density: "comfortable" }))}>Cómoda</Button>
                    <Button size="sm" variant={preferences.density === "compact" ? "solid" : "outline"} onClick={() => setPreferences((current) => ({ ...current, density: "compact" }))}>Compacta</Button>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={1}>Tamaño de texto</Text>
                  <HStack>
                    <Button size="sm" variant={preferences.text_size === "normal" ? "solid" : "outline"} onClick={() => setPreferences((current) => ({ ...current, text_size: "normal" }))}>Normal</Button>
                    <Button size="sm" variant={preferences.text_size === "large" ? "solid" : "outline"} onClick={() => setPreferences((current) => ({ ...current, text_size: "large" }))}>Grande</Button>
                  </HStack>
                </Box>
              </SimpleGrid>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={preferences.reduce_motion} onChange={(event) => setPreferences((current) => ({ ...current, reduce_motion: event.target.checked }))} style={{ accentColor: "#f6e05e" }} />
                <Text fontSize="sm" color="gray.200">Reducir animaciones</Text>
              </label>
              {preferencesError && <Text role="alert" color="red.300" fontSize="sm">{preferencesError}</Text>}
              {preferencesMessage && <Text role="status" color="green.300" fontSize="sm">{preferencesMessage}</Text>}
              <Button onClick={() => void savePreferences()} loading={preferencesSaving} colorScheme="yellow" color="black" alignSelf="flex-start">Guardar preferencias</Button>
            </VStack>
          )}
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <HStack gap={3} mb={4}>
              <ShieldCheck size={19} color="#f6e05e" />
              <Box>
                <Heading size="sm">Acceso al sistema</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>Solo un administrador puede cambiar tus permisos.</Text>
              </Box>
            </HStack>
            <HStack gap={2} mb={3}>
              <Badge colorScheme="yellow">{roleLabel(user)}</Badge>
              <Badge colorScheme={user.is_active ? "green" : "red"}>{user.is_active ? "Activo" : "Inactivo"}</Badge>
            </HStack>
            {user.level === 1 || user.permissions == null ? (
              <Text color="gray.300" fontSize="sm">Acceso general a los módulos disponibles para tu nivel.</Text>
            ) : allowedModules.length ? (
              <HStack gap={2} wrap="wrap">
                {allowedModules.map((module) => <Badge key={module.key} colorScheme="cyan" variant="subtle">{module.label}</Badge>)}
              </HStack>
            ) : <Text color="gray.500" fontSize="sm">No tienes módulos asignados. Contacta con un administrador.</Text>}
          </Box>

          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <HStack gap={3} mb={4}>
              <Sparkles size={19} color="#f6e05e" />
              <Box>
                <Heading size="sm">Avatar</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>Personaliza la imagen de tu cuenta.</Text>
              </Box>
            </HStack>
            <NextLink href="/dashboard/ia">
              <Button variant="outline" borderColor="whiteAlpha.300">Abrir editor de avatar</Button>
            </NextLink>
          </Box>
        </SimpleGrid>

        {isAdmin && (
          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <HStack gap={3} mb={5}>
              <ShieldCheck size={19} color="#f6e05e" />
              <Box>
                <Heading size="sm">Acceso por usuario</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>Asigna los módulos disponibles para cada cuenta.</Text>
              </Box>
            </HStack>
            <NextLink href="/dashboard/personal">
              <Button size="sm" variant="outline" borderColor="whiteAlpha.300" mb={4}>Gestionar cuentas y roles</Button>
            </NextLink>
            {permissionsLoading ? <Text color="gray.500">Cargando usuarios...</Text> : managedUsers.length === 0 ? (
              <Text color="gray.500" fontSize="sm">No hay otras cuentas para configurar.</Text>
            ) : (
              <VStack align="stretch" gap={4}>
                <Box maxW="520px">
                  <Text color="gray.400" fontSize="sm" mb={1}>Usuario</Text>
                  <select value={selectedUserId} onChange={(event) => selectManagedUser(event.target.value)} style={{ width: "100%", padding: "10px 12px", color: "white", background: "#090b0b", border: "1px solid #4a5568", borderRadius: 4 }}>
                    {managedUsers.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.nombre_completo || candidate.username} · {candidate.username}</option>)}
                  </select>
                </Box>
                <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} gap={2}>
                  {MODULE_OPTIONS.map((module) => (
                    <label key={module.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#090b0b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4 }}>
                      <input
                        type="checkbox"
                        checked={modulePermissions.includes(module.key)}
                        onChange={(event) => setModulePermissions((current) => event.target.checked ? [...current, module.key] : current.filter((permission) => permission !== module.key))}
                        style={{ accentColor: "#f6e05e" }}
                      />
                      <Text fontSize="sm" color="gray.200">{module.label}</Text>
                    </label>
                  ))}
                </SimpleGrid>
                {permissionsError && <Text role="alert" color="red.300" fontSize="sm">{permissionsError}</Text>}
                {permissionsMessage && <Text role="status" color="green.300" fontSize="sm">{permissionsMessage}</Text>}
                <Button onClick={() => void savePermissions()} loading={permissionsSaving} colorScheme="yellow" color="black" alignSelf="flex-start">Guardar permisos</Button>
              </VStack>
            )}
          </Box>
        )}

        {isAdmin && (
          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <HStack gap={3} mb={5}>
              <Building2 size={19} color="#f6e05e" />
              <Box>
                <Heading size="sm">Empresa y sistema</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>Datos generales y valores predeterminados para alertas.</Text>
              </Box>
            </HStack>
            <form onSubmit={saveGlobalSettings}>
              <VStack align="stretch" gap={4}>
                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={1}>Nombre de la empresa</Text>
                    <Input required value={systemSettings.company_name} onChange={(event) => setSystemSettings((current) => ({ ...current, company_name: event.target.value }))} />
                  </Box>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={1}>Correo de soporte</Text>
                    <Input type="email" value={systemSettings.support_email || ""} onChange={(event) => setSystemSettings((current) => ({ ...current, support_email: event.target.value || null }))} />
                  </Box>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={1}>Teléfono de soporte</Text>
                    <Input value={systemSettings.support_phone || ""} onChange={(event) => setSystemSettings((current) => ({ ...current, support_phone: event.target.value || null }))} />
                  </Box>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={1}>Zona horaria predeterminada</Text>
                    <select value={systemSettings.default_timezone} onChange={(event) => setSystemSettings((current) => ({ ...current, default_timezone: event.target.value }))} style={{ width: "100%", padding: "10px 12px", color: "white", background: "#090b0b", border: "1px solid #4a5568", borderRadius: 4 }}>
                      {timezoneOptions.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                    </select>
                  </Box>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={1}>Idioma de reconocimiento OCR</Text>
                    <select value={systemSettings.ocr_language} onChange={(event) => setSystemSettings((current) => ({ ...current, ocr_language: event.target.value as SystemSettings["ocr_language"] }))} style={{ width: "100%", padding: "10px 12px", color: "white", background: "#090b0b", border: "1px solid #4a5568", borderRadius: 4 }}>
                      <option value="auto">Automático</option>
                      <option value="spa">Español</option>
                      <option value="eng">Inglés</option>
                    </select>
                  </Box>
                  <Box>
                    <Text color="gray.400" fontSize="sm" mb={1}>Tamaño máximo por documento (MB)</Text>
                    <Input type="number" min={1} max={50} step={1} value={systemSettings.max_document_upload_mb} onChange={(event) => setSystemSettings((current) => ({ ...current, max_document_upload_mb: Number(event.target.value) }))} />
                  </Box>
                </SimpleGrid>
                <Box>
                  <Text color="gray.400" fontSize="sm" mb={1}>Dirección</Text>
                  <Textarea rows={2} maxLength={2000} value={systemSettings.company_address || ""} onChange={(event) => setSystemSettings((current) => ({ ...current, company_address: event.target.value || null }))} />
                </Box>
                <Box>
                  <Text color="gray.400" fontSize="sm" mb={2}>Alertas predeterminadas de vencimiento</Text>
                  <HStack gap={2} wrap="wrap">
                    {reminderOptions.map((days) => (
                      <label key={days} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4 }}>
                        <input type="checkbox" checked={systemSettings.expiry_reminder_days.includes(days)} onChange={(event) => setSystemSettings((current) => ({ ...current, expiry_reminder_days: event.target.checked ? [...current.expiry_reminder_days, days].sort((a, b) => b - a) : current.expiry_reminder_days.filter((value) => value !== days) }))} style={{ accentColor: "#f6e05e" }} />
                        <Text color="gray.300" fontSize="sm">{days} días</Text>
                      </label>
                    ))}
                  </HStack>
                </Box>
                {systemError && <Text role="alert" color="red.300" fontSize="sm">{systemError}</Text>}
                {systemMessage && <Text role="status" color="green.300" fontSize="sm">{systemMessage}</Text>}
                <Button type="submit" loading={systemSaving} colorScheme="yellow" color="black" alignSelf="flex-start">Guardar configuración global</Button>
              </VStack>
            </form>
          </Box>
        )}

        {isAdmin && (
          <Box bg="#111515" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 4, md: 5 }}>
            <HStack gap={3} mb={4}>
              <ClipboardList size={19} color="#f6e05e" />
              <Box>
                <Heading size="sm">Bitácora de cambios</Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>Registro de seguridad y administración.</Text>
              </Box>
            </HStack>
            {auditError && <Text role="alert" color="red.300" fontSize="sm" mb={3}>{auditError}</Text>}
            {auditEntries.length ? (
              <VStack align="stretch" gap={0}>
                {auditEntries.map((entry) => (
                  <Flex key={entry.id} justify="space-between" align="start" gap={4} py={3} borderTop="1px solid" borderColor="whiteAlpha.100" direction={{ base: "column", md: "row" }}>
                    <Box minW={0}>
                      <Text color="gray.200" fontSize="sm">{entry.action.replaceAll(".", " ")}</Text>
                      <Text color="gray.500" fontSize="xs" mt={1}>
                        {entry.actor_username} · {entry.entity_type}{entry.entity_id ? ` · ${entry.entity_id}` : ""}
                        {Array.isArray(entry.details.fields) ? ` · ${entry.details.fields.join(", ")}` : ""}
                      </Text>
                    </Box>
                    <Text color="gray.500" fontSize="xs" flexShrink={0}>{new Date(entry.created_at).toLocaleString(preferences.language, { timeZone: preferences.timezone })}</Text>
                  </Flex>
                ))}
              </VStack>
            ) : <Text color="gray.500" fontSize="sm">Aún no hay cambios registrados.</Text>}
          </Box>
        )}
      </VStack>
    </Box>
  );
}