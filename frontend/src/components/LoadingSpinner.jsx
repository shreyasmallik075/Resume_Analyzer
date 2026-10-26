import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4',
  };

  const colors = {
    primary: 'border-primary-500/20 border-t-primary-600',
    white: 'border-white/20 border-t-white',
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className={`${sizes[size]} ${colors[color]} rounded-full`}
      />
    </div>
  );
};

export default LoadingSpinner;
