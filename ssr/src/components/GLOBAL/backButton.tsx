import { MoveLeft } from 'lucide-react';
import React from 'react';

interface BackButtonProps {
    onClick?: () => void;
    className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, className }) => {
    return (
        <div
            onClick={onClick || (() => window.history.back())}
            className={`flex items-center justify-between p-4 bg-primary/10 w-fit rounded-tl-lg rounded-tr-lg ${className}`}
        >
            <MoveLeft className="w-6 h-6" />
        </div>
    );
};

export default BackButton;