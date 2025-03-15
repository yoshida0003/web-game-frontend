import React, { useState } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css"; // SimpleBarのスタイルを適用
import "./shogi.css";

interface HamburgerMenuProps {
  logs: string[];
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ logs }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className={`openbtn ${isOpen ? "active" : ""}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <nav id="g-nav" className={isOpen ? "panelactive" : ""}>
        <div id="g-nav-list">
          <h3 className="p-4 text-3xl pt-24 ml-10">ログ</h3>
          <SimpleBar style={{ maxHeight: "calc(100vh - 150px)" }}>
            <ul className="pt-4 px-6">
              {logs.map((log, index) => (
                <li key={`${log}-${index}`} className="log-item py-2">
                  {log}
                </li>
              ))}
            </ul>
          </SimpleBar>
        </div>
      </nav>
    </div>
  );
};

export default HamburgerMenu;
