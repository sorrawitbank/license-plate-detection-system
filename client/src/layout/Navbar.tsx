import { Menu } from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar gap-2 bg-accent sm:gap-6 lg:px-8">
      <label htmlFor="nav-drawer" className=" cursor-pointer lg:hidden">
        <Menu className="sm:size-8" />
      </label>
      <h1 className="style-headline-3 sm:style-headline-2 lg:style-headline-1">
        License Plate Detection
      </h1>
    </nav>
  );
}

export default Navbar;
