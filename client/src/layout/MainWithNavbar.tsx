import { cn } from "../utils";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

function MainWithNavbar(props: Props) {
  return (
    <>
      <Navbar />
      <Sidebar>
        <main
          className={cn(
            "drawer-content flex flex-col p-4 md:p-8 lg:max-h-[calc(100dvh-4.75rem)] lg:overflow-auto xl:px-12",
            props.className
          )}
        >
          {props.children}
        </main>
      </Sidebar>
    </>
  );
}

export default MainWithNavbar;
