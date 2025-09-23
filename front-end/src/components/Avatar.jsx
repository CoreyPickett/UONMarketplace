import React from "react";

const Avatar = ({ src, fallbackText = "U", size = "md", alt = "Profile" }) => {
  const avatarClass = `avatar-image avatar-${size}`;

  return (
    <div className="avatar">
      {src?.startsWith("https://") ? (
        <img
          src={src}
          alt={alt}
          className={avatarClass}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-avatar.png";
          }}
        />
      ) : (
        <span className={`avatar-fallback avatar-${size}`}>
          {fallbackText}
        </span>
      )}
    </div>
  );
};

export default Avatar;