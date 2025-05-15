export function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
      <div className="flex items-center justify-between w-full mb-6">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center w-full">
            <div
              className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
              ${
                index + 1 === currentStep
                  ? "bg-[#0071E3] text-white"
                  : index + 1 < currentStep
                    ? "bg-[#0071E3]/20 text-[#0071E3]"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }
            `}
            >
              {index + 1}
            </div>
  
            {index < totalSteps - 1 && (
              <div
                className={`
                flex-1 h-0.5 mx-2
                ${index + 1 < currentStep ? "bg-[#0071E3]" : "bg-gray-200 dark:bg-gray-700"}
              `}
              />
            )}
          </div>
        ))}
      </div>
    )
  }
  