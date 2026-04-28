import cn from "../utils/cn";
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
            "drawer-content flex flex-col p-4 md:p-8 xl:p-12",
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
