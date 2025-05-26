"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoLogoInstagram, IoPersonCircleOutline } from "react-icons/io5";
import { MdEmail, MdShoppingCart } from "react-icons/md";
import { TiSocialFacebook } from "react-icons/ti";

const Navbar = () => {
  const { cartItems } = useCart();
  const { user, signOut } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const totalQuantity = (cartItems?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0) +
    (cartItems?.customCoils?.reduce((acc, item) => acc + item.quantity, 0) || 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <nav className="flex flex-col py-5 px-5 lg:px-20 gap-y-5">
      <div className="flex justify-between items-center">
        <a
          href={`mailto:${process.env.NEXT_PUBLIC_CLIENT_EMAIL}`}
          className="hidden md:flex items-center gap-3 text-blue-700 hover:underline"
        >
          <MdEmail className="h-5 w-5" />
          <h3>{process.env.NEXT_PUBLIC_CLIENT_EMAIL}</h3>
        </a>

        <Link href="/" className="block md:hidden">
          <Image src={"/logo.png"} height={100} width={100} alt="logo" className="cursor-pointer" />
        </Link>

        <div className="flex gap-3 text-gray-500 items-center">
          {/* Cart Icon */}
          <Link href="/cart" className="relative">
            <MdShoppingCart className="h-6 w-6" />
            {mounted && totalQuantity > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="flex md:hidden flex-col justify-center items-center gap-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="block w-6 h-[2px] bg-black"></span>
            <span className="block w-6 h-[2px] bg-black"></span>
            <span className="block w-6 h-[2px] bg-black"></span>
          </button>

          {/* Desktop Menu */}
          {mounted ? (
            <>
              {!user && (
                <div className="hidden md:block ml-2 px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-semibold cursor-pointer">
                  <Link href={"/auth/signin"}>
                    <h4>Login</h4>
                  </Link>
                </div>
              )}

              {user && (
                <div
                  className="hidden md:block ml-2 px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-semibold cursor-pointer"
                  onClick={handleSignOut}
                >
                  <h4>Logout</h4>
                </div>
              )}
            </>
          ) : (
            <div className="hidden md:block ml-2 px-4 py-2 bg-gray-200 rounded-md text-sm font-semibold">
              <h4>Loading...</h4>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden flex flex-col gap-4 py-4">
          <Link href="/cart" className="flex items-center gap-2">
            <MdShoppingCart className="h-5 w-5" />
            <span>Cart ({totalQuantity})</span>
          </Link>
          {!user ? (
            <Link href="/auth/signin" className="flex items-center gap-2">
              <IoPersonCircleOutline className="h-5 w-5" />
              <span>Login</span>
            </Link>
          ) : (
            <button onClick={handleSignOut} className="flex items-center gap-2">
              <IoPersonCircleOutline className="h-5 w-5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 