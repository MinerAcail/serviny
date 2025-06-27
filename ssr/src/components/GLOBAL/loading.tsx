import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/middleware/context/authContext";

import { Button } from "../ui/button";
import { LogIn, LogOut } from "lucide-react";
import Login from "./PROTECTION/Login";
import Logout from "./PROTECTION/LogOut";

export function SpectaclesLoading() {
  const [key, setKey] = useState(0);

  // Regenerate animation on mount and when key changes
  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 3000); // Replay animation every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Generate random values for animation
  const randomX = () => Math.random() * 100 - 50; // -50 to 50
  const randomY = () => Math.random() * 100 - 50; // -50 to 50
  const randomRotation = () => Math.random() * 360; // 0 to 360

  // Generate random entry point
  const entryX = randomX();
  const entryY = randomY();
  const entryRotation = randomRotation();

  return (
    <div className="flex items-center justify-center w-full ">
      <motion.div
        key={key}
        className="relative w-64 h-80"
        initial={{
          x: entryX,
          y: entryY,
          rotate: entryRotation,
          opacity: 0,
          scale: 0.5,
        }}
        animate={{
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.8,
          type: "spring",
          stiffness: 100,
        }}
      >
        {/* SVG Logo */}
        <motion.div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 60 20"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <g>
              {/* Left spectacle lens - animated stroke */}
              <motion.path
                className="fill-none stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="0.5"
                d="m 293.50361,92.096156 c -0.14552,-0.0469 -0.91943,-0.28715 -1.71979,-0.53383 -0.80037,-0.24669 -2.265,-0.98602 -3.25474,-1.64295 -5.25013,-3.48475 -6.56338,-9.78176 -2.93788,-14.08704 1.04626,-1.24244 11.15116,-10.0615 12.71649,-11.09833 2.54669,-1.68685 6.8941,-2.37258 10.03221,-1.58239 1.42616,0.35911 1.68623,0.69405 0.97879,1.26053 -1.62429,1.30066 -15.99154,13.88493 -16.93956,14.83738 -0.96082,0.96529 -1.12448,1.28954 -1.12448,2.2278 0,2.34536 2.44437,4.31971 5.03938,4.07036 1.57045,-0.1509 1.55487,-0.1393 10.13098,-7.54306 9.32419,-8.04958 10.00319,-8.60326 10.24904,-8.3574 0.50266,0.50266 1.07953,3.59184 0.90615,4.85251 -0.27781,2.01988 -1.46275,4.18965 -3.20196,5.86319 -2.1832,2.10077 -10.05286,8.8416 -11.45373,9.8108 -1.94032,1.34243 -4.3242,2.04063 -6.90736,2.02304 -1.23693,-0.008 -2.36802,-0.0537 -2.51354,-0.10061 z"
                transform="translate(-270, -75)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.4 }}
              />
              <motion.path
                className="fill-blue-500 dark:fill-blue-400"
                d="m 293.50361,92.096156 c -0.14552,-0.0469 -0.91943,-0.28715 -1.71979,-0.53383 -0.80037,-0.24669 -2.265,-0.98602 -3.25474,-1.64295 -5.25013,-3.48475 -6.56338,-9.78176 -2.93788,-14.08704 1.04626,-1.24244 11.15116,-10.0615 12.71649,-11.09833 2.54669,-1.68685 6.8941,-2.37258 10.03221,-1.58239 1.42616,0.35911 1.68623,0.69405 0.97879,1.26053 -1.62429,1.30066 -15.99154,13.88493 -16.93956,14.83738 -0.96082,0.96529 -1.12448,1.28954 -1.12448,2.2278 0,2.34536 2.44437,4.31971 5.03938,4.07036 1.57045,-0.1509 1.55487,-0.1393 10.13098,-7.54306 9.32419,-8.04958 10.00319,-8.60326 10.24904,-8.3574 0.50266,0.50266 1.07953,3.59184 0.90615,4.85251 -0.27781,2.01988 -1.46275,4.18965 -3.20196,5.86319 -2.1832,2.10077 -10.05286,8.8416 -11.45373,9.8108 -1.94032,1.34243 -4.3242,2.04063 -6.90736,2.02304 -1.23693,-0.008 -2.36802,-0.0537 -2.51354,-0.10061 z"
                transform="translate(-270, -75)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ delay: 1.0, duration: 0.8 }}
              />
              <motion.path
                className="fill-current text-blue-600 dark:text-blue-400"
                d="m 293.50361,92.096156 c -0.14552,-0.0469 -0.91943,-0.28715 -1.71979,-0.53383 -0.80037,-0.24669 -2.265,-0.98602 -3.25474,-1.64295 -5.25013,-3.48475 -6.56338,-9.78176 -2.93788,-14.08704 1.04626,-1.24244 11.15116,-10.0615 12.71649,-11.09833 2.54669,-1.68685 6.8941,-2.37258 10.03221,-1.58239 1.42616,0.35911 1.68623,0.69405 0.97879,1.26053 -1.62429,1.30066 -15.99154,13.88493 -16.93956,14.83738 -0.96082,0.96529 -1.12448,1.28954 -1.12448,2.2278 0,2.34536 2.44437,4.31971 5.03938,4.07036 1.57045,-0.1509 1.55487,-0.1393 10.13098,-7.54306 9.32419,-8.04958 10.00319,-8.60326 10.24904,-8.3574 0.50266,0.50266 1.07953,3.59184 0.90615,4.85251 -0.27781,2.01988 -1.46275,4.18965 -3.20196,5.86319 -2.1832,2.10077 -10.05286,8.8416 -11.45373,9.8108 -1.94032,1.34243 -4.3242,2.04063 -6.90736,2.02304 -1.23693,-0.008 -2.36802,-0.0537 -2.51354,-0.10061 z m 7.31182,-1.78664 c 2.07554,-1.02882 8.45421,-6.26776 12.60373,-10.35174 2.36577,-2.3284 3.23504,-3.94809 3.27841,-6.10856 0.0264,-1.31744 -0.26825,-2.79264 -0.55787,-2.79264 -0.11458,0 -3.82582,3.09538 -8.24721,6.87863 -4.42138,3.78325 -8.48752,7.19421 -9.03585,7.57992 -1.94374,1.36727 -4.94404,1.08388 -6.86368,-0.64831 -2.54933,-2.30038 -2.34297,-4.64152 0.63636,-7.21936 0.7719,-0.66788 4.55861,-3.92309 8.41491,-7.23379 3.8563,-3.31071 7.04836,-6.11941 7.09346,-6.24157 0.13362,-0.36193 -2.26017,-0.60654 -4.27922,-0.43727 -2.77299,0.23248 -4.85857,1.38929 -9.16424,5.08314 -9.2721,7.95459 -10.19002,9.09864 -10.18134,12.68965 0.004,1.80424 0.11571,2.32819 0.75437,3.54975 0.91112,1.74269 3.09797,3.98356 4.68441,4.80013 2.36746,1.21858 3.93034,1.57831 6.49813,1.49568 2.16628,-0.0697 2.61918,-0.17798 4.36563,-1.04366 z"
                transform="translate(-270, -75)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.8 }}
              />

              {/* Right spectacle lens - animated stroke */}
              <motion.path
                className="fill-none stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="0.5"
                d="m 313.78578,88.439956 c 1.3457,-0.67465 3.31481,-2.14281 6.32031,-4.7124 8.90586,-7.61416 8.28307,-6.96012 9.38954,-11.886667 0.2942,-1.309916 -0.0718,-2.3873 -0.9053,-3.92458 -2.81706,-5.19589 -9.92972,-7.59091 -15.20798,-5.12091 -1.16133,0.54345 -3.11974,2.02732 -6.3986,4.84817 -8.37313,7.203517 -9.24803,8.228157 -9.55358,11.188647 -0.16264,1.57581 0.0764,3.32742 0.45408,3.32742 0.13407,0 3.96749,-3.17443 8.51871,-7.05429 4.55123,-3.879857 8.62922,-7.269717 9.0622,-7.533037 2.69934,-1.64156 6.68106,-0.26726 7.93482,2.73873 0.53237,1.27641 0.51764,1.6704 -0.11099,2.96767 -0.5422,1.118917 -0.91904,1.466657 -11.62526,10.727627 -4.98165,4.30918 -5.84816,5.16248 -5.42395,5.34131 0.27767,0.11705 1.64931,0.1812 3.04808,0.14254 2.33405,-0.0645 2.70399,-0.15088 4.49792,-1.05023 z"
                transform="translate(-270, -75)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 1.0 }}
              />
              <motion.path
                className="fill-blue-500 dark:fill-blue-400"
                d="m 313.78578,88.439956 c 1.3457,-0.67465 3.31481,-2.14281 6.32031,-4.7124 8.90586,-7.61416 8.28307,-6.96012 9.38954,-11.886667a 0.2942,-1.309916 -0.0718,-2.3873 -0.9053,-3.92458 -2.81706,-5.19589 -9.92972,-7.59091 -15.20798,-5.12091 -1.16133,0.54345 -3.11974,2.02732 -6.3986,4.84817 -8.37313,7.203517 -9.24803,8.228157 -9.55358,11.188647 -0.16264,1.57581 0.0764,3.32742 0.45408,3.32742 0.13407,0 3.96749,-3.17443 8.51871,-7.05429 4.55123,-3.879857 8.62922,-7.269717 9.0622,-7.533037 2.69934,-1.64156 6.68106,-0.26726 7.93482,2.73873 0.53237,1.27641 0.51764,1.6704 -0.11099,2.96767 -0.5422,1.118917 -0.91904,1.466657 -11.62526,10.727627 -4.98165,4.30918 -5.84816,5.16248 -5.42395,5.34131 0.27767,0.11705 1.64931,0.1812 3.04808,0.14254 2.33405,-0.0645 2.70399,-0.15088 4.49792,-1.05023 z"
                transform="translate(-270, -75)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ delay: 1.4, duration: 0.8 }}
              />
              <motion.path
                className="fill-current text-blue-600 dark:text-blue-400"
                d="m 313.78578,88.439956 c 1.3457,-0.67465 3.31481,-2.14281 6.32031,-4.7124 8.90586,-7.61416 8.28307,-6.96012 9.38954,-11.886667 0.2942,-1.309916 -0.0718,-2.3873 -0.9053,-3.92458 -2.81706,-5.19589 -9.92972,-7.59091 -15.20798,-5.12091 -1.16133,0.54345 -3.11974,2.02732 -6.3986,4.84817 -8.37313,7.203517 -9.24803,8.228157 -9.55358,11.188647 -0.16264,1.57581 0.0764,3.32742 0.45408,3.32742 0.13407,0 3.96749,-3.17443 8.51871,-7.05429 4.55123,-3.879857 8.62922,-7.269717 9.0622,-7.533037 2.69934,-1.64156 6.68106,-0.26726 7.93482,2.73873 0.53237,1.27641 0.51764,1.6704 -0.11099,2.96767 -0.5422,1.118917 -0.91904,1.466657 -11.62526,10.727627 -4.98165,4.30918 -5.84816,5.16248 -5.42395,5.34131 0.27767,0.11705 1.64931,0.1812 3.04808,0.14254 2.33405,-0.0645 2.70399,-0.15088 4.49792,-1.05023 z"
                transform="translate(-270, -75)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0, duration: 0.8 }}
              />
            </g>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function SpectaclesError() {
  const [shake, setShake] = useState(true);
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    // Shake effect when component mounts
    const timer = setTimeout(() => {
      setShake(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        className={`relative w-64 h-64 flex items-center justify-center ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Broken Spectacles SVG */}
        <svg
          viewBox="0 0 60 20"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <g>
            {/* Left spectacle lens - broken */}
            <path
              className="fill-red-500 dark:fill-red-600 opacity-70"
              d="m 293.50361,92.096156 c -0.14552,-0.0469 -0.91943,-0.28715 -1.71979,-0.53383 -0.80037,-0.24669 -2.265,-0.98602 -3.25474,-1.64295 -5.25013,-3.48475 -6.56338,-9.78176 -2.93788,-14.08704 1.04626,-1.24244 11.15116,-10.0615 12.71649,-11.09833 2.54669,-1.68685 6.8941,-2.37258 10.03221,-1.58239 1.42616,0.35911 1.68623,0.69405 0.97879,1.26053 -1.62429,1.30066 -15.99154,13.88493 -16.93956,14.83738 -0.96082,0.96529 -1.12448,1.28954 -1.12448,2.2278 0,2.34536 2.44437,4.31971 5.03938,4.07036 1.57045,-0.1509 1.55487,-0.1393 10.13098,-7.54306 9.32419,-8.04958 10.00319,-8.60326 10.24904,-8.3574 0.50266,0.50266 1.07953,3.59184 0.90615,4.85251 -0.27781,2.01988 -1.46275,4.18965 -3.20196,5.86319 -2.1832,2.10077 -10.05286,8.8416 -11.45373,9.8108 -1.94032,1.34243 -4.3242,2.04063 -6.90736,2.02304 -1.23693,-0.008 -2.36802,-0.0537 -2.51354,-0.10061 z"
              transform="translate(-270, -75)"
            />

            <path
              className="fill-red-500 dark:fill-red-600 opacity-70"
              d="m 313.78578,88.439956 c 1.3457,-0.67465 3.31481,-2.14281 6.32031,-4.7124 8.90586,-7.61416 8.28307,-6.96012 9.38954,-11.886667 0.2942,-1.309916 -0.0718,-2.3873 -0.9053,-3.92458 -2.81706,-5.19589 -9.92972,-7.59091 -15.20798,-5.12091 -1.16133,0.54345 -3.11974,2.02732 -6.3986,4.84817 -8.37313,7.203517 -9.24803,8.228157 -9.55358,11.188647 -0.16264,1.57581 0.0764,3.32742 0.45408,3.32742 0.13407,0 3.96749,-3.17443 8.51871,-7.05429 4.55123,-3.879857 8.62922,-7.269717 9.0622,-7.533037 2.69934,-1.64156 6.68106,-0.26726 7.93482,2.73873 0.53237,1.27641 0.51764,1.6704 -0.11099,2.96767 -0.5422,1.118917 -0.91904,1.466657 -11.62526,10.727627 -4.98165,4.30918 -5.84816,5.16248 -5.42395,5.34131 0.27767,0.11705 1.64931,0.1812 3.04808,0.14254 2.33405,-0.0645 2.70399,-0.15088 4.49792,-1.05023 z"
              transform="translate(-270, -75)"
            />
          </g>
        </svg>
      </div>

      {/* Error message */}
      <nav className="space-y-1">
        {isAuthenticated ? (
          // Logout message and button
          <>
            {/* message for unkown error to logout and login again */}

            {/* <div className="mt-4 text-red-600 dark:text-red-500 font-semibold text-center"> */}
            <div className="mt-4 gap-2 flex flex-col justify-center items-center text-red-600 dark:text-red-500 font-semibold text-center">
              <p className="mb-2">Something went wrong!</p>
      {/* {isAuthenticated && <ProfileSwitcherContainer />} */}

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please check your connection and try sign out and sign in again
              </p>
              <Logout>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </Logout>
            </div>
          </>
        ) : (
          <>
            {/* Login message & button */}
            <div className="mt-4 flex flex-col justify-center items-center text-red-600 dark:text-red-500 font-semibold text-center">
              <p className="mb-2">Session expired or an error occurred!</p>
              <Login>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Button>
              </Login>
            </div>
          </>
        )}
      </nav>

      <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}</style>
    </div>
  );
}

export function ItemNotFound() {
  const [shake, setShake] = useState(true);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    // Initial shake effect when component mounts
    const shakeTimer = setTimeout(() => {
      setShake(false);
      // Start floating animation after shake completes
      setFloating(true);
    }, 1000);

    return () => clearTimeout(shakeTimer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-[70%] py-20 pt-10">
      <div
        className={`relative w-64 h-full flex items-center justify-center ${
          shake ? "animate-shake" : floating ? "animate-float" : ""
        }`}
      >
        {/* Broken Spectacles SVG */}
        <svg
          viewBox="0 0 60 20"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <g>
            {/* Left spectacle lens - broken */}
            <path
              className="fill-red-500 dark:fill-red-600 opacity-70"
              d="m 293.50361,92.096156 c -0.14552,-0.0469 -0.91943,-0.28715 -1.71979,-0.53383 -0.80037,-0.24669 -2.265,-0.98602 -3.25474,-1.64295 -5.25013,-3.48475 -6.56338,-9.78176 -2.93788,-14.08704 1.04626,-1.24244 11.15116,-10.0615 12.71649,-11.09833 2.54669,-1.68685 6.8941,-2.37258 10.03221,-1.58239 1.42616,0.35911 1.68623,0.69405 0.97879,1.26053 -1.62429,1.30066 -15.99154,13.88493 -16.93956,14.83738 -0.96082,0.96529 -1.12448,1.28954 -1.12448,2.2278 0,2.34536 2.44437,4.31971 5.03938,4.07036 1.57045,-0.1509 1.55487,-0.1393 10.13098,-7.54306 9.32419,-8.04958 10.00319,-8.60326 10.24904,-8.3574 0.50266,0.50266 1.07953,3.59184 0.90615,4.85251 -0.27781,2.01988 -1.46275,4.18965 -3.20196,5.86319 -2.1832,2.10077 -10.05286,8.8416 -11.45373,9.8108 -1.94032,1.34243 -4.3242,2.04063 -6.90736,2.02304 -1.23693,-0.008 -2.36802,-0.0537 -2.51354,-0.10061 z"
              transform="translate(-270, -75)"
            />

            <path
              className="fill-red-500 dark:fill-red-600 opacity-70"
              d="m 313.78578,88.439956 c 1.3457,-0.67465 3.31481,-2.14281 6.32031,-4.7124 8.90586,-7.61416 8.28307,-6.96012 9.38954,-11.886667 0.2942,-1.309916 -0.0718,-2.3873 -0.9053,-3.92458 -2.81706,-5.19589 -9.92972,-7.59091 -15.20798,-5.12091 -1.16133,0.54345 -3.11974,2.02732 -6.3986,4.84817 -8.37313,7.203517 -9.24803,8.228157 -9.55358,11.188647 -0.16264,1.57581 0.0764,3.32742 0.45408,3.32742 0.13407,0 3.96749,-3.17443 8.51871,-7.05429 4.55123,-3.879857 8.62922,-7.269717 9.0622,-7.533037 2.69934,-1.64156 6.68106,-0.26726 7.93482,2.73873 0.53237,1.27641 0.51764,1.6704 -0.11099,2.96767 -0.5422,1.118917 -0.91904,1.466657 -11.62526,10.727627 -4.98165,4.30918 -5.84816,5.16248 -5.42395,5.34131 0.27767,0.11705 1.64931,0.1812 3.04808,0.14254 2.33405,-0.0645 2.70399,-0.15088 4.49792,-1.05023 z"
              transform="translate(-270, -75)"
            />
          </g>
        </svg>
      </div>

      {/* Error message */}
      <div className=" text-red-600 dark:text-red-500 font-semibold text-center">
        <p className=" text-xl">Not Found</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We couldn't find the what you were looking for
        </p>
        <button
          className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          onClick={() => window.location.reload()}
        >
          Back
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
