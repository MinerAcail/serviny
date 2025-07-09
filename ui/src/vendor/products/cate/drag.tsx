import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Box } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DroppableBoxProps {
  box: Box;
  removeBox: (id: string) => void;
  removeItem: (boxId: string, itemId: string) => void;
}

const DroppableBox: React.FC<DroppableBoxProps> = ({
  box,
  removeBox,
  removeItem,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: box.id,
    data: { type: "box", boxId: box.id },
  });

  return (
    <Card
      ref={setNodeRef}
      className={`p-4 h-64 flex flex-col ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
        <h3 className="font-medium truncate">{box.name}</h3>
          <div className="h-8 w-8 bg-primary/10 rounded">
            <img
               src={
                box.imageFile
                  ? URL.createObjectURL(box.imageFile)
                  : "/placeholder.svg"
             }
              alt={box.name}
              className="h-full w-full object-cover rounded"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>
            {box.items.length} item{box.items.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => removeBox(box.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {box.items.length === 0 && !isOver ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md p-4">
            Drag products here
          </div>
        ) : (
          <div className="space-y-2">
            {box.items.map((item) => (
              <Card
                key={item.id}
                className="p-2 flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary/10 rounded">
                    <img
                      src={item.imageUrls[0]}
                      alt={item.name}
                      className="h-full w-full object-cover rounded"
                    />
                  </div>
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeItem(box.id, item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default DroppableBox;
