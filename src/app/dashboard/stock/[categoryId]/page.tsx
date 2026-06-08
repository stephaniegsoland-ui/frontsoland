import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CategoryClient } from "./CategoryClient";

interface CategoryPageProps {
  params: Promise<{ categoryId: string }>; 
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return notFound();

  // 1. Obtener los ítems de esta categoría usando tu endpoint
  const itemsRes = await fetch(`http://localhost:8000/api/inventary/category/${categoryId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  let items = [];

  // Verificamos la respuesta de forma segura
  if (itemsRes.ok) {
    items = await itemsRes.json();
  } else if (itemsRes.status === 404) {
    // EL FIX: Si el backend dice 404, significa que aún no hay productos.
    // Dejamos el array vacío en lugar de romper la página.
    items = [];
  } else {
    throw new Error("Error cargando los ítems");
  }

  // 2. Obtener el nombre de la categoría 
  const catRes = await fetch("http://localhost:8000/api/categories/", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  let categoryName = `Categoría ${categoryId}`;
  if (catRes.ok) {
    const categories = await catRes.json();
    const found = categories.find((c: any) => c.id.toString() === categoryId);
    if (found) categoryName = found.name;
  }

  return (
    <CategoryClient 
      categoryId={parseInt(categoryId)} 
      categoryName={categoryName} 
      items={items} 
    />
  );
}