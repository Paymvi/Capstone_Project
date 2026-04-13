import { useRef, useState, useEffect } from "react";
import TAG_OPTIONS from "../utils/tags";
import ReactCountryFlag from "react-country-flag";
import { apiGetState  } from "../api";


export default function ProfilePage({ userId, collectedItems, setCollectedItems }) {

  const fileInputRef = useRef(null);

  const [avatar, setAvatar] = useState(null);
  const [displayName, setDisplayName] = useState("Demo User");
  const [tag, setTag] = useState(TAG_OPTIONS[0]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const totalCollected = [...new Set(collectedItems || [])].length;

  const BADGES = [
    {
      id: "socialite",
      img: "/badges/RR-Socialite-Badge.png",
      name: "Socialite",
      unlocked: false,
    },
    {
      id: "hiker",
      img: "/badges/RR-Hiker-Badge.png",
      name: "Hiker",
      unlocked: false,
    },
    {
      id: "explorer",
      img: "/badges/RR-Explorer-Badge.png",
      name: "Explorer",
      unlocked: false,
    },
    {
      id: "collector",
      img: "/badges/RR-Collector-Badge.png",
      name: "Collector",
      unlocked: totalCollected >= 5,
      requirement: "Collect 5 items",
    },
  ];

  useEffect(() => {
    async function loadState() {
      const data = await apiGetState();

      // IMPORTANT: overwrite + dedupe
      setCollectedItems([...new Set(data.inventory)]);
    }

    loadState();
  }, []);

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

        </div> {/* Profile-left */}
      

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
              <div className="profile-stat-value">{[...new Set(collectedItems || [])].length}</div>
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
          
          
        </div> {/* Profile-top-right */}

      </div> {/* Profile-top */}

        


      {/* BADGES SECTION */}
      <div className="profile-badges">

        <div className="badges-header">Badges</div>

        <div className="badges-scroll">
          {BADGES.map((badge) => (
            <div key={badge.id} className="badge-card">
              <img
                src={badge.img}
                alt={badge.name}
                className="badge-img"
                style={{ opacity: badge.unlocked ? 1 : 0.3 }}
              />
              <div className="badge-name">
                {badge.name}
                {!badge.unlocked && <div className="badge-status">Locked</div>}
              </div>
              <div className="badge-status">
                {badge.unlocked ? "Unlocked" : badge.requirement}
              </div>
            </div>
          ))}
        </div>

      </div>






    </div>
    

  );
}