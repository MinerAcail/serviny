import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
export function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Michael Thompson",
      image: "/placeholder.svg?height=80&width=80",
      rating: 5,
      date: "March 15, 2023",
      text: "Sarah transformed our outdated living room into a beautiful, functional space that perfectly matches our style. Her attention to detail and ability to work within our budget was impressive. Highly recommend!",
      project: "Living Room Redesign",
    },
    {
      id: 2,
      name: "Jennifer Wilson",
      image: "/placeholder.svg?height=80&width=80",
      rating: 5,
      date: "February 3, 2023",
      text: "Working with Sarah on our kitchen renovation was a fantastic experience. She listened to our needs, provided creative solutions, and managed the project seamlessly. The result exceeded our expectations!",
      project: "Kitchen Renovation",
    },
    {
      id: 3,
      name: "David Martinez",
      image: "/placeholder.svg?height=80&width=80",
      rating: 5,
      date: "January 20, 2023",
      text: "Sarah designed our new office space, and we couldn't be happier with the results. The space is not only beautiful but also functional and reflects our company culture perfectly. She was professional, responsive, and a joy to work with.",
      project: "Office Design",
    },
    {
      id: 4,
      name: "Emily Johnson",
      image: "/placeholder.svg?height=80&width=80",
      rating: 4,
      date: "December 12, 2022",
      text: "Sarah helped us redesign our bedroom and created a peaceful retreat that we love. She has a great eye for color and texture, and she found pieces that fit our style and budget.",
      project: "Bedroom Redesign",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          Client Testimonials
        </h2>
        <p className="mt-2 text-muted-foreground">
          Don't just take my word for it. Here's what my clients have to say.
        </p>
      </div>

      <div className="space-y-6">
        {testimonials.map((testimonial) => (
          <Card
            key={testimonial.id}
            className="overflow-hidden border-none bg-background/60 shadow-md"
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="relative p-6 md:w-2/3">
                  <Quote className="absolute left-6 top-6 h-8 w-8 text-primary/10" />
                  <div className="pl-0 pt-8">
                    <p className="text-sm leading-relaxed">
                      {testimonial.text}
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {testimonial.date}
                    </p>
                    <div className="text-end">
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.project}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
