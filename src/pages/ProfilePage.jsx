import { useRef, useState } from "react";
import TAG_OPTIONS from "../utils/tags";
import ReactCountryFlag from "react-country-flag";

export default function ProfilePage({ userId, collectedItems }) {

  const fileInputRef = useRef(null);

  const [avatar, setAvatar] = useState(null);
  const [displayName, setDisplayName] = useState("Demo User");
  const [tag, setTag] = useState(TAG_OPTIONS[0]);
  const [showEditProfile, setShowEditProfile] = useState(false);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const preview = URL.createObjectURL(file);
    setAvatar(preview);

    // TODO: upload to backend later
    console.log("New avatar:", file);
  }
  console.log("ProfilePage collectedItems:", collectedItems);

  return (
    <div className="profile-page">

      {/* Top of the profile page */}
      <div className="profile-top">


        {/* Left Column */}
        <div className="profile-left">

          {/* Avatar */}
          <div
            className = "profile-avatar-lg clickable"
            onClick={() => fileInputRef.current?.click()} 
          >
            {/* If the avatar exists */}
            {avatar ? (
              <img
                className="profile-avatar-img"
                src={avatar}
                alt="Profile avatar"
              />
            ) : (
              <span className="profile-avatar-emoji">🐶</span>
            )}

            {/* "Hidden upload button" */}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="avatar-file"
              style={{ display: "none" }}
            />    
          </div> 

        </div>
      

        {/* RIGHT COLUMN */}
        <div className="profile-top-right">

          {/* flag + name */}
          <div className="profile-name-row">
              <span className="profile-flag">
                  <ReactCountryFlag
                      countryCode="US"
                      svg
                      style={{
                          width: "28px",
                          height: "20px",
                          borderRadius: "4px"
                      }}
                  />
              </span>

              <div className="profile-identity-block">
                  <h2 className="profile-name">{displayName}</h2>
                  {/* <div className="profile-country-label">{selectedCountryLabel}</div> */}
              </div>

              <button
                  className="profile-edit-btn"
                  // onClick={() => setShowEditProfile(true)}
              >
                  Edit
              </button>
          </div>

          {/* Statistics */}
          <div className="profile-stat-row">
            <div className="profile-stat">
              <div className="profile-stat-title">Total Items</div>
              <div className="profile-stat-value">{collectedItems?.length || 0}</div>
            </div>

            <div className="profile-stat">
              <div className="profile-stat-title">Total friends</div>
              <div className="profile-stat-value">14 friends</div>
            </div>
          </div>  

          

          {/* second row: funny tag */}
          <div className="profile-pill">
            <div className="pill-title">Today’s Energy</div>

              <select
                  className="tag-select"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
              >
                  {TAG_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                      {option}
                  </option>
                  ))}
              </select>

            </div>
          </div>

        </div>





    </div>
    

  );
}