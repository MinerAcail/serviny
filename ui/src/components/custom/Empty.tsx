
import { Package2 } from "lucide-react"



export function NoItemsFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center h-[300px]  animate-in fade-in-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Package2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-xl font-semibold">No Item Found</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">There are no items to display at the moment.</p>
   
    </div>
  )
}

