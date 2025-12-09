import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';
import { PLANS } from '../constants/plans';

interface PlanGuardProps {
    feature: keyof typeof PLANS['pro']['features'];
    children: React.ReactNode;
    fallback?: React.ReactNode; // Optional custom fallback
    showLock?: boolean; // Show lock icon wrapper if denied?
}

const PlanGuard: React.FC<PlanGuardProps> = ({ feature, children, fallback, showLock = false }) => {
    const { checkAccess, userPlan } = useAuth();
    const access = checkAccess(feature);

    // If access is strictly false (boolean check)
    if (access === false) {
        if (fallback) return <>{fallback}</>;

        if (showLock) {
            return (
                <div className="relative group cursor-not-allowed opacity-60 grayscale">
                    <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-lg">
                        <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                            <Lock size={12} /> Recurso PRO
                        </div>
                    </div>
                    <div className="pointer-events-none select-none filter blur-[1px]">
                        {children}
                    </div>
                </div>
            );
        }

        return null; // Render nothing by default if access denied
    }

    // If access returns 'basic' or similar strings, handling is up to the child component to check level
    // This guard primarily blocks 'false'. 
    // For 'stockManagement' which returns 'basic' or 'advanced', both are "truthy", so it renders.
    // The child must handle specific levels.

    return <>{children}</>;
};

export default PlanGuard;
