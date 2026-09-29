import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import NavBar from "../NavBar.jsx";
import PawHeartLogo from "../PawHeartLogo.jsx";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import "./AppLayout.css";

const NAV_ROUTES: Record<string, string> = {
  home: "/",
  map: "/mapa",
  report: "/reportar",
  community: "/comunidad",
  profile: "/perfil",
};

const ROUTE_TO_NAV: Record<string, string> = {
  "/": "home",
  "/mapa": "map",
  "/reportar": "report",
  "/comunidad": "community",
  "/perfil": "profile",
  "/admin": "admin",
};

const SIDEBAR_ITEMS: { id: string; label: string; path: string; adminOnly?: boolean }[] = [
  { id: "home", label: "Inicio", path: "/" },
  { id: "map", label: "Mapa", path: "/mapa" },
  { id: "report", label: "Reportar", path: "/reportar" },
  { id: "community", label: "Comunidad", path: "/comunidad" },
  { id: "profile", label: "Perfil", path: "/perfil" },
  { id: "admin", label: "Administración", path: "/admin", adminOnly: true },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [unread, setUnread] = useState(0);

  const active = ROUTE_TO_NAV[location.pathname] ?? "home";

  useEffect(() => {
    let mounted = true;
    async function count() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (mounted) setUnread(count ?? 0);
    }
    void count();
    const channel = supabase
      .channel("layout-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => void count()
      )
      .subscribe();
    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [location.pathname]);

  return (
    <div className="pc-shell">
      <aside className="pc-sidebar">
        <button
          type="button"
          className="pc-sidebar__brand"
          onClick={() => navigate("/")}
        >
          <PawHeartLogo />
          <span>PetClue</span>
        </button>

        <nav className="pc-sidebar__nav" aria-label="Navegación principal">
          {SIDEBAR_ITEMS.filter((item) => !item.adminOnly || profile?.role === "admin").map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={`pc-sidebar__item ${active === item.id ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            )
          )}
          <button
            type="button"
            className="pc-sidebar__item"
            onClick={() => navigate("/notificaciones")}
          >
            Notificaciones
            {unread > 0 && <span className="pc-sidebar__badge">{unread}</span>}
          </button>
        </nav>

        <div className="pc-sidebar__footer">
          <div className="pc-sidebar__user">
            <span className="pc-sidebar__avatar" aria-hidden="true">
              {(profile?.name ?? "U").charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="pc-sidebar__name">{profile?.name ?? "…"}</p>
              <p className="pc-muted">{profile?.role ?? ""}</p>
            </div>
          </div>
          <button
            type="button"
            className="pc-sidebar__logout"
            onClick={() => void signOut()}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      <div className="pc-content">
        <header className="pc-topbar">
          <button
            type="button"
            className="pc-topbar__bell"
            onClick={() => navigate("/notificaciones")}
            aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
          >
            <Bell size={17} />
            {unread > 0 && <span className="pc-topbar__dot">{unread}</span>}
          </button>
        </header>

        <main className="pc-main">
          <Outlet />
        </main>

        <div className="pc-bottomnav">
          <NavBar
            active={active}
            onNavigate={(id: string) => navigate(NAV_ROUTES[id] ?? "/")}
          />
        </div>
      </div>
    </div>
  );
}
