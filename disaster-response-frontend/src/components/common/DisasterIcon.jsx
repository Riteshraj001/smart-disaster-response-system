import React from 'react';
import {
  Flame,
  Waves,
  Activity,
  Mountain,
  Wind,
  Car,
  AlertTriangle,
  Radio,
} from 'lucide-react';

const DisasterIcon = ({ type, className = 'w-5 h-5', showContainer = false, size = 'md' }) => {
  const normalized = (type || '').trim().toLowerCase();

  let Icon = AlertTriangle;
  let colorStyles = {
    iconColor: 'text-amber-600',
    containerBg: 'bg-amber-50 border-amber-200 text-amber-600',
  };

  if (normalized.includes('flood') || normalized.includes('water')) {
    Icon = Waves;
    colorStyles = {
      iconColor: 'text-blue-600',
      containerBg: 'bg-blue-50 border-blue-200 text-blue-600',
    };
  } else if (normalized.includes('earthquake') || normalized.includes('tremor')) {
    Icon = Activity;
    colorStyles = {
      iconColor: 'text-amber-600',
      containerBg: 'bg-amber-50 border-amber-200 text-amber-600',
    };
  } else if (normalized.includes('fire') || normalized.includes('wildfire') || normalized.includes('explosion')) {
    Icon = Flame;
    colorStyles = {
      iconColor: 'text-red-600',
      containerBg: 'bg-red-50 border-red-200 text-red-600',
    };
  } else if (normalized.includes('landslide') || normalized.includes('mudslide') || normalized.includes('mountain')) {
    Icon = Mountain;
    colorStyles = {
      iconColor: 'text-stone-600',
      containerBg: 'bg-stone-100 border-stone-200 text-stone-700',
    };
  } else if (normalized.includes('cyclone') || normalized.includes('hurricane') || normalized.includes('storm') || normalized.includes('wind')) {
    Icon = Wind;
    colorStyles = {
      iconColor: 'text-cyan-700',
      containerBg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    };
  } else if (normalized.includes('accident') || normalized.includes('crash') || normalized.includes('traffic')) {
    Icon = Car;
    colorStyles = {
      iconColor: 'text-orange-600',
      containerBg: 'bg-orange-50 border-orange-200 text-orange-600',
    };
  } else if (normalized.includes('tsunami')) {
    Icon = Waves;
    colorStyles = {
      iconColor: 'text-teal-700',
      containerBg: 'bg-teal-50 border-teal-200 text-teal-700',
    };
  } else if (normalized.includes('industrial') || normalized.includes('hazard') || normalized.includes('gas')) {
    Icon = Radio;
    colorStyles = {
      iconColor: 'text-indigo-600',
      containerBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    };
  }

  if (showContainer) {
    const sizeClasses =
      size === 'sm'
        ? 'w-8 h-8 rounded-lg'
        : size === 'lg'
        ? 'w-11 h-11 rounded-xl'
        : 'w-9 h-9 rounded-lg';

    return (
      <div
        className={`inline-flex items-center justify-center border ${sizeClasses} ${colorStyles.containerBg} shrink-0`}
      >
        <Icon className={className} />
      </div>
    );
  }

  return <Icon className={`${className} ${colorStyles.iconColor}`} />;
};

export default DisasterIcon;

