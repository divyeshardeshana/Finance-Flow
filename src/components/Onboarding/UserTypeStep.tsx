import { User, Users, Briefcase, Building2 } from 'lucide-react';
import { UserType } from './OnboardingFlow';

interface UserTypeStepProps {
  onComplete: (type: UserType) => void;
}

export function UserTypeStep({ onComplete }: UserTypeStepProps) {
  const options = [
    {
      type: 'individual' as UserType,
      icon: User,
      title: 'Individual',
      description: 'Managing personal finances',
    },
    {
      type: 'family' as UserType,
      icon: Users,
      title: 'Family',
      description: 'Managing household finances together',
    },
    {
      type: 'freelancer' as UserType,
      icon: Briefcase,
      title: 'Freelancer',
      description: 'Independent contractor with variable income',
    },
    {
      type: 'small_business' as UserType,
      icon: Building2,
      title: 'Small Business',
      description: 'Running a small business',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to FinanceFlow</h2>
      <p className="text-gray-600 mb-8">Let's personalize your experience. What describes you best?</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.type}
              onClick={() => onComplete(option.type)}
              className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{option.title}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
