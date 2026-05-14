import React from "react";
import { motion } from "framer-motion";
import logo from "../../assets/logo.png";

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-8">
          <motion.img
            src={logo}
            alt="InfraPilot"
            className="h-32 w-auto object-contain relative z-10"
            animate={{ 
              filter: ["drop-shadow(0 0 0px rgba(0, 102, 204, 0))", "drop-shadow(0 0 20px rgba(0, 102, 204, 0.4))", "drop-shadow(0 0 0px rgba(0, 102, 204, 0))"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 bg-primary rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase mt-2">
            Initializing Secure Session
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
