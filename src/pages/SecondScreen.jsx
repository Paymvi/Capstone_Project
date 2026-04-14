import { useState, useEffect, useMemo } from "react";
import 'leaflet/dist/leaflet.css';
import { useNavigate } from "react-router-dom";

import { apiSetEquipped } from "../api";
const DEV_MODE = true;

export default function SecondScreen({ userId, collectedItems, equipped, setEquipped }) {

  const [message, setMessage] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const navigate = useNavigate();

  // ALL Accessories
  // 123456
  const ACCESSORIES = [
    { 
      id: "hat_crown",                // crown
      type: "hat", 
      name: "Crown", 
      src: "/Roamie-Crown-2.png",
      position: { bottom: "77%", height: "40px", left: "44%" }
    },
    { 
      id: "hat_santahat",             // santahat
      type: "hat", 
      name: "SantaHat", 
      src: "/Roamie-SantaHat.png",
      position: { bottom: "75%", height: "60px", left: "55%" }
    },
    { 
      id: "hat_flower",             // flower
      type: "hat", 
      name: "Flower", 
      src: "/Roamie-Flower.png",
      position: { bottom: "75%", height: "45px", left: "56%" }
    }, 
    { 
      id: "body_coat",                // coat
      type: "body", 
      name: "Coat", 
      src: "/Roamie-Coat-2.png",
      position: { bottom: "8%", height: "90px", left: "45%" }
    
    },
    { 
      id: "outside_shield",             // shield
      type: "outside", 
      name: "Shield", 
      src: "/Roamie-Shield-2.png",
      position: { bottom: "10%", height: "100px", left: "65%"}
    },
    { 
      id: "outside_dumbbell",             // dumbbell
      type: "outside", 
      name: "Dumbell", 
      src: "/Roamie-Dumbbell-2.png",
      position: { bottom: "5%", height: "75px", left: "65%"}
    },
    
  ];


  // Unlocked Accessories
  const unlockedAccessories = ACCESSORIES.filter(item =>
    collectedItems.includes(item.id)
  );
  const filteredAccessories = useMemo(() => {
    if (activeCategory === "all") return unlockedAccessories;
    return unlockedAccessories.filter(item => item.type === activeCategory);
  }, [unlockedAccessories, activeCategory]);

  function equipAccessory(item) {
    setEquipped(prev => ({
      ...prev,
      [item.type]: item,     // replaces hat/body/outside automatically
    }));
  }

  const playClickSound = () => {
    const audio = new Audio("/jingle-2.wav");
    audio.volume = 0.5;
    audio.play();
  };

  async function toggleAccessory(item) {
    const newEquipped = {
      ...equipped,
      [item.type]: equipped[item.type] === item.id ? null : item.id
    };

    setEquipped(newEquipped);

  if (!DEV_MODE) {
    await apiSetEquipped(userId, {
      hat: newEquipped.hat,
      body: newEquipped.body,
      outside: newEquipped.outside
  }); }

    playClickSound();
  }

  function AccessoriesPanel({ items, equipped, onSelect }) {
    if (!items.length) {
      return (
        <div className="accessory-empty-state">
          <div className="accessory-empty-icon">🎒</div>
          <p>No accessories in this category yet.</p>
        </div>
      );
    }

    return (
      <div className="accessory-panel">
        {items.map(item => {
          const isEquipped = equipped[item.type] === item.id;

          return (
            <button
              key={item.id}
              className={`accessory-item ${isEquipped ? "equipped" : ""}`}
              onClick={() => onSelect(item)}
              type="button"
            >
              <div className="accessory-thumb-wrap">
                <img src={item.src} alt={item.name} />
              </div>

              <div className="accessory-meta">
                <span className="accessory-name">{item.name}</span>
                <span className="accessory-type">
                  {item.type === "hat" && "Hat"}
                  {item.type === "body" && "Outfit"}
                  {item.type === "outside" && "Item"}
                </span>
              </div>

              {isEquipped && <span className="equipped-badge">Equipped</span>}
            </button>
          );
        })}
      </div>
    );
  }



  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 1500); // 1.5 seconds

    return () => clearTimeout(timer);
  }, [message]);


  // The speak function
  const speak = (text) => {

    setMessage(text);

    let engine;

    engine = new Animalese("/animalese.wav", function () {
      const wave = engine.Animalese(text, false, 1);
      const audio = new Audio(wave.dataURI);
      audio.play();
    });
  };

  // ----------------------------------------------------

  return (

    <div className="avatar-screen">
      <div className="room">

        
          <div className="avatar-header">
            {/* <h1>Welcome to the Avatar Screen</h1> */}
          </div>

          <button
            className="customize-avatar-btn"
            onClick={() => setShowCustomizeModal(true)}
            type="button"
          >
            Customize Avatar
          </button>

          <button
            className="customize-avatar-btn"
            onClick={() => setShowCustomizeModal(true)}
            type="button"
          >
            Customize Avatar
          </button>

          <div className="avatar-stage">
            <div className="avatar-container">

            <img 
              src="/Roamie-Dog-2.png" 
              width="230px"
              onClick={() => speak("Welcome to Roamie!")}
            ></img>

            {message && (
              <div className="avatar-message">
                {message}
              </div>
            )}


            {/* Accessory */}

            {equipped.hat && (
              <img
                className="accessory accessory-hat"
                src={ACCESSORIES.find(a => a.id === equipped.hat)?.src}
                style={ACCESSORIES.find(a => a.id === equipped.hat)?.position}
              />
            )}

            {equipped.body && (
              <img
                className="accessory accessory-body"
                src={ACCESSORIES.find(a => a.id === equipped.body)?.src}
                style={ACCESSORIES.find(a => a.id === equipped.body)?.position}
              />
            )}

            {equipped.outside && (
              <img
                className="accessory accessory-outside"
                src={ACCESSORIES.find(a => a.id === equipped.outside)?.src}
                style={ACCESSORIES.find(a => a.id === equipped.outside)?.position}
              />
            )}


          </div>
        </div>


        {showCustomizeModal && (
          <div
            className="avatar-modal-overlay"
            onClick={() => setShowCustomizeModal(false)}
          >
            <div
              className="avatar-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="avatar-modal-top">
                {/* <div>
                  <p className="avatar-modal-kicker">Roamie Wardrobe</p>
                  <h2>Customize your avatar</h2>
                  <p className="avatar-modal-subtitle">
                    Mix hats, outfits, and items you’ve unlocked.
                  </p>
                </div> */}

                <button
                  className="avatar-modal-close"
                  onClick={() => setShowCustomizeModal(false)}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <div className="avatar-preview-card">
                <div className="avatar-preview-mini">
                  <img
                    src="/Roamie-Dog-2.png"
                    alt="Roamie preview"
                    className="avatar-preview-base"
                  />

                  {equipped.hat && (
                    <img
                      className="accessory accessory-hat"
                      src={ACCESSORIES.find(a => a.id === equipped.hat)?.src}
                      style={ACCESSORIES.find(a => a.id === equipped.hat)?.position}
                    />
                  )}

                  {equipped.body && (
                    <img
                      className="accessory accessory-body"
                      src={ACCESSORIES.find(a => a.id === equipped.body)?.src}
                      style={ACCESSORIES.find(a => a.id === equipped.body)?.position}
                    />
                  )}

                  {equipped.outside && (
                    <img
                      className="accessory accessory-outside"
                      src={ACCESSORIES.find(a => a.id === equipped.outside)?.src}
                      style={ACCESSORIES.find(a => a.id === equipped.outside)?.position}
                    />
                  )}
                </div>

                {/* <div className="avatar-preview-text">
                  <h3>Current Look</h3>
                  <p>
                    Tap any accessory below to equip or unequip it.
                  </p>
                </div> */}
              </div>

              <div className="accessory-filters">
                <button
                  className={activeCategory === "all" ? "active" : ""}
                  onClick={() => setActiveCategory("all")}
                  type="button"
                >
                  All
                </button>
                <button
                  className={activeCategory === "hat" ? "active" : ""}
                  onClick={() => setActiveCategory("hat")}
                  type="button"
                >
                  Hats
                </button>
                <button
                  className={activeCategory === "body" ? "active" : ""}
                  onClick={() => setActiveCategory("body")}
                  type="button"
                >
                  Outfits
                </button>
                <button
                  className={activeCategory === "outside" ? "active" : ""}
                  onClick={() => setActiveCategory("outside")}
                  type="button"
                >
                  Items
                </button>
              </div>

              <AccessoriesPanel
                items={filteredAccessories}
                equipped={equipped}
                onSelect={toggleAccessory}
              />
            </div>
          </div>
        )}
    
      </div>

    
  </div>

  )
}