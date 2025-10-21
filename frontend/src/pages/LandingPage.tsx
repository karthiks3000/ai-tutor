import { useNavigate } from 'react-router-dom';
import { Spotlight } from '../components/ui/spotlight-new';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { CardBody, CardContainer, CardItem } from '../components/ui/3d-card';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full rounded-md flex flex-col items-center justify-center relative overflow-hidden antialiased">
      {/* Spotlight Effect */}
      <Spotlight />
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl relative z-10 p-8">
        <div className="text-6xl mb-4 animate-float">🎓</div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          AI TUTOR
        </h1>
        <p className="text-2xl text-gray-700 mb-6">
          Learn English with Your Personal AI Teacher
        </p>
        <TextGenerateEffect 
          words="Personalized • Fun • Interactive • Smart"
          className="text-lg text-gray-600 mb-12"
        />
        
        {/* CTA Button */}
        <button
          onClick={() => navigate('/signup')}
          className="gradient-button text-xl px-12 py-4 mb-6 animate-pulse"
        >
          🚀 Start Learning Free
        </button>
        
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/signin')}
            className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Features with 3D Cards */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl relative z-10">
        <CardContainer className="inter-var">
          <CardBody className="bg-white relative group/card hover:shadow-2xl hover:shadow-purple-500/[0.1] border-gray-100 w-auto sm:w-[18rem] h-auto rounded-xl p-6 border">
            <CardItem translateZ="50" className="text-4xl mb-4 text-center w-full">
              🤖
            </CardItem>
            <CardItem translateZ="60" className="text-xl font-bold mb-2 text-center w-full">
              Smart AI
            </CardItem>
            <CardItem translateZ="50" className="text-gray-600 text-center w-full">
              AI that adapts to your learning style
            </CardItem>
          </CardBody>
        </CardContainer>

        <CardContainer className="inter-var">
          <CardBody className="bg-white relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-gray-100 w-auto sm:w-[18rem] h-auto rounded-xl p-6 border">
            <CardItem translateZ="50" className="text-4xl mb-4 text-center w-full">
              🎮
            </CardItem>
            <CardItem translateZ="60" className="text-xl font-bold mb-2 text-center w-full">
              Fun
            </CardItem>
            <CardItem translateZ="50" className="text-gray-600 text-center w-full">
              Interactive quizzes that feel like games
            </CardItem>
          </CardBody>
        </CardContainer>

        <CardContainer className="inter-var">
          <CardBody className="bg-white relative group/card hover:shadow-2xl hover:shadow-green-500/[0.1] border-gray-100 w-auto sm:w-[18rem] h-auto rounded-xl p-6 border">
            <CardItem translateZ="50" className="text-4xl mb-4 text-center w-full">
              🏆
            </CardItem>
            <CardItem translateZ="60" className="text-xl font-bold mb-2 text-center w-full">
              Rewards
            </CardItem>
            <CardItem translateZ="50" className="text-gray-600 text-center w-full">
              Earn XP and unlock achievements
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>
    </div>
  );
}
