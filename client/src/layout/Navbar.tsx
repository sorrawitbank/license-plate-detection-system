import { Menu } from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar gap-4 px-4 bg-accent lg:px-8">
      <label htmlFor="nav-drawer" className="cursor-pointer lg:hidden">
        <Menu className="md:size-8" />
      </label>
      <h1 className="style-headline-3 md:style-headline-2 lg:style-headline-1">
        Vehicle <span className="not-sm:hidden">Entry–Exit </span>Monitoring
      </h1>
    </nav>
  );
}

export default Navbar;
