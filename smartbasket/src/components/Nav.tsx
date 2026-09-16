'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { User, Users, Menu, Search, ShoppingBasket, ShoppingCart, Boxes, ClipboardCheck, LogOut, Package, PlusCircle, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import ProfileModal from './ProfileModal';

interface IUser {
  _id?:string;
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  address?: string;
  role: "user" | "deliveryBoy" | "admin" | "shopkeeper";
  image?: string;
}

export default function Nav({ user: initialUser }: { user: IUser }) {
  const storedUser = useSelector((state: RootState) => state.user.userData);
  const user = storedUser?._id === initialUser._id ? { ...initialUser, ...storedUser } : initialUser;
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const { cartData } = useSelector((state: RootState) => state.cart);
  const [search, setSearch] = useState("");
  const profileDropDown = useRef<HTMLDivElement>(null);
  const router = useRouter();
const [showProfileModal, setShowProfileModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) {
      return router.push("/");
    }

    router.push(`/?q=${encodeURIComponent(query)}`);
    setSearch("");
    setSearchBarOpen(false);
  };

  const sideBar = menuOpen ? createPortal(
    <AnimatePresence>
      <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-9998 bg-slate-950/40 backdrop-blur-sm" />
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100 }}
        transition={{ type: "spring", stiffness: 100, damping: 14 }}
        id="mobile-navigation"
        className="fixed inset-y-0 left-0 z-9999 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-emerald-950 p-6 text-white shadow-2xl"
      >
        <div className="flex justify-between items-center mb-2">
          <h1 className="font-extrabold text-2xl tracking-wide">{user.role === "admin" ? "Admin panel" : user.role === "shopkeeper" ? "Shopkeeper panel" : "SmartBasket"}</h1>
          <button 
            aria-label="Close navigation"
            className="rounded-lg p-2 text-emerald-100 transition hover:bg-white/10" 
            onClick={() => setMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 mt-3 bg-white/10 rounded-xl mb-6 transition-all hover:bg-white/15 shadow-inner">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg border-green-400/60 relative">
            {user?.image ? (
              <Image src={user?.image} alt="user" fill className="object-cover rounded-full" />
            ) : (
              <User className="w-12 h-12 p-2 text-green-300" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
            <p className="text-xs text-green-200 capitalize tracking-wide">{user?.role}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 font-medium mt-6">
          {user?.role === "admin" && (
            <>
              <Link href="/admin/view-grocery" className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              onClick={() => setMenuOpen(false)}>
                <Boxes className="w-5 h-5" /> View Grocery
              </Link>
              <Link href="/admin/manage-orders" className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              onClick={() => setMenuOpen(false)}>
                <ClipboardCheck className="w-5 h-5" /> Manage Orders
              </Link>
              <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              onClick={() => setMenuOpen(false)}>
                <Users className="w-5 h-5" /> Users
              </Link>
            </>
          )}
          {user?.role === "shopkeeper" && (
            <>
              <Link href="/admin/add-grocery" className='flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all'
              onClick={() => setMenuOpen(false)}>
                <PlusCircle className='w-5 h-5' /> Add Grocery
              </Link>
              <Link href="/admin/view-grocery" className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all"
              onClick={() => setMenuOpen(false)}>
                <Boxes className="w-5 h-5" /> View Grocery
              </Link>
            </>
          )}
        </div>

        {user.role === 'deliveryBoy' && <Link href="/delivery/my-deliveries" onClick={() => setMenuOpen(false)} className="mt-3 flex items-center gap-3 rounded-lg bg-white/10 p-3 text-sm"><Package size={20} /> My deliveries</Link>}
        <div className="my-5 border-t border-white/20"></div>

        {user?.role === "user" && (
          <Link href="/user/cart" className='relative bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-md hover:scale-105 transition'>
            <ShoppingCart className='text-green-600 w-6 h-6' />
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 flex items-center justify-center rounded-full font-semibold shadow'>{cartData?.length || 0}</span>
          </Link>
        )}

        <button 
          onClick={async () => await signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 text-red-300 font-semibold hover:bg-red-500/20 w-full p-3 rounded-lg transition mt-auto"
        >
          <LogOut className="w-5 h-5 text-red-300" /> Logout
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <nav aria-label="Main navigation" className="fixed top-3 left-1/2 z-50 flex h-18 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-emerald-950 px-4 text-white shadow-lg shadow-emerald-950/10 sm:top-4 sm:px-6">

        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-base font-bold tracking-tight text-white sm:text-xl">
          <span className="hidden rounded-xl bg-emerald-400/15 p-2 text-emerald-300 sm:block"><ShoppingBasket size={22} aria-hidden="true" /></span>
          SmartBasket
        </Link>

        {user?.role === "user" && (
          <form className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-1/2 max-w-lg shadow-md" onSubmit={handleSearch}>
            <Search className="text-gray-500 w-5 h-5 mr-3" />
            <input type="text" placeholder="Search groceries..."
              className="flex-1 outline-none text-gray-700 placeholder:text-gray-400"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
          </form>
        )}

        {user.role === 'deliveryBoy' && <Link href="/delivery/my-deliveries" className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10 lg:flex"><Package size={18} /> My deliveries</Link>}
        {/* Desktop Admin Links */}
        {user?.role === "admin" && (
          <div className='hidden lg:flex items-center gap-2'>
            <Link href='/admin/view-grocery' className='flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300'>
              <Boxes className='w-5 h-5' /> View Grocery
            </Link>
            <Link href='/admin/manage-orders' className='flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300'>
              <ClipboardCheck className='w-5 h-5' /> Manage Orders
            </Link>
            <Link href='/admin/users' className='flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300'>
              <Users className='w-5 h-5' /> Users
            </Link>
          </div>
        )}

        {/* Desktop Shopkeeper Links */}
        {user?.role === "shopkeeper" && (
          <div className='hidden lg:flex items-center gap-2'>
            <Link href='/admin/add-grocery' className='flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300'>
              <PlusCircle className='w-5 h-5' /> Add Grocery
            </Link>
            <Link href='/admin/view-grocery' className='flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300'>
              <Boxes className='w-5 h-5' /> View Grocery
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {user?.role === "user" && (
            <>
              <div 
                className="md:hidden bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition"
                onClick={() => setSearchBarOpen(prev => !prev)}
              >
                <Search className="text-green-600 w-6 h-6" />
              </div>

              <Link href="/user/cart" className="relative hidden bg-white rounded-full w-11 h-11 min-[400px]:flex items-center justify-center shadow-md hover:scale-105 transition">
                <ShoppingCart className="text-green-600 w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full shadow">
                  {cartData?.length || 0}
                </span>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button type="button" aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 lg:hidden"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            <Menu className="h-5 w-5 text-white" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropDown}>
            <button type="button" aria-label="Open account menu" aria-expanded={open}
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-800 bg-emerald-50 transition hover:border-emerald-400"
              onClick={() => setOpen(prev => !prev)}
            >
              {user?.image ? (
                <Image src={user?.image} alt="user" fill className="object-cover rounded-full" />
              ) : (
                <User className="text-green-600 w-6 h-6" />
              )}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="absolute right-0 mt-3 w-56 text-slate-700 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50"
                >
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100">
                    <div className="w-10 h-10 relative rounded-full overflow-hidden">
                      {user?.image ? (
                        <Image src={user?.image} alt='user' fill className="object-cover rounded-full" />
                      ) : (
                        <User className="w-10 h-10 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className='text-gray-800 font-semibold'>{user?.name}</div>
                      <div className='text-xs text-gray-500 capitalize'>{user?.role}</div>
                    </div>
                  </div>

                  {user?.role === "user" && (
                    <Link 
                      href="/user/my-orders" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-xl text-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      <Package className="w-5 h-5" /> My Orders
                    </Link>
                  )}

                  <button onClick={() => { setOpen(false); setShowProfileModal(true); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-xl">Profile</button>
                  <button onClick={() => {setOpen(false); setShowSettingsModal(true); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-xl">Settings</button>
                   
                  <button 
                    onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex items-center gap-3 text-red-400 hover:text-red-500 w-full p-3 rounded-lg hover:bg-red-50 transition"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {sideBar}

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {searchBarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-xl p-4 z-60 md:hidden"
          >
            <Search className='text-gray-500 w-5 h-5 mr-2' />
            <form className='grow' onSubmit={handleSearch}>
              <input type="text" className='w-full outline-none text-gray-700' 
                placeholder='search groceries...' value={search}
                onChange={(e)=>setSearch(e.target.value)}/>
            </form>
            <button onClick={() => setSearchBarOpen(false)}>
              <X className='text-gray-500 w-5 h-5' />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Profile Details Modal */}
<AnimatePresence>
  {showProfileModal && (
    <ProfileModal user={user} onClose={() => setShowProfileModal(false)} />
  )}
</AnimatePresence>
{/* Settings Modal */}
<AnimatePresence>
  {showSettingsModal && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-999 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative border border-gray-100"
      >
        <button 
          onClick={() => setShowSettingsModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Settings</h2>

        <div className="space-y-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Account Status</p>
              <p className="text-xs text-gray-500">Active and Verified</p>
            </div>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Role</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || "user"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSettingsModal(false)}
          className="w-full mt-6 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition shadow-md shadow-green-200"
        >
          Close
        </button>
      </motion.div>
    </div>
  )}
</AnimatePresence>
    </>
  );
}
