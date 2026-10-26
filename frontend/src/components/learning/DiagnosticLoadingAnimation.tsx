/**
 * Diagnostic Loading Animation - Robot Building Lesson Plan
 * Engaging 40-50 second animation for middle schoolers while diagnostic is being generated
 */
import { useEffect, useState } from 'react';

interface DiagnosticLoadingAnimationProps {
  subjectName?: string;
}

const FUN_FACTS = [
  "💡 Your brain has ~86 billion neurons!",
  "🚀 Learning creates new brain connections!",
  "🎯 Practice makes your brain stronger!",
  "⚡ Your brain uses 20% of your energy!",
  "🌟 You're building new skills right now!",
  "🧠 Your brain can hold 2.5 million gigabytes!",
  "🎨 Every time you learn, your brain changes!",
  "🔥 You're more powerful than you think!"
];

export default function DiagnosticLoadingAnimation({ subjectName = "your subject" }: DiagnosticLoadingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(1);
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Progress simulation over 50 seconds
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / 500); // 50 seconds = 500 intervals of 100ms
        return Math.min(newProgress, 99); // Cap at 99% until actually done
      });
    }, 100);

    // Stage progression
    const stageInterval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        
        // Update stage based on elapsed time
        if (newTime <= 10) setCurrentStage(1);
        else if (newTime <= 20) setCurrentStage(2);
        else if (newTime <= 35) setCurrentStage(3);
        else if (newTime <= 45) setCurrentStage(4);
        else setCurrentStage(5);
        
        return newTime;
      });
    }, 1000);

    // Fun facts rotation every 6 seconds
    const factInterval = setInterval(() => {
      setFunFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
      clearInterval(factInterval);
    };
  }, []);

  const getStageMessage = () => {
    switch (currentStage) {
      case 1:
        return "Initializing AI Tutor...";
      case 2:
        return "Analyzing your knowledge level...";
      case 3:
        return "Crafting your personalized lessons...";
      case 4:
        return "Almost there! Adding final touches...";
      case 5:
        return "Your learning plan is ready!";
      default:
        return "Preparing your experience...";
    }
  };

  const getSectionStatus = (sectionNum: number) => {
    if (currentStage < 3) return 'pending';
    if (currentStage === 3) {
      if (sectionNum === 1) return 'complete';
      if (sectionNum === 2) return 'building';
      return 'pending';
    }
    if (currentStage === 4) {
      if (sectionNum <= 2) return 'complete';
      if (sectionNum === 3) return 'building';
      return 'pending';
    }
    return 'complete'; // Stage 5
  };

  return (
    <div className="card-3d p-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          🤖 Your AI Tutor is Working...
        </h2>
        <p className="text-gray-600">
          Creating your personalized {subjectName} learning plan
        </p>
      </div>

      {/* Robot Animation */}
      <div className="relative h-64 mb-8 flex items-center justify-center">
        {/* Robot Container */}
        <div className="robot-container">
          {/* Robot Body */}
          <div className={`robot-body ${currentStage >= 1 ? 'assembled' : ''}`}>
            {/* Head */}
            <div className={`robot-head ${currentStage >= 1 ? 'attached' : ''}`}>
              <div className={`robot-eyes ${currentStage >= 2 ? 'scanning' : ''}`}>
                <div className="eye left"></div>
                <div className="eye right"></div>
              </div>
              <div className="robot-antenna">
                <div className="antenna-ball"></div>
              </div>
              {currentStage >= 2 && currentStage <= 4 && (
                <div className="thinking-steam"></div>
              )}
            </div>

            {/* Body */}
            <div className="robot-torso">
              <div className="robot-panel"></div>
              <div className={`robot-lights ${currentStage >= 2 ? 'active' : ''}`}>
                <span className="light"></span>
                <span className="light"></span>
                <span className="light"></span>
              </div>
            </div>

            {/* Arms */}
            <div className={`robot-arm left ${currentStage >= 1 ? 'attached' : ''} ${currentStage >= 3 ? 'typing' : ''}`}></div>
            <div className={`robot-arm right ${currentStage >= 1 ? 'attached' : ''} ${currentStage >= 3 ? 'typing' : ''}`}></div>

            {/* Celebration when done */}
            {currentStage === 5 && (
              <div className="celebration-arms">
                <div className="celebrate-left">🎉</div>
                <div className="celebrate-right">🎉</div>
              </div>
            )}
          </div>

          {/* Holographic Data (Stage 2) */}
          {currentStage === 2 && (
            <div className="holographic-data">
              <div className="data-stream stream-1"></div>
              <div className="data-stream stream-2"></div>
              <div className="data-stream stream-3"></div>
            </div>
          )}

          {/* Keyboard (Stage 3+) */}
          {currentStage >= 3 && currentStage <= 4 && (
            <div className="holographic-keyboard">
              <div className="keyboard-key"></div>
              <div className="keyboard-key"></div>
              <div className="keyboard-key"></div>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Plan Document (Stage 3+) */}
      {currentStage >= 3 && (
        <div className={`lesson-plan-document ${currentStage >= 3 ? 'visible' : ''}`}>
          <div className="document-header">
            <div className="document-icon">📋</div>
            <div className="document-title">Your Learning Plan</div>
          </div>
          
          <div className="document-sections">
            {[1, 2, 3].map(num => {
              const status = getSectionStatus(num);
              return (
                <div key={num} className={`section-item ${status}`}>
                  <div className="section-icon">
                    {status === 'complete' && <span className="checkmark">✅</span>}
                    {status === 'building' && (
                      <span className="building-icon">
                        <span className="spinner">⚙️</span>
                      </span>
                    )}
                    {status === 'pending' && <span className="pending-icon">⏳</span>}
                  </div>
                  <div className="section-text">
                    Section {num}: Learning Module {num}
                  </div>
                  {status === 'building' && (
                    <div className="building-dots">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {currentStage === 5 && (
            <div className="approved-stamp">
              <span>✓</span> READY
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-8 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">{getStageMessage()}</span>
          <span className="text-sm font-bold text-purple-600">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Fun Facts */}
      <div className="fun-fact-container">
        <div className="fun-fact" key={funFactIndex}>
          {FUN_FACTS[funFactIndex]}
        </div>
      </div>

      {/* Stage indicator (optional debug) */}
      <div className="text-center text-xs text-gray-400 mt-4">
        Stage {currentStage} of 5 • {elapsedTime}s elapsed
      </div>

      {/* CSS Styles */}
      <style>{`
        /* Robot Container */
        .robot-container {
          position: relative;
          width: 200px;
          height: 200px;
        }

        /* Robot Body */
        .robot-body {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        /* Robot Head */
        .robot-head {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          position: relative;
          transform: translateY(-50px);
          opacity: 0;
          animation: dropIn 0.5s ease-out forwards;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .robot-head.attached {
          animation: dropIn 0.5s ease-out forwards, bobbing 2s ease-in-out infinite 0.5s;
        }

        @keyframes dropIn {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes bobbing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* Robot Eyes */
        .robot-eyes {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 20px;
        }

        .eye {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        }

        .eye::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: #4299e1;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .robot-eyes.scanning .eye::after {
          animation: eyeScan 2s ease-in-out infinite;
        }

        @keyframes eyeScan {
          0%, 100% { transform: translate(-50%, -50%) translateX(0); }
          25% { transform: translate(-50%, -50%) translateX(-3px); }
          75% { transform: translate(-50%, -50%) translateX(3px); }
        }

        /* Antenna */
        .robot-antenna {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 15px;
          background: #764ba2;
        }

        .antenna-ball {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background: #f59e0b;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.6);
          animation: antennaPulse 1.5s ease-in-out infinite;
        }

        @keyframes antennaPulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.3); box-shadow: 0 0 20px rgba(245, 158, 11, 1); }
        }

        /* Thinking Steam */
        .thinking-steam {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 30px;
        }

        .thinking-steam::before,
        .thinking-steam::after {
          content: '💭';
          position: absolute;
          font-size: 16px;
          animation: steamRise 2s ease-out infinite;
        }

        .thinking-steam::after {
          animation-delay: 1s;
          left: 10px;
        }

        @keyframes steamRise {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-30px) scale(1); }
        }

        /* Robot Torso */
        .robot-torso {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          position: relative;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
          animation: assembleBody 0.6s ease-out 0.3s backwards;
        }

        @keyframes assembleBody {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .robot-panel {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        /* Robot Lights */
        .robot-lights {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }

        .robot-lights .light {
          width: 8px;
          height: 8px;
          background: #4299e1;
          border-radius: 50%;
          opacity: 0.3;
        }

        .robot-lights.active .light {
          animation: lightBlink 1.5s ease-in-out infinite;
        }

        .robot-lights.active .light:nth-child(2) {
          animation-delay: 0.5s;
        }

        .robot-lights.active .light:nth-child(3) {
          animation-delay: 1s;
        }

        @keyframes lightBlink {
          0%, 100% { opacity: 0.3; box-shadow: none; }
          50% { opacity: 1; box-shadow: 0 0 12px currentColor; }
        }

        /* Robot Arms */
        .robot-arm {
          position: absolute;
          width: 16px;
          height: 80px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          top: 80px;
          opacity: 0;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .robot-arm.left {
          left: -20px;
          transform-origin: top center;
          animation: armAttach 0.4s ease-out 0.5s forwards;
        }

        .robot-arm.right {
          right: -20px;
          transform-origin: top center;
          animation: armAttach 0.4s ease-out 0.6s forwards;
        }

        @keyframes armAttach {
          from {
            transform: rotate(-90deg);
            opacity: 0;
          }
          to {
            transform: rotate(0);
            opacity: 1;
          }
        }

        .robot-arm.typing {
          animation: typing 0.6s ease-in-out infinite;
        }

        @keyframes typing {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }

        /* Celebration */
        .celebration-arms {
          position: absolute;
          top: 80px;
          width: 140px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: space-between;
          font-size: 24px;
        }

        .celebrate-left,
        .celebrate-right {
          animation: celebrate 0.6s ease-in-out infinite;
        }

        .celebrate-right {
          animation-delay: 0.3s;
        }

        @keyframes celebrate {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(20deg); }
        }

        /* Holographic Data */
        .holographic-data {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
        }

        .data-stream {
          position: absolute;
          width: 2px;
          height: 30px;
          background: linear-gradient(to bottom, transparent, #4299e1, transparent);
          animation: dataFlow 2s ease-in-out infinite;
        }

        .data-stream.stream-1 {
          left: -20px;
        }

        .data-stream.stream-2 {
          left: 0;
          animation-delay: 0.3s;
        }

        .data-stream.stream-3 {
          left: 20px;
          animation-delay: 0.6s;
        }

        @keyframes dataFlow {
          0% { transform: translateY(0) scaleY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-40px) scaleY(1); opacity: 0; }
        }

        /* Holographic Keyboard */
        .holographic-keyboard {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
        }

        .keyboard-key {
          width: 12px;
          height: 12px;
          background: rgba(66, 153, 225, 0.3);
          border: 1px solid #4299e1;
          border-radius: 2px;
          animation: keyPress 0.8s ease-in-out infinite;
        }

        .keyboard-key:nth-child(2) {
          animation-delay: 0.2s;
        }

        .keyboard-key:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes keyPress {
          0%, 100% { transform: translateY(0); background: rgba(66, 153, 225, 0.3); }
          50% { transform: translateY(3px); background: rgba(66, 153, 225, 0.6); }
        }

        /* Lesson Plan Document */
        .lesson-plan-document {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border: 2px solid #e2e8f0;
          margin-top: 20px;
          transform: scale(0.9);
          opacity: 0;
          animation: documentAppear 0.5s ease-out forwards;
        }

        @keyframes documentAppear {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .document-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }

        .document-icon {
          font-size: 28px;
        }

        .document-title {
          font-size: 18px;
          font-weight: 700;
          color: #2d3748;
        }

        /* Section Items */
        .document-sections {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f7fafc;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
        }

        .section-item.complete {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
        }

        .section-item.building {
          background: #fefcbf;
          border: 1px solid #fbd38d;
          animation: buildingPulse 1.5s ease-in-out infinite;
        }

        @keyframes buildingPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(251, 211, 141, 0); }
          50% { box-shadow: 0 0 12px rgba(251, 211, 141, 0.6); }
        }

        .section-item.pending {
          opacity: 0.6;
        }

        .section-icon {
          font-size: 20px;
          min-width: 24px;
        }

        .spinner {
          display: inline-block;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .section-text {
          flex: 1;
          font-weight: 600;
          color: #2d3748;
        }

        .building-dots {
          display: flex;
          gap: 4px;
        }

        .building-dots span {
          width: 6px;
          height: 6px;
          background: #f6ad55;
          border-radius: 50%;
          animation: dotBounce 1s ease-in-out infinite;
        }

        .building-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .building-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* Approved Stamp */
        .approved-stamp {
          position: absolute;
          top: -10px;
          right: -10px;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
          animation: stampAppear 0.3s ease-out, stampPulse 1s ease-in-out infinite 0.3s;
        }

        @keyframes stampAppear {
          from {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes stampPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Progress Bar */
        .progress-bar-container {
          width: 100%;
          height: 12px;
          background: #e2e8f0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          transition: width 0.3s ease;
          box-shadow: 0 0 12px rgba(102, 126, 234, 0.5);
          position: relative;
          overflow: hidden;
        }

        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Fun Fact */
        .fun-fact-container {
          text-align: center;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fun-fact {
          font-size: 16px;
          font-weight: 600;
          color: #5a67d8;
          animation: fadeInUp 0.5s ease-out;
          background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
          padding: 12px 24px;
          border-radius: 20px;
          border: 2px solid #c3dafe;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
