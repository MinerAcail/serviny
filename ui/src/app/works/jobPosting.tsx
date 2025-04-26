import React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Package, Bike, LucideIcon, Megaphone } from "lucide-react";
import ApplyNowSection from "./applyNow";
import WorksNav from "@/components/custom/nav";
// const ghSim = "GH¢";

interface BubbleProps {
  x: number;
  y: number;
  size: number;
  color: string;
}

interface BubbleState extends BubbleProps {
  id: number;
}

interface JobPostingCardProps {
  title: string;
  description: string;
  requirements: string[];
  icon: LucideIcon;
  salary?: string;
  location: string;
}

function Bubble({ x, y, size, color }: BubbleProps): JSX.Element {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.7, 0.3, 0.7],
        scale: [1, 1.2, 1],
        x: x + Math.random() * 100 - 50,
        y: y + Math.random() * 100 - 50,
      }}
      transition={{
        duration: 5 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
    />
  );
}

function FloatingBubbles(): JSX.Element {
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);

  useEffect(() => {
    const newBubbles: BubbleState[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 20 + 5,
      color: `rgba(${Math.random() * 255},${Math.random() * 255},${
        Math.random() * 255
      },0.3)`,
    }));
    setBubbles(newBubbles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <title>Floating Bubbles</title>
        {bubbles.map((bubble) => (
          <Bubble key={bubble.id} {...bubble} />
        ))}
      </svg>
    </div>
  );
}

function JobPostingCard({
  title,
  description,
  requirements,
  icon: Icon,
  salary,
  location,
}: JobPostingCardProps): JSX.Element {
  return (
    <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-none">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-start gap-4 p-6">
        <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl shadow-inner">
          <Icon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{location}</span>
            <span>•</span>
            <span>{salary}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Requirements:
          </h3>
          <ul className="space-y-3">
            {requirements.map((req, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-gray-700 dark:text-gray-200"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm">
                    ✓
                  </span>
                </span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <ApplyNowSection>
          Apply Now
          {/* <ArrowRight className="w-4 h-4 ml-2" /> */}
        </ApplyNowSection>
      </CardContent>
    </Card>
  );
}

const JobPosting: React.FC = () => {
  return (
    <div className="  min-h-screen w-full bgcontainer">
      <FloatingBubbles />

      <div className="relative z-10 ">
        <WorksNav />

        <main className="container mx-auto px-4 mt-10 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Join Our Elite Delivery Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Be part of a dynamic team that keeps the winneba town moving.
              We're looking for passionate individuals who love being on the go!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <JobPostingCard
              title="Advertiser"
              description="Promote our platform and earn commissions when users uses your promo code. Upload a short video to showcase our services!"
              requirements={[
                "Marketing or social media experience preferred",
                "Ability to engage an audience effectively",
                "Unique promo code for tracking referrals",
                "Optional: Video submission (1 min max)",
              ]}
              icon={Megaphone}
              location="Flexible • Remote Possible"
            />

            <JobPostingCard
              title="Dispatch Coordinator"
              description="Lead our logistics operations and be the crucial link between vendors and drivers. Your organizational skills will keep our delivery network running smoothly."
              requirements={[
                "Experience in logistics coordination or similar role",
                "Strong communication and multitasking abilities",
                "Tech-savvy with excellent problem-solving skills",
                "Flexible schedule availability",
              ]}
              icon={Package}
              // salary={`${ghSim}20-25/hr + Benefits`}
              location="Full-time • Remote Possible"
            />

            <JobPostingCard
              title="Delivery Driver"
              description="Turn your driving passion into a rewarding career. Enjoy flexible hours, competitive pay, and the freedom of the open road while delivering joy to our customers."
              requirements={[
                "Valid driver's license with clean record",
                "Reliable vehicle or motorcycle",
                "Strong customer service mindset",
                "Available for various shifts",
              ]}
              icon={Bike}
              // salary={`Up to ${ghSim}30/hr + Tips`}
              location="Flexible Hours • Choose Your Area"
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default JobPosting;
