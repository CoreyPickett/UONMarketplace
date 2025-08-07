import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from 'firebase/auth';
import useUser from "./useUser";

export default function NavBar() {
  const { isLoading, user } = useUser();
  const navigate = useNavigate();

  return (
    <nav style={{
      backgroundColor: '#1e1e1e',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      
      {/* Left side: Return button and user info */}
      <ul style={{
        display: 'flex',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        alignItems: 'center',
        gap: '20px',
        color: 'white'
      }}>
        {/* Return to Dashboard button */}
        <li>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#ffffff',
              color: '#1e1e1e',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Return to Dashboard
          </button>
        </li>

        {isLoading ? (
          <li>Loading...</li>
        ) : (
          <>
            {user && (
              <li style={{ fontWeight: 'bold' }}>
                Logged in as {user.email}
              </li>
            )}
            <li>
              {user ? (
                <button
                  onClick={() => signOut(getAuth())}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1e1e1e',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1e1e1e',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Sign In
                </button>
              )}
            </li>
          </>
        )}
      </ul>

      <img
        src="/uon-logo.jfif"
        alt="UoN Logo"
        style={{
          height: '40px',
          borderRadius: '4px',
        }}
      />
    </nav>
  );
}
