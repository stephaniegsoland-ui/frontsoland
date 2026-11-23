"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Grid, Heading, HStack, Input, Text, Textarea, VStack } from "@chakra-ui/react";
import { Download, FileBox, FileText, Plus, Search, Trash2, Upload } from "lucide-react";

type CADDrawing = {
  id: string;
  title: string;
  drawing_code: string | null;
  revision: string | null;
  category: string;
  notes: string | null;
  original_filename: string;
  file_size: number;
  created_at: string;
};

const FILE_ACCEPT = ".pdf,.dwg,.dxf,.dwt,.dgn,.step,.stp,.iges,.igs,.stl,.png,.jpg,.jpeg,.tif,.tiff,.doc,.docx,.xls,.xlsx,.csv,.txt";
const inputStyle = {
  width: "100%",
  background: "var(--soland-surface-08090a)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "var(--soland-text-primary)",
} as const;

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.detail === "string" ? body.detail : "No se pudo completar la operación.";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CADClient() {
  const [files, setFiles] = useState<CADDrawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cad/drawings", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      setFiles(await response.json() as CADDrawing[]);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los archivos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return files;
    return files.filter((file) =>
      [file.title, file.drawing_code, file.revision, file.category, file.original_filename]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  }, [files, search]);

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedFile = formData.get("file");
    if (!(selectedFile instanceof File) || selectedFile.size === 0) {
      setError("Selecciona un archivo para subir.");
      setUploading(false);
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("El archivo no puede superar los 50 MB.");
      setUploading(false);
      return;
    }

    try {
      const response = await fetch("/api/cad/drawings", { method: "POST", body: formData });
      if (!response.ok) throw new Error(await responseError(response));
      form.reset();
      setShowForm(false);
      await loadFiles();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteFile(file: CADDrawing) {
    if (!window.confirm(`¿Eliminar "${file.title}" y su archivo?`)) return;
    setDeletingId(file.id);
    setError("");
    try {
      const response = await fetch(`/api/cad/drawings/${encodeURIComponent(file.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      setFiles((current) => current.filter((item) => item.id !== file.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el archivo.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Box p={{ base: 4, md: 6 }} color="var(--soland-text-primary)">
      <Flex justify="space-between" align={{ base: "stretch", sm: "center" }} gap={4} direction={{ base: "column", sm: "row" }} mb={5}>
        <Box>
          <HStack gap={2} color="cyan.300" mb={1}>
            <FileBox size={18} />
            <Text fontSize="sm" fontWeight="bold">PLANOS Y ARCHIVOS TÉCNICOS</Text>
          </HStack>
          <Heading size="lg">CAD</Heading>
          <Text color="gray.400" fontSize="sm" mt={1}>Repositorio de dibujos, planos y documentos de ingeniería.</Text>
        </Box>
        <Button bg="yellow.400" color="black" onClick={() => setShowForm((value) => !value)}>
          <Plus size={17} /> Subir archivo
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }} gap={3} mb={5}>
        {[
          { label: "Archivos", value: files.length },
          { label: "Planos", value: files.filter((file) => file.category === "Planos").length },
          { label: "Formatos CAD", value: files.filter((file) => [".dwg", ".dxf", ".dwt", ".dgn", ".step", ".stp", ".iges", ".igs", ".stl"].includes(file.original_filename.slice(file.original_filename.lastIndexOf(".")).toLowerCase())).length },
        ].map((item) => (
          <Flex key={item.label} justify="space-between" align="center" bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl" px={4} py={3}>
            <Text color="gray.400" fontSize="xs" fontWeight="bold" textTransform="uppercase">{item.label}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="cyan.300">{item.value}</Text>
          </Flex>
        ))}
      </Grid>

      {showForm && (
        <form onSubmit={uploadFile}>
        <Box mb={5} p={{ base: 4, md: 5 }} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.200" borderRadius="xl">
          <Heading size="sm" mb={4}>Agregar plano o archivo técnico</Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={3}>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Nombre</Text>
              <Input name="title" required maxLength={200} placeholder="Ej. Plano eléctrico edificio A" />
            </label>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Archivo</Text>
              <input name="file" type="file" accept={FILE_ACCEPT} required style={inputStyle} />
              <Text color="gray.500" fontSize="xs" mt={1}>PDF, DWG, DXF, STEP, imágenes y documentos · máximo 50 MB</Text>
            </label>
            <label>
              <Text fontSize="sm" mb={1} color="gray.300">Código de plano</Text>
              <Input name="drawing_code" maxLength={100} placeholder="Ej. PL-EL-001" />
            </label>
            <Flex gap={3}>
              <label style={{ flex: 1 }}>
                <Text fontSize="sm" mb={1} color="gray.300">Revisión</Text>
                <Input name="revision" maxLength={40} placeholder="A" />
              </label>
              <label style={{ flex: 1 }}>
                <Text fontSize="sm" mb={1} color="gray.300">Categoría</Text>
                <select name="category" style={inputStyle}>
                  <option>Planos</option><option>Dibujos</option><option>Modelos 3D</option><option>Especificaciones</option><option>Otros</option>
                </select>
              </label>
            </Flex>
            <label style={{ gridColumn: "1 / -1" }}>
              <Text fontSize="sm" mb={1} color="gray.300">Notas</Text>
              <Textarea name="notes" maxLength={5000} rows={2} placeholder="Descripción, proyecto o comentarios" />
            </label>
          </Grid>
          <HStack mt={4} justify="flex-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" bg="yellow.400" color="black" loading={uploading}>
              <Upload size={16} /> Guardar archivo
            </Button>
          </HStack>
        </Box>
        </form>
      )}

      <HStack gap={2} mb={3} maxW={{ base: "full", md: "420px" }}>
        <Search size={17} color="gray" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, código o revisión" />
      </HStack>
      {error && <Text role="alert" color="red.300" mb={4}>{error}</Text>}

      {loading ? <Text color="gray.400">Cargando archivos...</Text> : filteredFiles.length === 0 ? (
        <Box p={8} textAlign="center" bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl">
          <FileText size={28} color="gray" style={{ margin: "0 auto 12px" }} />
          <Text color="gray.300" fontWeight="semibold">{search ? "No hay archivos que coincidan." : "El repositorio está vacío."}</Text>
          {!search && <Text color="gray.500" fontSize="sm" mt={1}>Sube el primer plano o documento técnico.</Text>}
        </Box>
      ) : (
        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, minmax(0, 1fr))" }} gap={3}>
          {filteredFiles.map((file) => (
            <Flex key={file.id} align="flex-start" gap={3} p={4} bg="var(--soland-surface-18181b)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="xl">
              <Box p={2} bg="cyan.950" color="cyan.300" borderRadius="lg"><FileText size={20} /></Box>
              <Box flex="1" minW={0}>
                <Text fontWeight="bold" lineClamp={1}>{file.title}</Text>
                <HStack gap={2} mt={1} flexWrap="wrap">
                  <Badge variant="subtle" colorPalette="cyan">{file.category}</Badge>
                  {file.drawing_code && <Text fontSize="xs" color="gray.400">{file.drawing_code}</Text>}
                  {file.revision && <Text fontSize="xs" color="gray.400">Rev. {file.revision}</Text>}
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={2} lineClamp={1}>{file.original_filename} · {formatFileSize(file.file_size)}</Text>
                {file.notes && <Text fontSize="sm" color="gray.400" mt={2} lineClamp={2}>{file.notes}</Text>}
                <Text fontSize="xs" color="gray.500" mt={1}>{new Date(file.created_at).toLocaleDateString("es-VE")}</Text>
              </Box>
              <VStack gap={1}>
                <Button asChild size="sm" variant="ghost" color="cyan.300" aria-label={`Descargar ${file.title}`}>
                  <a href={`/api/cad/drawings/${encodeURIComponent(file.id)}/file`}><Download size={16} /></a>
                </Button>
                <Button size="sm" variant="ghost" color="red.300" aria-label={`Eliminar ${file.title}`} loading={deletingId === file.id} onClick={() => void deleteFile(file)}>
                  <Trash2 size={16} />
                </Button>
              </VStack>
            </Flex>
          ))}
        </Grid>
      )}
    </Box>
  );
}
