import { Link } from "react-router-dom";

interface Props {
  children?: React.ReactNode;
}

function Sidebar(props: Props) {
  return (
    <aside className="drawer lg:drawer-open">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      {props.children}
      <div className="drawer-side h-[calc(100dvh-4.75rem)]">
        <label
          htmlFor="nav-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <ul className="menu gap-2 bg-base-200 min-h-full w-60 p-4">
          <li>
            <Link to="/" className="btn btn-ghost btn-xl">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/detection" className="btn btn-ghost btn-xl">
              Detection
            </Link>
          </li>
          <li>
            <Link to="/log" className="btn btn-ghost btn-xl">
              Log
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
