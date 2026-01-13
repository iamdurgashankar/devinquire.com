import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle, type = 'login' }) => {
    return (
        <div className="min-h-screen w-full bg-[#f3f4f6] p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans">
            <div className="w-full max-w-[1400px] min-h-[90vh] grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 my-auto">

                {/* Left Column - Form & Social Proof */}
                <div className="flex flex-col h-full gap-4 md:gap-6">

                    {/* Main Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 bg-white rounded-[2.5rem] p-8 md:p-12 lg:p-16 flex flex-col justify-center relative overflow-hidden shadow-sm"
                    >
                        <div className="max-w-md w-full mx-auto">
                            {/* Logo */}
                            <div className="mb-10 text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                                <div className="w-8 h-8 bg-black rounded-lg text-white flex items-center justify-center text-xs font-bold font-mono">
                                    DI
                                </div>
                                DevInquire
                            </div>

                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-[2.75rem] leading-[1.1] font-medium tracking-tight text-neutral-900 mb-4">
                                    {title}
                                </h1>
                                <p className="text-neutral-500 text-lg leading-relaxed">
                                    {subtitle}
                                </p>
                            </div>

                            {/* Form Content */}
                            {children}
                        </div>
                    </motion.div>

                    {/* Social Proof Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-white rounded-[2rem] p-6 md:p-8 flex items-center justify-between shadow-sm min-h-[120px]"
                    >
                        <div className="flex items-center gap-6">
                            <div className="flex items-center -space-x-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-neutral-100 overflow-hidden relative">
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 40}`}
                                            alt="User"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                                <div className="w-12 h-12 rounded-full border-2 border-white bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold">
                                    +20k
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold text-neutral-900 text-lg">Join with 20k+ Users!</div>
                                <div className="text-neutral-500 text-sm">Let's see our happy customers</div>
                            </div>
                        </div>

                        <button className="w-14 h-14 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors group">
                            <ArrowUpRight className="text-neutral-900 group-hover:rotate-45 transition-transform duration-300" size={24} />
                        </button>
                    </motion.div>

                </div>

                {/* Right Column - Visual Hero */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="hidden lg:flex relative rounded-[2.5rem] overflow-hidden bg-[#7BB8C4]" // Fallback color close to reference
                >
                    {/* Background Image/Gradient resembling the reference */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7BB8C4] to-[#5A99A8]"></div>

                    {/* 3D Abstract Shape Placeholder - using CSS for 'clean' abstract look */}
                    <div className="absolute inset-0 flex items-center justify-center perspective-[1000px]">
                        <div className="relative w-[80%] h-[60%] transform rotate-x-12 rotate-y-12 hover:rotate-y-45 transition-transform duration-[2s] ease-in-out">
                            {/* Simulating the white architectural block in the reference */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/10 backdrop-blur-md rounded-[3rem] border border-white/20 shadow-2xl transform rotate-45"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/20 backdrop-blur-xl rounded-[2rem] shadow-xl animate-pulse"></div>
                        </div>
                    </div>

                    {/* Text Overlay */}
                    <div className="relative z-10 p-16 text-white h-full flex flex-col justify-between">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-medium leading-tight mb-6">
                                AI Revolutionizing <br /> the way we create.
                            </h2>
                        </div>

                        {/* Bottom Card in Hero */}
                        <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-white rounded-full"></div>
                                    </div>
                                    <span className="text-lg font-medium">Creating Design Brief...</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-white/80 font-light leading-relaxed">
                                Create design brief with AI voice command to make awesome 3d images that suits your needs.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthLayout;
