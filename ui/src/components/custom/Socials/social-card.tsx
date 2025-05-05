
import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router"

interface SocialLink {
  platform: string
  username: string
  url: string
  icon: React.ReactNode
}

interface SocialCardProps {
  name: string
  title?: string
  socialLinks: SocialLink[]
}

export default function SocialCard({
  name ,
  title ,
  socialLinks 
}: SocialCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        {title && <CardDescription>{title}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {socialLinks.map((social) => (
            <li key={social.platform}>
              <Link
                to={social.url}
                className="flex items-center p-3 rounded-lg transition-colors hover:bg-muted"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-center w-10">{social.icon}</div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{social.platform}</p>
                  <p className="text-xs text-muted-foreground">{social.username}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
