//Layout of application
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { use } from 'react';


export default function Layout() {
  const location = useLocation();

  const hiddenHeader =['/login', '/registration', '/forgotpswd']
  const hideHeader = hiddenHeader.includes(location.pathname);

  return (
    <>
    {!hideHeader && <Header />}
    <Outlet />
    </>
  );
}