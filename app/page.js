"use client";
import React, { useState } from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  googleLogout,
} from "@react-oauth/google";
import PhotoSearch from "@/app/components/photoSearch";
import PhotoUpload from "@/app/components/photoUpload";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faUpload } from "@fortawesome/free-solid-svg-icons";
import jwt from "jsonwebtoken"; // Import jsonwebtoken

const CLIENT_ID =
  "103190927335-gcdgd02ma19ajtsan19c7p40d301tvlg.apps.googleusercontent.com";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("search");
  const images = [
    { src: "/images/sample1.jpg", alt: "Sample 1", caption: "Sample 1" },
    { src: "/images/sample2.jpg", alt: "Sample 2", caption: "Sample 2" },
    { src: "/images/sample3.jpg", alt: "Sample 3", caption: "Sample 3" },
  ];
  const switchToSearch = () => {
    setActiveTab("search");
  };

  const switchToUpload = () => {
    setActiveTab("upload");
  };

  const handleLoginSuccess = (response) => {
    setIsLoggedIn(true);
    setUser(response.profileObj); // Save the profile object from response

    // Encode JWT with user information
    const token = jwt.sign(
      { username: response.profileObj.name },
      "your_secret_key",
      { expiresIn: "1h" }
    );
    localStorage.setItem("jwtToken", token); // Store JWT in localStorage or session

    console.log(response);
  };

  const handleLoginFailure = (error) => {
    alert("Failed to log in");
    console.log(error);
  };

  const handleLogoutSuccess = () => {
    setIsLoggedIn(false);
    setUser(null);
    googleLogout();
    localStorage.removeItem("jwtToken"); // Remove JWT from storage upon logout
  };

  Fancybox.bind("[data-fancybox]", {
    // Your custom options
  });

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="min-h-screen bg-white text-gray-900">
        <header className="p-2 flex justify-between items-center ">
          <div className="container mx-auto flex justify-between items-center px-4">
            <img
              src="/images/VTVLive.png"
              alt="Logo"
              className="h-12 md:h-16"
            />
            <div>
              {isLoggedIn ? (
                <div className="flex items-center">
                  <span className="text-white mr-2">
                    Hi, {user && user.name}
                  </span>
                  <button
                    onClick={handleLogoutSuccess}
                    className="bg-red-500 text-white py-2 px-4 rounded"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginFailure}
                  text="Login / Sign Up"
                  className="bg-green-500 text-white py-2 px-4 rounded"
                />
              )}
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 text-center">
          <a
            href="/images/background.jpg"
            data-fancybox="gallery"
            data-caption="Mừng sinh nhật công ty VTVLive"
          >
            <div
              className="text-section h-96 p-8 bg-cover bg-center mb-4 rounded-lg shadow-lg text-white flex flex-col justify-center items-center"
              style={{ backgroundImage: 'url("/images/background.jpg")' }}
            ></div>
          </a>
          <div className="border-b border-gray-300 mb-4">
            <div className="flex bg-white rounded-t-lg shadow-lg">
              <button
                onClick={switchToSearch}
                className={`cursor-pointer py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-t-lg border-b-2 ${
                  activeTab === "search"
                    ? "border-blue-300 bg-gray-200"
                    : "border-transparent"
                } transition-colors duration-300`}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />
                  Tìm kiếm ảnh
                </div>
              </button>
              <button
                onClick={switchToUpload}
                className={`cursor-pointer py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-t-lg border-b-2 ${
                  activeTab === "upload"
                    ? "border-blue-300 bg-gray-200"
                    : "border-transparent"
                } transition-colors duration-300`}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faUpload} className="mr-2" />
                  Đóng góp ảnh
                </div>
              </button>
            </div>

            <div className="p-4 mt-4 bg-white rounded-lg shadow-lg">
              {activeTab === "search" && <PhotoSearch />}
              {activeTab === "upload" && <PhotoUpload />}
            </div>
          </div>
        </main>
        <h3 className="text-2xl mb-4 text-center">Các ảnh đang có</h3>
        <div className="flex justify-center flex-wrap">
          {images.map((image, index) => (
            <a
              key={index}
              href={image.src}
              data-fancybox="gallery"
              data-caption={image.caption}
              className="m-2"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-48 h-48 object-cover rounded-lg shadow-lg border-2 border-black"
              />
            </a>
          ))}
        </div>
        <footer className="bg-gray-900 text-gray-300 p-6">
          <div className="container mx-auto text-center">
            <p className="text-lg font-bold mb-2">VTVLive - Kỷ niệm 10 năm</p>
            <p className="mb-4">Theo dõi chúng tôi trên mạng xã hội:</p>
            <div className="flex justify-center space-x-4 mb-4">
              <a
                href="#"
                className="text-gray-300 hover:text-gray-400 transition duration-300"
              >
                Facebook
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-gray-400 transition duration-300"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-gray-400 transition duration-300"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-gray-400 transition duration-300"
              >
                LinkedIn
              </a>
            </div>
            <p>
              &copy; {new Date().getFullYear()} VTVLive. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}
