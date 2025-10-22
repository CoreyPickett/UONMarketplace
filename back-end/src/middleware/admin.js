// List of current admin emails
const adminEmails = ['admin@uon.edu', 'tester@uon.edu', 'demo2@uon.edu', 'tester100@uon.edu.au'];

// Function to check if email is admin verified
export function checkIfAdmin(req, res, next) {
  const userEmail = req.user?.email;

  if (!userEmail) {
    console.warn("Missing email in decoded token");
    return res.status(401).json({ error: "Invalid token: no email" });
  }

  console.log("Checking admin status for:", userEmail);

  if (adminEmails.includes(userEmail)) {
    req.user.isAdmin = true;
    console.log(`Admin verified: ${userEmail}`);
  } else {
    console.log(`Not an admin: ${userEmail}`);
  }

  next();
}

// Check if user is admin verified
export function requireAdmin(req, res, next) {
  if (req.user?.isAdmin === true || req.user?.admin === true) {
    return next();
  }
  return res.status(403).json({ error: "Admin privileges required" });
}