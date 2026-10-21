import React from 'react';
import { BookOpen, Flame, Waves, Activity, Wind, PhoneCall } from 'lucide-react';
import { EMERGENCY_HELPLINES } from '../../constants/incidentConstants';

const SafetyGuidePage = () => {
  const guides = [
    {
      title: 'Structure Fire & Wildfire',
      icon: Flame,
      dos: [
        'Stay low to the floor to avoid inhaling smoke and toxic gases.',
        'Feel door handles before opening; if hot, seek an alternate escape route.',
        'Call national emergency helpline 112 or Fire Brigade 101 immediately.',
      ],
      donts: [
        'Do not use elevators during a building fire.',
        'Do not re-enter a burning building under any circumstances.',
      ],
    },
    {
      title: 'Flash Floods & Water Inundation',
      icon: Waves,
      dos: [
        'Move immediately to higher ground away from drainage canals and rivers.',
        'Turn off main electricity breakers and gas valves if safe to do so.',
        'Follow local administration announcements on radio and official advisories.',
      ],
      donts: [
        'Do not walk, swim, or drive through moving floodwaters.',
        'Do not touch fallen power lines or submerged electrical devices.',
      ],
    },
    {
      title: 'Earthquake Safety',
      icon: Activity,
      dos: [
        'Drop, Cover, and Hold On under a sturdy table or desk.',
        'If outdoors, move to an open area away from tall buildings, power lines, and trees.',
        'Be prepared for aftershocks and check for gas leaks before using matches.',
      ],
      donts: [
        'Do not stand in doorways or run outside during active shaking.',
        'Do not use elevators until cleared by safety inspectors.',
      ],
    },
    {
      title: 'Cyclone & Severe Storm',
      icon: Wind,
      dos: [
        'Secure windows, doors, and loose outdoor items before the storm arrives.',
        'Store adequate drinking water, non-perishable food, and essential medications.',
        'Remain inside a reinforced room until official all-clear is announced.',
      ],
      donts: [
        'Do not venture outside during the calm eye of the storm.',
        'Do not shelter under trees or temporary tin structures.',
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          Disaster Preparedness &amp; Safety Guide
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Essential protocols and safety steps for citizens during natural disasters and emergencies.
        </p>
      </div>

      {/* Helplines reminder */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase text-[#111827] mb-3 flex items-center gap-1.5">
          <PhoneCall className="w-4 h-4 text-[#1D4ED8]" />
          <span>Quick National Emergency Helplines</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          {EMERGENCY_HELPLINES.slice(0, 4).map((h) => (
            <div key={h.number} className="p-2.5 rounded-md border border-[#E5E7EB] bg-[#F5F7FA]">
              <p className="text-[#64748B] text-[11px] truncate">{h.name}</p>
              <p className="text-[#1D4ED8] font-bold text-xs mt-0.5">{h.number}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((g) => {
          const Icon = g.icon;
          return (
            <div
              key={g.title}
              className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-blue-50 text-[#1D4ED8]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111827]">{g.title}</h3>
                </div>

                {/* DO's */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#059669] uppercase">
                    &check; Recommended Actions (DO)
                  </span>
                  <ul className="space-y-1 text-xs text-[#111827]">
                    {g.dos.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[#64748B]">
                        <span className="text-[#059669] font-bold">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* DONT's */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-[#DC2626] uppercase">
                    &#10006; Actions to Avoid (DON'T)
                  </span>
                  <ul className="space-y-1 text-xs text-[#111827]">
                    {g.donts.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[#64748B]">
                        <span className="text-[#DC2626] font-bold">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SafetyGuidePage;

