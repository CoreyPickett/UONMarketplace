//Layout of application
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { useState } from 'react';
import Sidebar from './components/SideBar';

export default function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const hiddenHeader =['/login', '/registration', '/forgotpswd']
  const hideHeader = hiddenHeader.includes(location.pathname);

  return (
    <>
      {!hideHeader && <Header onOpenMenu={() => setMenuOpen(true)} />}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        <Outlet />
      </main>
    </>
  );
}