"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Linkedin, Mail, MapPin } from "lucide-react"

export function AboutMe({aboutme}:{aboutme:string}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }


  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className="w-full mx-auto"
    >
    

     
      <motion.div variants={itemVariants} className="">
        <Card>
          <CardContent className="p-6">
            <div className="">
              <motion.div variants={itemVariants} className="text-center">
                
                <h5 className="font-medium mb-2">{aboutme.length > 50 ? aboutme.slice(0, 100) + "..." : aboutme}</h5>
                {/* <p className="text-sm text-gray-600">
                    
                  Creating beautiful, responsive user interfaces with modern frameworks
                </p> */}
              </motion.div>

             
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.section>
  )
}
