import React from "react";

const Avatar = ({ src, fallbackText = "U", size = "md", alt = "Profile" }) => {
  return src?.startsWith("https://") ? (
    <div className={`avatar-wrapper avatar-${size}`}>
      <img
        src={src}
        alt={alt}
        className="avatar-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/default-avatar.png";
        }}
      />
    </div>
  ) : (
    <span className={`avatar-fallback avatar-${size}`}>
      {fallbackText}
    </span>
  );
};

export default Avatar;