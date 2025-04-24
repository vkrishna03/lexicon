// components/layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router";
import Header from "./Header";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main
          className={`
            pt-28 min-h-screen transition-all duration-300 pl-0
          `}
        >
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};

export default Layout;
