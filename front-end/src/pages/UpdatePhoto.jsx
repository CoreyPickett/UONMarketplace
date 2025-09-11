import { useState } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./UpdatePhoto.css";

export default function UpdatePhoto() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const auth = getAuth();
    const user = auth.currentUser;

    try {
        const response = await fetch(
        `/api/marketplace/s3-upload-url?filename=profile.jpg&filetype=${selectedFile.type}&scope=profile&userId=${user.uid}`
        );
        const { uploadURL, key } = await response.json();

        await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
        });

        const photoUrl = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
        console.log("Uploading photo to:", photoUrl);

        const token = await user.getIdToken();

        await fetch("/api/profile/updatePhoto", {
        method: "POST",
         headers: {
            "Content-Type": "application/json",
            authtoken: token,
        },
        body: JSON.stringify({ profilePhotoUrl: photoUrl }),
        });

        navigate("/UpdateSuccess");
    } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload profile photo.");
    } finally {
        setUploading(false);
    }
};

  return (
    <div className="update-photo-container">
      <h2 style={{ textAlign: "center" }}>Update Profile Photo</h2>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {previewUrl && (
        <div className="preview-block">
          <img src={previewUrl} alt="Preview" className="preview-image" />
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
      >
        {uploading ? "Uploading…" : "Save Profile Photo"}
      </button>

      <div className="back-link">
        <a href="/profile">← Back to Profile</a>
      </div>
    </div>
  );
}