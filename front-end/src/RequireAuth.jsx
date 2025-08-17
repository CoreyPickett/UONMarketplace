import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function RequireAuth({ children }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setAuthed(!!u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return null;            // optional: show a spinner
  if (!authed) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
}
