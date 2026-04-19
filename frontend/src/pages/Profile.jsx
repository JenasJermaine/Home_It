import { useEffect, useMemo, useState } from "react";
import {
  buildMediaUrl,
  getMyProfile,
  updateMyProfile,
  updateMyProfilePicture,
} from "../api/apiService";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    bio: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getMyProfile();
        const user = response.data?.data;
        setProfile(user);
        setFormData({
          first_name: user?.first_name || "",
          last_name: user?.last_name || "",
          phone_number: user?.phone_number || "",
          bio: user?.bio || "",
        });
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaveMessage("");
    setError("");
    setIsSavingProfile(true);

    try {
      const response = await updateMyProfile(formData);
      const updatedUser = response.data?.data;
      setProfile(updatedUser);
      setFormData({
        first_name: updatedUser?.first_name || "",
        last_name: updatedUser?.last_name || "",
        phone_number: updatedUser?.phone_number || "",
        bio: updatedUser?.bio || "",
      });
      setSaveMessage("Profile details updated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSelectedPicture(file);
    setPreviewUrl(nextPreviewUrl);
  };

  const handlePictureUpload = async () => {
    if (!selectedPicture) return;
    setSaveMessage("");
    setError("");
    setIsUploadingPicture(true);

    try {
      const form = new FormData();
      form.append("profile_picture", selectedPicture);

      const response = await updateMyProfilePicture(form);
      const nextPictureUrl = response.data?.data?.profile_picture_url || "";

      setProfile((prev) => ({
        ...prev,
        profile_picture_url: nextPictureUrl,
      }));
      setSelectedPicture(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      setSaveMessage("Profile picture updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to update profile picture.",
      );
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const profileImageUrl = useMemo(() => {
    if (previewUrl) return previewUrl;
    return buildMediaUrl(profile?.profile_picture_url);
  }, [previewUrl, profile]);

  const initials = useMemo(() => {
    const first = profile?.first_name?.trim()?.[0];
    const last = profile?.last_name?.trim()?.[0];
    const fallback = profile?.username?.trim()?.[0];
    return `${first || fallback || "U"}${last || ""}`.toUpperCase();
  }, [profile]);

  if (loading) {
    return (
      <div className="profile-page-bg d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="profile-page-bg p-3 p-md-4 p-lg-5">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">My Profile</h2>
        <p className="text-muted m-0">
          Personalize your account details and profile photo.
        </p>
      </div>

      {(error || saveMessage) && (
        <div
          className={`alert ${error ? "alert-danger" : "alert-success"} mb-4`}
          role="alert"
        >
          {error || saveMessage}
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="profile-panel h-100 border rounded-4 border-primary">
            <div className="d-flex flex-column align-items-center text-center mb-3">
              <div className="profile-avatar-frame mb-3">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="rounded-circle w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="profile-avatar-fallback">{initials}</div>
                )}
              </div>

              <h5 className="fw-semibold mb-1">
                {profile?.first_name || profile?.last_name
                  ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
                  : profile?.username}
              </h5>
              <p className="mb-0 text-muted">@{profile?.username}</p>
            </div>

            <div className="d-flex gap-2 mb-3 flex-wrap justify-content-center">
              <span className="profile-chip border rounded-4 border-primary text-primary small">
                <i
                  className="bi bi-envelope me-2 "
                  style={{ fontSize: "20px"}}
                />
                {profile?.email}
              </span>
              <span className="profile-chip border rounded-4 border-primary text-primary small">
                <i
                  className="bi bi-calendar-event me-2"
                  style={{ fontSize: "20px"}}
                />
                Joined {new Date(profile?.createdAt).toLocaleDateString()}
              </span>
            </div>

            <hr className="border-primary opacity-100" />

            <label className="form-label fw-semibold">
              Change Profile Picture
            </label>
            <input
              type="file"
              className="form-control mb-4 rounded-4"
              accept="image/*"
              onChange={handlePictureChange}
            />
            <button
              className="btn btn-primary w-100 rounded-4"
              onClick={handlePictureUpload}
              disabled={!selectedPicture || isUploadingPicture}
            >
              {isUploadingPicture ? "Uploading..." : "Update Picture"}
            </button>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="profile-panel border rounded-4 border-primary">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-semibold m-0">Editable Details</h5>
            </div>

            <form onSubmit={handleProfileSave}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className="form-control rounded-4"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className="form-control rounded-4"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    className="form-control rounded-4"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="e.g. +254 712 345678"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Bio</label>
                  <textarea
                    name="bio"
                    className="form-control rounded-4"
                    rows="5"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell people a bit about you..."
                  />
                  <small className="text-muted">
                    {formData.bio.length} characters
                  </small>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="btn btn-primary px-4 rounded-4 "
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
