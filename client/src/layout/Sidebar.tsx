import { LayoutDashboard, Logs, Radar } from "lucide-react";
import { Link, useLocation, type To } from "react-router-dom";

interface Props {
  children?: React.ReactNode;
}

function sidebarTo(
  pathname: string,
  location: ReturnType<typeof useLocation>
): To {
  if (location.pathname === pathname) {
    return { pathname, search: location.search };
  }
  return pathname;
}

function Sidebar(props: Props) {
  const location = useLocation();

  return (
    <aside className="drawer lg:drawer-open">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      {props.children}
      <div className="drawer-side lg:h-[calc(100dvh-4.75rem)]">
        <label
          htmlFor="nav-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <ul className="menu gap-2 bg-base-200 min-h-full w-60 p-4">
          <li>
            <Link
              to={sidebarTo("/", location)}
              className="btn btn-ghost btn-xl justify-start"
            >
              <LayoutDashboard />
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to={sidebarTo("/detection", location)}
              className="btn btn-ghost btn-xl justify-start"
            >
              <Radar />
              Detection
            </Link>
          </li>
          <li>
            <Link
              to={sidebarTo("/log", location)}
              className="btn btn-ghost btn-xl justify-start"
            >
              <Logs />
              Log
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
