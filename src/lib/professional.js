/**
 * Textos de "Mi clínica" según el tipo de cuenta profesional:
 * - clinic:  veterinaria (establecimiento) con su lugar verificado en el mapa
 * - shelter: refugio (lugar verificado o rol foundation)
 * - doctor:  médico veterinario (persona, rol vet sin lugar verificado): el consultorio es opcional
 */
export function professionalKind(role, verifiedPlaceKind, establishment = false) {
  if (verifiedPlaceKind === "clinic" || verifiedPlaceKind === "shelter") return verifiedPlaceKind;
  if (role === "foundation") return "shelter";
  // Rol vet: si su solicitud fue de establecimiento es una veterinaria (aún sin lugar); si no, un médico
  if (role === "vet") return establishment ? "clinic" : "doctor";
  return null;
}

// Etiqueta del perfil
export const PRO_LABEL = { clinic: "Veterinaria", shelter: "Refugio", doctor: "Médico veterinario" };

export const PRO_TEXT = {
  clinic: {
    menu: "Mis veterinarias",
    menuSub: "Tus sedes en el mapa",
    listTitle: "Mis veterinarias",
    listIntro: "Agrega cada sede de tu veterinaria. Cada una aparece en el mapa cuando un administrador la verifica.",
    addLabel: "Agregar otra sede",
    addFirst: "Agregar mi veterinaria",
    empty: "Todavía no has agregado tu veterinaria al mapa.",
    newTitle: "Nueva sede",
    deleteLabel: "Eliminar esta sede",
    title: "Mi veterinaria",
    namePlaceholder: "Ej: Veterinaria San Francisco",
    intro:
      "Marca en el mapa dónde está tu veterinaria. Los dueños de mascotas te encontrarán en el filtro «Veterinarias» y podrán llamarte.",
    verified: "Veterinaria verificada y visible en el mapa",
    verifiedSub: "Los dueños de mascotas ya pueden encontrarte en el filtro «Veterinarias» y llamarte.",
    pending: "Un administrador revisará tu veterinaria antes de mostrarla en el mapa.",
    created: "¡Listo! Tu veterinaria quedó pendiente de verificación.",
    create: "Crear mi veterinaria en el mapa",
    nameError: "Escribe el nombre de tu veterinaria.",
  },
  shelter: {
    menu: "Mis refugios",
    menuSub: "Tus sedes en el mapa",
    listTitle: "Mis refugios",
    listIntro: "Agrega cada sede o punto de tu refugio. Cada una aparece en el mapa cuando un administrador la verifica.",
    addLabel: "Agregar otra sede",
    addFirst: "Agregar mi refugio",
    empty: "Todavía no has agregado tu refugio al mapa.",
    newTitle: "Nueva sede",
    deleteLabel: "Eliminar esta sede",
    title: "Mi refugio",
    namePlaceholder: "Ej: Refugio Huellitas",
    intro:
      "Marca en el mapa dónde está tu refugio. Las personas te encontrarán en el filtro «Refugios» y tus mascotas en adopción llevarán la etiqueta «Refugio».",
    verified: "Refugio verificado y visible en el mapa",
    verifiedSub:
      "Las personas ya pueden encontrarte en el filtro «Refugios». Tus publicaciones en adopción llevan la etiqueta «Refugio».",
    pending: "Un administrador revisará tu refugio antes de mostrarlo en el mapa.",
    created: "¡Listo! Tu refugio quedó pendiente de verificación.",
    create: "Crear mi refugio en el mapa",
    nameError: "Escribe el nombre de tu refugio.",
    adoptionCta: "Dar una mascota en adopción",
  },
  doctor: {
    menu: "Mis consultorios",
    menuSub: "Dónde atiendes (opcional)",
    listTitle: "Mis consultorios",
    listIntro: "Si atiendes en uno o varios consultorios, agrégalos (es opcional). Cada uno aparece en el mapa cuando un administrador lo verifica.",
    addLabel: "Agregar otro consultorio",
    addFirst: "Agregar mi consultorio",
    empty: "No has agregado consultorios. Es opcional.",
    newTitle: "Nuevo consultorio",
    deleteLabel: "Eliminar este consultorio",
    title: "Mi consultorio",
    namePlaceholder: "Ej: Consultorio Dra. Pérez",
    intro:
      "Como médico veterinario, tu etiqueta «Médico vet.» ya aparece en tus publicaciones y comentarios. Si además atiendes en un consultorio, márcalo en el mapa (es opcional).",
    verified: "Consultorio verificado y visible en el mapa",
    verifiedSub: "Los dueños de mascotas ya pueden encontrarte en el mapa.",
    pending: "Un administrador revisará tu consultorio antes de mostrarlo en el mapa.",
    created: "¡Listo! Tu consultorio quedó pendiente de verificación.",
    create: "Agregar mi consultorio al mapa",
    nameError: "Escribe el nombre de tu consultorio.",
  },
};
